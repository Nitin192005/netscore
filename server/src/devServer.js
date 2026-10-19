import connectDB from "./db/index.js"
import dotenv from "dotenv";
import { app } from "./expressApp.js";

dotenv.config({
  path: "./.env",
});
connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.error("Error in Express server:", error);
      throw error;
    });
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on port ${process.env.PORT || 8000}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to the database:", err);
    process.exit(1);
  });