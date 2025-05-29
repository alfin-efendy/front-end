"use server";

import { createClient } from "@/lib/supabase/server";
import { NewProjectSchema, NewProjectInput } from "@/types/project";

export async function createProject(
  params: NewProjectInput
): Promise<{ success: boolean; error?: string }> {
  const parsed = NewProjectSchema.safeParse(params);
  const supabase = await createClient();

  if (!parsed.success) {
    return { success: false, error: "Data not valid!" };
  }

  // Insert into "project" table
  const { data: projectData, error: projectError } = await supabase
    .from("project")
    .insert({
      name: parsed.data.name,
      description: parsed.data.description,
    })
    .select("id")
    .single();

  if (projectError) {
    return { success: false, error: projectError.message };
  }

  const { error: labelError } = await supabase.from("label").insert(
    parsed.data.labels.map((label) => ({
      project_id: projectData.id,
      label: label.name,
      type: label.type,
      color: label.color,
      order: label.order,
    }))
  );

  if (labelError) {
    return { success: false, error: labelError.message };
  }

  const { error: imageError } = await supabase.from("task").insert(
    parsed.data.images.map((image) => ({
      project_id: projectData.id,
      file_path: image,
    }))
  );

  if (imageError) {
    return { success: false, error: imageError.message };
  }

  return { success: true };
}
