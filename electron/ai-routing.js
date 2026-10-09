/**
 * AI capability routing — one honest answer to "which model is powering this
 * feature, and does it actually work?".
 *
 * Capabilities are the user-visible briizOS functions that make model calls.
 * Each capability resolves in this order:
 *   1. A scope-local override (e.g. a journal's Execubriiz support settings)
 *   2. The app-level routing choice stored in the 'ai_routing' setting
 *   3. The app default model profile
 *
 * This module is the single place that defines the capability registry and
 * the resolution/test logic; the settings pane and every consumer read from
 * here so the pane can never disagree with what the app will actually do.
 */

const {
  resolveChatModelRequest,
  createChatModel,
  getRoutingModel,
  ROUTING_FIELDS,
} = require('./agent/models');
const { journalContract, bindJournalModel, parseToolArguments, PROTOCOL } = require('./execubriiz/model-contract');
const { SystemMessage, HumanMessage } = require('@langchain/core/messages');

const CAPABILITIES = [
  {
    id: 'chat',
    label: 'Chat',
    description: 'Main conversation in the interaction panel.',
    routingField: null, // Chat persists its choice as the legacy 'selected_model' setting.
    codexCapable: true,
  },
  {
    id: 'execubriiz-live',
    label: 'Execubriiz · live companion',
    description: 'The companion that reads along while you write a journal entry.',
    routingField: ROUTING_FIELDS['execubriiz-live'],
    journalNote: 'A journal’s own support setting still wins over this choice.',
    codexCapable: false,
  },
  {
    id: 'execubriiz-deep',
    label: 'Execubriiz · board & research',
    description: 'Board curation, entry summaries, session memory and web-research reactions.',
    routingField: ROUTING_FIELDS['execubriiz-deep'],
    journalNote: 'A journal’s own support setting still wins over this choice.',
    codexCapable: false,
  },
  {
    id: 'background',
    label: 'Background helpers',
    description: 'Conversation titles, tags and memory consolidation after chat turns; Forest auto tags and File Hunter searches.',
    routingField: ROUTING_FIELDS.background,
    codexCapable: true,
  },
];

function requestedNameFor(service, capability) {
  if (capability.id === 'chat') {
    const stored = service.getSetting?.('selected_model')?.value;
    return typeof stored === 'string' && stored.trim() ? stored.trim() : null;
  }
  return getRoutingModel(capability.id);
}

function credentialStatus(service, provider) {
  const status = service.getProviderKeyStatus?.() || {};
  switch (provider) {
    case 'openai': return !!status.openai || !!process.env.OPENAI_API_KEY;
    case 'claude': return !!status.claude || !!process.env.ANTHROPIC_API_KEY;
    case 'gemini': return !!status.gemini || !!process.env.GEMINI_API_KEY || !!process.env.GOOGLE_API_KEY;
    default: return false;
  }
}

function resolveCapability(service, capability) {
  const requestedName = requestedNameFor(service, capability);
  let resolved = null;
  let error = null;
  try {
    resolved = resolveChatModelRequest({ name: requestedName, maxTokens: 3500 });
  } catch (e) {
    error = e.message;
  }
  const provider = resolved?.provider || null;
  const incompatible = provider === 'codex' && !capability.codexCapable
    ? 'Execubriiz needs an OpenAI, Claude or Gemini API profile. The Codex Subscription connector cannot power the structured journal workflow.'
    : null;
  const missingKey = provider && provider !== 'codex' ? !credentialStatus(service, provider) : false;
  return {
    id: capability.id,
    label: capability.label,
    description: capability.description,
    journalNote: capability.journalNote || null,
    override: requestedName,
    effectiveName: resolved ? (resolved.profileName || resolved.model) : (requestedName || null),
    provider,
    adapter: resolved?.adapter || null,
    hasCredential: provider ? (provider === 'codex' ? true : !missingKey) : false,
    missingKey: provider ? missingKey : false,
    incompatible,
    error,
  };
}

function routingState(service) {
  return {
    capabilities: CAPABILITIES.map((capability) => resolveCapability(service, capability)),
    models: service.listModelProfiles?.() || [],
  };
}

function setRoute(service, capabilityId, modelName, logger) {
  const capability = CAPABILITIES.find((entry) => entry.id === capabilityId);
  if (!capability) throw new Error('Unknown AI capability');
  const value = typeof modelName === 'string' ? modelName.trim() : '';
  if (value) {
    const known = (service.listModelProfiles?.() || []).some((profile) => profile.name === value || profile.model === value || profile.display_name === value);
    if (!known) throw new Error(`Unknown configured model: ${value}`);
  }
  if (capability.id === 'chat') {
    if (!value) throw new Error('Chat always needs a model; pick one from the Model tab.');
    service.setSetting('selected_model', value);
  } else {
    const current = service.getSetting?.('ai_routing')?.value || {};
    service.setSetting('ai_routing', { ...current, [capability.routingField]: value || null });
  }
  logger?.info?.('ai.routing', value ? `AI routing updated — ${capability.label} now uses ${value}` : `AI routing cleared — ${capability.label} follows the app default`, { capability: capabilityId, model: value || null });
  return resolveCapability(service, capability);
}

async function testRoute(service, capabilityId, logger) {
  const capability = CAPABILITIES.find((entry) => entry.id === capabilityId);
  if (!capability) throw new Error('Unknown AI capability');
  const requestedName = requestedNameFor(service, capability);
  const started = Date.now();
  let timeout = null;
  const controller = new AbortController();
  try {
    const deadline = new Promise((_, reject) => {
      timeout = setTimeout(() => {
        controller.abort();
        reject(new Error('The provider did not answer within 45 seconds'));
      }, 45000);
    });
    await Promise.race([
      (async () => {
        const journal = capability.id.startsWith('execubriiz-');
        const config = resolveChatModelRequest({ name: requestedName, maxTokens: journal ? 3500 : 16 });
        const model = createChatModel({ name: config.profileName, maxTokens: journal ? 3500 : 16 });
        if (journal) {
          const contract = journalContract(config.provider);
          const bound = bindJournalModel(model, contract);
          logger?.info?.('ai.routing', 'Checking the journal function-result contract', { capability: capabilityId, provider: config.provider, model: config.model, mode: contract.mode, tools: contract.tools, toolOptions: contract.options });
          const reply = await bound.invoke([
            new SystemMessage(PROTOCOL),
            new HumanMessage('Connection check with no journal content. Call finish_journal_work with null summary, null answer, empty operations, empty reactions, and null researchQuestion. No retrieval is needed.'),
          ], { signal: controller.signal });
          if (reply.invalid_tool_calls?.length || reply.tool_calls?.length !== 1 || reply.tool_calls[0].name !== 'finish_journal_work') throw new Error('The provider answered, but did not return the requested journal function result.');
          parseToolArguments('finish_journal_work', reply.tool_calls[0].args, 'live');
        } else await model.invoke('Reply with the single word: ok', { signal: controller.signal });
      })(),
      deadline,
    ]);
    const latencyMs = Date.now() - started;
    logger?.info?.('ai.routing', `AI routing test succeeded for ${capability.label}`, { capability: capabilityId, model: requestedName || 'app default', latencyMs });
    return { ok: true, latencyMs };
  } catch (error) {
    logger?.warn?.('ai.routing', `AI routing test failed for ${capability.label}`, { capability: capabilityId, model: requestedName || 'app default', reason: error.message, nextStep: 'Check the API key for this provider on the Model tab, or route this capability to a different model.' });
    return { ok: false, error: error.message };
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

module.exports = { CAPABILITIES, routingState, setRoute, testRoute };
