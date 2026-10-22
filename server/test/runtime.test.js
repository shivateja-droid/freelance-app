import test from 'node:test';
import assert from 'node:assert/strict';
import { localDevelopmentOrigin } from '../config/cors.js';
import { resolveRuntimeConfig } from '../config/runtime.js';

const productionEnvironment = {
  NODE_ENV: 'production',
  JWT_SECRET: 'a'.repeat(32),
  MONGO_URI: 'mongodb://test.invalid/kaamsetu',
  CLIENT_ORIGINS: 'https://kaamsetu-wheat.vercel.app',
  ALLOW_LOCAL_ORIGIN: 'true',
};

test('requires an explicitly supported NODE_ENV', () => {
  assert.throws(() => resolveRuntimeConfig({}), /NODE_ENV/);
  assert.throws(() => resolveRuntimeConfig({ NODE_ENV: 'prod' }), /NODE_ENV/);
});

test('validates required production configuration without exposing values', () => {
  const config = resolveRuntimeConfig(productionEnvironment);
  assert.equal(config.nodeEnv, 'production');
  assert.equal(config.allowLocalOrigin, false);
  assert.equal(config.clientOriginPolicy.allows('https://kaamsetu-wheat.vercel.app'), true);
  assert.equal(config.clientOriginPolicy.allows(localDevelopmentOrigin), false);
  assert.throws(() => resolveRuntimeConfig({ ...productionEnvironment, MONGO_URI: '' }), /MONGO_URI/);
});

test('enables localhost only for explicitly configured development', () => {
  const config = resolveRuntimeConfig({
    NODE_ENV: 'development',
    ALLOW_LOCAL_ORIGIN: 'true',
    CLIENT_ORIGINS: '',
  });
  assert.equal(config.allowLocalOrigin, true);
  assert.equal(config.clientOriginPolicy.allows(localDevelopmentOrigin), true);
});

test('keeps test mode non-production and does not enable localhost implicitly', () => {
  const config = resolveRuntimeConfig({
    NODE_ENV: 'test',
    ALLOW_LOCAL_ORIGIN: 'true',
    CLIENT_ORIGINS: 'https://kaamsetu-wheat.vercel.app',
  });
  assert.equal(config.allowLocalOrigin, false);
  assert.equal(config.clientOriginPolicy.allows(localDevelopmentOrigin), false);
});