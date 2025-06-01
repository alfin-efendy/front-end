import { useTimeAgo } from "@/hooks/useTimeAgo";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import React from "react";

type Props = {
  date: string | Date;
};

export const TextDatetime = ({ date }: Props) => {
  const timeAgo = useTimeAgo(date);
  const fullDate = new Date(date).toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-sm text-gray-500 cursor-default">{timeAgo}</span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs text-muted-foreground">{fullDate}</p>
      </TooltipContent>
    </Tooltip>
  );
};
