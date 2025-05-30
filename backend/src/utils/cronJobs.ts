import cron from "node-cron";
import { sendDailyAllFeedersReport } from "../controllers/report.controller";
import { Request, Response } from "express";

// We need dummy Request and Response objects because sendDailyAllFeedersReport expects them,
// but since we are running outside Express, we can mock minimal versions.
const mockReq = {
  query: {
    // For a full month report, don't specify a specific date
    // This will make the controller use the default logic to generate a report from the 1st to today
  }
} as Request;

const mockRes = {
  status: function (code: number) {
    // chainable function
    return this;
  },
  json: function (obj: any) {
    console.log("Cron job response:", obj);
    return this;
  }
} as unknown as Response;

// Run the cron job every day at 12:00 AM
cron.schedule("0 12 * * *", async () => {
  console.log("Running daily feeders report cron job...");
  try {
    await sendDailyAllFeedersReport(mockReq, mockRes);
  } catch (error) {
    console.error("Error in cron job:", error);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
  }
});

// For testing purposes only - remove in production
// This runs every 5 minutes for testing
if (process.env.NODE_ENV === "development") {
  cron.schedule("*/30 * * * *", async () => {
    console.log("Running daily feeders report cron job for testing (every 5 minutes)...");
    try {
      await sendDailyAllFeedersReport(mockReq, mockRes);
    } catch (error) {
      console.error("Error in cron job:", error);
      console.error("Error message:", error instanceof Error ? error.message : String(error));
    }
  });
}