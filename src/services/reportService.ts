import { ReportStatus } from "@prisma/client";
import createHttpError from "http-errors";
import {
  createReport,
  getReportById,
  incrementVote,
  listReports,
  removeReport,
  updateReport
} from "../repositories/reportRepository.js";
import {
  ReportPayload,
  reportPayloadSchema
} from "../types/report.js";

export async function getReports() {
  return listReports();
}

export async function getReportOrThrow(id: number) {
  const report = await getReportById(id);
  if (!report) {
    throw createHttpError(404, "Report not found");
  }
  return report;
}

export async function createNewReport(payload: unknown) {
  const data = reportPayloadSchema.parse(payload);
  return createReport(data);
}

export async function updateExistingReport(
  id: number,
  payload: Partial<ReportPayload> & { status?: ReportStatus }
) {
  await getReportOrThrow(id);
  const safeData = reportPayloadSchema.partial().parse(payload);
  return updateReport(id, safeData);
}

export async function deleteReport(id: number) {
  await getReportOrThrow(id);
  await removeReport(id);
}

export async function registerVote(id: number, type: "up" | "down") {
  await getReportOrThrow(id);
  return incrementVote(id, type);
}
