import { Icon as IconifyIcon } from '@iconify/react';
import type { Wifi } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Amenity {
    id: string;
    name: string;
    icon: typeof Wifi | null;
    customSvg?: string | null;
    iconifyName?: string | null;
}

interface HotelInfoProps {
    description: string;
    category?: string;
    amenities: Amenity[];
    checkIn?: string;
    checkOut?: string;
    address?: string;
    phone?: string;
    email?: string;
    options?: Array<{ id: number; title: string }>;
    boardings?: Array<{
        id: number;
        code: string;
        name: string;
        description: string;
    }>;
    facilities?: Array<{ title: string; category: string }>;
    amenityTags?: Array<{ id: number; title: string; image: string }>;
    note?: string;
}

export function HotelInfo({
    description,
    category: _category,
    amenities,
    checkIn,
    checkOut,
    address,
    phone,
    email,
    options,
    boardings,
    facilities,
    amenityTags,
    note,
}: HotelInfoProps) {
    const { t } = useLanguage();

    const hasTimes = Boolean(checkIn || checkOut);
    const hasContact = Boolean(address || phone || email);

    return (
        <div className="mb-12 space-y-8">
            {/* Description */}
            {description && (
                <div>
                    <h2 className="mb-4 mt-8 font-serif text-2xl font-bold text-foreground">
                        {t('hotelDetail.aboutHotel')}
                    </h2>
                    <div className="whitespace-pre-line text-muted-foreground">
                        {description}
                    </div>
                </div>
            )}

            {/* Practical info: times + contact */}
            {(hasTimes || hasContact) && (
                <div>
                    <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">
                        {t('hotelDetail.practicalInfo')}
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {hasTimes && (
                            <div className="rounded-lg border border-border bg-card p-4">
                                <p className="mb-2 text-sm font-semibold text-foreground">
                                    {t('hotelDetail.checkInOut')}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {checkIn && `${t('hotelDetail.checkIn')}: ${checkIn}`}
                                    {checkIn && checkOut ? ' · ' : ''}
                                    {checkOut && `${t('hotelDetail.checkOut')}: ${checkOut}`}
                                </p>
                            </div>
                        )}
                        {hasContact && (
                            <div className="rounded-lg border border-border bg-card p-4">
                                <p className="mb-2 text-sm font-semibold text-foreground">
                                    {t('hotelDetail.contact')}
                                </p>
                                <div className="space-y-1 text-sm text-muted-foreground">
                                    {address && <p>{address}</p>}
                                    {phone && <p>{t('hotelDetail.phone')}: {phone}</p>}
                                    {email && <p>{t('hotelDetail.email')}: {email}</p>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Boarding options */}
            {boardings && boardings.length > 0 && (
                <div>
                    <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">
                        {t('hotelDetail.boardings')}
                    </h2>
                    <div className="flex flex-wrap gap-3">
                        {boardings.map((boarding) => (
                            <div
                                key={boarding.id}
                                className="rounded-lg border border-border bg-card p-4"
                            >
                                <p className="text-sm font-semibold text-foreground">
                                    {boarding.name || boarding.code}
                                </p>
                                {boarding.description && (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {boarding.description}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Special request options */}
            {options && options.length > 0 && (
                <div>
                    <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">
                        {t('hotelDetail.options')}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {options.map((option) => (
                            <span
                                key={option.id}
                                className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground"
                            >
                                {option.title}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Facilities */}
            {facilities && facilities.length > 0 && (
                <div>
                    <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">
                        {t('hotelDetail.facilities')}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {facilities.map((facility, index) => (
                            <span
                                key={`${facility.title}-${index}`}
                                className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground"
                                title={facility.category || undefined}
                            >
                                {facility.title}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Provider amenity tags */}
            {amenityTags && amenityTags.length > 0 && (
                <div>
                    <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">
                        {t('hotelDetail.tags')}
                    </h2>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                        {amenityTags.map((tag) => (
                            <div
                                key={tag.id}
                                className="flex items-center gap-3 rounded-lg border border-border bg-card p-4"
                            >
                                {tag.image ? (
                                    <img
                                        src={tag.image}
                                        alt=""
                                        loading="lazy"
                                        className="h-9 w-9 flex-shrink-0 rounded-lg object-cover"
                                        onError={(event) => {
                                            event.currentTarget.style.display =
                                                'none';
                                        }}
                                    />
                                ) : (
                                    <div className="h-9 w-9 flex-shrink-0 rounded-lg bg-primary/10" />
                                )}
                                <span className="text-sm font-medium">
                                    {tag.title}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
                <div>
                    <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">
                        {t('hotelDetail.amenities')}
                    </h2>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                        {amenities.map((amenity) => {
                            const Icon = amenity.icon;
                            return (
                                <div
                                    key={amenity.id}
                                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted"
                                >
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                        {amenity.iconifyName ? (
                                            <IconifyIcon
                                                icon={amenity.iconifyName}
                                                className="h-5 w-5 flex-shrink-0 text-primary"
                                            />
                                        ) : amenity.customSvg ? (
                                            <span
                                                className="h-5 w-5 flex-shrink-0 [&>svg]:h-5 [&>svg]:w-5"
                                                dangerouslySetInnerHTML={{
                                                    __html: amenity.customSvg,
                                                }}
                                            />
                                        ) : Icon ? (
                                            <Icon className="h-5 w-5 flex-shrink-0 text-primary" />
                                        ) : null}
                                    </div>
                                    <span className="text-sm font-medium">
                                        {amenity.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Note */}
            {note && (
                <div className="rounded-2xl border border-border bg-muted/40 p-4">
                    <p className="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                        {note}
                    </p>
                </div>
            )}
        </div>
    );
}
