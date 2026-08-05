import type { LucideIcon } from 'lucide-react';
import { MapPin, MessageCircle, Phone, Star, Clock, Users } from 'lucide-react';
import { useState } from 'react';
import { notifyInteraction } from '@/api/interactions.api';
import { BookingDialog } from '@/components/forms/BookingDialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

type DetailItem = {
    label: string;
    value: string | number;
    icon?: LucideIcon;
};

interface StickyBookingCardProps {
    // Price model
    price?: number;
    minPrice?: number;
    currency?: string;
    priceLabel?: string;
    priceSuffix?: string;

    // Header/content
    badge?: string;
    title?: string;
    location?: string | string[];
    description?: string;

    // Entity info for Booking
    entityType?: 'destination' | 'hotel' | 'tour' | 'flight' | 'car' | 'travel';
    itemSlug?: string;
    itemId?: string;

    // Ratings/meta
    rating?: number;
    reviews?: number;
    ratingMeta?: string;
    details?: DetailItem[];
    detailsLayout?: 'rows' | 'grid3';

    // Backward compatible props
    duration?: string;
    maxGroup?: number;
    type?: string;

    // Actions
    primaryButtonLabel?: string;
    secondaryButtonLabel?: string;
    tertiaryButtonLabel?: string;
    phoneNumber?: string;
    onBook?: () => void;
    onWhatsApp?: () => void;
}

export function StickyBookingCard({
    price,
    minPrice,
    currency = 'TND',
    priceLabel,
    priceSuffix,
    badge,
    title,
    location,
    description,
    entityType,
    itemSlug,
    itemId,
    details,
    detailsLayout = 'rows',
    duration,
    maxGroup,
    type,
    rating,
    ratingMeta,
    primaryButtonLabel,
    secondaryButtonLabel,
    tertiaryButtonLabel,
    phoneNumber,
    onBook,
    onWhatsApp,
}: StickyBookingCardProps) {
    const { t } = useLanguage();
    const [bookingOpen, setBookingOpen] = useState(false);

    const handleCall = () => {
        notifyInteraction('call');
        if (phoneNumber) {
            window.open(`tel:${phoneNumber}`);
            return;
        }

        window.open('/contact', '_self');
    };

    const handleWhatsApp = () => {
        notifyInteraction('whatsapp');
        if (onWhatsApp) {
            onWhatsApp();
            return;
        }

        const messageParts = [title, displayLocation, description].filter(
            Boolean,
        );
        if (messageParts.length > 0) {
            const message = encodeURIComponent(messageParts.join(' - '));
            window.open(`https://wa.me/?text=${message}`, '_blank');
            return;
        }

        window.open('/contact', '_self');
    };

    const handleBookClick = () => {
        if (onBook) {
            onBook();
            return;
        }

        // If this card has an entity type we can open the booking dialog,
        // otherwise fallback to the contact page so users can still book.
        if (entityType) {
            setBookingOpen(true);
            return;
        }

        window.open('/contact', '_self');
    };

    const displayPrice = price ?? minPrice ?? 0;
    const displayLocation = Array.isArray(location)
        ? location.join(', ')
        : location;
    const computedDetails: DetailItem[] = details ?? [
        ...(duration
            ? [
                  {
                      label: t('label.duration'),
                      value: duration,
                      icon: Clock,
                  },
              ]
            : []),
        ...(maxGroup !== undefined
            ? [
                  {
                      label: t('label.maxGroup'),
                      value: `${maxGroup} ${t('common.travelers')}`,
                      icon: Users,
                  },
              ]
            : []),
    ];
    // Provide localized default labels so buttons always display
    const displayPriceLabel = priceLabel;
    const displayPrimaryButtonLabel =
        primaryButtonLabel ?? t('actions.book_now');
    const displaySecondaryButtonLabel =
        secondaryButtonLabel ?? t('actions.whatsapp');
    const displayTertiaryButtonLabel = tertiaryButtonLabel ?? t('actions.call');

    return (
        <div className="card-elevated sticky top-24 h-fit self-start rounded-3xl border border-border bg-card p-6">
            {badge && (
                <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
                    {badge}
                </span>
            )}

            {(title || displayLocation) && (
                <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                        {displayLocation && (
                            <p className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" /> {displayLocation}
                            </p>
                        )}
                        {title && (
                            <h1 className="font-serif text-3xl font-bold text-foreground">
                                {title}
                            </h1>
                        )}
                    </div>
                </div>
            )}

            {rating !== undefined && (
                <div className="mb-4 flex items-center gap-2">
                    <Star className="h-4 w-4 fill-current text-secondary" />
                    <span className="font-bold text-foreground">{rating}</span>

                    {ratingMeta && (
                        <span className="text-sm text-muted-foreground">
                            · {ratingMeta}
                        </span>
                    )}
                </div>
            )}

            {description && (
                <p className="mb-6 text-sm text-muted-foreground">
                    {description}
                </p>
            )}

            {computedDetails.length > 0 && (
                <div className="space-y-3 border-y border-border py-6 text-sm">
                    {detailsLayout === 'grid3' ? (
                        <div className="grid grid-cols-3 gap-3">
                            {computedDetails.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <div
                                        key={`${item.label}-${item.value}`}
                                        className="text-center"
                                    >
                                        {Icon && (
                                            <Icon className="mx-auto mb-1 h-5 w-5 text-primary" />
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            {item.label}
                                        </p>
                                        <p className="text-xs font-bold text-foreground">
                                            {item.value}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {computedDetails.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <div
                                        key={`${item.label}-${item.value}`}
                                        className="flex justify-between gap-4"
                                    >
                                        <span className="flex items-center gap-2 text-muted-foreground">
                                            {Icon && (
                                                <Icon className="h-4 w-4 text-primary" />
                                            )}
                                            {item.label}
                                        </span>
                                        <span className="text-right font-medium text-foreground">
                                            {item.value}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            <div className="mb-5">
                {displayPriceLabel && (
                    <p className="mb-1 mt-4 text-xs text-muted-foreground">
                        {displayPriceLabel}
                    </p>
                )}

                <div className="flex items-baseline gap-1">
                    <span className="font-serif text-4xl font-bold leading-none text-secondary">
                        {displayPrice.toLocaleString()} {currency}
                    </span>
                    {priceSuffix && (
                        <span className="text-sm text-muted-foreground">
                            {priceSuffix}
                        </span>
                    )}
                </div>

                {type && (
                    <span className="mt-3 inline-block rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                        {type}
                    </span>
                )}
            </div>

            <div className="space-y-3">
                <Button onClick={handleBookClick} size="lg" className="w-full">
                    {displayPrimaryButtonLabel}
                </Button>

                <div className="flex gap-3">
                    <Button
                        onClick={handleWhatsApp}
                        variant="outline"
                        size="lg"
                        className="flex-1 gap-2"
                    >
                        <MessageCircle className="h-4 w-4" />
                        {displaySecondaryButtonLabel}
                    </Button>

                    <Button
                        onClick={handleCall}
                        variant="outline"
                        size="lg"
                        className="flex-1 gap-2"
                    >
                        <Phone className="h-4 w-4" />
                        {displayTertiaryButtonLabel}
                    </Button>
                </div>
            </div>

            {entityType && (
                <BookingDialog
                    open={bookingOpen}
                    onOpenChange={setBookingOpen}
                    type={entityType}
                    itemSlug={itemSlug}
                    itemId={itemId}
                    itemName={title || ''}
                    amount={displayPrice}
                />
            )}
        </div>
    );
}
