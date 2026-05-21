import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';

interface Props {
    html: string;
    className?: string;
}

export function RichTextRenderer({ html, className }: Props) {
    const clean = DOMPurify.sanitize(html || '', {
        USE_PROFILES: { html: true },
    });

    return (
        <div
            className={cn(
                'prose prose-slate max-w-none dark:prose-invert',
                className,
            )}
            dangerouslySetInnerHTML={{ __html: clean }}
        />
    );
}
