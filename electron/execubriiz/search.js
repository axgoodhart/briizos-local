// Research credentials stay in Main. This capability has no filesystem, terminal,
// calendar, messaging or purchase tools and never receives raw Invisible entries.
async function searchWeb({ service, config, question, signal, logger }) {
  const provider = config.provider;
  const key = service.getProviderApiKey(provider) || (provider === 'openai' ? process.env.OPENAI_API_KEY : provider === 'claude' ? process.env.ANTHROPIC_API_KEY : process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  if (!key) throw new Error('Online research needs the selected provider’s API key');
  let url; let headers; let body;
  const prompt = `Research this narrow question using web search. State only supported facts and cite sources. Today is ${new Date().toISOString().slice(0, 10)}. Question: ${String(question || '').slice(0, 1000)}`;
  if (provider === 'openai') {
    url = 'https://api.openai.com/v1/responses'; headers = { Authorization: `Bearer ${key}` };
    body = { model: config.model, input: prompt, tools: [{ type: 'web_search' }], max_output_tokens: 1800 };
  } else if (provider === 'claude') {
    url = 'https://api.anthropic.com/v1/messages'; headers = { 'x-api-key': key, 'anthropic-version': '2023-06-01' };
    body = { model: config.model, max_tokens: 1800, messages: [{ role: 'user', content: prompt }], tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 2 }] };
  } else if (provider === 'gemini') {
    url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent`; headers = { 'x-goog-api-key': key };
    body = { contents: [{ parts: [{ text: prompt }] }], tools: [{ google_search: {} }] };
  } else throw new Error('The selected model has no journal web-search adapter');
  logger.info('journal.execubriiz', 'Journal online research requested', { provider, model: config.model, query: question, executionTools: false });
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body), signal });
  if (!response.ok) throw new Error(`Online research returned ${response.status}; verify the selected model supports web search`);
  const data = await response.json();
  const sources = []; const texts = [];
  const visit = (value) => {
    if (!value || typeof value !== 'object') return;
    const link = value.url || (value.web && value.web.uri);
    if (typeof link === 'string' && /^https?:\/\//i.test(link)) sources.push({ url: link, title: value.title || value.web?.title || '', retrievedAt: new Date().toISOString() });
    if (typeof value.text === 'string') texts.push(value.text);
    for (const child of Object.values(value)) if (typeof child === 'object') Array.isArray(child) ? child.forEach(visit) : visit(child);
  };
  visit(data);
  const unique = [...new Map(sources.map((s) => [s.url, s])).values()].slice(0, 12);
  if (!unique.length) throw new Error('Research returned no source links; no unsupported reaction was added');
  logger.info('journal.execubriiz', 'Journal research returned source evidence', { provider, sources: unique, usage: data.usage || data.usageMetadata });
  return { text: texts.join('\n').slice(0, 12000), sources: unique };
}
module.exports = { searchWeb };
