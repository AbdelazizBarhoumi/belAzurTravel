import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
    title: React.ReactNode;
    defaultOpen?: boolean;
    activeCount?: number;
    children: React.ReactNode;
    className?: string;
}

export function CollapsibleSection({
    title,
    defaultOpen = true,
    activeCount,
    children,
    className,
}: CollapsibleSectionProps) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <Collapsible open={open} onOpenChange={setOpen} className={className}>
            <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    {typeof title === 'string' ? (
                        <h3 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
                            {title}
                        </h3>
                    ) : (
                        title
                    )}
                    {activeCount !== undefined && activeCount > 0 && (
                        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-medium text-primary-foreground sm:text-[10px]">
                            {activeCount}
                        </span>
                    )}
                </div>
                <ChevronDown
                    className={cn(
                        'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 sm:h-4 sm:w-4',
                        open && 'rotate-180',
                    )}
                />
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <div className="pt-1">{children}</div>
            </CollapsibleContent>
        </Collapsible>
    );
}
