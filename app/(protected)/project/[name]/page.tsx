import { TaskList } from "@/components/blocks/task-list";
import { getTask } from "./actions";

export default async function Page({ params }: { params: { name: string } }) {
  const { name } = params;
  const { data, error } = name
    ? await getTask(name)
    : { data: [], error: undefined };

  return (
    <div>
      {error ? <p>Error: {error}</p> : <TaskList initialTasks={data} />}
    </div>
  );
}
