import { Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface ListFilterBarProps {
    searchValue: string;
    onSearchChange: (value: string) => void;
    resultCount: number;
    hasActiveFilters?: boolean;
    onClearFilters?: () => void;
    searchPlaceholder?: string;
    className?: string;
    children?: ReactNode;
    inline?: boolean;
}

export function ListFilterBar({
    searchValue,
    onSearchChange,
    resultCount,
    hasActiveFilters = false,
    onClearFilters,
    searchPlaceholder,
    className,
    children,
    inline = false,
}: ListFilterBarProps) {
    const { t, dir } = useLanguage();
    const isRtl = dir === 'rtl';

    return (
        <section
            className={cn(
                'mb-8 rounded-3xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur-sm md:p-5',
                className,
            )}
        >
            {inline ? (
                <div
                    className={cn(
                        'flex flex-col gap-2 sm:gap-3 lg:items-center lg:flex-row',
                        isRtl && 'lg:flex-row-reverse',
                    )}
                >
                    <div className="relative flex-1">
                        <Search
                            className={cn(
                                'pointer-events-none absolute top-1/2 h-3 w-3 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground',
                                isRtl ? 'right-3 sm:right-4' : 'left-3 sm:left-4',
                            )}
                        />
                        <Input
                            value={searchValue}
                            onChange={(event) => onSearchChange(event.target.value)}
                            placeholder={searchPlaceholder ?? t('common.search')}
                            aria-label={searchPlaceholder ?? t('common.search')}
                            type="search"
                            className={cn(
                                'h-10 sm:h-12 rounded-xl sm:rounded-2xl border-border/70 bg-background/90 shadow-sm text-xs sm:text-sm',
                                isRtl ? 'pr-9 sm:pr-11 text-right' : 'pl-9 sm:pl-11',
                            )}
                        />
                    </div>
                    {children}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                            {resultCount} {t('common.results')}
                        </span>
                        {hasActiveFilters && onClearFilters ? (
                            <Button
                                type="button"
                                variant="outline"
                                className="h-10 sm:h-12 rounded-xl sm:rounded-2xl px-3 sm:px-4 text-xs sm:text-sm"
                                onClick={onClearFilters}
                            >
                                {t('common.clearFilters')}
                            </Button>
                        ) : null}
                    </div>
                </div>
            ) : (
                <>
                    <div
                        className={cn(
                            'flex flex-col gap-4 lg:items-center lg:justify-between',
                            isRtl ? 'lg:flex-row-reverse' : 'lg:flex-row',
                        )}
                    >
                        <div className="relative w-full lg:max-w-xl">
                            <Search
                                className={cn(
                                    'pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground',
                                    isRtl ? 'right-4' : 'left-4',
                                )}
                            />
                            <Input
                                value={searchValue}
                                onChange={(event) => onSearchChange(event.target.value)}
                                placeholder={searchPlaceholder ?? t('common.search')}
                                aria-label={searchPlaceholder ?? t('common.search')}
                                type="search"
                                className={cn(
                                    'h-12 rounded-2xl border-border/70 bg-background/90 shadow-sm',
                                    isRtl ? 'pr-11 text-right' : 'pl-11',
                                )}
                            />
                        </div>

                        <div
                            className={cn(
                                'flex flex-wrap items-center gap-3',
                                isRtl && 'justify-end text-right',
                            )}
                        >
                            <span className="text-sm text-muted-foreground">
                                {resultCount} {t('common.results')}
                            </span>
                            {hasActiveFilters && onClearFilters ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-12 rounded-2xl px-4"
                                    onClick={onClearFilters}
                                >
                                    {t('common.clearFilters')}
                                </Button>
                            ) : null}
                        </div>
                    </div>

                    {children ? (
                        <div className="mt-4 grid gap-3">{children}</div>
                    ) : null}
                </>
            )}
        </section>
    );
}
