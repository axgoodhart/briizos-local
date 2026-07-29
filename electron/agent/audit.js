/**
 * Lossless-enough JSON preparation for the developer AI audit ledger.
 *
 * The governing rule is narrow: redact credentials, never prompts. Message
 * content, system instructions, tool calls/results, duplicate messages, model
 * output, and provider errors stay intact. Repeated object references are
 * serialized repeatedly; only a true ancestor cycle becomes a marker.
 */

function isCredentialKey(key) {
  const compact = String(key || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return compact === 'authorization'
    || compact === 'proxyauthorization'
    || compact === 'apikey'
    || compact.endsWith('apikey')
    || compact === 'cookie'
    || compact === 'setcookie'
    || compact === 'password'
    || compact.endsWith('password')
    || compact === 'clientsecret'
    || compact.endsWith('clientsecret')
    || compact === 'secret'
    || compact.endsWith('secret')
    || compact === 'privatekey'
    || compact.endsWith('privatekey')
    || compact === 'accesstoken'
    || compact.endsWith('accesstoken')
    || compact === 'refreshtoken'
    || compact.endsWith('refreshtoken')
    || compact === 'idtoken'
    || compact.endsWith('idtoken')
    || compact === 'bearertoken'
    || compact.endsWith('bearertoken')
    || compact === 'sessiontoken'
    || compact.endsWith('sessiontoken')
    || compact === 'credential'
    || compact === 'credentials'
    || compact.endsWith('credential')
    || compact.endsWith('credentials');
}

function redactCredentialText(value) {
  return String(value)
    .replace(/\b(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi, '$1[REDACTED credential]')
    .replace(/([?&](?:api[_-]?key|access[_-]?token|refresh[_-]?token|session[_-]?token|token|secret|key)=)[^&#\s]+/gi, '$1[REDACTED credential]')
    .replace(/\bsk-(?:proj-)?[A-Za-z0-9_-]{16,}\b/g, '[REDACTED OpenAI credential]')
    .replace(/\bAIza[A-Za-z0-9_-]{20,}\b/g, '[REDACTED Google credential]');
}

function ownEnumerableValue(value) {
  const result = {};
  for (const key of Object.keys(value)) result[key] = value[key];
  return result;
}

function sanitizeForAudit(value, propertyKey = '', ancestors = new Set()) {
  if (isCredentialKey(propertyKey)) return '[REDACTED credential]';
  if (value === null || value === undefined) return value ?? null;
  if (typeof value === 'string') return redactCredentialText(value);
  if (typeof value === 'boolean' || typeof value === 'number') {
    return Number.isFinite(value) || typeof value !== 'number' ? value : String(value);
  }
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'function') return `[Function ${value.name || 'anonymous'}]`;
  if (typeof value === 'symbol') return String(value);

  if (ancestors.has(value)) {
    return `[Circular ${value?.constructor?.name || 'Object'}]`;
  }
  ancestors.add(value);
  try {
    if (value instanceof Date) return value.toISOString();
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) {
      return {
        object_type: 'Buffer',
        byte_length: value.byteLength,
        base64: value.toString('base64'),
      };
    }
    if (ArrayBuffer.isView(value)) {
      const bytes = Buffer.from(value.buffer, value.byteOffset, value.byteLength);
      return {
        object_type: value.constructor?.name || 'TypedArray',
        byte_length: value.byteLength,
        base64: bytes.toString('base64'),
      };
    }
    if (value instanceof ArrayBuffer) {
      const bytes = Buffer.from(value);
      return {
        object_type: 'ArrayBuffer',
        byte_length: value.byteLength,
        base64: bytes.toString('base64'),
      };
    }
    if (Array.isArray(value)) {
      return value.map((item) => sanitizeForAudit(item, '', ancestors));
    }
    if (value instanceof Map) {
      return {
        object_type: 'Map',
        entries: [...value.entries()].map(([key, entryValue]) => ([
          sanitizeForAudit(key, '', ancestors),
          sanitizeForAudit(entryValue, String(key), ancestors),
        ])),
      };
    }
    if (value instanceof Set) {
      return {
        object_type: 'Set',
        values: [...value].map((item) => sanitizeForAudit(item, '', ancestors)),
      };
    }
    if (value?.constructor?.name === 'Headers' && typeof value.entries === 'function') {
      return sanitizeForAudit(Object.fromEntries(value.entries()), '', ancestors);
    }
    if (value instanceof Error) return serializeError(value, ancestors);

    // LangChain BaseMessage fields are enumerable, but the role/type and LC
    // constructor schema live on methods. Preserve both representations.
    if (typeof value?._getType === 'function') {
      let langchainSerialized = null;
      try {
        langchainSerialized = typeof value.toJSON === 'function' ? value.toJSON() : null;
      } catch {
        langchainSerialized = null;
      }
      return {
        object_type: value.constructor?.name || 'BaseMessage',
        message_type: value._getType(),
        fields: sanitizeForAudit(ownEnumerableValue(value), '', ancestors),
        langchain_serialized: sanitizeForAudit(langchainSerialized, '', ancestors),
      };
    }

    const result = {};
    const objectType = value?.constructor?.name;
    if (objectType && objectType !== 'Object') result.object_type = objectType;
    for (const key of Object.keys(value)) {
      result[key] = sanitizeForAudit(value[key], key, ancestors);
    }
    return result;
  } finally {
    ancestors.delete(value);
  }
}

function serializeError(error, ancestors = new Set()) {
  if (!error) return null;
  const fields = {
    name: error.name || error.constructor?.name || 'Error',
    message: error.message || String(error),
    stack: error.stack || null,
  };
  for (const key of Object.getOwnPropertyNames(error)) {
    if (key === 'name' || key === 'message' || key === 'stack') continue;
    fields[key] = error[key];
  }
  for (const key of [
    'status',
    'statusCode',
    'code',
    'type',
    'param',
    'requestID',
    'request_id',
    'error',
    'cause',
    'response',
    'headers',
  ]) {
    if (fields[key] === undefined && error[key] !== undefined) fields[key] = error[key];
  }
  return sanitizeForAudit(fields, '', ancestors);
}

function collectTokenUsage(value) {
  const sanitized = sanitizeForAudit(value);
  const reported = [];

  function visit(current, path) {
    if (!current || typeof current !== 'object') return;
    if (Array.isArray(current)) {
      current.forEach((item, index) => visit(item, `${path}[${index}]`));
      return;
    }
    for (const [key, child] of Object.entries(current)) {
      const childPath = path ? `${path}.${key}` : key;
      const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      const looksLikeUsage = normalized === 'usagemetadata'
        || normalized === 'tokenusage'
        || (normalized === 'usage'
          && child
          && typeof child === 'object'
          && Object.keys(child).some((usageKey) => /token/i.test(usageKey)));
      if (looksLikeUsage) reported.push({ path: childPath, value: child });
      visit(child, childPath);
    }
  }

  visit(sanitized, '');
  return {
    providerReported: reported,
    note: reported.length
      ? 'Token counts copied exactly from provider/LangChain metadata.'
      : 'The provider/LangChain response did not report token counts for this event.',
  };
}

function providerErrorGuidance(errorDetails, provider, model) {
  const status = errorDetails?.status ?? errorDetails?.statusCode
    ?? errorDetails?.cause?.status ?? errorDetails?.cause?.statusCode ?? null;
  const code = errorDetails?.code ?? errorDetails?.error?.code
    ?? errorDetails?.cause?.code ?? errorDetails?.cause?.error?.code ?? null;
  const text = JSON.stringify(errorDetails || {}).toLowerCase();
  const providerLabel = provider === 'openai' ? 'OpenAI'
    : provider === 'claude' ? 'Anthropic'
      : provider === 'gemini' ? 'Google Gemini'
        : provider || 'The AI provider';
  const modelLabel = model || 'the selected model';

  if (/insufficient_quota|quota|billing|credit balance|resource_exhausted/.test(text)) {
    return {
      category: 'quota_or_billing',
      status,
      code,
      nextAction: `Check ${providerLabel} quota/billing, add provider credit if needed, or select a different configured model before retrying ${modelLabel}.`,
    };
  }
  if (Number(status) === 429 || /rate.?limit|too many requests/.test(text)) {
    return {
      category: 'rate_limit',
      status,
      code,
      nextAction: `Wait for the provider limit to reset, then retry; if it repeats, check ${providerLabel} quota/rate limits or select a different configured model.`,
    };
  }
  if (Number(status) === 401 || /authentication|invalid.?api.?key|unauthorized/.test(text)) {
    return {
      category: 'authentication',
      status,
      code,
      nextAction: `Check the saved ${providerLabel} API credential, then retry or select another configured provider/model.`,
    };
  }
  if (Number(status) === 404 || /model.*not found|unknown model/.test(text)) {
    return {
      category: 'model_unavailable',
      status,
      code,
      nextAction: `Choose a ${providerLabel} model that this account can access, or update the selected model profile before retrying.`,
    };
  }
  return {
    category: 'provider_error',
    status,
    code,
    nextAction: `Review the exact provider error below, verify ${providerLabel} service/credentials and ${modelLabel}, then retry or select another configured model.`,
  };
}

module.exports = {
  collectTokenUsage,
  providerErrorGuidance,
  sanitizeForAudit,
  serializeError,
};
