import 'flag-icons/css/flag-icons.min.css';
import { cn } from '@/lib/utils';

interface FlagProps {
    /** ISO-3166 alpha-2 country code, any case. */
    code?: string | null;
    className?: string;
    /** Accessible label; omitted flags are treated as decorative. */
    title?: string;
}

/**
 * Country flag as an SVG image. Emoji flags render as two letters on
 * Windows, so the site uses real images everywhere.
 */
export function Flag({ code, className, title }: FlagProps) {
    const iso = (code ?? '').trim().toLowerCase();

    if (!/^[a-z]{2}$/.test(iso)) {
        return (
            <span
                aria-hidden
                className={cn(
                    'inline-block h-[0.75em] w-[1em] rounded-[2px] bg-muted',
                    className,
                )}
            />
        );
    }

    return (
        <span
            role={title ? 'img' : undefined}
            aria-label={title}
            aria-hidden={title ? undefined : true}
            title={title}
            className={cn(
                `fi fi-${iso} shrink-0 rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.08)]`,
                className,
            )}
        />
    );
}
