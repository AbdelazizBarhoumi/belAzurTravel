import { Icon as IconifyIcon } from "@iconify/react";
import { motion } from "framer-motion";
import {
    CheckCircle2,
    LogIn,
    LogOut,
    MapPin,
    Sparkles,
    Tag,
    UtensilsCrossed,
    type Wifi,
} from "lucide-react";
import { useMemo } from "react";
import type { ReactNode } from "react";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface Amenity {
    id: string;
    name: string;
    icon: typeof Wifi | null;
    customSvg?: string | null;
    iconifyName?: string | null;
}

interface HotelInfoProps {
    amenities: Amenity[];
    checkIn?: string;
    checkOut?: string;
    address?: string;
    options?: Array<{
        id: number;
        title: string;
    }>;
    boardings?: Array<{
        id: number;
        code: string;
        name: string;
        description: string | null;
    }>;
    facilities?: Array<{
        title: string;
        category: string;
    }>;
    amenityTags?: Array<{
        id: number;
        title: string;
        image: string;
    }>;
}

const fadeInProps = {
    initial: { opacity: 0, y: 12 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
    transition: { duration: 0.35 },
} as const;

function AmenityGlyph({ amenity }: { amenity: Amenity }) {
    const Icon = amenity.icon;

    if (amenity.iconifyName) {
        return (
            <IconifyIcon
                icon={amenity.iconifyName}
                className="h-4 w-4 text-primary"
            />
        );
    }

    if (amenity.customSvg) {
        return (
            <span
                className="h-4 w-4 text-primary [&>svg]:h-4 [&>svg]:w-4"
                dangerouslySetInnerHTML={{ __html: amenity.customSvg }}
            />
        );
    }

    if (Icon) {
        return <Icon className="h-4 w-4 text-primary" />;
    }

    return <Sparkles className="h-4 w-4 text-primary" />;
}

function Tile({
    icon: Icon,
    label,
    value,
    href,
    dir,
    valueDir,
}: {
    icon: typeof Wifi;
    label: string;
    value: ReactNode;
    href?: string;
    dir: "ltr" | "rtl";
    valueDir?: "ltr" | "rtl";
}) {
    const content = (
        <>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
            </div>

            <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {label}
                </p>

                <div
                    dir={valueDir ?? dir}
                    className="text-sm font-semibold leading-snug text-foreground"
                >
                    {value}
                </div>
            </div>
        </>
    );

    const className =
        "flex items-start gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40";

    return href ? (
        <a href={href} dir={dir} className={className}>
            {content}
        </a>
    ) : (
        <div dir={dir} className={className}>
            {content}
        </div>
    );
}

function Pill({
    icon: Icon,
    children,
    dir,
}: {
    icon: typeof Wifi;
    children: ReactNode;
    dir: "ltr" | "rtl";
}) {
    return (
        <span
            dir={dir}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground"
        >
            <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
            {children}
        </span>
    );
}

function SectionTitle({
    children,
    hint,
    dir,
}: {
    children: ReactNode;
    hint?: string;
    dir: "ltr" | "rtl";
}) {
    return (
        <div
            dir={dir}
            className="mb-4 flex items-baseline justify-between gap-4"
        >
            <h3 className="inline-block border-b-2 border-secondary pb-1 font-serif text-xl font-bold text-foreground">
                {children}
            </h3>

            {hint && (
                <span className="shrink-0 text-xs text-muted-foreground">
                    {hint}
                </span>
            )}
        </div>
    );
}

export function HotelInfo({
    amenities,
    checkIn,
    checkOut,
    address,
    options,
    boardings,
    facilities,
    amenityTags,
}: HotelInfoProps) {
    const { t, dir } = useLanguage();

    const facilityGroups = useMemo(() => {
        const acc: Record<string, string[]> = {};

        for (const f of facilities ?? []) {
            const key = f.category?.trim() || t("hotelInfo.general");
            (acc[key] ??= []).push(f.title);
        }

        return Object.entries(acc);
    }, [facilities, t]);

    const hasEquipment =
        amenities.length > 0 ||
        facilityGroups.length > 0 ||
        (amenityTags?.length ?? 0) > 0;

    const hasDining =
        (boardings?.length ?? 0) > 0 ||
        (options?.length ?? 0) > 0;

    const tabs = [
        {
            value: "equipment",
            label: t("hotelInfo.tabEquipment"),
            show: hasEquipment,
        },
        {
            value: "dining",
            label: t("hotelInfo.tabDining"),
            show: hasDining,
        },
        {
            value: "practical",
            label: t("hotelInfo.tabPractical"),
            show: Boolean(
                checkIn ||
                    checkOut ||
                    address
            ),
        },
    ].filter((tab) => tab.show);

    if (!tabs.length) {
        return null;
    }

    return (
        <motion.section
            {...fadeInProps}
            dir={dir}
            className="rounded-[28px] border border-border bg-card/50 p-5 md:p-7"
        >
<Tabs dir={dir}>
    <TabsList
        dir={dir}
        className={cn(
            "flex h-auto w-full flex-wrap justify-start gap-1 rounded-2xl bg-muted/60 p-1",
        )}
    >
        {tabs.map((tab) => (
            <TabsTrigger
                key={tab.value}
                value={tab.value}
                dir={dir}
                className="rounded-xl px-4 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow"
            >
                {tab.label}
            </TabsTrigger>
        ))}
    </TabsList>

                {/* ─────────────────────────────────────────────
                    EQUIPMENT
                ────────────────────────────────────────────── */}
                <TabsContent
                    value="equipment"
                    dir={dir}
                    className="mt-0 space-y-8 focus-visible:outline-none"
                >
                    {amenityTags && amenityTags.length > 0 && (
                        <div dir={dir}>
                            <SectionTitle
                                hint={`${amenityTags.length}`}
                                dir={dir}
                            >
                                {t("hotelInfo.highlights")}
                            </SectionTitle>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                {amenityTags.map((tag) => (
                                    <div
                                        key={tag.id}
                                        dir={dir}
                                        className="group flex items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                                    >
                                        {tag.image ? (
                                            <img
                                                src={tag.image}
                                                alt=""
                                                loading="lazy"
                                                className="h-10 w-10 shrink-0 rounded-xl object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.style.display =
                                                        "none";
                                                }}
                                            />
                                        ) : (
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                                <Tag className="h-4 w-4 text-primary" />
                                            </div>
                                        )}

                                        <span className="min-w-0 text-sm font-medium leading-snug text-foreground">
                                            {tag.title}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {amenities.length > 0 && (
                        <div dir={dir}>
                            <SectionTitle
                                hint={`${amenities.length}`}
                                dir={dir}
                            >
                                {t("hotelInfo.amenities")}
                            </SectionTitle>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                {amenities.map((a) => (
                                    <div
                                        key={a.id}
                                        dir={dir}
                                        className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted"
                                    >
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                            <AmenityGlyph amenity={a} />
                                        </div>

                                        <span className="min-w-0 text-sm text-foreground">
                                            {a.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {facilityGroups.length > 0 && (
                        <div dir={dir}>
                            <SectionTitle dir={dir}>
                                {t("hotelInfo.facilities")}
                            </SectionTitle>

                            <Accordion
                                type="multiple"
                                defaultValue={facilityGroups
                                    .slice(0, 2)
                                    .map(([c]) => c)}
                                dir={dir}
                                className="rounded-3xl border border-border bg-card px-4"
                            >
                                {facilityGroups.map(([cat, titles]) => (
                                    <AccordionItem
                                        key={cat}
                                        value={cat}
                                        className="border-border last:border-0"
                                    >
                                        <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                                            <span className="flex min-w-0 flex-1 items-center gap-2">
                                                <span className="min-w-0">
                                                    {cat}
                                                </span>

                                                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                                    {titles.length}
                                                </span>
                                            </span>
                                        </AccordionTrigger>

                                        <AccordionContent>
                                            <div className="flex flex-wrap gap-2 pb-1">
                                                {titles.map((title, i) => (
                                                    <span
                                                        key={`${title}-${i}`}
                                                        dir={dir}
                                                        className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground"
                                                    >
                                                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                                                        <span>{title}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    )}
                </TabsContent>

                {/* ─────────────────────────────────────────────
                    DINING & OPTIONS
                ────────────────────────────────────────────── */}
                <TabsContent
                    value="dining"
                    dir={dir}
                    className="mt-0 space-y-8 focus-visible:outline-none"
                >
                    {boardings && boardings.length > 0 && (
                        <div dir={dir}>
                            <SectionTitle dir={dir}>
                                {t("hotelInfo.boardings")}
                            </SectionTitle>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {boardings.map((b) => (
                                    <div
                                        key={b.id}
                                        dir={dir}
                                        className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                                <UtensilsCrossed className="h-4 w-4 text-primary" />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-foreground">
                                                    {b.name || b.code}
                                                </p>

                                                {b.code && b.name && (
                                                    <span
                                                        className="text-[11px] font-semibold uppercase tracking-wide text-primary"
                                                        dir="ltr"
                                                    >
                                                        {b.code}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {b.description && (
                                            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                                {b.description}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {options && options.length > 0 && (
                        <div dir={dir}>
                            <SectionTitle
                                hint={t("hotelInfo.onRequest")}
                                dir={dir}
                            >
                                {t("hotelInfo.options")}
                            </SectionTitle>

                            <div className="flex flex-wrap gap-2">
                                {options.map((o) => (
                                    <Pill
                                        key={o.id}
                                        icon={CheckCircle2}
                                        dir={dir}
                                    >
                                        {o.title}
                                    </Pill>
                                ))}
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* ─────────────────────────────────────────────
                    PRACTICAL INFORMATION
                ────────────────────────────────────────────── */}
                <TabsContent
                    value="practical"
                    dir={dir}
                    className="mt-0 space-y-6 focus-visible:outline-none"
                >
                    <div dir={dir}>
                        <SectionTitle dir={dir}>
                            {t("hotelInfo.practical")}
                        </SectionTitle>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {checkIn && (
                                <Tile
                                    icon={LogIn}
                                    label={t("hotelInfo.checkIn")}
                                    value={checkIn}
                                    dir={dir}
                                />
                            )}

                            {checkOut && (
                                <Tile
                                    icon={LogOut}
                                    label={t("hotelInfo.checkOut")}
                                    value={checkOut}
                                    dir={dir}
                                />
                            )}

                            {address && (
                                <Tile
                                    icon={MapPin}
                                    label={t("hotelInfo.address")}
                                    value={address}
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                        address
                                    )}`}
                                    dir={dir}
                                />
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </motion.section>
    );
}