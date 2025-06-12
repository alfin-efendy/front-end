"use server";
import { createClient } from "@/lib/supabase/server";
import { InitialAnnotationData } from "@/types/annotation";
import { LabelInput } from "@/types/label";
import { Task } from "@/types/task";
import { headers } from "next/headers";

export async function getAnnotation(
  taskId: number
): Promise<{ data?: InitialAnnotationData; error?: string }> {
  const supabase = await createClient();
  const requestHeaders = await headers();
  const host = (await requestHeaders).get("host");
  const protocol = (await requestHeaders).get("x-forwarded-proto") || "http";

  // Fetch the annotation by ID
  const { data: taskData, error: taskError } = await supabase
    .from("task")
    .select("project_id, file_path")
    .eq("id", taskId)
    .single();

  if (taskError) {
    return {
      error: `Error find task: ${taskError.message}`,
    };
  }

  // Fetch annotations for the task
  const { data: annotationsData, error: annotationsError } = await supabase
    .from("annotation")
    .select(
      `*,
        label:label_id (
            label:label,
            type,
            color
        )`
    )
    .eq("task_id", taskId);

  if (annotationsError) {
    return {
      error: `Error fetching annotations: ${annotationsError.message}`,
    };
  }

  const { data: labelData, error: labelError } = await supabase
    .from("label")
    .select("*")
    .order("order", { ascending: true })
    .eq("project_id", taskData.project_id);

  if (labelError) {
    return {
      error: `Error fetching labels: ${labelError.message}`,
    };
  }

  const { data: tasksData, error: tasksError} = await supabase
  .from("task")
  .select("*")
  .eq("project_id", taskData.project_id);

  if (tasksError){
    return{
      error: `Error fetching tasks ${tasksError.message}`,
    }
  }

  let processedData: InitialAnnotationData = {
    annotations: annotationsData,
    urlFile: `${protocol}://${host}/files/${taskData.file_path}`,
    taskId: taskId.toString(),
    labels: labelData.map(
      (label) => ({
        id: label.id,
        name: label.label,
        type: label.type,
        color: label.color,
        order: label.order,
      })
    ),
    tasks: tasksData.map(
      (task) => (
        {
        id: task.id,
        urlFile: `${protocol}://${host}/files/${task.file_path}`,
        status: task.status,
      })
    ),
  };

  // Return the fetched annotation data
  return {
    data: processedData,
  };
}
