import { VercelRequest, VercelResponse } from "@vercel/node";
import "dotenv/config";
import { registerVote } from "../../../../dist/src/services/reportService.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const id = Number.parseInt(req.query.id as string, 10);
    const direction = req.query.direction === "up" ? "up" : "down";

    const report = await registerVote(id, direction);
    return res.status(200).json({ data: report });
  } catch (error: any) {
    console.error("API error:", error);
    res.status(500).json({
      error: error.message || "Internal server error"
    });
  }
}
