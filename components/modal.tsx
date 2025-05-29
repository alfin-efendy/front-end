"use client"

import type * as React from "react"
import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader } from "@/components/ui/drawer"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { useViewportSize } from "@/hooks/useViewportSize"
import { X } from "lucide-react"

type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw"
type ModalSize = "xs" | "sm" | "md" | "lg" | "xl" | "full"

interface ResizableModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  footer?: React.ReactNode
  className?: string
  size?: ModalSize
  customSize?: { width: number; height: number }
  minSize?: { width: number; height: number }
  maxSize?: { width: number; height: number }
  closeOnOutsideClick?: boolean
}

export function ResizableModal({
  open,
  onOpenChange,
  children,
  title,
  description,
  footer,
  className,
  size = "md",
  customSize,
  minSize = { width: 300, height: 200 },
  maxSize,
  closeOnOutsideClick = true,
}: ResizableModalProps) {
  const isMobile = useMediaQuery("(max-width: 767px)")
  const viewportSize = useViewportSize()

  // Calculate size based on variant and viewport
  const calculatedSize = useMemo(() => {
    if (customSize) return customSize

    const { width: vw, height: vh } = viewportSize

    // If viewport is not ready, use default values
    if (vw === 0 || vh === 0) {
      return { width: 500, height: 400 }
    }

    const sizeMap: Record<ModalSize, { width: number; height: number }> = {
      xs: {
        width: Math.min(320, vw * 0.9),
        height: Math.min(240, vh * 0.6),
      },
      sm: {
        width: Math.min(480, vw * 0.8),
        height: Math.min(360, vh * 0.7),
      },
      md: {
        width: Math.min(640, vw * 0.75),
        height: Math.min(480, vh * 0.75),
      },
      lg: {
        width: Math.min(800, vw * 0.85),
        height: Math.min(600, vh * 0.8),
      },
      xl: {
        width: Math.min(1024, vw * 0.9),
        height: Math.min(768, vh * 0.85),
      },
      full: {
        width: vw * 0.95,
        height: vh * 0.9,
      },
    }

    return sizeMap[size]
  }, [size, customSize, viewportSize])

  // Calculate max size based on viewport
  const calculatedMaxSize = useMemo(() => {
    if (maxSize) return maxSize

    const { width: vw, height: vh } = viewportSize

    if (vw === 0 || vh === 0) {
      return { width: 1200, height: 800 }
    }

    return {
      width: vw * 0.95,
      height: vh * 0.9,
    }
  }, [maxSize, viewportSize])

  const [modalSize, setModalSize] = useState(calculatedSize)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isResizing, setIsResizing] = useState<ResizeDirection | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const modalRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>(0)

  // Use refs to store current values to avoid stale closures
  const sizeRef = useRef(modalSize)
  const positionRef = useRef(position)
  const minSizeRef = useRef(minSize)
  const maxSizeRef = useRef(calculatedMaxSize)

  // Update modal size when calculated size changes
  useEffect(() => {
    setModalSize(calculatedSize)
    sizeRef.current = calculatedSize
  }, [calculatedSize])

  // Update refs when state changes
  useEffect(() => {
    sizeRef.current = modalSize
  }, [modalSize])

  useEffect(() => {
    positionRef.current = position
  }, [position])

  useEffect(() => {
    minSizeRef.current = minSize
  }, [minSize])

  useEffect(() => {
    maxSizeRef.current = calculatedMaxSize
  }, [calculatedMaxSize])

  // Center the modal when it opens or size changes
  const centerModal = useCallback(() => {
    if (!isMobile && viewportSize.width > 0 && viewportSize.height > 0) {
      const newPosition = {
        x: (viewportSize.width - sizeRef.current.width) / 2,
        y: (viewportSize.height - sizeRef.current.height) / 2,
      }
      setPosition(newPosition)
      positionRef.current = newPosition
    }
  }, [isMobile, viewportSize])

  useEffect(() => {
    if (open) {
      centerModal()
    }
  }, [open, centerModal])

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (closeOnOutsideClick && e.target === backdropRef.current) {
        onOpenChange(false)
      }
    },
    [closeOnOutsideClick, onOpenChange],
  )

  // Optimized resize handler with requestAnimationFrame
  const handleMouseDown = useCallback((e: React.MouseEvent, direction: ResizeDirection) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(direction)

    const startX = e.clientX
    const startY = e.clientY
    const startWidth = sizeRef.current.width
    const startHeight = sizeRef.current.height
    const startPosX = positionRef.current.x
    const startPosY = positionRef.current.y

    const handleMouseMove = (e: MouseEvent) => {
      // Cancel previous animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      // Use requestAnimationFrame for smooth updates
      animationFrameRef.current = requestAnimationFrame(() => {
        const deltaX = e.clientX - startX
        const deltaY = e.clientY - startY

        let newWidth = startWidth
        let newHeight = startHeight
        let newX = startPosX
        let newY = startPosY

        const minW = minSizeRef.current.width
        const minH = minSizeRef.current.height
        const maxW = maxSizeRef.current.width
        const maxH = maxSizeRef.current.height

        // Calculate new dimensions based on resize direction
        switch (direction) {
          case "e": // East (right)
            newWidth = Math.max(minW, Math.min(maxW, startWidth + deltaX))
            break
          case "w": // West (left)
            newWidth = Math.max(minW, Math.min(maxW, startWidth - deltaX))
            newX = startPosX + (startWidth - newWidth)
            break
          case "s": // South (bottom)
            newHeight = Math.max(minH, Math.min(maxH, startHeight + deltaY))
            break
          case "n": // North (top)
            newHeight = Math.max(minH, Math.min(maxH, startHeight - deltaY))
            newY = startPosY + (startHeight - newHeight)
            break
          case "se": // Southeast (bottom-right)
            newWidth = Math.max(minW, Math.min(maxW, startWidth + deltaX))
            newHeight = Math.max(minH, Math.min(maxH, startHeight + deltaY))
            break
          case "sw": // Southwest (bottom-left)
            newWidth = Math.max(minW, Math.min(maxW, startWidth - deltaX))
            newHeight = Math.max(minH, Math.min(maxH, startHeight + deltaY))
            newX = startPosX + (startWidth - newWidth)
            break
          case "ne": // Northeast (top-right)
            newWidth = Math.max(minW, Math.min(maxW, startWidth + deltaX))
            newHeight = Math.max(minH, Math.min(maxH, startHeight - deltaY))
            newY = startPosY + (startHeight - newHeight)
            break
          case "nw": // Northwest (top-left)
            newWidth = Math.max(minW, Math.min(maxW, startWidth - deltaX))
            newHeight = Math.max(minH, Math.min(maxH, startHeight - deltaY))
            newX = startPosX + (startWidth - newWidth)
            newY = startPosY + (startHeight - newHeight)
            break
        }

        // Update refs immediately for next calculation
        sizeRef.current = { width: newWidth, height: newHeight }
        positionRef.current = { x: newX, y: newY }

        // Batch state updates
        setModalSize({ width: newWidth, height: newHeight })
        setPosition({ x: newX, y: newY })
      })
    }

    const handleMouseUp = () => {
      setIsResizing(null)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""

      // Cancel any pending animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    document.body.style.userSelect = "none"
  }, [])

  // Optimized drag handler
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (isResizing) return
      e.preventDefault()
      setIsDragging(true)

      const startX = e.clientX
      const startY = e.clientY
      const startPosX = positionRef.current.x
      const startPosY = positionRef.current.y

      const handleMouseMove = (e: MouseEvent) => {
        // Cancel previous animation frame
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }

        // Use requestAnimationFrame for smooth updates
        animationFrameRef.current = requestAnimationFrame(() => {
          const deltaX = e.clientX - startX
          const deltaY = e.clientY - startY

          const newPosition = {
            x: startPosX + deltaX,
            y: startPosY + deltaY,
          }

          // Update ref immediately
          positionRef.current = newPosition
          setPosition(newPosition)
        })
      }

      const handleMouseUp = () => {
        setIsDragging(false)
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        document.body.style.cursor = ""
        document.body.style.userSelect = ""

        // Cancel any pending animation frame
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.body.style.userSelect = "none"
    },
    [isResizing],
  )

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Render drawer for mobile
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className={cn("max-h-[85vh]", className)}>
          {title && (
            <DrawerHeader>
              {typeof title === "string" ? <h2 className="text-lg font-semibold">{title}</h2> : title}
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </DrawerHeader>
          )}
          <div className="px-4 pb-4">{children}</div>
          {footer && <DrawerFooter>{footer}</DrawerFooter>}
        </DrawerContent>
      </Drawer>
    )
  }

  // Don't render anything if not open
  if (!open) return null

  // Render custom modal for desktop with resize functionality
  return (
    <div ref={backdropRef} className="fixed inset-0 z-50 bg-black/50" onClick={handleBackdropClick}>
      <div
        ref={modalRef}
        className={cn(
          "bg-background rounded-lg shadow-lg overflow-hidden flex flex-col relative border",
          isDragging && "cursor-grabbing",
          isResizing && "select-none",
          className,
        )}
        style={{
          width: `${modalSize.width}px`,
          height: `${modalSize.height}px`,
          position: "absolute",
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: "translate3d(0, 0, 0)", // Force hardware acceleration
          willChange: isResizing || isDragging ? "transform, width, height" : "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with drag handle */}
        <div
          className="p-4 pb-0 flex items-center justify-between cursor-grab active:cursor-grabbing border-b"
          onMouseDown={handleDragStart}
        >
          <div className="flex-1">
            {title && (
              <div>
                {typeof title === "string" ? <h2 className="text-lg font-semibold">{title}</h2> : title}
                {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
              </div>
            )}
          </div>
          <button
            className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-auto">{children}</div>

        {/* Footer */}
        {footer && <div className="p-4 pt-0 border-t">{footer}</div>}

        {/* Resize handles */}
        {/* Corner handles */}
        <div
          className="absolute -top-1 -left-1 w-3 h-3 cursor-nw-resize bg-transparent hover:bg-blue-500/20 rounded-tl transition-colors"
          onMouseDown={(e) => handleMouseDown(e, "nw")}
        />
        <div
          className="absolute -top-1 -right-1 w-3 h-3 cursor-ne-resize bg-transparent hover:bg-blue-500/20 rounded-tr transition-colors"
          onMouseDown={(e) => handleMouseDown(e, "ne")}
        />
        <div
          className="absolute -bottom-1 -left-1 w-3 h-3 cursor-sw-resize bg-transparent hover:bg-blue-500/20 rounded-bl transition-colors"
          onMouseDown={(e) => handleMouseDown(e, "sw")}
        />
        <div
          className="absolute -bottom-1 -right-1 w-3 h-3 cursor-se-resize bg-transparent hover:bg-blue-500/20 rounded-br transition-colors"
          onMouseDown={(e) => handleMouseDown(e, "se")}
        />

        {/* Edge handles */}
        <div
          className="absolute -top-1 left-3 right-3 h-2 cursor-n-resize bg-transparent hover:bg-blue-500/20 transition-colors"
          onMouseDown={(e) => handleMouseDown(e, "n")}
        />
        <div
          className="absolute -bottom-1 left-3 right-3 h-2 cursor-s-resize bg-transparent hover:bg-blue-500/20 transition-colors"
          onMouseDown={(e) => handleMouseDown(e, "s")}
        />
        <div
          className="absolute -left-1 top-3 bottom-3 w-2 cursor-w-resize bg-transparent hover:bg-blue-500/20 transition-colors"
          onMouseDown={(e) => handleMouseDown(e, "w")}
        />
        <div
          className="absolute -right-1 top-3 bottom-3 w-2 cursor-e-resize bg-transparent hover:bg-blue-500/20 transition-colors"
          onMouseDown={(e) => handleMouseDown(e, "e")}
        />
      </div>
    </div>
  )
}
