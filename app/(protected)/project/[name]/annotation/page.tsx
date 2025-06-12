import { getAnnotation } from "./actions";
import { AnnotationsPage } from "@/components/blocks/annotations";

export default async function Page(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const taskId = searchParams.task;
  const { data, error } = taskId
    ? await getAnnotation(taskId as unknown as number)
    : { data: null, error: "Task Id Not Found" };

  return (
    <div>
      {error ? (
        <p>Error: {error}</p>
      ) : (
        <div>{data && <AnnotationsPage data={data} />}</div>
      )}
    </div>
  );
}