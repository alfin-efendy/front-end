import { useEffect, useState } from "react";
import {
  formatDistanceToNow,
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  parseISO,
} from "date-fns";

export function useTimeAgo(date: string | Date): string {
  const [timeAgo, setTimeAgo] = useState("");

  useEffect(() => {
    const parsedDate = typeof date === "string" ? parseISO(date) : date;

    const updateTime = () => {
      const now = new Date();

      const seconds = differenceInSeconds(now, parsedDate);
      const minutes = differenceInMinutes(now, parsedDate);
      const hours = differenceInHours(now, parsedDate);
      const days = differenceInDays(now, parsedDate);

      if (seconds < 60) {
        setTimeAgo("less than a minute ago");
      } else if (minutes < 60) {
        setTimeAgo(minutes === 1 ? "1 minute ago" : `more than ${minutes} minutes ago`);
      } else if (hours < 24) {
        setTimeAgo(hours === 1 ? "1 hour ago" : `more than ${hours} hours ago`);
      } else if (days < 7) {
        setTimeAgo(days === 1 ? "1 day ago" : `${days} days ago`);
      } else {
        // fallback to relative format
        setTimeAgo(formatDistanceToNow(parsedDate, { addSuffix: true }));
      }
    };

    updateTime();

    const interval = setInterval(updateTime, 60000); // update every 1 min
    return () => clearInterval(interval);
  }, [date]);

  return timeAgo;
}
