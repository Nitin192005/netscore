import { SpeedTestAggregate } from "../models/aggregate.model.js";
import { geoBuckets } from "../utils/geoBucket.js";

function formatDate(timestamp) {
  const d = new Date(timestamp);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatHour(timestamp) {
  return new Date(timestamp).getUTCHours();
}

export function toAggregateResponse(doc) {
  const { totalTests, sumDownload, sumUpload } = doc.metrics;
  const count = totalTests || 1;

  return {
    provider: doc.provider,
    location: {
      latBucket: doc.location.latBucket,
      lonBucket: doc.location.lonBucket,
    },
    timeBucket: {
      date: doc.timeBucket.date,
      hour: doc.timeBucket.hour,
    },
    metrics: {
      totalTests,
      avgDownload: Math.round((sumDownload / count) * 100) / 100,
      avgUpload: Math.round((sumUpload / count) * 100) / 100,
      maxDownload: doc.metrics.maxDownload,
      minDownload: doc.metrics.minDownload,
      maxUpload: doc.metrics.maxUpload,
      minUpload: doc.metrics.minUpload,
    },
    lastUpdated: doc.lastUpdated,
  };
}

export async function upsertSpeedTestAggregate(entry) {
  const { latBucket, lonBucket } = geoBuckets(entry.latitude, entry.longitude);
  if (latBucket == null || lonBucket == null) return null;

  const provider = entry.provider || "Unknown";
  const timestamp = entry.timestamp ?? new Date();
  const date = formatDate(timestamp);
  const hour = formatHour(timestamp);
  const download = entry.downloadSpeedMbps ?? 0;
  const upload = entry.uploadSpeedMbps ?? 0;

  return SpeedTestAggregate.findOneAndUpdate(
    {
      provider,
      "location.latBucket": latBucket,
      "location.lonBucket": lonBucket,
      "timeBucket.date": date,
      "timeBucket.hour": hour,
    },
    {
      $inc: {
        "metrics.totalTests": 1,
        "metrics.sumDownload": download,
        "metrics.sumUpload": upload,
      },
      $max: {
        "metrics.maxDownload": download,
        "metrics.maxUpload": upload,
      },
      $min: {
        "metrics.minDownload": download,
        "metrics.minUpload": upload,
      },
      $set: { lastUpdated: new Date() },
      $setOnInsert: {
        provider,
        location: { latBucket, lonBucket },
        timeBucket: { date, hour },
      },
    },
    { upsert: true, new: true },
  );
}
