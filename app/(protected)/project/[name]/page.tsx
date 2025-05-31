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
        <ul className="space-y-4">
          {data.map((task) => (
            <li key={task.id}>
              <img src={task.urlFile} alt="Task File" className="w-auto max-h-56 mb-2" />
              <p>Status: {task.status}</p>
              <p>Total Labeled: {task.totalLabeled}</p>
              <p>Total Annotations: {task.totalAnnotations}</p>
              <p>Created At: {new Date(task.createdAt).toLocaleString()}</p>
              <p>Created By: {task.createdBy}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
