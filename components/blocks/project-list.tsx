"use client";

import { Button } from "@/components/ui/button";
import { ProjectWithStats } from "@/types/project";
import { getProject, deleteProject } from "@/app/(protected)/project/actions";
import { useEffect, useState } from "react";
import { NewProject } from "./project-new";
import { ProjectCard } from "./project-card";
import { useAction } from "@/hooks/useAction";
type Props = {
  initialProjects: ProjectWithStats[];
};

export const ListProjects = ({initialProjects}:Props) => {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectWithStats[]>(initialProjects);
  const { run } = useAction();
  
  const fetchProjects = async () => {
    const data = await getProject();
    setProjects(data);
  };
  
  useEffect(() => {
    if (!open) {
      fetchProjects();
    }
  }, [open]);

  const handleDeleteProject = async (id: number) => {
    run(async () => {
      const result = await deleteProject(id);
      if (!result.success) {
        throw new Error("Failed to delete project");
      }

      setProjects((prev) => prev.filter((project) => project.id !== id));
    })
  }
  
  return (
    <div className="p-8">
      <div className="space-y-4 mb-4">
        <NewProject open={open} setOpen={setOpen} />
        <Button onClick={() => setOpen(true)}>New Project</Button>
      </div>
      
      {projects.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          No projects found. Please create a new project.
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {projects.length > 0 &&
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={async (id) => handleDeleteProject(id)}
            />
          ))}
      </div>
    </div>
  );
};
