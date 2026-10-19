export const BUCKET_PRECISION = 3;

export function bucketCoord(value) {
  if (value == null || Number.isNaN(Number(value))) return null;
  const factor = 10 ** BUCKET_PRECISION;
  return Math.round(Number(value) * factor) / factor;
}

export function geoBuckets(latitude, longitude) {
  return {
    latBucket: bucketCoord(latitude),
    lonBucket: bucketCoord(longitude),
  };
}
