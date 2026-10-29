import { cn } from '@/lib/utils';

/** Languages the site publishes content in (Arabic is kept in the data only). */
export const CONTENT_LANGS = ['fr', 'en'] as const;
export type ContentLang = (typeof CONTENT_LANGS)[number];

interface ContentLangSwitchProps {
    value: ContentLang;
    onChange: (lang: ContentLang) => void;
    /** Languages that already have content get a filled dot. */
    filled?: Partial<Record<ContentLang, boolean>>;
    className?: string;
}

export function ContentLangSwitch({
    value,
    onChange,
    filled,
    className,
}: ContentLangSwitchProps) {
    return (
        <div
            role="tablist"
            className={cn(
                'inline-flex rounded-md border bg-muted/40 p-0.5',
                className,
            )}
        >
            {CONTENT_LANGS.map((lang) => (
                <button
                    key={lang}
                    type="button"
                    role="tab"
                    aria-selected={value === lang}
                    onClick={() => onChange(lang)}
                    className={cn(
                        'flex items-center gap-1.5 rounded px-3 py-1 text-xs font-semibold uppercase transition-colors',
                        value === lang
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    {lang}
                    <span
                        className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            filled?.[lang]
                                ? 'bg-emerald-500'
                                : 'bg-muted-foreground/30',
                        )}
                    />
                </button>
            ))}
        </div>
    );
}
