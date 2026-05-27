import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from 'lucide-react';

const InfoTooltip = ({ content }) => {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            type="button" 
            className="cursor-help inline-flex items-center ml-2 outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full transition-opacity hover:opacity-80"
            onClick={(e) => e.preventDefault()}
          >
            <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors duration-150" />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          sideOffset={4}
          className="max-w-xs text-sm p-3 rounded-lg shadow-xl border bg-popover text-popover-foreground animate-in fade-in-0 zoom-in-95 duration-150"
        >
          {typeof content === 'string' ? <p>{content}</p> : content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default InfoTooltip;