// app/upload/page.tsx
"use client";

import { useState } from "react";
import { FileUploader } from "@/components/file-upload";
import { TextareaWithText } from "@/components/labels-editor";
import { UploadResponse } from "@/lib/upload-service";

export default function UploadPage() {
  const [uploadResults, setUploadResults] = useState<UploadResponse[]>([]);

  const handleUploadSuccess = (result: UploadResponse) => {
    setUploadResults((prev) => [...prev, result]);
    console.log("File uploaded successfully:", result);
  };

  return (
    <div className="max-h-fit p-6">
      <div className="max-w-2xl mx-auto">
        <TextareaWithText />
        {/* File Uploader Component */}
        <FileUploader
          onUploadSuccess={handleUploadSuccess}
          acceptedTypes=".jpg,.jpeg,.png"
          maxSizeMB={5}
          maxFiles={10}
          description={[
            "Upload up to 10 images up to 5MB each.",
            "Supported formats: JPG, JPEG, and PNG",
          ].join("\n")}
        />
      </div>
    </div>
  );
}
