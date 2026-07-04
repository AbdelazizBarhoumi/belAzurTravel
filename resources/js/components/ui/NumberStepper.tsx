import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NumberStepperProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    className?: string;
    disabled?: boolean;
}

export function NumberStepper({
    value,
    onChange,
    min = 0,
    max = 999,
    step = 1,
    className,
    disabled = false,
}: NumberStepperProps) {
    const decrement = () => {
        const next = value - step;
        if (next >= min) {
            onChange(next);
        }
    };

    const increment = () => {
        const next = value + step;
        if (next <= max) {
            onChange(next);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (raw === '') {
            onChange(min);
            return;
        }
        const num = Number(raw);
        if (!Number.isNaN(num) && num >= min && num <= max) {
            onChange(num);
        }
    };

    return (
        <div
            className={cn(
                'flex items-center rounded-lg border border-border',
                className,
            )}
        >
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-l-lg text-muted-foreground hover:text-foreground"
                onClick={decrement}
                disabled={disabled || value <= min}
                aria-label="Decrease"
            >
                <Minus className="h-4 w-4" />
            </Button>
            <input
                type="number"
                value={value}
                onChange={handleInputChange}
                min={min}
                max={max}
                disabled={disabled}
                className="h-9 w-12 border-x border-border bg-transparent text-center text-sm font-medium outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-r-lg text-muted-foreground hover:text-foreground"
                onClick={increment}
                disabled={disabled || value >= max}
                aria-label="Increase"
            >
                <Plus className="h-4 w-4" />
            </Button>
        </div>
    );
}
