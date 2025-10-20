import { Report, ReportStatus } from "@prisma/client";
import { z } from "zod";

export const reportPayloadSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(2000),
  location: z.string().min(3).max(255),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  status: z.nativeEnum(ReportStatus).optional(),
  imageUrl: z
    .string()
    .url()
    .or(z.string().length(0))
    .optional(),
  upVotes: z.number().int().min(0).optional(),
  downVotes: z.number().int().min(0).optional()
});

export type ReportPayload = z.infer<typeof reportPayloadSchema>;

export type ReportWithMeta = Report;
