import { ApiError } from './ApiError.js';

const measurementFields = ['downloadSpeed', 'uploadSpeed', 'ping'];

export function validateSpeedTestPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new ApiError(400, 'Request body must be an object');
  }

  for (const field of measurementFields) {
    const value = payload[field];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      throw new ApiError(400, `${field} must be a finite non-negative number`);
    }
  }

  const { latitude, longitude } = payload;
  const hasLatitude = latitude != null;
  const hasLongitude = longitude != null;

  if (hasLatitude !== hasLongitude) {
    throw new ApiError(400, 'Latitude and longitude must be provided together');
  }

  if (
    hasLatitude &&
    (typeof latitude !== 'number' ||
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      typeof longitude !== 'number' ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180)
  ) {
    throw new ApiError(400, 'Latitude and longitude must be valid coordinates');
  }
}
