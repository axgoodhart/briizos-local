/**
 * Provider transport audit context.
 *
 * LangGraph agents are cached and can serve concurrent turns, so a callback
 * stored directly on a model instance would mix unrelated conversations.
 * AsyncLocalStorage keeps the transport capture attached to the turn whose
 * async iterator is currently advancing.
 */

const crypto = require('crypto');
const { AsyncLocalStorage } = require('node:async_hooks');
const { sanitizeForAudit } = require('./audit');

const providerHttpAudit = new AsyncLocalStorage();
const nativeFetch = globalThis.fetch;

function stopWithoutRetry(message, code) {
  const error = new Error(message);
  error.code = code;
  error.status = 400;
  error.statusCode = 400;
  return error;
}

function withProviderInvocationAudit(invocationRef, task) {
  const context = providerHttpAudit.getStore();
  if (!context) return task();
  return providerHttpAudit.run(
    {
      ...context,
      invocationRef,
    },
    task,
  );
}

function selectedResponseHeaders(value) {
  if (!value) return {};
  try {
    const headers = new Headers(value);
    const result = {};
    for (const key of [
      'x-request-id',
      'openai-processing-ms',
      'x-ratelimit-limit-requests',
      'x-ratelimit-remaining-requests',
      'x-ratelimit-reset-requests',
      'x-ratelimit-limit-tokens',
      'x-ratelimit-remaining-tokens',
      'x-ratelimit-reset-tokens',
    ]) {
      const headerValue = headers.get(key);
      if (headerValue != null) result[key] = headerValue;
    }
    return result;
  } catch {
    return { selected_headers_unreadable: true };
  }
}

function endpointDetails(input, init) {
  try {
    const requestObject = typeof Request !== 'undefined' && input instanceof Request
      ? input
      : null;
    const url = new URL(requestObject?.url || String(input));
    return {
      method: String(init?.method || requestObject?.method || 'GET').toUpperCase(),
      origin: url.origin,
      path: url.pathname,
    };
  } catch {
    return {
      method: String(init?.method || 'GET').toUpperCase(),
      origin: null,
      path: String(input),
    };
  }
}

async function describeBody(body) {
  if (body == null) {
    return {
      body_type: null,
      byte_length: 0,
      serialized_body_redacted: null,
      parsed_json_body: null,
      original_body_sha256: null,
    };
  }

  let serializedBody = null;
  let bodyType = body?.constructor?.name || typeof body;
  let base64Body = null;

  if (typeof body === 'string') {
    serializedBody = body;
    bodyType = 'string';
  } else if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) {
    serializedBody = body.toString();
    bodyType = 'URLSearchParams';
  } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(body)) {
    base64Body = body.toString('base64');
    bodyType = 'Buffer';
  } else if (ArrayBuffer.isView(body)) {
    base64Body = Buffer.from(body.buffer, body.byteOffset, body.byteLength).toString('base64');
  } else if (body instanceof ArrayBuffer) {
    base64Body = Buffer.from(body).toString('base64');
  } else if (typeof Blob !== 'undefined' && body instanceof Blob) {
    serializedBody = await body.text();
    bodyType = 'Blob';
  } else if (typeof FormData !== 'undefined' && body instanceof FormData) {
    return {
      body_type: 'FormData',
      byte_length: null,
      serialized_body_redacted: null,
      parsed_json_body: null,
      form_fields: [...body.entries()].map(([key, value]) => ({
        key,
        value: typeof value === 'string'
          ? value
          : {
            type: value?.constructor?.name || 'File',
            name: value?.name || null,
            size: value?.size ?? null,
            mime_type: value?.type || null,
          },
      })),
      note: 'The runtime creates the multipart boundary during fetch, so field values are retained but the generated boundary bytes are not available at this hook.',
    };
  } else {
    serializedBody = String(body);
  }

  let parsedJsonBody = null;
  if (serializedBody != null) {
    try {
      parsedJsonBody = JSON.parse(serializedBody);
    } catch {
      parsedJsonBody = null;
    }
  }

  const byteLength = serializedBody != null
    ? Buffer.byteLength(serializedBody, 'utf8')
    : base64Body != null
      ? Buffer.from(base64Body, 'base64').byteLength
      : null;
  const originalBodySha256 = serializedBody != null
    ? crypto.createHash('sha256').update(serializedBody).digest('hex')
    : base64Body != null
      ? crypto.createHash('sha256').update(Buffer.from(base64Body, 'base64')).digest('hex')
      : null;
  const redactedParsedJsonBody = parsedJsonBody == null
    ? null
    : sanitizeForAudit(parsedJsonBody);
  const redactedSerializedBody = redactedParsedJsonBody == null
    ? serializedBody == null
      ? null
      : sanitizeForAudit(serializedBody)
    : JSON.stringify(redactedParsedJsonBody);

  return {
    body_type: bodyType,
    byte_length: byteLength,
    original_body_sha256: originalBodySha256,
    serialized_body_redacted: redactedSerializedBody,
    parsed_json_body: redactedParsedJsonBody,
    base64_body: base64Body,
  };
}

async function captureRequest(input, init = {}) {
  const endpoint = endpointDetails(input, init);
  return {
    wire_request_id: crypto.randomUUID(),
    capture_boundary: 'custom fetch immediately before network dispatch',
    endpoint_origin: endpoint.origin,
    endpoint_path: endpoint.path,
    method: endpoint.method,
    body: await describeBody(init.body),
  };
}

function captureResponse(response, wireRequestId) {
  return {
    wire_request_id: wireRequestId,
    capture_boundary: 'custom fetch immediately after response headers arrived',
    status: response?.status ?? null,
    status_text: response?.statusText || null,
    ok: response?.ok ?? null,
    redirected: response?.redirected ?? null,
    response_type: response?.type || null,
    selected_headers: selectedResponseHeaders(response?.headers),
    body_note: 'The streamed response body is retained by LangChain model stream/completion audit events instead of being consumed at the fetch boundary.',
  };
}

async function auditedProviderFetch(input, init) {
  const endpoint = endpointDetails(input, init);
  const isModelRequest = endpoint.method === 'POST'
    && (endpoint.path.endsWith('/chat/completions') || endpoint.path.endsWith('/responses'));
  if (!isModelRequest) {
    if (typeof nativeFetch !== 'function') {
      throw new Error('The runtime has no fetch implementation for the AI provider request.');
    }
    return nativeFetch.call(undefined, input, init);
  }

  const context = providerHttpAudit.getStore();
  if (typeof nativeFetch !== 'function') {
    throw new Error('The runtime has no fetch implementation for the AI provider request.');
  }
  if (!context) {
    throw stopWithoutRetry(
      'The OpenAI request had no turn-scoped audit context, so briizOS stopped it before network dispatch.',
      'AI_AUDIT_CONTEXT_MISSING',
    );
  }
  if (typeof init?.body !== 'string') {
    throw stopWithoutRetry(
      'The OpenAI SDK did not expose a serialized JSON request body, so briizOS stopped the request instead of sending it without a complete audit record.',
      'AI_AUDIT_REQUEST_BODY_UNAVAILABLE',
    );
  }
  const langchainInvocationId = context.invocationRef?.runId || null;
  if (!langchainInvocationId) {
    throw stopWithoutRetry(
      'The OpenAI request could not be correlated to its LangChain model invocation, so briizOS stopped it before network dispatch.',
      'AI_AUDIT_INVOCATION_MISSING',
    );
  }

  const request = {
    ...await captureRequest(input, init),
    langchain_invocation_id: langchainInvocationId,
  };
  const requestContext = await context.onRequest?.(request);
  let response;
  try {
    response = await nativeFetch.call(undefined, input, init);
  } catch (error) {
    try {
      await context.onNetworkError?.(request, error, requestContext);
    } catch {
      // Preserve the original transport failure. The required model_error
      // record later in the turn decides whether the outcome is auditable.
    }
    throw error;
  }
  try {
    await context.onResponse?.(captureResponse(response, request.wire_request_id), requestContext);
  } catch {
    // Never turn a post-dispatch bookkeeping failure into a provider retry.
    // The required model_response/model_error write later fails the turn closed.
  }
  return response;
}

/**
 * Advance every async-generator step inside the supplied turn context. Merely
 * creating an async generator inside AsyncLocalStorage is insufficient because
 * its body does not execute until next() is called.
 */
async function* withProviderHttpAudit(context, iterableFactory) {
  const iterator = providerHttpAudit.run(
    context,
    () => iterableFactory()[Symbol.asyncIterator](),
  );
  let finished = false;
  try {
    while (!finished) {
      const step = await providerHttpAudit.run(context, () => iterator.next());
      finished = !!step.done;
      if (!finished) yield step.value;
    }
  } finally {
    if (!finished && typeof iterator.return === 'function') {
      await providerHttpAudit.run(context, () => iterator.return());
    }
  }
}

module.exports = {
  auditedProviderFetch,
  withProviderInvocationAudit,
  withProviderHttpAudit,
};
