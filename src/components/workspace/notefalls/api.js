function workspaceApi(name) {
  const fn = typeof window !== 'undefined' ? window.api?.[name] : null;
  if (typeof fn !== 'function') {
    throw new Error(`Workspace API unavailable: ${name}`);
  }
  return fn;
}

export const api = {
  list: () => workspaceApi('notefallsList')(),
  create: (input) => workspaceApi('notefallsCreate')(input),
  update: (id, patch) => workspaceApi('notefallsUpdate')(id, patch),
  remove: (id) => workspaceApi('notefallsDelete')(id),
  attachMedia: async () => {
    const fn = typeof window !== 'undefined'
      ? (window.api?.notefallsAttachMedia || window.api?.mediaOpenFiles)
      : null;
    if (typeof fn !== 'function') return [];
    const result = await fn();
    return Array.isArray(result) ? result : (result?.files || []);
  },
};

export function mediaUrl(p) {
  if (!p) return '';
  if (/^(file|data|https?):/.test(p)) return p;
  return `file://${p}`;
}
