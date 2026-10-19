import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendData, getData } from '../controllers/measure.controllers.js';
import { aggregateSpeedData } from '../controllers/aggregate.controller.js';
import { reverseGeocode } from '../controllers/geocode.controller.js';
import { getIpGeo } from '../controllers/ipGeo.controller.js';

const router = express.Router();

router.route('/sendData').post(asyncHandler(sendData));
router.route('/getData').get(asyncHandler(getData));
router.route('/aggregated').get(asyncHandler(aggregateSpeedData));
router.route('/geocode').get(asyncHandler(reverseGeocode));
router.route('/ip-geo').get(asyncHandler(getIpGeo));

export default router;
