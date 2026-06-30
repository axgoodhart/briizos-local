class LocalDataError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'LocalDataError';
    this.code = code;
  }
}

function fail(code, message) {
  throw new LocalDataError(code, message);
}

function object(value, label, allowedKeys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail('INVALID_INPUT', `${label} must be an object`);
  }
  const unknown = Object.keys(value).filter((key) => !allowedKeys.includes(key));
  if (unknown.length) fail('INVALID_INPUT', `${label} contains unsupported fields: ${unknown.join(', ')}`);
  return value;
}

function string(value, label, { required = false, nullable = false, max = 10000 } = {}) {
  if (value === undefined) {
    if (!required) return undefined;
    fail('INVALID_INPUT', `${label} is required`);
  }
  if (value === null) {
    if (nullable) return null;
    fail('INVALID_INPUT', `${label} must be text`);
  }
  if (typeof value !== 'string') fail('INVALID_INPUT', `${label} must be text`);
  const normalized = value.trim();
  if (required && !normalized) fail('INVALID_INPUT', `${label} cannot be empty`);
  if (value.length > max) fail('INVALID_INPUT', `${label} is too long`);
  return value;
}

function identifier(value, label = 'id', { nullable = false } = {}) {
  if (value == null && nullable) return null;
  const result = string(value, label, { required: true, max: 128 });
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(result)) {
    fail('INVALID_INPUT', `${label} has an invalid format`);
  }
  return result;
}

function integer(value, label, { nullable = false, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (value == null && nullable) return null;
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    fail('INVALID_INPUT', `${label} must be an integer between ${min} and ${max}`);
  }
  return value;
}

function number(value, label, { min = -Number.MAX_VALUE, max = Number.MAX_VALUE } = {}) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    fail('INVALID_INPUT', `${label} must be a number between ${min} and ${max}`);
  }
  return value;
}

function boolean(value, label) {
  if (typeof value !== 'boolean') fail('INVALID_INPUT', `${label} must be true or false`);
  return value;
}

function oneOf(value, label, values, { nullable = false } = {}) {
  if (value == null && nullable) return null;
  if (!values.includes(value)) fail('INVALID_INPUT', `${label} must be one of: ${values.join(', ')}`);
  return value;
}

function stringArray(value, label, { maxItems = 100, maxLength = 200 } = {}) {
  if (!Array.isArray(value) || value.length > maxItems) {
    fail('INVALID_INPUT', `${label} must be a list with at most ${maxItems} items`);
  }
  return value.map((item, index) => string(item, `${label}[${index}]`, { required: true, max: maxLength }));
}

function optional(value, validator) {
  return value === undefined ? undefined : validator(value);
}

module.exports = {
  LocalDataError,
  boolean,
  fail,
  identifier,
  integer,
  number,
  object,
  oneOf,
  optional,
  string,
  stringArray,
};
