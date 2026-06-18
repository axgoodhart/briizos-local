function workspaceApi(name) {
  const fn = typeof window !== 'undefined' ? window.api?.[name] : null;
  if (typeof fn !== 'function') {
    throw new Error(`Workspace API unavailable: ${name}`);
  }
  return fn;
}

export const api = {
  list: () => workspaceApi('journalsList')(),
  create: (input) => workspaceApi('journalsCreate')(input),
  foliosList: (journalId) => workspaceApi('foliosList')(journalId),
  foliosCreate: (journalId, folio, opts) => workspaceApi('foliosCreate')(journalId, folio, opts),
  foliosDelete: (id) => workspaceApi('foliosDelete')(id),
  foliosUpdate: (id, patch) => workspaceApi('foliosUpdate')(id, patch),
};
