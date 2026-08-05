import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface StatusOption {
  value: string;
  label: string;
  colorClass?: string;
  indicatorClass?: string;
}

interface StatusSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: StatusOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const defaultStatusColors: Record<string, string> = {
  // Common statuses
  confirmed: "bg-emerald-500/10 text-emerald-600 border-emerald-200/50",
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-200/50",
  pending: "bg-amber-500/10 text-amber-600 border-amber-200/50",
  processing: "bg-blue-500/10 text-blue-600 border-blue-200/50",
  cancelled: "bg-rose-500/10 text-rose-600 border-rose-200/50",
  failed: "bg-rose-500/10 text-rose-600 border-rose-200/50",
  active: "bg-emerald-500/10 text-emerald-600 border-emerald-200/50",
  inactive: "bg-slate-500/10 text-slate-600 border-slate-200/50",
};

const defaultIndicatorColors: Record<string, string> = {
  confirmed: "bg-emerald-500",
  completed: "bg-emerald-500",
  pending: "bg-amber-500",
  processing: "bg-blue-500",
  cancelled: "bg-rose-500",
  failed: "bg-rose-500",
  active: "bg-emerald-500",
  inactive: "bg-slate-500",
};

export function StatusSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select status",
  className,
  disabled,
}: StatusSelectProps) {
  const selectedOption = options.find((opt) => opt.value === value);
  const normalizedValue = value?.toLowerCase() || "";
  
  const statusColorClass = selectedOption?.colorClass || defaultStatusColors[normalizedValue] || "bg-muted/50 text-muted-foreground border-border";

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        className={cn(
          "h-8 w-fit min-w-[120px] gap-2 rounded-full border px-3 text-xs font-bold transition-all hover:opacity-80",
          statusColorClass,
          className
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="rounded-xl">
        {options.map((option) => {
          const optValue = option.value.toLowerCase();
          const optIndicator = option.indicatorClass || defaultIndicatorColors[optValue] || "bg-muted-foreground";
          
          return (
            <SelectItem
              key={option.value}
              value={option.value}
              className="rounded-lg"
            >
              <div className="flex items-center gap-2">
                <div className={cn("h-1.5 w-1.5 rounded-full", optIndicator)} />
                <span>{option.label}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
