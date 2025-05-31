"use server";

import { createClient } from "@/lib/supabase/server";
import {
  NewProjectSchema,
  NewProjectInput,
  ProjectWithStats,
} from "@/types/project";

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

  // Move file from temporary folder to permanent storage
  const docFiles: string[] = await Promise.all(
    parsed.data.files.map(async (tmpFile) => {
      const timestamp = Date.now();
      const fileName = tmpFile.split("/").pop() || "";
      const extension = fileName.split(".").pop() || "";
      const docFilePath = `docs/${timestamp}.${extension}`;

      // TODO: Move file to permanent storage is not working
      const { error } = await supabase.storage
        .from(process.env.NEXT_SUPABASE_BUCKET!)
        .move(tmpFile, docFilePath);

      if (error) {
        return tmpFile;
      }
      return docFilePath;
    })
  );

  const { error: imageError } = await supabase.from("task").insert(
    docFiles.map((docFile) => ({
      project_id: projectData.id,
      file_path: docFile,
    }))
  );

  if (imageError) {
    return { success: false, error: imageError.message };
  }

  return { success: true };
}

export async function getProject(search?: string): Promise<ProjectWithStats[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project")
    .select("*")
    .ilike("name", `%${search ?? ""}%`)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const processedProjects: ProjectWithStats[] = await Promise.all(
    (data || []).map(async (project: any) => {
      // Fetch task for this project
      const { data: files } = await supabase
        .from("task")
        .select("id, file_path")
        .eq("project_id", project.id);

      // Fetch labels for this project
      const { data: labels } = await supabase
        .from("label")
        .select("id, label")
        .eq("project_id", project.id);

      // Fetch annotations for files in this project
      const fileIds = (files || []).map((file: any) => file.id);
      let annotations: any[] = [];

      if (fileIds.length > 0) {
        const { data: annotationsData } = await supabase
          .from("annotation")
          .select("id, is_submitted, file_id")
          .in("task_id", fileIds);

        annotations = annotationsData || [];
      }

      const totalFiles = (files || []).length;
      const submittedAnnotations = annotations.filter(
        (ann: any) => ann.is_submitted
      ).length;
      const totalLabels = (labels || []).length;
      const progress =
        totalFiles > 0
          ? Math.round((submittedAnnotations / totalFiles) * 100)
          : 0;

      return {
        id: project.id,
        name: project.name,
        created_at: project.created_at,
        updated_at: project.updated_at,
        user_id: project.user_id,
        totalFiles,
        submittedAnnotations,
        totalLabels,
        progress,
      };
    })
  );

  return processedProjects;
}

export async function deleteProject(
  id: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error: projectError } = await supabase
    .from("project")
    .delete()
    .eq("id", id);

  if (projectError) {
    return { success: false, error: projectError.message };
  }

  return { success: true };
}
