// app/upload/page.tsx
'use client';

import { useState } from 'react';
import FileUploader from '@/components/file-upload';
import { UploadResponse } from '@/lib/upload-service';

export default function UploadPage() {
  const [uploadResults, setUploadResults] = useState<UploadResponse[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const handleUploadSuccess = (result: UploadResponse) => {
    setUploadResults(prev => [...prev, result]);
    console.log('File uploaded successfully:', result);
  };

  const handleUploadError = (error: string) => {
    setErrors(prev => [...prev, error]);
    console.error('Upload error:', error);

    // Auto remove error after 5 seconds
    setTimeout(() => {
      setErrors(prev => prev.filter(e => e !== error));
    }, 5000);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="mb-6 space-y-2">
            {errors.map((error, index) => (
              <div
                key={index}
                className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg"
              >
                {error}
              </div>
            ))}
          </div>
        )}

        {/* File Uploader Component */}
        <FileUploader
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
          acceptedTypes=".jpg,.jpeg,.png"
          maxSizeMB={5}
          maxFiles={10}
          description={[
            "Upload up to 10 images up to 5MB each.",
            "Supported formats: JPG, JPEG, and PNG",
          ].join('\n')}
        />
      </div>
    </div>
  );
}