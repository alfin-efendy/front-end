import { TaskList } from "@/components/blocks/task-list";
import { getTask } from "./actions";

export default async function Page(props: { params: Promise<{ name: string }> }) {
  const params = await props.params;
  const { name } = params;
  const { data, error } = name
    ? await getTask(name)
    : { data: [], error: undefined };

  return (
    <div className="p-8">
      {error ? <p>Error: {error}</p> : <TaskList initialTasks={data} />}
    </div>
  );
}
