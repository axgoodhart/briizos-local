const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

// ==== SAMPLE FILES ====
const MAX_FILE_BYTES = 60 * 1024 * 1024;  // refuse larger files outright
const MAX_TEXT_CHARS = 400000;            // a sample longer than this is cut and flagged
const TEXT_EXTENSIONS = new Set(['.txt', '.md', '.markdown', '.mdown', '.text', '.tex']);
const TEXTUTIL_EXTENSIONS = new Set(['.rtf', '.rtfd', '.doc', '.html', '.htm', '.webarchive', '.odt', '.wordml']);
const PICKER_EXTENSIONS = ['pdf', 'pages', 'docx', 'doc', 'rtf', 'rtfd', 'txt', 'md', 'markdown', 'text', 'html', 'htm', 'odt', 'tex'];

function kindOf(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === '.pdf') return 'pdf';
  if (extension === '.pages') return 'pages';
  if (extension === '.docx') return 'docx';
  if (TEXT_EXTENSIONS.has(extension)) return 'text';
  if (TEXTUTIL_EXTENSIONS.has(extension)) return 'textutil';
  return null;
}

async function readPdf(buffer) {
  const pdfParse = require('pdf-parse');
  const data = await pdfParse(buffer);
  return { text: data.text || '', pages: data.numpages || null };
}

async function readDocx(filePath) {
  const mammoth = require('mammoth');
  const result = await mammoth.extractRawText({ path: filePath });
  return { text: result.value || '' };
}

const NO_PREVIEW = 'This Pages document has no preview inside it. In Pages choose File › Export To › PDF and add that file instead.';

async function readPages(filePath) {
  if (fs.statSync(filePath).isDirectory()) {
    for (const candidate of ['QuickLook/Preview.pdf', 'preview.pdf', 'Preview.pdf']) {
      const inside = path.join(filePath, candidate);
      if (fs.existsSync(inside)) return readPdf(fs.readFileSync(inside));
    }
    throw new Error(NO_PREVIEW);
  }
  const AdmZip = require('adm-zip');
  const entry = new AdmZip(filePath).getEntries().find((candidate) => /(^|\/)(quicklook\/)?preview\.pdf$/i.test(candidate.entryName));
  if (!entry) throw new Error(NO_PREVIEW);
  return readPdf(entry.getData());
}

function readWithTextutil(filePath) {
  return new Promise((resolve, reject) => {
    execFile('/usr/bin/textutil', ['-convert', 'txt', '-stdout', filePath], { maxBuffer: 64 * 1024 * 1024 }, (error, stdout) => {
      if (error) reject(new Error(`macOS could not turn this file into plain text: ${error.message}`));
      else resolve({ text: String(stdout || '') });
    });
  });
}

// PDF text arrives with a line break at every printed line. Rejoin wrapped
// lines inside a paragraph and fix words split by a hyphen at the margin.
function cleanPdfText(text) {
  return String(text || '')
    .replace(/\r\n?/g, '\n')
    .replace(/(\p{L})-\n(?=\p{Ll})/gu, '$1')
    .replace(/([^\n])\n(?!\n)(?=[\p{Ll}(“"'‘])/gu, '$1 ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cleanText(text) {
  return String(text || '').replace(/\r\n?/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

async function readSampleFile(filePath) {
  const resolved = path.resolve(String(filePath || ''));
  if (!fs.existsSync(resolved)) throw new Error('That file could not be found.');
  const kind = kindOf(resolved);
  if (!kind) throw new Error(`Files of type “${path.extname(resolved) || 'unknown'}” cannot be read as writing. Use PDF, Pages, Word, RTF, HTML or plain text.`);
  const stat = fs.statSync(resolved);
  if (!stat.isDirectory() && stat.size > MAX_FILE_BYTES) throw new Error('That file is larger than 60 MB. Export the writing itself to a smaller file.');

  let result;
  if (kind === 'pdf') result = await readPdf(fs.readFileSync(resolved));
  else if (kind === 'pages') result = await readPages(resolved);
  else if (kind === 'docx') result = await readDocx(resolved);
  else if (kind === 'text') result = { text: fs.readFileSync(resolved, 'utf8') };
  else result = await readWithTextutil(resolved);

  const cleaned = kind === 'pdf' || kind === 'pages' ? cleanPdfText(result.text) : cleanText(result.text);
  if (!cleaned) throw new Error(kind === 'pdf' || kind === 'pages'
    ? 'No text was found in that document. If it is a scan, it has no selectable text to read.'
    : 'That file holds no readable text.');
  const truncated = cleaned.length > MAX_TEXT_CHARS;
  return {
    filePath: resolved,
    label: path.basename(resolved, path.extname(resolved)),
    kind,
    pages: result.pages || null,
    bytes: stat.isDirectory() ? null : stat.size,
    text: truncated ? cleaned.slice(0, MAX_TEXT_CHARS) : cleaned,
    truncated,
  };
}

module.exports = { readSampleFile, kindOf, PICKER_EXTENSIONS, MAX_TEXT_CHARS };
