import { z } from "zod";
import { LabelSchema } from "./label";

export const ProjectSchema = z.object({
    id: z.number().optional(),
    name: z.string().min(1, "Project name is required"),
    description: z.string().optional(),
    createdAt: z.date().optional(),
    createdBy: z.string().optional(),
    updatedAt: z.date().optional(),
    updatedBy: z.string().optional(),
});
export type ProjectInput = z.infer<typeof ProjectSchema>;

export const NewProjectSchema = ProjectSchema.merge(
  z.object({
    labels: z.array(LabelSchema), // or reuse LabelArraySchema
    images: z.array(z.string()).min(1, "At least one image is required"),
  })
);
export type NewProjectInput = z.infer<typeof NewProjectSchema>;
