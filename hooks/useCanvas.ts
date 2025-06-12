"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import type { CanvasSize } from "@/types/canvas"
import type { AnnotationClient } from "@/types/annotation"
import { isOnBorder, isOnTitle, isInsideAnnotation, getCursorStyle } from "@/lib/interaction"
import { drawAnnotations } from "@/lib/drawing"
import type { ToolType } from "@/components/toolbar"

interface UseCanvasProps {
  image: string
  annotations: AnnotationClient[]
  selectedAnnotation: string | null
  currentLabel: string
  imageRef: React.RefObject<HTMLImageElement | null>
  addAnnotation: (annotation: AnnotationClient) => void
  setSelectedAnnotation: (id: string | null) => void
  updateAnnotation: (id: string, updates: Partial<AnnotationClient>) => void
  selectedTool?: ToolType
  zoomLevel?: number
}

export function useCanvas({
  image,
  annotations,
  selectedAnnotation,
  currentLabel,
  imageRef,
  addAnnotation,
  setSelectedAnnotation,
  updateAnnotation,
  selectedTool = "select",
  zoomLevel = 1,
}: UseCanvasProps) {
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 0, height: 0 })
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentAnnotation, setCurrentAnnotation] = useState<Partial<AnnotationClient> | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)

  // Convert screen coordinates to canvas coordinates
  const getCanvasCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 }

    const rect = canvasRef.current.getBoundingClientRect()

    // Calculate the scale between the canvas element's displayed size and its actual dimensions
    const scaleX = canvasRef.current.width / rect.width
    const scaleY = canvasRef.current.height / rect.height

    // Convert client coordinates to canvas coordinates
    const x = (clientX - rect.left) * scaleX
    const y = (clientY - rect.top) * scaleY

    return { x, y }
  }, [])

  // Draw only the image on canvas (annotations are now React components)
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")

    if (!canvas || !ctx || !image) return

    try {
      if (imageRef.current) {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        // Draw the image at the canvas dimensions
        ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height)
      } else {
        const img = new Image()
        img.onload = () => {
          imageRef.current = img
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        }
        img.src = image
      }
    } catch (error) {
      console.error("Error rendering canvas:", error)
    }
  }, [image, imageRef])

  // Update canvas cursor (simplified for React components)
  const updateCursor = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current || !image) return

      // Set cursor based on selected tool
      if (selectedTool === "pan") {
        canvasRef.current.style.cursor = isPanning ? "grabbing" : "grab"
        return
      }

      // Default cursor for drawing new annotations
      canvasRef.current.style.cursor = "crosshair"
    },
    [image, isPanning, selectedTool],
  )

  // Mouse events for drawing
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!image) return

      const canvas = canvasRef.current
      if (!canvas) return

      const { x, y } = getCanvasCoordinates(e.clientX, e.clientY)

      // Handle different tools
      if (selectedTool === "pan") {
        setIsPanning(true)
        setPanStart({ x: e.clientX, y: e.clientY })
        if (canvasContainerRef.current) {
          canvasContainerRef.current.style.cursor = "grabbing"
        }
        return
      }

      // Default tool is "select"
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Check if clicked on a border or title of any annotation
      for (const ann of annotations) {
        if (
          ann.visible &&
          ann.id !== selectedAnnotation &&
          (isOnBorder(x, y, ann) ||
            isOnTitle(x, y, ann, canvas.width, canvas.height, (text) => ctx.measureText(text)) ||
            isInsideAnnotation(x, y, ann))
        ) {
          setSelectedAnnotation(ann.id || ann.tmpId)
          return
        }
      }

      // Check if clicked on a resize handle of selected annotation
      if (selectedAnnotation) {
        const selected = annotations.find((ann) => ann.id === selectedAnnotation && ann.visible)
        if (selected && !selected.locked) {
          const handleSize = 8

          // Corner handles
          // Check top-left handle
          if (Math.abs(x - selected.x) <= handleSize && Math.abs(y - selected.y) <= handleSize) {
            setIsResizing(true)
            setResizeHandle("top-left")
            return
          }

          // Check top-right handle
          if (Math.abs(x - (selected.x + selected.width)) <= handleSize && Math.abs(y - selected.y) <= handleSize) {
            setIsResizing(true)
            setResizeHandle("top-right")
            return
          }

          // Check bottom-left handle
          if (Math.abs(x - selected.x) <= handleSize && Math.abs(y - (selected.y + selected.height)) <= handleSize) {
            setIsResizing(true)
            setResizeHandle("bottom-left")
            return
          }

          // Check bottom-right handle
          if (
            Math.abs(x - (selected.x + selected.width)) <= handleSize &&
            Math.abs(y - (selected.y + selected.height)) <= handleSize
          ) {
            setIsResizing(true)
            setResizeHandle("bottom-right")
            return
          }

          // Middle handles
          // Check top-middle handle
          if (Math.abs(x - (selected.x + selected.width / 2)) <= handleSize && Math.abs(y - selected.y) <= handleSize) {
            setIsResizing(true)
            setResizeHandle("top")
            return
          }

          // Check bottom-middle handle
          if (
            Math.abs(x - (selected.x + selected.width / 2)) <= handleSize &&
            Math.abs(y - (selected.y + selected.height)) <= handleSize
          ) {
            setIsResizing(true)
            setResizeHandle("bottom")
            return
          }

          // Check left-middle handle
          if (
            Math.abs(x - selected.x) <= handleSize &&
            Math.abs(y - (selected.y + selected.height / 2)) <= handleSize
          ) {
            setIsResizing(true)
            setResizeHandle("left")
            return
          }

          // Check right-middle handle
          if (
            Math.abs(x - (selected.x + selected.width)) <= handleSize &&
            Math.abs(y - (selected.y + selected.height / 2)) <= handleSize
          ) {
            setIsResizing(true)
            setResizeHandle("right")
            return
          }
        }
      }

      // Check if clicked on an existing annotation for dragging
      const clicked = annotations.find(
        (ann) =>
          ann.visible && !ann.locked && x >= ann.x && x <= ann.x + ann.width && y >= ann.y && y <= ann.y + ann.height,
      )

      if (clicked) {
        setSelectedAnnotation(clicked.id || clicked.tmpId)
        setIsDragging(true)
        setDragOffset({ x: x - clicked.x, y: y - clicked.y })
        return
      }

      // If not dragging or resizing, start drawing a new annotation
      setSelectedAnnotation(null)
      setIsDrawing(true)
      setCurrentAnnotation({
        id: Date.now().toString(),
        x,
        y,
        width: 0,
        height: 0,
        labelName: currentLabel,
        titlePosition: "Top Left",
        visible: true,
        locked: false,
      })
    },
    [annotations, currentLabel, getCanvasCoordinates, image, selectedAnnotation, selectedTool, setSelectedAnnotation],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current || !image) return

      // Update cursor style
      updateCursor(e)

      // Handle panning
      if (isPanning && canvasContainerRef.current) {
        const dx = e.clientX - panStart.x
        const dy = e.clientY - panStart.y

        canvasContainerRef.current.scrollLeft -= dx
        canvasContainerRef.current.scrollTop -= dy

        setPanStart({ x: e.clientX, y: e.clientY })
        return
      }

      const { x, y } = getCanvasCoordinates(e.clientX, e.clientY)

      // Handle resizing
      if (isResizing && selectedAnnotation) {
        const index = annotations.findIndex((ann) => ann.id === selectedAnnotation)
        if (index !== -1) {
          const ann = { ...annotations[index] }

          // Corner handles
          if (resizeHandle === "top-left") {
            const newWidth = ann.x + ann.width - x
            const newHeight = ann.y + ann.height - y
            if (newWidth > 5 && newHeight > 5) {
              updateAnnotation(selectedAnnotation, {
                width: newWidth,
                height: newHeight,
                x,
                y,
              })
            }
          } else if (resizeHandle === "top-right") {
            const newWidth = x - ann.x
            const newHeight = ann.y + ann.height - y
            if (newWidth > 5 && newHeight > 5) {
              updateAnnotation(selectedAnnotation, {
                width: newWidth,
                height: newHeight,
                y,
              })
            }
          } else if (resizeHandle === "bottom-left") {
            const newWidth = ann.x + ann.width - x
            const newHeight = y - ann.y
            if (newWidth > 5 && newHeight > 5) {
              updateAnnotation(selectedAnnotation, {
                width: newWidth,
                height: newHeight,
                x,
              })
            }
          } else if (resizeHandle === "bottom-right") {
            const newWidth = x - ann.x
            const newHeight = y - ann.y
            if (newWidth > 5 && newHeight > 5) {
              updateAnnotation(selectedAnnotation, {
                width: newWidth,
                height: newHeight,
              })
            }
          }
          // Middle handles
          else if (resizeHandle === "top") {
            const newHeight = ann.y + ann.height - y
            if (newHeight > 5) {
              updateAnnotation(selectedAnnotation, {
                height: newHeight,
                y,
              })
            }
          } else if (resizeHandle === "bottom") {
            const newHeight = y - ann.y
            if (newHeight > 5) {
              updateAnnotation(selectedAnnotation, {
                height: newHeight,
              })
            }
          } else if (resizeHandle === "left") {
            const newWidth = ann.x + ann.width - x
            if (newWidth > 5) {
              updateAnnotation(selectedAnnotation, {
                width: newWidth,
                x,
              })
            }
          } else if (resizeHandle === "right") {
            const newWidth = x - ann.x
            if (newWidth > 5) {
              updateAnnotation(selectedAnnotation, {
                width: newWidth,
              })
            }
          }

          // Redraw immediately to prevent flickering
          renderCanvas()
          return
        }
      }

      // Handle dragging
      if (isDragging && selectedAnnotation) {
        const index = annotations.findIndex((ann) => ann.id === selectedAnnotation)
        if (index !== -1) {
          updateAnnotation(selectedAnnotation, {
            x: x - dragOffset.x,
            y: y - dragOffset.y,
          })

          // Redraw immediately to prevent flickering
          renderCanvas()
          return
        }
      }

      // Handle drawing new annotation
      if (isDrawing && currentAnnotation) {
        setCurrentAnnotation((prev) => {
          if (!prev) return null
          return {
            ...prev,
            width: x - (prev.x || 0),
            height: y - (prev.y || 0),
          }
        })

        // Redraw immediately to prevent flickering
        renderCanvas()
      }
    },
    [
      annotations,
      currentAnnotation,
      dragOffset.x,
      dragOffset.y,
      getCanvasCoordinates,
      image,
      isDragging,
      isDrawing,
      isPanning,
      isResizing,
      panStart.x,
      panStart.y,
      renderCanvas,
      resizeHandle,
      selectedAnnotation,
      updateAnnotation,
      updateCursor,
    ],
  )

  const handleMouseUp = useCallback(() => {
    // Reset panning state
    if (isPanning) {
      setIsPanning(false)
      if (canvasContainerRef.current) {
        canvasContainerRef.current.style.cursor = "grab"
      }
    }

    // Reset dragging and resizing states
    setIsDragging(false)
    setIsResizing(false)
    setResizeHandle(null)

    // Handle completing a new annotation draw
    if (isDrawing && currentAnnotation) {
      // Create a copy of the current annotation
      const finalAnnotation = { ...currentAnnotation } as AnnotationClient

      // Handle all four drawing directions by normalizing coordinates and dimensions
      if (finalAnnotation.width < 0) {
        finalAnnotation.x = (finalAnnotation.x || 0) + finalAnnotation.width
        finalAnnotation.width = Math.abs(finalAnnotation.width)
      }

      if (finalAnnotation.height < 0) {
        finalAnnotation.y = (finalAnnotation.y || 0) + finalAnnotation.height
        finalAnnotation.height = Math.abs(finalAnnotation.height)
      }

      // Only add if the box has some minimum size
      if (finalAnnotation.width > 5 && finalAnnotation.height > 5) {
        addAnnotation(finalAnnotation)
      }

      setIsDrawing(false)
      setCurrentAnnotation(null)
    }
  }, [addAnnotation, currentAnnotation, isDrawing, isPanning])

  // Handle React component events
  const handleAnnotationResize = useCallback(
    (handle: string, e: React.MouseEvent) => {
      setIsResizing(true)
      setResizeHandle(handle)
    },
    [],
  )

  const handleAnnotationDrag = useCallback(
    (annotation: AnnotationClient, e: React.MouseEvent) => {
      const { x, y } = getCanvasCoordinates(e.clientX, e.clientY)
      setIsDragging(true)
      setDragOffset({ x: x - annotation.x, y: y - annotation.y })
      setSelectedAnnotation(annotation.id || annotation.tmpId)
    },
    [getCanvasCoordinates, setSelectedAnnotation],
  )

  // Resize canvas and scale annotations
  const resizeCanvas = useCallback(() => {
    if (!image || !canvasRef.current) return

    const canvas = canvasRef.current
    const container = canvas.parentElement
    if (!container) return

    // Set new canvas size based on container width
    const containerWidth = container.clientWidth

    // If we have an image reference, use its aspect ratio
    if (imageRef.current) {
      const aspectRatio = imageRef.current.height / imageRef.current.width

      // Important: Set the actual canvas dimensions
      canvas.width = containerWidth
      canvas.height = containerWidth * aspectRatio
      
      // Update canvas size state
      const newSize = {
        width: canvas.width,
        height: canvas.height,
      }

      setCanvasSize(newSize)

      // Use requestAnimationFrame to prevent render loops
      requestAnimationFrame(() => {
        renderCanvas()
      })

      return newSize
    } else if (image) {
      // If we don't have an image reference yet, create one
      const img = new Image()
      img.onload = () => {
        imageRef.current = img

        const aspectRatio = img.height / img.width

        // Important: Set the actual canvas dimensions
        canvas.width = containerWidth
        canvas.height = containerWidth * aspectRatio

        // Update canvas size state
        const newSize = {
          width: canvas.width,
          height: canvas.height,
        }

        setCanvasSize(newSize)

        // Use requestAnimationFrame to prevent render loops
        requestAnimationFrame(() => {
          renderCanvas()
        })
      }
      img.src = image
    }
  }, [image, imageRef, renderCanvas])

  // Update canvas when annotations change
  useEffect(() => {
    if (image && canvasRef.current) {
      // Use requestAnimationFrame to prevent potential render loops
      const animationId = requestAnimationFrame(() => {
        renderCanvas()
      })
      return () => cancelAnimationFrame(animationId)
    }
  }, [image, renderCanvas, annotations, selectedAnnotation]) // Added dependencies

  // Initialize canvas when image is loaded
  useEffect(() => {
    if (image) {
      const newSize = resizeCanvas()
      if (newSize) {
        setCanvasSize(newSize)
      }
    }
  }, [image, resizeCanvas])

  // Redraw canvas when zoom level changes
  useEffect(() => {
    if (image && canvasRef.current) {
      // Force a redraw when zoom level changes
      renderCanvas()
    }
  }, [zoomLevel, image, renderCanvas])

  return {
    canvasRef,
    canvasContainerRef,
    canvasSize,
    isDrawing,
    isDragging,
    isResizing,
    currentAnnotation,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleAnnotationResize,
    handleAnnotationDrag,
    renderCanvas,
    resizeCanvas,
  }
}