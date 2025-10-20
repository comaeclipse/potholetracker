import { Request, Response, NextFunction } from "express";
import {
  createNewReport,
  deleteReport,
  getReportOrThrow,
  getReports,
  registerVote,
  updateExistingReport
} from "../services/reportService.js";

export async function listReportsHandler(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const reports = await getReports();
    res.json({ data: reports });
  } catch (error) {
    next(error);
  }
}

export async function getReportHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const report = await getReportOrThrow(id);
    res.json({ data: report });
  } catch (error) {
    next(error);
  }
}

export async function createReportHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const report = await createNewReport(req.body);
    res.status(201).json({ data: report });
  } catch (error) {
    next(error);
  }
}

export async function updateReportHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const report = await updateExistingReport(id, req.body);
    res.json({ data: report });
  } catch (error) {
    next(error);
  }
}

export async function deleteReportHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = Number.parseInt(req.params.id, 10);
    await deleteReport(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function voteReportHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const direction = req.params.direction === "up" ? "up" : "down";
    const report = await registerVote(id, direction);
    res.json({ data: report });
  } catch (error) {
    next(error);
  }
}
