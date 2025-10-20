import { VercelRequest, VercelResponse } from "@vercel/node";
import "dotenv/config";
import {
  getReportOrThrow,
  updateExistingReport,
  deleteReport
} from "../../dist/src/services/reportService.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    const id = Number.parseInt(req.query.id as string, 10);

    if (req.method === "GET") {
      const report = await getReportOrThrow(id);
      return res.status(200).json({ data: report });
    }

    if (req.method === "PATCH") {
      const report = await updateExistingReport(id, req.body);
      return res.status(200).json({ data: report });
    }

    if (req.method === "DELETE") {
      await deleteReport(id);
      return res.status(204).end();
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("API error:", error);
    res.status(500).json({
      error: error.message || "Internal server error"
    });
  }
}
