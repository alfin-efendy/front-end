"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { FileUploader } from "@/components/file-upload";
import { LabelEditor } from "@/components/labels-editor";
import { UploadResponse } from "@/lib/upload-service";
import { NewProjectInput } from "@/types/project";
import { LabelArrayInput } from "@/types/label";
import { Stepper } from "@/components/stepper";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { createProject } from "@/app/(protected)/project/actions";
import { useAction } from "@/hooks/useAction";
import { ResizableModal } from "@/components/modal";

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
};
export const NewProject = ({ open, setOpen }: Props) => {
  const [uploadResults, setUploadResults] = useState<UploadResponse[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const { run, error, isLoading } = useAction();
  const form = useForm<NewProjectInput>({
    defaultValues: {
      name: "",
      description: "",
      labels: [],
      files: [],
    },
  });

  const labelsForm = useForm<LabelArrayInput>({
    defaultValues: {
      labels: [],
    },
  });

  const handleUploadSuccess = (result: UploadResponse) => {
    setUploadResults((prev) => [...prev, result]);
  };

  const steps = [
    {
      id: "info",
      title: "Project Information",
    },
    {
      id: "labels",
      title: "Labels",
    },
    {
      id: "upload",
      title: "Upload Images",
    },
  ];

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleNewProject = () => {
    switch (currentStep) {
      case 0:
        if (!form.getValues("name")) {
          form.setError("name", {
            type: "manual",
            message: "Project name is required",
          });
          return;
        }

        form.clearErrors("name"); // Clear any previous error
        setCurrentStep(1);
        break;
      case 1:
        const labels = labelsForm.getValues("labels");
        form.setValue("labels", labels);

        if (form.getValues("labels").length === 0) {
          form.setError("labels", {
            type: "manual",
            message: "At least one label is required",
          });
          return;
        }

        form.clearErrors("labels"); // Clear any previous error
        setCurrentStep(2);
        break;
      case 2:
        const images = uploadResults.map((result) => result.path);
        form.setValue("files", images);

        if (images.length === 0) {
          form.setError("files", {
            type: "manual",
            message: "At least one image is required",
          });
          return;
        }
        form.clearErrors("files"); // Clear any previous error

        // Final step: submit the project
        run(
          async () => {
            await createProject(form.getValues()).then((response) => {
              if (response.success) {
                // Reset state after successful project creation
                setOpen(false);
                setCurrentStep(0);
                setUploadResults([]);
                form.reset();
                labelsForm.reset();
                return;
              }

              throw new Error(response.error || "Unknown error");
            });
          },
          {
            loading: "Creating project...",
            success: "Project created successfully!",
            error: "Failed to create project.\n" + (error || "Unknown error"),
          }
        );

        break;
    }
  };

  return (
    <ResizableModal
      open={open}
      onOpenChange={setOpen}
      size="auto"
      title="Create New Project"
    >
      <div className="mx-auto">
        <Stepper data={steps} currentStep={currentStep}>
          {/* Project Information Step */}
          {currentStep == 0 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Project Name
                </label>
                <input
                  disabled={isLoading}
                  {...form.register("name", {
                    required: "Project name is required",
                  })}
                  className="w-full p-2 border rounded"
                  placeholder="Enter project name"
                />
                {form.formState.errors.name && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium">Description</label>
                <textarea
                  disabled={isLoading}
                  {...form.register("description")}
                  className="w-full p-2 border rounded"
                  placeholder="Enter project description"
                />
              </div>
            </div>
          )}
          {/* Labels Step */}
          {currentStep == 1 && (
            <div>
              <LabelEditor disabled={isLoading} form={labelsForm} />
              {form.formState.errors.labels && (
                <p className="text-red-500 text-sm">
                  {form.formState.errors.labels.message}
                </p>
              )}
            </div>
          )}
          {/* File Uploader Component */}
          {currentStep == 2 && (
            <div>
              <FileUploader
                disabled={isLoading}
                onUploadSuccess={handleUploadSuccess}
                acceptedTypes=".jpg,.jpeg,.png"
                maxSizeMB={5}
                maxFiles={10}
                description={[
                  "Upload up to 10 images up to 5MB each.",
                  "Supported formats: JPG, JPEG, and PNG",
                ].join("\n")}
              />
              {form.formState.errors.labels && (
                <p className="text-red-500 text-sm">
                  {form.formState.errors.labels.message}
                </p>
              )}
            </div>
          )}
          <Separator className="my-4" />
          <div className="flex items-center justify-between w-full">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                disabled={currentStep === 0 || isLoading}
                className="flex items-center gap-1 transition-all duration-300 rounded-2xl"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="button"
                disabled={isLoading}
                onClick={handleNewProject}
                className={cn(
                  "flex items-center gap-1 transition-all duration-300 rounded-2xl",
                  currentStep === steps.length - 1 ? "" : ""
                )}
              >
                {currentStep === steps.length - 1 ? "Submit" : "Next"}
                {currentStep === steps.length - 1 ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </motion.div>
          </div>
        </Stepper>
      </div>
    </ResizableModal>
  );
};
