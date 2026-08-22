import { motion } from 'framer-motion';
import { Bed, Users, Wifi, Wind, Bath, Tv } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface RoomSupplement {
    name: string;
    price: number;
    perNight?: boolean;
}

interface Room {
    id: string;
    name: string;
    description: string;
    pricePerNight: number;
    // Live OS-TRAVEL rooms carry a TOTAL-stay price plus the derived per-night
    // figure; static admin rooms only have an admin-defined per-night price.
    priceTotal?: number;
    nights?: number;
    capacity: number;
    size: number;
    features: string[];
    images: string[];
    // Mandatory supplements quoted by the provider for this room offer.
    supplements?: RoomSupplement[];
    // Provider bookability metadata powering the room badges.
    minStay?: number;
    onRequest?: boolean;
    stopSales?: { from: string; to: string } | null;
    notRefundable?: boolean;
    cancellationDeadline?: string;
}

interface RoomsListProps {
    rooms: Room[];
    onBookRoom: (roomId: string) => void;
    bookDisabled?: boolean;
    currency?: string;
}

const FEATURE_ICONS: Record<string, typeof Wifi> = {
    wifi: Wifi,
    ac: Wind,
    bathroom: Bath,
    tv: Tv,
};

export function RoomsList({
    rooms,
    onBookRoom,
    bookDisabled = false,
    currency = 'TND',
}: RoomsListProps) {
    const { t, lang } = useLanguage();

    const formatBadgeDate = (value: string) => {
        const date = new Date(`${value}T00:00:00`);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleDateString(
            lang === 'fr' ? 'fr-FR' : lang === 'ar' ? 'ar-TN' : 'en-GB',
        );
    };

    return (
        <>
            {rooms.length > 0 && (
                <div className="mb-12">
                    <h2 className="mb-6 font-serif text-3xl font-bold text-foreground">
                        {t('hotelDetail.availableRooms')}
                    </h2>

                    <div className="space-y-6">
                        {rooms.map((room, index) => (
                            <motion.div
                                // Ensure a stable, unique key even if room.id is missing or not unique
                                key={room.id ?? `room-${index}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="overflow-hidden rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-lg"
                            >
                                <div className="grid gap-6 lg:grid-cols-4">
                                    {/* Image */}
                                    <div className="lg:col-span-1">
                                        {room.images[0] ? (
                                            <img
                                                src={room.images[0]}
                                                alt={room.name}
                                                className="h-40 w-full rounded-lg object-cover"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="flex h-40 w-full items-center justify-center rounded-lg bg-muted">
                                                <Bed className="h-10 w-10 text-muted-foreground/60" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="lg:col-span-2">
                                        <h3 className="mb-2 font-serif text-xl font-bold text-foreground">
                                            {room.name}
                                        </h3>

                                        <div className="mb-3 flex flex-wrap gap-2">
                                            {room.onRequest && (
                                                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800">
                                                    {t('hotelDetail.onRequest')}
                                                </span>
                                            )}
                                            {room.minStay &&
                                                room.minStay > 1 && (
                                                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                                                        {t(
                                                            'hotelDetail.minimumNights',
                                                        )}{' '}
                                                        {room.minStay}
                                                    </span>
                                                )}
                                            {room.stopSales && (
                                                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-semibold text-red-700">
                                                    {t('hotelDetail.stopSale')}{' '}
                                                    {formatBadgeDate(
                                                        room.stopSales.from,
                                                    )}
                                                    {' – '}
                                                    {formatBadgeDate(
                                                        room.stopSales.to,
                                                    )}
                                                </span>
                                            )}
                                            {room.notRefundable && (
                                                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-semibold text-red-700">
                                                    {t(
                                                        'hotelDetail.nonRefundable',
                                                    )}
                                                </span>
                                            )}
                                            {room.cancellationDeadline && (
                                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                                                    {t(
                                                        'hotelDetail.freeCancellationUntil',
                                                    )}{' '}
                                                    {formatBadgeDate(
                                                        room.cancellationDeadline,
                                                    )}
                                                </span>
                                            )}
                                        </div>

                                        <p className="mb-4 text-sm text-muted-foreground">
                                            {room.description}
                                        </p>

                                        <div className="mb-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4" />
                                                {room.capacity}{' '}
                                                {t('hotelDetail.guests')}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                •
                                            </div>
                                            <div>{room.size} m²</div>
                                        </div>

                                        {/* Features */}
                                        <div className="flex flex-wrap gap-2">
                                            {room.features.map((feature) => {
                                                const Icon =
                                                    FEATURE_ICONS[
                                                        feature as keyof typeof FEATURE_ICONS
                                                    ];
                                                if (!Icon) return null;

                                                // Use combined key with room id to guarantee uniqueness across the page
                                                return (
                                                    <div
                                                        key={`${room.id ?? index}-${feature}`}
                                                        className="flex items-center gap-2 rounded-lg bg-muted px-2 py-1"
                                                    >
                                                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span className="text-xs text-muted-foreground">
                                                            {feature}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Price & CTA */}
                                    <div className="flex flex-col items-end justify-between lg:col-span-1">
                                        <div className="text-right">
                                            <div className="text-sm text-muted-foreground">
                                                {room.priceTotal !== undefined
                                                    ? t(
                                                          'hotelDetail.totalForStay',
                                                      )
                                                    : t(
                                                          'hotelDetail.pricePerNight',
                                                      )}
                                            </div>
                                            <div className="mb-4 font-serif text-3xl font-bold text-secondary">
                                                {room.priceTotal?.toLocaleString() ??
                                                    room.pricePerNight.toLocaleString()}{' '}
                                                {currency}
                                            </div>
                                            {room.priceTotal !== undefined &&
                                            room.nights ? (
                                                <div className="mb-4 text-xs text-muted-foreground">
                                                    ~
                                                    {room.pricePerNight.toLocaleString()}{' '}
                                                    {currency}{' '}
                                                    {t('hotelDetail.pernight')}{' '}
                                                    · {room.nights}{' '}
                                                    {t(
                                                        'hotelDetail.nightsLabel',
                                                    )}
                                                </div>
                                            ) : null}
                                            {room.supplements &&
                                            room.supplements.length > 0 ? (
                                                <div className="mb-4 space-y-1 border-t border-border pt-3">
                                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                        {t(
                                                            'hotelDetail.mandatorySupplements',
                                                        )}
                                                    </p>
                                                    {room.supplements.map(
                                                        (supplement, i) => (
                                                            <div
                                                                key={`${room.id}-supplement-${i}`}
                                                                className="flex items-center justify-between gap-2 text-xs text-muted-foreground"
                                                            >
                                                                <span>
                                                                    {
                                                                        supplement.name
                                                                    }
                                                                </span>
                                                                <span className="font-semibold text-foreground">
                                                                    +
                                                                    {supplement.price.toLocaleString()}{' '}
                                                                    {currency}
                                                                    {supplement.perNight
                                                                        ? ` ${t('hotelDetail.pernight')}`
                                                                        : ''}
                                                                </span>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            ) : null}
                                        </div>

                                        <Button
                                            onClick={() => onBookRoom(room.id)}
                                            className="w-full"
                                            disabled={bookDisabled}
                                        >
                                            {t('hotelDetail.selectRoom')}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
