import { MessageCircle, Phone, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';
import { cn } from '@/lib/utils';

interface RequestThingEmptyStateProps {
    variant?: 'empty' | 'no-results';
    className?: string;
}

export function RequestThingEmptyState({
    variant = 'no-results',
    className,
}: RequestThingEmptyStateProps) {
    const { t } = useLanguage();
    const { settings } = useSiteSettingsContext();

    const content =
        variant === 'empty'
            ? {
                  eyebrow: t('common.requestThingEyebrow'),
                  title: t('common.noItemsYet'),
                  description: t('common.noItemsYetDescription'),
              }
            : {
                  eyebrow: t('common.requestThingEyebrow'),
                  title: t('common.noResults'),
                  description: t('common.requestThingDescription'),
              };

    return (
        <div
            className={cn(
                'rounded-3xl border border-dashed border-border bg-card/80 p-10 text-center shadow-sm backdrop-blur-sm sm:p-12',
                className,
            )}
        >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <SearchX className="h-7 w-7" />
            </div>

            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.28em] text-secondary">
                {content.eyebrow}
            </p>

            <h3 className="mt-3 font-serif text-2xl font-bold text-foreground">
                {content.title}
            </h3>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                {content.description}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-3">
                {settings.whatsapp && (
                    <Button
                        asChild
                        variant="default"
                        className="rounded-full px-6"
                    >
                        <a
                            href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            {t('common.contactViaWhatsApp')}
                        </a>
                    </Button>
                )}

                {settings.phone && (
                    <Button
                        asChild
                        variant="outline"
                        className="rounded-full px-6"
                    >
                        <a href={`tel:${settings.phone}`}>
                            <Phone className="mr-2 h-4 w-4" />
                            {t('common.contactViaPhone')}
                        </a>
                    </Button>
                )}
            </div>
        </div>
    );
}
