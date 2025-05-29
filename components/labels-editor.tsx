"use client";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { LabelInput, LabelTypes, LabelArrayInput } from "@/types/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "./ui/input";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { GetRandomColor } from "@/lib/color";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";

type Props = {
  form: UseFormReturn<LabelArrayInput>;
  disabled?: boolean;
};

export const LabelEditor = ({ form, disabled = false }: Props) => {
  const [error, setError] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [scrollHeight, setScrollHeight] = useState<number>(0);
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "labels",
  });

  const watchedLabels = form.watch("labels");

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

    let lastOrder = form.getValues("labels")?.length || 0;
    const labelObjects = lines.map((name) => ({
      name,
      order: lastOrder++,
      type: "text" as LabelInput["type"], // default type
      color: GetRandomColor(), // default color
    }));
    const existingNames =
      form.getValues("labels")?.map((l) => l.name.trim().toLowerCase()) || [];
    const newNames = labelObjects.map((l) => l.name.trim().toLowerCase());
    const allNames = [...existingNames, ...newNames];
    const hasDuplicate = allNames.length !== new Set(allNames).size;

    if (hasDuplicate) {
      setError("Duplicate label names are not allowed.");
      return;
    }

    append(labelObjects);

    setValue(""); // clear textarea
    setError(null);
  };

  const handleLabelNameChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const newName = e.target.value.trim();
    if (newName.length === 0) {
      form.setError(`labels.${index}.name`, {
        type: "manual",
        message: "Label name cannot be empty",
      });
    } else {
      form.clearErrors(`labels.${index}.name`);
    }

    // Check for duplicates
    const names = (form.getValues("labels") || []).map((l, i) =>
      i === index ? newName.trim().toLowerCase() : l?.name?.trim().toLowerCase()
    );
    const hasDuplicate =
      names.filter((n, i) => n && names.indexOf(n) !== i).length > 0;
    if (hasDuplicate) {
      form.setError(`labels.${index}.name`, {
        type: "duplicate",
        message: "Duplicate label names are not allowed.",
      });
    } else {
      form.clearErrors(`labels.${index}.name`);
    }

    form.setValue(`labels.${index}.name`, newName);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const from = result.source.index;
    const to = result.destination.index;
    if (from === to) return;
    const currentLabels = [...(form.getValues("labels") || [])];
    const [removed] = currentLabels.splice(from, 1);
    currentLabels.splice(to, 0, removed);
    // Update order field for each label
    const reordered = currentLabels.map((label, idx) => ({
      ...label,
      order: idx,
    }));
    form.setValue("labels", reordered);
  };

  return (
    <div className="space-y-4 flex flex-col">
      <div className="flex items-center justify-between">
        <div className="font-medium">
          Labels ({form.getValues("labels")?.length ?? 0})
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
      <div className="space-x-2 flex flex-row items-start">
        <Textarea
          disabled={disabled}
          ref={textareaRef}
          className={cn(
            "resize overflow-auto min-w-[200px] min-h-[200px] max-h-[350px]",
            fields.length > 0 ? "w-1/5" : "w-full"
          )}
          placeholder="Enter one label per line"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        {fields.length > 0 && (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable isDropDisabled={disabled} droppableId="labels-droppable">
              {(provided) => (
                <ScrollArea
                  style={{ height: scrollHeight }}
                  className="w-full h-full border min-w-[300px] rounded-md overflow-hidden"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <ScrollBar orientation="vertical" />
                  {fields.map((label, index) => (
                    <Draggable
                      key={label.id ?? index}
                      draggableId={String(label.id ?? index)}
                      index={index}
                    >
                      {(draggableProvided, snapshot) => (
                        <div
                          ref={draggableProvided.innerRef}
                          {...draggableProvided.draggableProps}
                          {...draggableProvided.dragHandleProps}
                        >
                          <div
                            className="p-1 flex items-center space-x-1 bg-white border-b"
                            style={{ opacity: snapshot.isDragging ? 0.7 : 1 }}
                          >
                            <span className="cursor-move px-2">☰</span>
                            <div className="w-8">
                              <Input
                                disabled={disabled}
                                type="color"
                                className="h-9 w-full p-1"
                                {...form.register(`labels.${index}.color`)}
                                value={
                                  watchedLabels?.[index]?.color || "#000000"
                                }
                                onChange={(e) =>
                                  form.setValue(
                                    `labels.${index}.color`,
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                            <div className="flex-1 min-w-16">
                              <Input
                                disabled={disabled}
                                {...form.register(`labels.${index}.name`)}
                                className="h-9"
                                value={watchedLabels?.[index]?.name || ""}
                                onChange={(e) =>
                                  handleLabelNameChange(e, index)
                                }
                              />
                            </div>
                            <div className="min-w-32">
                              <Select
                                disabled={disabled}
                                value={watchedLabels?.[index]?.type || "text"}
                                onValueChange={(val) =>
                                  form.setValue(
                                    `labels.${index}.type`,
                                    val as LabelInput["type"]
                                  )
                                }
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {LabelTypes.map((type) => (
                                    <SelectItem
                                      key={type.value}
                                      value={type.value}
                                    >
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              disabled={disabled}
                              type="button"
                              onClick={() => remove(index)}
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete label</span>
                            </Button>
                          </div>
                          {form.formState.errors.labels?.[index]?.name && (
                            <p className="text-xs text-red-500 mt-1">
                              {form.formState.errors.labels[index].name.message}
                            </p>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </ScrollArea>
              )}
            </Droppable>
          </DragDropContext>
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
    </div>
  );
};
