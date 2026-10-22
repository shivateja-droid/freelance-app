import test from 'node:test';
import assert from 'node:assert/strict';
import { createMessageRateLimiter } from '../config/chat.js';

test('reclaims expired inactive users without requiring another message', () => {
  let currentTime = 0;
  const limiter = createMessageRateLimiter({ now: () => currentTime, startCleanup: false });

  assert.equal(limiter.consume('inactive-user'), true);
  assert.equal(limiter.size(), 1);
  currentTime = 10_001;
  limiter.cleanupExpired();
  assert.equal(limiter.size(), 0);
  assert.equal(limiter.consume('inactive-user'), true);
});

test('enforces the configured limit for one authenticated user', () => {
  let currentTime = 0;
  const limiter = createMessageRateLimiter({ now: () => currentTime, startCleanup: false });

  for (let attempt = 0; attempt < 20; attempt += 1) assert.equal(limiter.consume('same-user'), true);
  assert.equal(limiter.consume('same-user'), false);
  currentTime = 10_001;
  limiter.cleanupExpired();
  assert.equal(limiter.consume('same-user'), true);
});

test('bounds tracked limiter users and exposes a clean stop operation', () => {
  const limiter = createMessageRateLimiter({ maxUsers: 2, startCleanup: false });

  assert.equal(limiter.consume('user-1'), true);
  assert.equal(limiter.consume('user-2'), true);
  assert.equal(limiter.consume('user-3'), false);
  assert.equal(limiter.size(), 2);
  limiter.stop();
  assert.equal(limiter.size(), 0);
});