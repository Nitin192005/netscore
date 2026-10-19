import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError } from '../src/utils/ApiError.js';
import { validateSpeedTestPayload } from '../src/utils/validateSpeedTestPayload.js';

const validPayload = {
  downloadSpeed: 100,
  uploadSpeed: 20,
  ping: 15,
};

test('accepts finite non-negative measurements without location', () => {
  assert.doesNotThrow(() => validateSpeedTestPayload(validPayload));
});

test('accepts valid coordinates including geographic boundaries', () => {
  assert.doesNotThrow(() =>
    validateSpeedTestPayload({
      ...validPayload,
      latitude: -90,
      longitude: 180,
    }),
  );
});

test('rejects a non-object request body', () => {
  assert.throws(
    () => validateSpeedTestPayload(null),
    (error) => error instanceof ApiError && error.statusCode === 400,
  );
});

for (const value of [undefined, '10', -1, NaN, Infinity]) {
  test(`rejects invalid download speed ${String(value)}`, () => {
    assert.throws(
      () =>
        validateSpeedTestPayload({
          ...validPayload,
          downloadSpeed: value,
        }),
      (error) => error instanceof ApiError && error.statusCode === 400,
    );
  });
}

test('rejects coordinates when only one is provided', () => {
  assert.throws(
    () => validateSpeedTestPayload({ ...validPayload, latitude: 10 }),
    (error) => error instanceof ApiError && error.statusCode === 400,
  );
});

test('rejects coordinates outside geographic bounds', () => {
  assert.throws(
    () =>
      validateSpeedTestPayload({
        ...validPayload,
        latitude: 91,
        longitude: 0,
      }),
    (error) => error instanceof ApiError && error.statusCode === 400,
  );
});
