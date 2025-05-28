"use client";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { LabelArraySchema, LabelSchema, LabelInput, LabelTypes } from "@/types/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "./ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { GetRandomColor } from "@/lib/color";

type Props = {
  onLabelsChange?: (labels: LabelInput[]) => void;
  Labels?: LabelInput[];
};

export function TextareaWithText({ onLabelsChange, Labels }: Props) {
  const [labels, setLabels] = useState<LabelInput[]>(Labels || []);
  const [error, setError] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [scrollHeight, setScrollHeight] = useState<number>(0);
  const form = useForm<LabelInput>({
    resolver: zodResolver(LabelSchema),
    defaultValues: {
      id: "",
      name: "",
      type: "text", // default type
      color: GetRandomColor(), // default color
    },
  });

  useEffect(() => {
    if (!textareaRef.current) return;

    const updateHeight = () => {
      if (textareaRef.current) {
        setScrollHeight(textareaRef.current.offsetHeight);
      }
    };

    // Inisialisasi ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    resizeObserver.observe(textareaRef.current);
    updateHeight(); // initial sync

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const handleAddLabels = () => {
    const lines = value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const labelObjects = lines.map((name) => ({
      name,
      type: "text", // default type
      color: GetRandomColor(), // default color
    }));

    const result = LabelArraySchema.safeParse(labelObjects);

    if (!result.success) {
      setError("Invalid label data.");
      console.error(result.error.format());
      return;
    }
    const newLabels = [...labels, ...result.data];
    setLabels(newLabels);
    onLabelsChange?.(newLabels);
    setValue(""); // clear textarea
    setError(null);
  };

  return (
    <div className="my-8 space-y-4 flex flex-col">
      <div className="font-medium">Labels ({labels.length})</div>
      <div className="space-x-2 flex flex-row items-start">
        <Textarea
          ref={textareaRef}
          className="resize overflow-auto min-w-[200px] min-h-[100px] max-h-[300px]"
          placeholder="Enter one label per line"
          id="message-2"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        {labels.length > 0 && (
          <ScrollArea
            style={{ height: scrollHeight }}
            className="w-full h-full border min-w-[300px] rounded-md overflow-hidden"
          >
            <ScrollBar orientation="vertical" />
            {labels.map((label, index) => (
              <div className="p-1 flex items-center space-x-1">
                <div className="w-8">
                  <Input
                    type="color"
                    value={label.color}
                    className="h-9 w-full p-1"
                  />
                </div>
                <div className="flex-1 min-w-9">
                  <Input value={label.name} className="h-9" />
                </div>
                <div className="min-w-24">
                  <Select value={label.type}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {LabelTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete label</span>
                </Button>
              </div>
            ))}
          </ScrollArea>
        )}
      </div>
      <div className="flex items-center justify-between">
        <Button onClick={handleAddLabels}>
          <Plus />
          Add Labels
        </Button>
        <p className="text-sm text-muted-foreground">
          Enter one label per line. Labels will be added to the list
        </p>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
