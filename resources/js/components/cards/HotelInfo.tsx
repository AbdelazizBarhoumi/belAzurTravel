import { Icon as IconifyIcon } from '@iconify/react';
import { motion } from 'framer-motion';
import {
    CheckCircle2,
    Info,
    LogIn,
    LogOut,
    Mail,
    MapPin,
    Phone,
    Sparkles,
    Tag,
    UtensilsCrossed,
    type Wifi,
} from 'lucide-react';
import type { ReactNode } from 'react';
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

// Shared scroll-reveal, matching the fade/slide used for the header and
// live-rate results on the hotel detail page.
const fadeInProps = {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: { duration: 0.4 },
} as const;

// Underlined serif heading, matching "Services & équipements",
// "Dates & Tarifs", etc. on the parent page.
function SectionHeading({ children }: { children: ReactNode }) {
    return (
        <h2 className="mb-4 inline-block border-b-2 border-secondary pb-1 font-serif text-2xl font-bold text-foreground">
            {children}
        </h2>
    );
}

// Icon + label/value tile, matching the amenity-card pattern from
// HotelDetail's "Services & équipements" grid.
function InfoTile({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof Wifi;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="truncate text-sm font-semibold text-foreground">
                    {value}
                </p>
            </div>
        </div>
    );
}

// Rounded pill used for options/facilities — consistent with the
// promo/recommended badges on the hotel header.
function InfoPill({
    icon: Icon,
    children,
    tone = 'card',
}: {
    icon: typeof Wifi;
    children: ReactNode;
    tone?: 'card' | 'muted';
}) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-foreground ${
                tone === 'card'
                    ? 'border border-border bg-card'
                    : 'bg-muted'
            }`}
        >
            <Icon className="h-3.5 w-3.5 text-primary" />
            {children}
        </span>
    );
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
    const hasPracticalInfo = hasTimes || hasContact || Boolean(note);

    const facilityGroups = (facilities ?? []).reduce<Record<string, string[]>>(
        (acc, facility) => {
            const key = facility.category?.trim() ?? '';
            if (!acc[key]) acc[key] = [];
            acc[key].push(facility.title);
            return acc;
        },
        {},
    );
    const facilityGroupEntries = Object.entries(facilityGroups);

    return (
        <div className="space-y-10">
            {/* Description */}
            {description && (
                <motion.div {...fadeInProps}>
                    <SectionHeading>
                        {t('hotelDetail.aboutHotel')}
                    </SectionHeading>
                    <p className="max-w-3xl whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                        {description}
                    </p>
                </motion.div>
            )}

            {/* Practical information */}
            {hasPracticalInfo && (
                <motion.div {...fadeInProps}>
                    <SectionHeading>
                        {t('hotelDetail.practicalInfo')}
                    </SectionHeading>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                        {checkIn && (
                            <InfoTile
                                icon={LogIn}
                                label={t('hotelDetail.checkIn')}
                                value={checkIn}
                            />
                        )}
                        {checkOut && (
                            <InfoTile
                                icon={LogOut}
                                label={t('hotelDetail.checkOut')}
                                value={checkOut}
                            />
                        )}
                        {address && (
                            <InfoTile
                                icon={MapPin}
                                label={t('hotelDetail.locationTitle')}
                                value={address}
                            />
                        )}
                        {phone && (
                            <InfoTile
                                icon={Phone}
                                label={t('hotelDetail.phone')}
                                value={phone}
                            />
                        )}
                        {email && (
                            <InfoTile
                                icon={Mail}
                                label={t('hotelDetail.email')}
                                value={email}
                            />
                        )}
                    </div>
                    {note && (
                        <div className="mt-3 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                            <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                                {note}
                            </p>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Meal plans */}
            {boardings && boardings.length > 0 && (
                <motion.div {...fadeInProps}>
                    <SectionHeading>
                        {t('hotelDetail.boardings')}
                    </SectionHeading>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {boardings.map((boarding) => (
                            <div
                                key={boarding.id}
                                className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4"
                            >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                    <UtensilsCrossed className="h-4 w-4 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm font-semibold text-foreground">
                                            {boarding.name || boarding.code}
                                        </p>
                                        {boarding.code && boarding.name && (
                                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                {boarding.code}
                                            </span>
                                        )}
                                    </div>
                                    {boarding.description && (
                                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                            {boarding.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Available options */}
            {options && options.length > 0 && (
                <motion.div {...fadeInProps}>
                    <SectionHeading>{t('hotelDetail.options')}</SectionHeading>
                    <div className="flex flex-wrap gap-2">
                        {options.map((option) => (
                            <InfoPill key={option.id} icon={CheckCircle2}>
                                {option.title}
                            </InfoPill>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Facilities */}
            {facilityGroupEntries.length > 0 && (
                <motion.div {...fadeInProps}>
                    <SectionHeading>
                        {t('hotelDetail.facilities')}
                    </SectionHeading>
                    <div className="space-y-4 rounded-3xl border border-border bg-card p-5">
                        {facilityGroupEntries.map(([category, titles]) => (
                            <div key={category || 'uncategorized'}>
                                {category && (
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        {category}
                                    </p>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    {titles.map((title, index) => (
                                        <InfoPill
                                            key={`${title}-${index}`}
                                            icon={Sparkles}
                                            tone="muted"
                                        >
                                            {title}
                                        </InfoPill>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Services & tags */}
            {amenityTags && amenityTags.length > 0 && (
                <motion.div {...fadeInProps}>
                    <SectionHeading>{t('hotelDetail.tags')}</SectionHeading>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {amenityTags.map((tag) => (
                            <div
                                key={tag.id}
                                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                            >
                                {tag.image ? (
                                    <img
                                        src={tag.image}
                                        alt=""
                                        loading="lazy"
                                        className="h-9 w-9 shrink-0 rounded-lg object-cover"
                                        onError={(event) => {
                                            event.currentTarget.style.display =
                                                'none';
                                        }}
                                    />
                                ) : (
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                        <Tag className="h-4 w-4 text-primary" />
                                    </div>
                                )}
                                <span className="text-sm font-medium text-foreground">
                                    {tag.title}
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Amenities (custom icon/svg feed) */}
            {amenities.length > 0 && (
                <motion.div {...fadeInProps}>
                    <SectionHeading>
                        {t('hotelDetail.amenities')}
                    </SectionHeading>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {amenities.map((amenity) => {
                            const Icon = amenity.icon;
                            return (
                                <div
                                    key={amenity.id}
                                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted"
                                >
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                        {amenity.iconifyName ? (
                                            <IconifyIcon
                                                icon={amenity.iconifyName}
                                                className="h-4 w-4 text-primary"
                                            />
                                        ) : amenity.customSvg ? (
                                            <span
                                                className="h-4 w-4 [&>svg]:h-4 [&>svg]:w-4"
                                                dangerouslySetInnerHTML={{
                                                    __html: amenity.customSvg,
                                                }}
                                            />
                                        ) : Icon ? (
                                            <Icon className="h-4 w-4 text-primary" />
                                        ) : null}
                                    </div>
                                    <span className="text-sm text-foreground">
                                        {amenity.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </div>
    );
}