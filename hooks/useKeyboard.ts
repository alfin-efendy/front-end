"use client"

import { useEffect, useCallback, useState } from "react"

interface UseKeyboardProps {
  selectedAnnotation: string | null
  deleteSelectedAnnotation: () => void
  moveSelectedAnnotation: (direction: "up" | "down" | "left" | "right", amount: number) => void
  zoomLevel?: number
  setZoomLevel?: (zoom: number) => void
  selectedTool?: string
  setSelectedTool?: (tool: "select" | "pan") => void
}

export function useKeyboard({
  selectedAnnotation,
  deleteSelectedAnnotation,
  moveSelectedAnnotation,
  zoomLevel = 1,
  setZoomLevel,
  selectedTool,
  setSelectedTool,
}: UseKeyboardProps) {
  // Track previous tool to restore after space key is released
  const [previousTool, setPreviousTool] = useState<"select" | "pan">("select")
  const [isSpacePressed, setIsSpacePressed] = useState(false)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Check if the active element is an input, textarea, or select element
      const activeElement = document.activeElement
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement

      // Handle space key for pan tool - prevent default BEFORE any other logic
      if (!isInputFocused && e.code === "Space") {
        e.preventDefault() // Prevent page scrolling

        // Only switch tool if not already pressed
        if (!isSpacePressed && setSelectedTool) {
          setIsSpacePressed(true)
          // Store current tool before switching to pan
          setPreviousTool(selectedTool as "select" | "pan")
          setSelectedTool("pan")
        }
        return
      }

      // Handle tool selection shortcuts
      if (!isInputFocused) {
        if (e.key === "s" && setSelectedTool) {
          setSelectedTool("select")
          return
        }
        if (e.key === "p" && setSelectedTool) {
          setSelectedTool("pan")
          return
        }
      }

      // Handle zoom shortcuts
      if (!isInputFocused && setZoomLevel) {
        if (e.key === "=" || e.key === "+") {
          e.preventDefault()
          // Use 5% increment for zoom in
          setZoomLevel(Math.min(zoomLevel + 0.05, 5))
          return
        }
        if (e.key === "-") {
          e.preventDefault()
          // Use 5% decrement for zoom out
          setZoomLevel(Math.max(zoomLevel - 0.05, 0.1))
          return
        }
        if (e.key === "0") {
          e.preventDefault()
          setZoomLevel(1)
          return
        }
      }

      if (selectedAnnotation) {
        // Always handle Delete key
        if (e.key === "Delete") {
          deleteSelectedAnnotation()
          return
        }

        // Only handle arrow keys if no input element is focused
        if (!isInputFocused) {
          switch (e.key) {
            case "ArrowUp":
              e.preventDefault()
              moveSelectedAnnotation("up", e.shiftKey ? 10 : 1)
              break
            case "ArrowDown":
              e.preventDefault()
              moveSelectedAnnotation("down", e.shiftKey ? 10 : 1)
              break
            case "ArrowLeft":
              e.preventDefault()
              moveSelectedAnnotation("left", e.shiftKey ? 10 : 1)
              break
            case "ArrowRight":
              e.preventDefault()
              moveSelectedAnnotation("right", e.shiftKey ? 10 : 1)
              break
          }
        }
      }
    },
    [
      deleteSelectedAnnotation,
      isSpacePressed,
      moveSelectedAnnotation,
      selectedAnnotation,
      selectedTool,
      setSelectedTool,
      setZoomLevel,
      zoomLevel,
    ],
  )

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      // Handle space key release
      if (e.code === "Space") {
        e.preventDefault() // Prevent any default behavior

        if (isSpacePressed && setSelectedTool) {
          setIsSpacePressed(false)
          // Restore previous tool
          setSelectedTool(previousTool)
        }
      }
    },
    [isSpacePressed, previousTool, setSelectedTool],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  // Add a global event listener to prevent space key scrolling
  useEffect(() => {
    const preventSpaceScroll = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault()
      }
    }

    // Add the event listener to the document
    document.addEventListener("keydown", preventSpaceScroll)

    return () => {
      document.removeEventListener("keydown", preventSpaceScroll)
    }
  }, [])

  return null
}
