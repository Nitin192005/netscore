import express from "express";
import dotenv from "dotenv";
import connectDB from "./src/db/index.js";
import { app } from "./src/expressApp.js";

dotenv.config();

export default async function handler(req, res) {
  await connectDB();
  return app(req, res);
}
