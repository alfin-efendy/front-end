"use client";

import { NewProject } from "@/components/blocks/project-new";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ProjectPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <NewProject open={open} setOpen={setOpen} />
      <Button onClick={() => setOpen(true)}>New Project</Button>
    </div>
  );
}
