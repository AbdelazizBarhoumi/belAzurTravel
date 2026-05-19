import type { Lang } from '@/i18n/translations';

interface LangBadgeProps {
    lang: Lang;
}

export function LangBadge({ lang }: LangBadgeProps) {
    return (
        <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {lang}
        </span>
    );
}

export default LangBadge;
