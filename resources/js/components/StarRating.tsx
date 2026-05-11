import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
    rating: number;
    maxRating?: number;
    size?: 'sm' | 'md' | 'lg';
    interactive?: boolean;
    onRatingChange?: (rating: number) => void;
    className?: string;
}

export function StarRating({
    rating,
    maxRating = 5,
    size = 'md',
    interactive = false,
    onRatingChange,
    className,
}: StarRatingProps) {
    const sizeMap = {
        sm: 'h-3.5 w-3.5',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
    };

    const stars = Array.from({ length: maxRating }, (_, i) => i + 1);

    return (
        <div
            className={cn('flex items-center gap-1', className)}
            role="group"
            aria-label={`${rating} out of ${maxRating} stars`}
        >
            {stars.map((star) => (
                <button
                    key={star}
                    onClick={() => {
                        if (interactive && onRatingChange) {
                            onRatingChange(star);
                        }
                    }}
                    disabled={!interactive}
                    className={cn(
                        'transition-all',
                        interactive &&
                            'cursor-pointer hover:scale-110'
                    )}
                    aria-label={`Rate ${star} stars`}
                >
                    <Star
                        className={cn(
                            sizeMap[size],
                            'text-secondary',
                            star <= rating
                                ? 'fill-current'
                                : 'text-muted'
                        )}
                    />
                </button>
            ))}
        </div>
    );
}
