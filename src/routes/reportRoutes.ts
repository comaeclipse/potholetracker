import { Router } from "express";
import {
  createReportHandler,
  deleteReportHandler,
  getReportHandler,
  listReportsHandler,
  updateReportHandler,
  voteReportHandler
} from "../controllers/reportController.js";

const router = Router();

router.get("/", listReportsHandler);
router.get("/:id", getReportHandler);
router.post("/", createReportHandler);
router.patch("/:id", updateReportHandler);
router.delete("/:id", deleteReportHandler);
router.post("/:id/votes/:direction(up|down)", voteReportHandler);

export default router;
