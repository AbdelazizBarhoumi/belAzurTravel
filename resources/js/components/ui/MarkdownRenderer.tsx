import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface Props {
    content: string;
    className?: string;
}

export function MarkdownRenderer({ content, className }: Props) {
    return (
        <div
            className={cn(
                'prose prose-slate max-w-none dark:prose-invert',
                className,
            )}
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
            >
                {content || ''}
            </ReactMarkdown>
        </div>
    );
}
