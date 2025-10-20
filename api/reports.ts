import { VercelRequest, VercelResponse } from "@vercel/node";
import "dotenv/config";
import { getReports, createNewReport } from "../dist/src/services/reportService.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE, PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === "GET") {
      const reports = await getReports();
      return res.status(200).json({ data: reports });
    }

    if (req.method === "POST") {
      const report = await createNewReport(req.body);
      return res.status(201).json({ data: report });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("API error:", error);
    res.status(500).json({
      error: error.message || "Internal server error"
    });
  }
}
