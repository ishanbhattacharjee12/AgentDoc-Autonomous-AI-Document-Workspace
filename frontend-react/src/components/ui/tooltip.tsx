import React from 'react'
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"
import { Info } from 'lucide-react'

interface TooltipProps {
  content: string
  side?: 'top' | 'right' | 'bottom' | 'left'
}

export const Tooltip: React.FC<TooltipProps> = ({ content, side = 'top' }) => {
  return (
    <TooltipPrimitive.Provider delay={200}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger className="inline-flex items-center shrink-0 p-0.5 text-muted-foreground/50 hover:text-foreground/80 focus:outline-none cursor-help transition-colors select-none">
          <Info className="h-3.5 w-3.5" />
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Positioner side={side} sideOffset={6} align="center">
            <TooltipPrimitive.Popup className="z-50 max-w-64 rounded-lg bg-popover text-popover-foreground border border-border p-2.5 text-[11.5px] font-normal leading-normal whitespace-pre-line shadow-md animate-[fadeIn_0.1s_ease-out] text-left outline-none overflow-visible">
              <TooltipPrimitive.Arrow className="group overflow-visible">
                <div className="absolute left-1/2 -translate-x-1/2 size-2 rotate-45 bg-popover border-r border-b border-border bottom-0 translate-y-1/2 group-data-[side=top]:top-0 group-data-[side=top]:bottom-auto group-data-[side=top]:-translate-y-1/2 group-data-[side=top]:rotate-[225deg]" />
              </TooltipPrimitive.Arrow>
              {content}
            </TooltipPrimitive.Popup>
          </TooltipPrimitive.Positioner>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}
