import type { AnnotationClient } from "@/types/annotation"

// Check if point is on annotation border
export function isOnBorder(x: number, y: number, ann: AnnotationClient, borderWidth = 5): boolean {
  // Skip invisible annotations
  if (!ann.visible) return false

  // Check if point is near the border of the annotation
  const onLeftBorder = Math.abs(x - ann.x) <= borderWidth && y >= ann.y && y <= ann.y + ann.height
  const onRightBorder = Math.abs(x - (ann.x + ann.width)) <= borderWidth && y >= ann.y && y <= ann.y + ann.height
  const onTopBorder = Math.abs(y - ann.y) <= borderWidth && x >= ann.x && x <= ann.x + ann.width
  const onBottomBorder = Math.abs(y - (ann.y + ann.height)) <= borderWidth && x >= ann.x && x <= ann.x + ann.width

  return onLeftBorder || onRightBorder || onTopBorder || onBottomBorder
}

// Check if point is on annotation title
export function isOnTitle(
  x: number,
  y: number,
  ann: AnnotationClient,
  canvasWidth: number,
  canvasHeight: number,
  measureText: (text: string) => TextMetrics,
): boolean {
  // Skip invisible annotations
  if (!ann.visible) return false

  if (ann.titlePosition === "Hide" || !ann.labelName || !ann.labelName.trim()) return false

  const labelText = ann.labelName
  const textWidth = measureText(labelText).width + 10
  const textHeight = 20

  let titleX = ann.x
  let titleY = ann.y

  // Calculate position based on titlePosition
  switch (ann.titlePosition) {
    case "Top Left":
      titleX = ann.x
      titleY = ann.y - textHeight
      break
    case "Top Right":
      titleX = ann.x + ann.width - textWidth
      titleY = ann.y - textHeight
      break
    case "Top Center":
      titleX = ann.x + ann.width / 2 - textWidth / 2
      titleY = ann.y - textHeight
      break
    case "Left":
      titleX = ann.x - textWidth
      titleY = ann.y + ann.height / 2 - textHeight / 2
      break
    case "Right":
      titleX = ann.x + ann.width
      titleY = ann.y + ann.height / 2 - textHeight / 2
      break
    case "Bottom Left":
      titleX = ann.x
      titleY = ann.y + ann.height
      break
    case "Bottom Right":
      titleX = ann.x + ann.width - textWidth
      titleY = ann.y + ann.height
      break
    case "Bottom Center":
      titleX = ann.x + ann.width / 2 - textWidth / 2
      titleY = ann.y + ann.height
      break
  }

  // Ensure the title stays within canvas bounds
  titleX = Math.max(0, Math.min(canvasWidth - textWidth, titleX))
  titleY = Math.max(0, Math.min(canvasHeight - textHeight, titleY))

  // Check if point is in the title area
  return x >= titleX && x <= titleX + textWidth && y >= titleY && y <= titleY + textHeight
}

// Check if point is inside annotation
export function isInsideAnnotation(x: number, y: number, ann: AnnotationClient): boolean {
  // Skip invisible annotations
  if (!ann.visible) return false

  return x >= ann.x && x <= ann.x + ann.width && y >= ann.y && y <= ann.y + ann.height
}

// Get cursor style based on position
export function getCursorStyle(
  x: number,
  y: number,
  annotations: AnnotationClient[],
  selectedAnnotation: string | null,
  canvasWidth: number,
  canvasHeight: number,
  measureText: (text: string) => TextMetrics,
): string {
  // Check if hovering over any annotation border or title
  for (const ann of annotations) {
    // Skip invisible annotations
    if (!ann.visible) continue

    // Skip the selected annotation
    if (ann.id === selectedAnnotation) {
      // For selected annotation, check resize handles
      if (selectedAnnotation) {
        const selected = ann

        // If annotation is locked, just show not-allowed cursor
        if (selected.locked) {
          if (isInsideAnnotation(x, y, selected)) {
            return "not-allowed"
          }
          continue
        }

        const handleSize = 8

        // Corner handles
        // Top-left (nwse-resize)
        if (Math.abs(x - selected.x) <= handleSize && Math.abs(y - selected.y) <= handleSize) {
          return "nwse-resize"
        }

        // Top-right (nesw-resize)
        if (Math.abs(x - (selected.x + selected.width)) <= handleSize && Math.abs(y - selected.y) <= handleSize) {
          return "nesw-resize"
        }

        // Bottom-left (nesw-resize)
        if (Math.abs(x - selected.x) <= handleSize && Math.abs(y - (selected.y + selected.height)) <= handleSize) {
          return "nesw-resize"
        }

        // Bottom-right (nwse-resize)
        if (
          Math.abs(x - (selected.x + selected.width)) <= handleSize &&
          Math.abs(y - (selected.y + selected.height)) <= handleSize
        ) {
          return "nwse-resize"
        }

        // Middle handles
        // Top-middle (ns-resize)
        if (Math.abs(x - (selected.x + selected.width / 2)) <= handleSize && Math.abs(y - selected.y) <= handleSize) {
          return "ns-resize"
        }

        // Bottom-middle (ns-resize)
        if (
          Math.abs(x - (selected.x + selected.width / 2)) <= handleSize &&
          Math.abs(y - (selected.y + selected.height)) <= handleSize
        ) {
          return "ns-resize"
        }

        // Left-middle (ew-resize)
        if (Math.abs(x - selected.x) <= handleSize && Math.abs(y - (selected.y + selected.height / 2)) <= handleSize) {
          return "ew-resize"
        }

        // Right-middle (ew-resize)
        if (
          Math.abs(x - (selected.x + selected.width)) <= handleSize &&
          Math.abs(y - (selected.y + selected.height / 2)) <= handleSize
        ) {
          return "ew-resize"
        }

        // Inside selected annotation
        if (isInsideAnnotation(x, y, selected)) {
          return "move"
        }
      }
      continue
    }

    // For unselected annotations, show pointer on border or title
    if (isOnBorder(x, y, ann) || isOnTitle(x, y, ann, canvasWidth, canvasHeight, measureText)) {
      return "pointer"
    }

    // Show hand cursor when inside an unselected annotation
    if (isInsideAnnotation(x, y, ann)) {
      return "pointer"
    }
  }

  return "crosshair"
}
