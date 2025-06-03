import type { AnnotationClient } from "@/types/annotation"

// Draw title based on position
export function drawAnnotationTitle(
  ctx: CanvasRenderingContext2D,
  ann: AnnotationClient,
  labelText: string,
  canvasWidth: number,
  canvasHeight: number,
) {
  if (ann.titlePosition === "Hide" || !labelText.trim()) return

  const textWidth = ctx.measureText(labelText).width + 10
  const textHeight = 20
  let x = ann.x
  let y = ann.y

  // Calculate position based on titlePosition
  switch (ann.titlePosition) {
    case "Top Left":
      x = ann.x
      y = ann.y - textHeight
      break
    case "Top Right":
      x = ann.x + ann.width - textWidth
      y = ann.y - textHeight
      break
    case "Top Center":
      x = ann.x + ann.width / 2 - textWidth / 2
      y = ann.y - textHeight
      break
    case "Left":
      x = ann.x - textWidth
      y = ann.y + ann.height / 2 - textHeight / 2
      break
    case "Right":
      x = ann.x + ann.width
      y = ann.y + ann.height / 2 - textHeight / 2
      break
    case "Bottom Left":
      x = ann.x
      y = ann.y + ann.height
      break
    case "Bottom Right":
      x = ann.x + ann.width - textWidth
      y = ann.y + ann.height
      break
    case "Bottom Center":
      x = ann.x + ann.width / 2 - textWidth / 2
      y = ann.y + ann.height
      break
  }

  // Ensure the title stays within canvas bounds
  x = Math.max(0, Math.min(canvasWidth - textWidth, x))
  y = Math.max(0, Math.min(canvasHeight - textHeight, y))

  // Draw the title background
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
  ctx.fillRect(x, y, textWidth, textHeight)

  // Draw the title text
  ctx.fillStyle = "#ffffff"
  ctx.font = "12px Arial"
  ctx.fillText(labelText, x + 5, y + 15)
}

// Draw annotations on canvas
export function drawAnnotations(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  annotations: AnnotationClient[],
  selectedAnnotation: string | null,
  isDrawing: boolean,
  currentAnnotation: Partial<AnnotationClient> | null,
  image: HTMLImageElement,
) {
  // Clear canvas
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  // Draw the image first - ensure it fills the canvas
  ctx.drawImage(image, 0, 0, canvasWidth, canvasHeight)

  // Draw all annotations
  annotations.forEach((ann) => {
    // Skip invisible annotations
    if (!ann.visible) return

    const isSelected = selectedAnnotation === ann.id
    const hasLabel = ann.labelName && ann.labelName.trim() !== ""
    const isLocked = ann.locked

    // Set fill style with low opacity
    if (isSelected) {
      ctx.fillStyle = "rgba(255, 0, 0, 0.2)" // Red with 20% opacity for selected
    } else if (!hasLabel) {
      ctx.fillStyle = "rgba(255, 165, 0, 0.2)" // Orange with 20% opacity for unlabeled
    } else {
      ctx.fillStyle = "rgba(0, 255, 0, 0.2)" // Green with 20% opacity for labeled
    }

    // Fill the rectangle with the semi-transparent color
    ctx.fillRect(ann.x, ann.y, ann.width, ann.height)

    // Draw the border
    if (isSelected) {
      ctx.strokeStyle = "#ff0000" // Red for selected
    } else if (!hasLabel) {
      ctx.strokeStyle = "#ffa500" // Orange for unlabeled
    } else {
      ctx.strokeStyle = "#00ff00" // Green for labeled
    }

    // Use dashed line for locked annotations
    if (isLocked) {
      ctx.setLineDash([5, 3]) // 5px dash, 3px gap
    } else {
      ctx.setLineDash([]) // Solid line
    }

    ctx.lineWidth = 2
    ctx.strokeRect(ann.x, ann.y, ann.width, ann.height)

    // Reset line dash
    ctx.setLineDash([])

    // Draw label if it exists
    if (hasLabel) {
      drawAnnotationTitle(ctx, ann, ann.labelName, canvasWidth, canvasHeight)
    }

    // Draw resize handles if selected and not locked
    if (isSelected && !isLocked) {
      const handleSize = 14

      // Helper to draw a circle handle with white fill and red border
      function drawCircleHandle(cx: number, cy: number) {
        ctx.beginPath()
        ctx.arc(cx, cy, handleSize / 2, 0, 2 * Math.PI)
        ctx.fillStyle = "#ffffff"
        ctx.fill()
        ctx.strokeStyle = "#ff0000"
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // Corner handles
      // Top-left
      drawCircleHandle(ann.x, ann.y)
      // Top-right
      drawCircleHandle(ann.x + ann.width, ann.y)
      // Bottom-left
      drawCircleHandle(ann.x, ann.y + ann.height)
      // Bottom-right
      drawCircleHandle(ann.x + ann.width, ann.y + ann.height)

      // Middle handles
      // Top-middle
      drawCircleHandle(ann.x + ann.width / 2, ann.y)
      // Bottom-middle
      drawCircleHandle(ann.x + ann.width / 2, ann.y + ann.height)
      // Left-middle
      drawCircleHandle(ann.x, ann.y + ann.height / 2)
      // Right-middle
      drawCircleHandle(ann.x + ann.width, ann.y + ann.height / 2)
    }
  })

  // Draw current annotation if drawing
  if (isDrawing && currentAnnotation) {
    ctx.strokeStyle = "#0000ff"
    ctx.lineWidth = 2
    ctx.fillStyle = "rgba(0, 0, 255, 0.2)" // Blue with 20% opacity for drawing

    // Calculate normalized coordinates for display while drawing
    let x = currentAnnotation.x || 0
    let y = currentAnnotation.y || 0
    let width = currentAnnotation.width || 0
    let height = currentAnnotation.height || 0

    // Normalize for display
    if (width < 0) {
      x = x + width
      width = Math.abs(width)
    }

    if (height < 0) {
      y = y + height
      height = Math.abs(height)
    }

    // Fill the rectangle with semi-transparent color
    ctx.fillRect(x, y, width, height)
    // Draw the border
    ctx.strokeRect(x, y, width, height)
  }
}
