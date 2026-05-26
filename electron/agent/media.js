/**
 * Upload/image context helpers.
 *
 * Source parity:
 *   - agent/src/agents/middlewares/uploads_middleware.py
 *   - agent/src/agents/middlewares/view_image_middleware.py
 *   - agent/src/tools/builtins/view_image_tool.py
 *   - agent/src/tools/builtins/present_file_tool.py
 */

const { HumanMessage, isAIMessage, isToolMessage } = require('@langchain/core/messages');

function createUploadedFilesBlock(files = []) {
  if (!Array.isArray(files) || files.length === 0) return '';
  const lines = [
    '<uploaded_files>',
    'The following files were uploaded or pinned in this message:',
    '',
  ];
  for (const file of files) {
    const name = file.name || file.filename || file.path;
    lines.push(`- ${name}`);
    lines.push(`  Path: ${file.path}`);
    if (file.size) lines.push(`  Size: ${file.size} bytes`);
    lines.push('');
  }
  lines.push('You can read these files using the `read_file` tool with the paths shown above.');
  lines.push('</uploaded_files>');
  return lines.join('\n');
}

function hasViewImageToolCall(message) {
  return isAIMessage(message) && Array.isArray(message.tool_calls)
    && message.tool_calls.some((call) => call?.name === 'view_image');
}

function allToolCallsCompleted(messages, assistantMessage) {
  const toolCallIds = new Set((assistantMessage.tool_calls || []).map((call) => call.id).filter(Boolean));
  if (toolCallIds.size === 0) return false;
  const assistantIndex = messages.indexOf(assistantMessage);
  if (assistantIndex < 0) return false;
  const completed = new Set();
  for (const msg of messages.slice(assistantIndex + 1)) {
    if (isToolMessage(msg) && msg.tool_call_id) completed.add(msg.tool_call_id);
  }
  return [...toolCallIds].every((id) => completed.has(id));
}

function alreadyInjected(messages, assistantMessage) {
  const assistantIndex = messages.indexOf(assistantMessage);
  return messages.slice(assistantIndex + 1).some((msg) => (
    msg instanceof HumanMessage && String(msg.content).includes("Here are the images you've viewed")
  ));
}

function createViewImagePreModelHook() {
  return async (state) => {
    const messages = state?.messages || [];
    const viewedImages = state?.viewedImages || {};
    if (Object.keys(viewedImages).length === 0) return {};
    const lastAssistant = [...messages].reverse().find((msg) => isAIMessage(msg));
    if (!lastAssistant || !hasViewImageToolCall(lastAssistant)) return {};
    if (!allToolCallsCompleted(messages, lastAssistant)) return {};
    if (alreadyInjected(messages, lastAssistant)) return {};

    const content = [{ type: 'text', text: "Here are the images you've viewed:" }];
    for (const [imagePath, imageData] of Object.entries(viewedImages)) {
      const mimeType = imageData.mime_type || imageData.mimeType || 'application/octet-stream';
      content.push({ type: 'text', text: `\n- ${imagePath} (${mimeType})` });
      if (imageData.base64) {
        content.push({
          type: 'image_url',
          image_url: { url: `data:${mimeType};base64,${imageData.base64}` },
        });
      }
    }
    return { messages: [new HumanMessage({ content })] };
  };
}

module.exports = {
  createUploadedFilesBlock,
  createViewImagePreModelHook,
};
