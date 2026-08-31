import { LayoutGrid, List } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ViewMode } from '@/hooks/useViewMode';
import { cn } from '@/lib/utils';

interface ViewToggleProps {
    value: ViewMode;
    onChange: (mode: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
    const { t, dir } = useLanguage();
    const isRtl = dir === 'rtl';

    return (
        <div
            className={cn(
                'flex gap-1 rounded-lg border border-border p-1',
                isRtl && 'flex-row-reverse',
            )}
        >
            <button
                onClick={() => onChange('grid')}
                className={cn(
                    'rounded p-1.5 transition-colors',
                    value === 'grid'
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:bg-muted/50',
                )}
                aria-label={t('common.gridView')}
            >
                <LayoutGrid className="h-4 w-4" />
            </button>
            <button
                onClick={() => onChange('list')}
                className={cn(
                    'rounded p-1.5 transition-colors',
                    value === 'list'
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:bg-muted/50',
                )}
                aria-label={t('common.listView')}
            >
                <List className="h-4 w-4" />
            </button>
        </div>
    );
}
