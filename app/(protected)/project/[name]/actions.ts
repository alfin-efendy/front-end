"use server";
import { createClient } from "@/lib/supabase/server";
import { Task } from "@/types/task";
import { headers } from "next/headers";

export async function getTask(
  projectName: string
): Promise<{ data: Task[]; error?: string }> {
  const supabase = await createClient();
  const requestHeaders = headers();
  const host = (await requestHeaders).get("host");
  const protocol = (await requestHeaders).get("x-forwarded-proto") || "http";
  const { data: projectData, error: projectError } = await supabase
    .from("project")
    .select("id")
    .eq("name", projectName)
    .single();

  if (projectError) {
    return {
      data: [],
      error: `Project not found: ${projectError.message}`,
    };
  }

  // Fetch tasks for the given project name
  const { data, error } = await supabase
    .from("task")
    .select("*")
    .eq("project_id", projectData.id);

  if (error) {
    return {
      data: [],
      error: `Error fetching tasks: ${error.message}`,
    };
  }

  // Process the data to ensure it matches the Task type
  const processedTasks: Task[] = await Promise.all(
    data.map(async (task) => {
      let annotations: any[] = [];

      const { data: annotationsData } = await supabase
        .from("annotation")
        .select("id, label_id")
        .eq("task_id", task.id);

      annotations = annotationsData || [];
      const submittedAnnotations = annotations.filter(
        (ann: any) => ann.label_id
      ).length;

      const urlFile = `${protocol}://${host}/files/${task.file_path}`;

      return {
        id: task.id,
        urlFile: urlFile,
        status: task.status,
        totalLabeled: submittedAnnotations,
        totalAnnotations: annotations.length,
        cratedAt: task.crated_at,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
        createdBy: task.created_by,
        updatedBy: task.updated_by,
      };
    })
  );

  return {
    data: processedTasks,
  };
}
