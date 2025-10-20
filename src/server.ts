import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import { fileURLToPath } from "node:url";
import reportsRouter from "./routes/reportRoutes.js";

const app = express();
const port = Number.parseInt(process.env.PORT ?? "3000", 10);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "../public");

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicDir));

app.use("/api/reports", reportsRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use(
  (
    err: Error & { status?: number; statusCode?: number },
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    const status = err.status ?? err.statusCode ?? 500;
    res.status(status).json({
      error: err.message ?? "Unexpected error"
    });
  }
);

app.listen(port, () => {
  console.log(`🚧 Pothole Reporter API running on http://localhost:${port}`);
});
