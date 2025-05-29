"use client"

import { useState, useEffect } from "react"

export function useViewportSize() {
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    // Set initial size
    updateSize()

    // Add event listener
    window.addEventListener("resize", updateSize)

    // Cleanup
    return () => window.removeEventListener("resize", updateSize)
  }, [])

  return viewportSize
}
