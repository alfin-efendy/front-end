import { TaskList } from "@/components/blocks/task-list";
import { getTask } from "./actions";

export default async function Page({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const { data, error } = await getTask(name);

  return (
    <div>
      {error ? (
        <p>Error: {error}</p>
      ) : (
        <TaskList initialTasks={data}></TaskList>
      )}
    </div>
  );
}
