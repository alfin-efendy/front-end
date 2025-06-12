"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useImageLoader } from "@/hooks/useImageLoader";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ImagePreviewProps = {
  src: string;
  enableZoom?: boolean;
} & React.ImgHTMLAttributes<HTMLImageElement>;

export const ImagePreview = React.forwardRef<
  HTMLImageElement,
  ImagePreviewProps
>(
  (
    { src, height = 200, width = 200, enableZoom = false, className, ...props },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const { dataUrl, loading, error } = useImageLoader(src);

    if (loading)
      return (
        <Skeleton
          className="rounded-lg"
          style={{ height: height, width: width }}
        />
      );
    if (error) return <p className="text-red-500">Error: {error}</p>;

    return (
      <>
        <img
          ref={ref}
          src={dataUrl!}
          width={width}
          height={height}
          className={cn(enableZoom ? "cursor-zoom-in" : "", className)}
          onClick={() => {
            if (enableZoom) setIsOpen(true);
          }}
          {...props}
        />

        {enableZoom && (
            <DialogPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
            <DialogPrimitive.Portal>
              <DialogPrimitive.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
              <DialogPrimitive.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] max-w-[90vw] max-h-[90vh] w-auto h-auto p-0 bg-transparent border-0">
              {/* Visually hidden DialogTitle for accessibility */}
              <span className="sr-only">
                <DialogPrimitive.Title>Image preview</DialogPrimitive.Title>
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/75 focus:outline-none"
              >
                <X className="h-6 w-6" />
                <span className="sr-only">Close</span>
              </button>
              <div className="relative w-full h-full">
                <img
                ref={ref}
                src={dataUrl!}
                className="object-contain h-screen w-auto max-w-screen"
                {...props}
                />
              </div>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
            </DialogPrimitive.Root>
        )}
      </>
    );
  }
);
