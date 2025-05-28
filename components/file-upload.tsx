"use client";

import { useState, useCallback } from "react";
import {
  X,
  Upload,
  FileArchiveIcon,
  FileAudioIcon,
  FileCodeIcon,
  FileCogIcon,
  FileIcon,
  FileTextIcon,
  FileVideoIcon,
  RefreshCcw,
} from "lucide-react";
import { UploadService, UploadProgress } from "@/lib/upload-service";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { TextboxPassword } from "@/components/textbox-password";

interface FileItem {
  id: string;
  file: File;
  password?: string;
  status: "pending" | "uploading" | "completed" | "error";
  progress?: UploadProgress;
  result?: any;
  error?: string;
}

interface FileUploaderProps {
  onUploadSuccess?: (result: any) => void;
  onUploadError?: (error: string) => void;
  acceptedTypes?: string;
  maxSizeMB?: number;
  maxFiles?: number;
  description?: string;
}

export function FileUploader({
  onUploadSuccess,
  onUploadError,
  acceptedTypes = "image/*,.pdf,.doc,.docx",
  maxSizeMB = 5,
  maxFiles = 2,
  description = `Upload up to ${maxFiles} images up to ${maxSizeMB}MB each.`,
}: FileUploaderProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getFileIcon = (file: File) => {
    const type = file.type;
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (file.type.startsWith("image/")) {
      return (
        <img className="w-16" src={URL.createObjectURL(file)} alt={file.name} />
      );
    }
    if (type.startsWith("video/")) {
      return <FileVideoIcon className="h-12 w-12 text-lime-400" />;
    }

    if (type.startsWith("audio/")) {
      return <FileAudioIcon className="h-12 w-12 text-slate-400" />;
    }

    if (
      type.startsWith("text/") ||
      ["txt", "md", "rtf", "pdf"].includes(extension)
    ) {
      return <FileTextIcon className="h-12 w-12 text-blue-400" />;
    }

    if (
      [
        "html",
        "css",
        "js",
        "jsx",
        "ts",
        "tsx",
        "json",
        "xml",
        "php",
        "py",
        "rb",
        "java",
        "c",
        "cpp",
        "cs",
      ].includes(extension)
    ) {
      return <FileCodeIcon className="h-12 w-12 text-green-400" />;
    }

    if (["zip", "rar", "7z", "tar", "gz", "bz2"].includes(extension)) {
      return <FileArchiveIcon className="h-12 w-12 text-indigo-400" />;
    }

    if (
      ["exe", "msi", "app", "apk", "deb", "rpm"].includes(extension) ||
      type.startsWith("application/")
    ) {
      return <FileCogIcon className="h-12 w-12 text-red-400" />;
    }

    return <FileIcon className="h-12 w-12 text-orange-400" />;
  };

  const validateFile = (file: File): string | null => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size exceeds ${maxSizeMB}MB limit`;
    }
    return null;
  };

  const uploadFile = async (fileItem: FileItem): Promise<void> => {
    try {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileItem.id ? { ...f, status: "uploading" } : f
        )
      );

      const result = await UploadService.uploadFile(
        fileItem.file,
        fileItem.password,
        (progress) => {
          setFiles((prev) =>
            prev.map((f) => (f.id === fileItem.id ? { ...f, progress } : f))
          );
        }
      );

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileItem.id ? { ...f, status: "completed", result } : f
        )
      );
      onUploadSuccess?.(result);
    } catch (error: any) {
      const errorMsg = error.message || "Upload failed";
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileItem.id ? { ...f, status: "error", error: errorMsg } : f
        )
      );
      onUploadError?.(errorMsg);
      throw error;
    }
  };

  const handleFiles = useCallback(
    async (fileList: FileList) => {
      const newFiles = Array.from(fileList);

      // Check max files limit
      if (files.length + newFiles.length > maxFiles) {
        onUploadError?.(
          `Maximum ${maxFiles} files allowed. Current: ${files.length}, Adding: ${newFiles.length}`
        );
        return;
      }

      // Validate and add files
      const validFiles: FileItem[] = [];
      for (const file of newFiles) {
        const error = validateFile(file);
        if (error) {
          onUploadError?.(error);
          continue;
        }

        const fileItem: FileItem = {
          id: generateId(),
          file,
          status: "pending",
        };
        validFiles.push(fileItem);
      }

      if (validFiles.length === 0) return;

      // Add files to state
      setFiles((prev) => [...prev, ...validFiles]);

      // Start uploading files
      for (const fileItem of validFiles) {
        try {
          await uploadFile(fileItem);
        } catch (error) {
          console.error(`Upload failed for ${fileItem.file.name}:`, error);
        }
      }
    },
    [files.length, maxFiles, maxSizeMB, onUploadSuccess, onUploadError]
  );

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
      // Reset input
      e.target.value = "";
    }
  };

  return (
    <div className="w-full">
      {/* Upload Area */}
      <div
        className={`border-2 cursor-pointer border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? "border-primary bg-primary/10"
            : "border-zinc-600 hover:border-zinc-500"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-upload")?.click()}
      >
        <input
          type="file"
          onChange={handleInputChange}
          className="hidden"
          id="file-upload"
          accept={acceptedTypes}
          multiple
          disabled={files.length >= maxFiles}
        />
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />

        <div className="text-lg font-medium">
          Drag & Drop here or Click to browse files
        </div>
        <div className="text-sm text-muted-foreground mt-2 whitespace-pre-line">
          {description}
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <ScrollArea className="h-72 border p-2 pr-4 mt-4 rounded-sm">
          <div className="space-y-3">
            <ScrollBar orientation="vertical" />
            {files.map((fileItem) => (
              <div
                key={fileItem.id}
                className="bg-card rounded-lg p-2 border border-border"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {/* File Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getFileIcon(fileItem.file)}
                    </div>
                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <h4 className="font-medium truncate">
                          {fileItem.file.name}
                        </h4>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {formatFileSize(fileItem.file.size)}
                      </p>
                      {/* Progress Bar */}
                      {fileItem.status === "uploading" && fileItem.progress && (
                        <div className="mt-2">
                          <div className="bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${fileItem.progress.percentage}%`,
                              }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {fileItem.progress.percentage}% uploaded
                          </p>
                        </div>
                      )}
                      {/* Status Messages */}
                      {fileItem.status === "completed" && (
                        <p className="text-green-400 text-sm mt-1">
                          ✓ Upload completed
                        </p>
                      )}
                      {fileItem.status === "error" && (
                        <div className="flex flex-row items-center justify-between w-auto">
                          <p className="text-red-400 text-sm mt-1">
                            ✗{" "}
                            {(fileItem.error === "corrupt_file" &&
                              "Your file is broken (corrupt) please try to open the file before reupload") ||
                              (fileItem.error === "incorrect_password" &&
                                "Wrong password for this file") ||
                              fileItem.error ||
                              "Upload failed"}
                          </p>

                          {!["corrupt_file", "incorrect_password"].includes(
                            fileItem.error!
                          ) && (
                            <button
                              onClick={() => uploadFile(fileItem)}
                              className="text-green-300 hover:text-green-500 p-1"
                            >
                              <RefreshCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {/* File Password */}
                    {fileItem.status === "error" &&
                      fileItem.error == "incorrect_password" && (
                        <div className="flex flex-row items-center space-x-2">
                          <TextboxPassword
                            id="pdf-password"
                            type="password"
                            value={fileItem.password}
                            onChange={(e) =>
                              setFiles((prev) =>
                                prev.map((f) =>
                                  f.id === fileItem.id
                                    ? { ...f, password: e.target.value }
                                    : f
                                )
                              )
                            }
                            placeholder="Enter password"
                            className="max-w-48"
                          />
                          <Button
                            type="submit"
                            className="max-w-16"
                            onClick={() => uploadFile(fileItem)}
                          >
                            Submit
                          </Button>
                        </div>
                      )}
                    {/* Remove File */}
                    <button
                      onClick={() => removeFile(fileItem.id)}
                      className="text-muted-foreground hover:text-white p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
