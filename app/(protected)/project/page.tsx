import { ListProjects } from "@/components/blocks/project-list";
import { getProject } from "@/app/(protected)/project/actions";
import { ProjectWithStats } from "@/types/project";

export default async function ProjectPage() {
  const projects: ProjectWithStats[] = await getProject();

  return <ListProjects initialProjects={projects} />;
}
