"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  MousePointer,
  Hand,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Undo,
  Redo,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Download,
  Upload,
  FileImage,
  HelpCircle,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export type ToolType = "select" | "pan"

interface ToolbarProps {
  selectedTool: ToolType
  onToolChange: (tool: ToolType) => void
  zoomLevel: number
  onZoomChange: (zoom: number) => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onShowHelp?: () => void
}

export function Toolbar({
  selectedTool,
  onToolChange,
  zoomLevel,
  onZoomChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onShowHelp,
}: ToolbarProps) {
  // Define tools
  const tools = [
    {
      id: "select" as ToolType,
      name: "Select & Draw",
      icon: <MousePointer className="h-4 w-4" />,
      tooltip: "Select and draw annotations (S)",
    },
    {
      id: "pan" as ToolType,
      name: "Pan",
      icon: <Hand className="h-4 w-4" />,
      tooltip: "Pan around the document (P)",
    },
  ]

  // Handle zoom in
  const handleZoomIn = () => {
    // Use 5% increment for zoom in
    const newZoom = Math.min(zoomLevel + 0.05, 5)
    onZoomChange(newZoom)
  }

  // Handle zoom out
  const handleZoomOut = () => {
    // Use 5% decrement for zoom out
    const newZoom = Math.max(zoomLevel - 0.05, 0.1)
    onZoomChange(newZoom)
  }

  // Handle zoom reset
  const handleZoomReset = () => {
    onZoomChange(1)
  }

  return (
    <TooltipProvider>
      <div className="bg-background border-b p-2 flex flex-wrap items-center gap-2">
        {/* Tool buttons */}
        <div className="flex items-center space-x-1">
          {tools.map((tool) => (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={selectedTool === tool.id ? "default" : "outline"}
                  size="icon"
                  onClick={() => onToolChange(tool.id)}
                  aria-label={tool.name}
                >
                  {tool.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{tool.tooltip}</TooltipContent>
            </Tooltip>
          ))}
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Zoom controls */}
        <div className="flex items-center space-x-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleZoomOut} aria-label="Zoom Out">
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom Out (-)</TooltipContent>
          </Tooltip>

          <div className="text-sm font-medium w-16 text-center">{Math.round(zoomLevel * 100)}%</div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleZoomIn} aria-label="Zoom In">
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom In (+)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleZoomReset} aria-label="Reset Zoom">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset Zoom (R)</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* History controls */}
        <div className="flex items-center space-x-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={onUndo} disabled={!canUndo} aria-label="Undo">
                <Undo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={onRedo} disabled={!canRedo} aria-label="Redo">
                <Redo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Document and Help */}
        <div className="flex items-center space-x-1">
          {onShowHelp && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={onShowHelp} aria-label="Help">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Show Help</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
