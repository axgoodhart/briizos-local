// Turns terminal output (colors, carriage returns, backspaces) into styled lines.
// Cursor-addressed full-screen programs are not emulated.

// ==== TERMINAL OUTPUT ====
const MAX_LINES = 1500;

const TOKEN = /\x1b\[([0-9;?]*)([A-Za-z@`])|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)?|\x1b[()][A-Za-z0-9]|\x1b[=>78DEHM]|\r\n|\r|\n|\x08|\x07|[^\x1b\r\n\x08\x07]+/g;

export function createAnsi() {
  return { lines: [[]], style: '', pendingCR: false };
}

function styleFromCodes(current, params) {
  const parts = new Set(current ? current.split(' ') : []);
  const codes = params === '' ? [0] : params.split(';').map((n) => Number(n) || 0);
  const dropFg = () => [...parts].forEach((p) => p.startsWith('fg') && parts.delete(p));
  const dropBg = () => [...parts].forEach((p) => p.startsWith('bg') && parts.delete(p));
  for (let i = 0; i < codes.length; i += 1) {
    const code = codes[i];
    if (code === 0) parts.clear();
    else if (code === 1) parts.add('b');
    else if (code === 2) parts.add('dim');
    else if (code === 3) parts.add('i');
    else if (code === 4) parts.add('u');
    else if (code === 22) { parts.delete('b'); parts.delete('dim'); }
    else if (code === 23) parts.delete('i');
    else if (code === 24) parts.delete('u');
    else if (code >= 30 && code <= 37) { dropFg(); parts.add(`fg${code - 30}`); }
    else if (code >= 90 && code <= 97) { dropFg(); parts.add(`fg${code - 90 + 8}`); }
    else if (code === 39) dropFg();
    else if (code >= 40 && code <= 47) { dropBg(); parts.add(`bg${code - 40}`); }
    else if (code >= 100 && code <= 107) { dropBg(); parts.add(`bg${code - 100 + 8}`); }
    else if (code === 49) dropBg();
    else if (code === 38 || code === 48) {
      const fg = code === 38;
      if (codes[i + 1] === 5) {
        const n = codes[i + 2];
        if (n < 16) { (fg ? dropFg : dropBg)(); parts.add(`${fg ? 'fg' : 'bg'}${n}`); }
        i += 2;
      } else if (codes[i + 1] === 2) {
        i += 4;
      }
    }
  }
  return [...parts].join(' ');
}

function currentLine(state) {
  return state.lines[state.lines.length - 1];
}

function appendText(state, text) {
  if (state.pendingCR) {
    state.lines[state.lines.length - 1] = [];
    state.pendingCR = false;
  }
  const line = currentLine(state);
  const last = line[line.length - 1];
  if (last && last.s === state.style) last.t += text;
  else line.push({ s: state.style, t: text });
}

function backspace(state) {
  const line = currentLine(state);
  const last = line[line.length - 1];
  if (!last) return;
  last.t = last.t.slice(0, -1);
  if (!last.t) line.pop();
}

export function feedAnsi(state, chunk) {
  if (!chunk) return state;
  TOKEN.lastIndex = 0;
  let match;
  while ((match = TOKEN.exec(chunk))) {
    const token = match[0];
    if (match[2]) {
      const cmd = match[2];
      if (cmd === 'm') state.style = styleFromCodes(state.style, match[1]);
      else if (cmd === 'J' && (match[1] === '2' || match[1] === '3')) { state.lines = [[]]; state.pendingCR = false; }
      else if (cmd === 'K' && state.pendingCR) { state.lines[state.lines.length - 1] = []; state.pendingCR = false; }
      continue;
    }
    if (token === '\r\n' || token === '\n') {
      state.pendingCR = false;
      state.lines.push([]);
    } else if (token === '\r') {
      state.pendingCR = true;
    } else if (token === '\x08') {
      backspace(state);
    } else if (token.charCodeAt(0) === 27 || token === '\x07') {
      continue;
    } else {
      appendText(state, token);
    }
  }
  if (state.lines.length > MAX_LINES) state.lines = state.lines.slice(-MAX_LINES);
  return state;
}
