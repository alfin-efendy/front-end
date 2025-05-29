import { z } from "zod";
export const LabelTypeSchema = z.enum(["text", "table", "image", "qr/barcode"]);

export const LabelSchema = z.object({
  id: z.string().optional(),
  order: z.number(),
  name: z.string(),
  type: LabelTypeSchema,
  color: z.string(),
});
export const LabelArraySchema = z.object({
  labels: z.array(LabelSchema),
});

export type LabelType = z.infer<typeof LabelTypeSchema>;
export type LabelInput = z.infer<typeof LabelSchema>;
export type LabelArrayInput = z.infer<typeof LabelArraySchema>;

function formatLabel(value: string): string {
  return value
    .split("/")
    .map((v) => v.charAt(0).toUpperCase() + v.slice(1))
    .join("/");
}

export const LabelTypes: { value: LabelType; label: string }[] = LabelTypeSchema.options.map(
  (value) => ({
    value,
    label: formatLabel(value),
  })
);
