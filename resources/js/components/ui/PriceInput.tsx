import { cn } from '@/lib/utils';

interface PriceInputProps {
    value: string | number;
    onChange: (value: string) => void;
    placeholder?: string;
    min?: number;
    max?: number;
    className?: string;
    disabled?: boolean;
    currency?: string;
}

export function PriceInput({
    value,
    onChange,
    placeholder = '0.00',
    min = 0,
    max,
    className,
    disabled = false,
    currency = 'TND',
}: PriceInputProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
            onChange(raw);
        }
    };

    const handleBlur = () => {
        if (value !== '' && value !== undefined) {
            const num = Number(value);
            if (!Number.isNaN(num)) {
                if (min !== undefined && num < min) {
                    onChange(String(min));
                } else if (max !== undefined && num > max) {
                    onChange(String(max));
                }
            }
        }
    };

    return (
        <div
            className={cn(
                'flex items-center rounded-lg border border-border bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
                disabled && 'opacity-50 cursor-not-allowed',
                className,
            )}
        >
            <span className="flex items-center border-r border-border bg-muted/50 px-3 py-2 text-sm font-medium text-muted-foreground">
                {currency}
            </span>
            <input
                type="text"
                inputMode="decimal"
                value={value}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={placeholder}
                disabled={disabled}
                className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
            />
        </div>
    );
}
