import { ReportStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { ReportPayload } from "../types/report.js";

export function listReports() {
  return prisma.report.findMany({
    orderBy: {
      reportedAt: "desc"
    }
  });
}

export function getReportById(id: number) {
  return prisma.report.findUnique({ where: { id } });
}

export function createReport(payload: ReportPayload) {
  const { latitude, longitude, status, upVotes, downVotes, ...rest } = payload;

  return prisma.report.create({
    data: {
      ...rest,
      status: status ?? ReportStatus.REPORTED,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      upVotes: upVotes ?? 0,
      downVotes: downVotes ?? 0
    }
  });
}

export function updateReport(
  id: number,
  payload: Partial<ReportPayload> & { status?: ReportStatus }
) {
  return prisma.report.update({
    where: { id },
    data: {
      ...payload,
      latitude:
        payload.latitude !== undefined ? payload.latitude : undefined,
      longitude:
        payload.longitude !== undefined ? payload.longitude : undefined
    }
  });
}

export function removeReport(id: number) {
  return prisma.report.delete({ where: { id } });
}

export function incrementVote(id: number, type: "up" | "down") {
  if (type === "up") {
    return prisma.report.update({
      where: { id },
      data: { upVotes: { increment: 1 } }
    });
  }

  return prisma.report.update({
    where: { id },
    data: { downVotes: { increment: 1 } }
  });
}
