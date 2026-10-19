import dotenv from "dotenv";
import connectDB from "../src/db/index.js";
import { SpeedTest } from "../src/models/measure.model.js";
import { SpeedTestAggregate } from "../src/models/aggregate.model.js";
import { upsertSpeedTestAggregate } from "../src/services/aggregate.service.js";
import { resolveIsp, looksLikeIp } from "../src/services/isp.service.js";

dotenv.config();

const ISP_DELAY_MS = 1100;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function backfill() {
  await connectDB();

  await SpeedTestAggregate.collection.drop().catch(() => {});
  console.log("Dropped speedtestaggregates collection");

  const cursor = SpeedTest.find().cursor();
  let processed = 0;
  let ispLookups = 0;

  for await (const doc of cursor) {
    if (
      !doc.provider ||
      doc.provider === doc.ip ||
      looksLikeIp(doc.provider)
    ) {
      const { provider, isp } = await resolveIsp(doc.ip);
      doc.provider = provider;
      doc.isp = isp;
      await doc.save();
      ispLookups += 1;
      await sleep(ISP_DELAY_MS);
    }

    await upsertSpeedTestAggregate(doc);
    processed += 1;

    if (processed % 50 === 0) {
      console.log(`Processed ${processed} documents (${ispLookups} ISP lookups)`);
    }
  }

  console.log(`Backfill complete: ${processed} documents, ${ispLookups} ISP lookups`);
  process.exit(0);
}

backfill().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
