const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SPLIT_FILE_RE = /^conversations-\d+\.json$/i;
const CHATGPT_FILE = 'conversations.json';
const APPROX_CHARS_PER_TOKEN = 4;
const LONG_MESSAGE_TOKENS = 1200;
const TARGET_CHUNK_TOKENS = 900;
const CHUNK_OVERLAP_TOKENS = 100;

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function timestampMs(value, fallback = null) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.abs(numeric) < 1e12 ? Math.round(numeric * 1000) : Math.round(numeric);
}

function extractMessageText(message) {
  const content = message?.content;
  if (!content || !Array.isArray(content.parts)) return '';
  if (content.content_type && !['text', 'multimodal_text'].includes(content.content_type)) return '';
  return content.parts.map((part) => {
    if (typeof part === 'string') return part;
    if (part?.content_type === 'audio_transcription' && typeof part.text === 'string') return part.text;
    return '';
  }).filter(Boolean).join('\n');
}

function isDisplayMessage(message) {
  const role = message?.author?.role;
  if (!message?.id || !['user', 'assistant'].includes(role)) return false;
  return Boolean(extractMessageText(message).trim());
}

function getMessagesInOrder(conversationOrMapping) {
  if (!conversationOrMapping) return [];
  const conversation = conversationOrMapping.mapping ? conversationOrMapping : null;
  const mapping = conversation?.mapping || conversationOrMapping;
  if (!mapping || typeof mapping !== 'object') return [];

  if (conversation?.current_node && mapping[conversation.current_node]) {
    const result = [];
    const seen = new Set();
    let currentNode = conversation.current_node;
    while (currentNode && mapping[currentNode]) {
      if (seen.has(currentNode)) return [];
      seen.add(currentNode);
      const node = mapping[currentNode];
      if (isDisplayMessage(node.message)) result.push(node);
      currentNode = node.parent;
    }
    return result.reverse();
  }

  const result = [];
  const seen = new Set();
  const roots = Object.values(mapping).filter((node) => node?.parent == null);
  function traverse(node) {
    if (!node || seen.has(node.id)) return;
    if (node.id) seen.add(node.id);
    if (isDisplayMessage(node.message)) result.push(node);
    for (const childId of node.children || []) traverse(mapping[childId]);
  }
  roots.forEach(traverse);
  return result;
}

function preferredBoundary(text, ideal, min) {
  const candidates = [
    text.lastIndexOf('\n\n', ideal),
    text.lastIndexOf('\n', ideal),
    text.lastIndexOf('. ', ideal),
    text.lastIndexOf('? ', ideal),
    text.lastIndexOf('! ', ideal),
    text.lastIndexOf(' ', ideal),
  ];
  return candidates.find((candidate) => candidate >= min) ?? ideal;
}

function chunkMessage(text) {
  const exact = String(text || '');
  const longThreshold = LONG_MESSAGE_TOKENS * APPROX_CHARS_PER_TOKEN;
  if (exact.length <= longThreshold) return [{ startChar: 0, endChar: exact.length, text: exact }];

  const target = TARGET_CHUNK_TOKENS * APPROX_CHARS_PER_TOKEN;
  const overlap = CHUNK_OVERLAP_TOKENS * APPROX_CHARS_PER_TOKEN;
  const chunks = [];
  let start = 0;
  while (start < exact.length) {
    const idealEnd = Math.min(exact.length, start + target);
    let end = idealEnd === exact.length ? exact.length : preferredBoundary(exact, idealEnd, start + Math.floor(target * 0.65));
    if (end <= start) end = idealEnd;
    const chunkText = exact.slice(start, end);
    if (chunkText.trim()) chunks.push({ startChar: start, endChar: end, text: chunkText });
    if (end >= exact.length) break;
    const nextIdeal = Math.max(start + 1, end - overlap);
    const nextBreak = exact.indexOf(' ', nextIdeal);
    start = nextBreak >= 0 && nextBreak < end ? nextBreak + 1 : nextIdeal;
  }
  return chunks;
}

function conversationIdOf(conversation) {
  return String(conversation?.conversation_id || conversation?.id || sha256(JSON.stringify(conversation).slice(0, 10000)));
}

function extractConversation(conversation, sourceFile = '') {
  const conversationId = conversationIdOf(conversation);
  const title = String(conversation?.title || 'Untitled conversation');
  const conversationAt = timestampMs(conversation?.create_time, null);
  const ordered = getMessagesInOrder(conversation);
  const messages = ordered.map((node, ordinal) => {
    const message = node.message;
    const text = extractMessageText(message);
    return {
      conversationId,
      conversationTitle: title,
      conversationAt,
      currentNode: conversation?.current_node || null,
      sourceFile,
      messageId: String(message.id),
      ordinal,
      role: message.author.role,
      text,
      sourceHash: sha256(text),
      messageAt: timestampMs(message.create_time, conversationAt),
    };
  });

  const chunks = [];
  messages.forEach((message, messageIndex) => {
    if (message.role !== 'user') return;
    const previous = messages[messageIndex - 1];
    const next = messages[messageIndex + 1];
    chunkMessage(message.text).forEach((chunk, chunkIndex) => {
      const contextParts = [
        `Conversation: ${title}`,
        message.messageAt ? `Date: ${new Date(message.messageAt).toISOString().slice(0, 10)}` : '',
        previous ? `Previous ${previous.role}: ${previous.text.slice(0, 800)}` : '',
        `Alex: ${chunk.text}`,
        next ? `Next ${next.role}: ${next.text.slice(0, 800)}` : '',
      ].filter(Boolean);
      chunks.push({
        ...message,
        chunkId: `${message.messageId}:${chunkIndex}`,
        chunkIndex,
        startChar: chunk.startChar,
        endChar: chunk.endChar,
        exactText: chunk.text,
        contextText: contextParts.join('\n'),
      });
    });
  });

  return { conversationId, title, conversationAt, currentNode: conversation?.current_node || null, sourceFile, messages, chunks };
}

function findSplitDirectory(rootPath) {
  const direct = fs.readdirSync(rootPath, { withFileTypes: true });
  if (direct.some((entry) => entry.isFile() && SPLIT_FILE_RE.test(entry.name))) return rootPath;
  const named = direct.find((entry) => entry.isDirectory() && entry.name.toLowerCase() === 'split new format');
  return named ? path.join(rootPath, named.name) : null;
}

function detectArchive(rootPath) {
  const resolved = path.resolve(String(rootPath || ''));
  const stat = fs.statSync(resolved);
  if (!stat.isDirectory()) throw new Error('Choose a folder containing a ChatGPT export or Split conversation files.');
  const chatgptPath = path.join(resolved, CHATGPT_FILE);
  if (fs.existsSync(chatgptPath) && fs.statSync(chatgptPath).isFile()) {
    return { rootPath: resolved, sourceKind: 'chatgpt-export', files: [chatgptPath] };
  }
  const splitRoot = findSplitDirectory(resolved);
  if (splitRoot) {
    const files = fs.readdirSync(splitRoot)
      .filter((name) => SPLIT_FILE_RE.test(name))
      .sort()
      .map((name) => path.join(splitRoot, name));
    if (files.length) return { rootPath: resolved, dataPath: splitRoot, sourceKind: 'split-folder', files };
  }
  throw new Error('No conversations.json or Split conversations-###.json files were found in that folder.');
}

async function* streamConversations(filePath) {
  const [{ chain }, { parser }, { streamArray }] = await Promise.all([
    import('stream-chain/node'),
    import('stream-json'),
    import('stream-json/streamers/stream-array.js'),
  ]);
  const pipeline = chain([fs.createReadStream(filePath), parser(), streamArray()]);
  for await (const item of pipeline) {
    if (item?.value && typeof item.value === 'object') yield item.value;
  }
}

function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const input = fs.createReadStream(filePath);
    input.on('error', reject);
    input.on('data', (chunk) => hash.update(chunk));
    input.on('end', () => resolve(hash.digest('hex')));
  });
}

module.exports = {
  CHATGPT_FILE,
  SPLIT_FILE_RE,
  chunkMessage,
  detectArchive,
  extractConversation,
  extractMessageText,
  getMessagesInOrder,
  hashFile,
  sha256,
  streamConversations,
  timestampMs,
};
