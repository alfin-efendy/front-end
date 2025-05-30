import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { MoreHorizontal, Trash2, FileText, Tags } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";
import { ProjectWithStats } from "@/types/project";

type Props = {
  projects: ProjectWithStats[];
};

export const ListProjects = ({ projects }: Props) => {
  return projects.map((project) => {
    <Card className="h-full flex flex-col overflow-hidden transition-all hover:shadow-md">
      <Link href={`/projects/${project.id}`} className="flex-1 flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle
              className="text-xl font-bold truncate"
              title={project.name}
            >
              {project.name}
            </CardTitle>
            {/* {onDelete && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => {
                        e.preventDefault()
                        setIsDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )} */}
          </div>
        </CardHeader>
        <CardContent className="flex-1 pb-2">
          <div className="space-y-4">
            {/* Progress Section */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-2" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <div className="font-medium">
                    {project.submittedAnnotations}/{project.totalFiles}
                  </div>
                  <div className="text-muted-foreground">Files</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Tags className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <div className="font-medium">{project.totalLabels}</div>
                  <div className="text-muted-foreground">Labels</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          {project.updatedAt && (
            <div className="w-full text-xs text-muted-foreground">
              Updated{" "}
              {formatDistanceToNow(new Date(project.updatedAt), {
                addSuffix: true,
              })}
            </div>
          )}
        </CardFooter>
      </Link>
    </Card>;
  });
};
