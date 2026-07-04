import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export function TimeInput({
    value,
    onChange,
    placeholder = 'HH:MM',
    className,
    disabled = false,
}: TimeInputProps) {
    return (
        <div
            className={cn(
                'flex items-center rounded-lg border border-border bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
                disabled && 'opacity-50 cursor-not-allowed',
                className,
            )}
        >
            <span className="flex items-center border-r border-border px-2.5 py-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
            </span>
            <input
                type="time"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed [&::-webkit-calendar-picker-indicator]:hidden"
            />
        </div>
    );
}
