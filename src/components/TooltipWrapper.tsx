'use client';
import { ReactNode } from 'react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '@/components/ui/tooltip';

interface UseTooltipProps {
    message: string;
    children: ReactNode;
    sideOffset?: number;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

export const TooltipWrapper = ({
    message,
    children,
    sideOffset = 2,
    position = 'top'
}: UseTooltipProps) => {
    return (
        <TooltipProvider delayDuration={0}>
            <Tooltip>
                <TooltipTrigger asChild>{children}</TooltipTrigger>
                <TooltipContent
                    side={position}
                    sideOffset={sideOffset}
                    className='z-100'
                >
                    <p className='text-center whitespace-pre-line'>{message}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};
