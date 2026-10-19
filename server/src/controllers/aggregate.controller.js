import { SpeedTestAggregate } from "../models/aggregate.model.js";
import { toAggregateResponse } from "../services/aggregate.service.js";

export const aggregateSpeedData = async (req, res) => {
  try {
    const docs = await SpeedTestAggregate.find().lean();
    const results = docs.map(toAggregateResponse);

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
