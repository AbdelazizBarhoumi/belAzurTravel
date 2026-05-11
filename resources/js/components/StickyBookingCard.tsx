import { MessageCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface StickyBookingCardProps {
    // Support both hotels (minPrice) and tours (price per person)
    price?: number; // per person
    minPrice?: number; // fallback for hotels
    currency?: string;
    duration?: string;
    type?: string;
    rating?: number;
    reviews?: number;
    phoneNumber?: string;
    onBook: () => void;
    onWhatsApp?: () => void;
}

export function StickyBookingCard({
    price,
    minPrice,
    currency = '$',
    duration,
    type,
    rating,
    reviews,
    phoneNumber,
    onBook,
    onWhatsApp,
}: StickyBookingCardProps) {
    const { t } = useLanguage();

    const handleCall = () => {
        if (phoneNumber) window.open(`tel:${phoneNumber}`);
    };

    const handleWhatsApp = () => {
        onWhatsApp?.();
    };

    const displayPrice = price ?? minPrice ?? 0;

    return (
        <div className="sticky top-24 self-start rounded-2xl border border-border bg-card p-6 shadow-lg">
            {/* Price Section */}
            <div className="mb-6 border-b border-border pb-6">
                <div className="mb-2 text-sm text-muted-foreground">
                    {t('hotelDetail.startingFrom')}
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="font-serif text-4xl font-bold text-secondary">
                        {currency}{displayPrice.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">
                        {t('tours.person')}
                    </span>
                </div>

                {duration && (
                    <div className="mt-3 text-sm text-muted-foreground">
                        {duration}
                    </div>
                )}
                {type && (
                    <div className="mt-1 inline-block rounded-full bg-muted px-2 py-1 text-xs font-medium">{type}</div>
                )}
            </div>

            {/* Rating */}
            {rating !== undefined && (
                <div className="mb-6 border-b border-border pb-6">
                    <div className="text-sm font-bold text-secondary">{rating}</div>
                    {reviews !== undefined && (
                        <div className="text-xs text-muted-foreground">{reviews} {t('hotels.reviews')}</div>
                    )}
                </div>
            )}

            {/* CTA Buttons */}
            <div className="space-y-3">
                <Button onClick={onBook} size="lg" className="w-full">
                    {t('hotelDetail.reserveNow')}
                </Button>

                <Button onClick={handleWhatsApp} variant="outline" size="lg" className="w-full gap-2">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                </Button>

                <Button onClick={handleCall} variant="ghost" size="lg" className="w-full gap-2">
                    <Phone className="h-4 w-4" />
                    {t('hotelDetail.call')}
                </Button>
            </div>

            {/* Info Note */}
            <div className="mt-6 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                {t('hotelDetail.bookingNote')}
            </div>
        </div>
    );
}