import { Icon as IconifyIcon } from "@iconify/react";
import { motion } from "framer-motion";
import {
    CheckCircle2,
    ChevronDown,
    Copy,
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
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
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
    description: string;
    category?: string;
    amenities: Amenity[];
    checkIn?: string;
    checkOut?: string;
    address?: string;
    phone?: string;
    email?: string;
    options?: Array<{ id: number; title: string }>;
    boardings?: Array<{ id: number; code: string; name: string; description: string | null }>;
    facilities?: Array<{ title: string; category: string }>;
    amenityTags?: Array<{ id: number; title: string; image: string }>;
    note?: string;
}

const fadeInProps = {
    initial: { opacity: 0, y: 12 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
    transition: { duration: 0.35 },
} as const;

/** Provider payloads arrive as escaped HTML + \r\n — normalise to clean text. */
function clean(raw?: string | null): string {
    if (!raw) return "";

    return raw
        // Decode common HTML entities
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")

        // HTML line breaks should be spaces, not huge vertical gaps
        .replace(/<br\s*\/?>/gi, " ")

        // Remove all HTML tags
        .replace(/<[^>]+>/g, " ")

        // Remove escaped CR/LF and normalize whitespace
        .replace(/\\r\\n|\\r|\\n/g, " ")
        .replace(/\s+/g, " ")

        .trim();
}

function AmenityGlyph({ amenity }: { amenity: Amenity }) {
    const Icon = amenity.icon;
    if (amenity.iconifyName)
        return <IconifyIcon icon={amenity.iconifyName} className="h-4 w-4 text-primary" />;
    if (amenity.customSvg)
        return (
            <span
                className="h-4 w-4 text-primary [&>svg]:h-4 [&>svg]:w-4"
                dangerouslySetInnerHTML={{ __html: amenity.customSvg }}
            />
        );
    if (Icon) return <Icon className="h-4 w-4 text-primary" />;
    return <Sparkles className="h-4 w-4 text-primary" />;
}

function Tile({
    icon: Icon,
    label,
    value,
    href,
}: {
    icon: typeof Wifi;
    label: string;
    value: ReactNode;
    href?: string;
}) {
    const inner = (
        <>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
                <div className="text-sm font-semibold leading-snug text-foreground">{value}</div>
            </div>
        </>
    );
    const base =
        "flex items-start gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40";
    return href ? (
        <a href={href} className={base}>
            {inner}
        </a>
    ) : (
        <div className={base}>{inner}</div>
    );
}

function Pill({ icon: Icon, children }: { icon: typeof Wifi; children: ReactNode }) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground">
            <Icon className="h-3.5 w-3.5 text-primary" />
            {children}
        </span>
    );
}

function SectionTitle({ children, hint }: { children: ReactNode; hint?: string }) {
    return (
        <div className="mb-4 flex items-baseline justify-between gap-4">
            <h3 className="inline-block border-b-2 border-secondary pb-1 font-serif text-xl font-bold text-foreground">
                {children}
            </h3>
            {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        </div>
    );
}

export function HotelInfo({
    description,
    category,
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
    const [expanded, setExpanded] = useState(false);
    const [showNote, setShowNote] = useState(false);

    const text = useMemo(() => clean(description), [description]);
    const noteText = useMemo(() => clean(note), [note]);
    const emails = useMemo(
        () =>
            (email ?? "")
                .split(/[;,]/)
                .map((e) => e.trim())
                .filter(Boolean),
        [email],
    );
    const phones = useMemo(
        () =>
            (phone ?? "")
                .split(/[;,/]/)
                .map((p) => p.trim())
                .filter(Boolean),
        [phone],
    );

    const facilityGroups = useMemo(() => {
        const acc: Record<string, string[]> = {};
        for (const f of facilities ?? []) {
            const key = f.category?.trim() || t("hotelInfo.general");
            (acc[key] ??= []).push(f.title);
        }
        return Object.entries(acc);
    }, [facilities, t]);

    const long = text.length > 420;
    const hasEquipment =
        amenities.length > 0 || facilityGroups.length > 0 || (amenityTags?.length ?? 0) > 0;
    const hasDining = (boardings?.length ?? 0) > 0 || (options?.length ?? 0) > 0;

    const tabs = [
        { value: "about", label: t("hotelInfo.tabAbout"), show: Boolean(text) || Boolean(category) },
        { value: "equipment", label: t("hotelInfo.tabEquipment"), show: hasEquipment },
        { value: "dining", label: t("hotelInfo.tabDining"), show: hasDining },
        {
            value: "practical",
            label: t("hotelInfo.tabPractical"),
            show: Boolean(checkIn || checkOut || address || phones.length || emails.length || noteText),
        },
    ].filter((tab) => tab.show);

    if (!tabs.length) return null;

    return (
        <motion.section {...fadeInProps} className="rounded-[28px] border border-border bg-card/50 p-5 md:p-7">
            <Tabs defaultValue={tabs[0].value} className="w-full">
                <div className="sticky top-20 z-10 -mx-5 mb-6 bg-card/80 px-5 py-2 backdrop-blur md:-mx-7 md:px-7">
                    <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-2xl bg-muted/60 p-1">
                        {tabs.map((tab) => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className="rounded-xl px-4 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow"
                            >
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                {/* ── About ─────────────────────────────────────────── */}
                <TabsContent value="about" className="mt-0 focus-visible:outline-none">
                    <SectionTitle>{t("hotelInfo.about")}</SectionTitle>
                    {category && (
                        <div className="mb-4 flex flex-wrap gap-2">
                            <Pill icon={Sparkles}>{category}</Pill>
                            {checkIn && <Pill icon={LogIn}>{`${t("hotelInfo.checkIn")} ${checkIn}`}</Pill>}
                            {checkOut && <Pill icon={LogOut}>{`${t("hotelInfo.checkOut")} ${checkOut}`}</Pill>}
                        </div>
                    )}
                    <div className="relative max-w-3xl">
                        <p
                            className={cn(
                                "text-sm leading-relaxed text-muted-foreground transition-all",
                                long && !expanded && "line-clamp-6",
                            )}
                        >
                            {text}
                        </p>
                        {long && !expanded && (
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card/90 to-transparent" />
                        )}
                    </div>
                    {long && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 px-0 text-primary hover:bg-transparent"
                            onClick={() => setExpanded((v) => !v)}
                        >
                            {expanded ? t("hotelInfo.less") : t("hotelInfo.more")}
                            <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
                        </Button>
                    )}
                </TabsContent>

                {/* ── Equipment ─────────────────────────────────────── */}
                <TabsContent value="equipment" className="mt-0 space-y-8 focus-visible:outline-none">
                    {amenityTags && amenityTags.length > 0 && (
                        <div>
                            <SectionTitle hint={`${amenityTags.length}`}>{t("hotelInfo.highlights")}</SectionTitle>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                {amenityTags.map((tag) => (
                                    <div
                                        key={tag.id}
                                        className="group flex items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                                    >
                                        {tag.image ? (
                                            <img
                                                src={tag.image}
                                                alt=""
                                                loading="lazy"
                                                className="h-10 w-10 shrink-0 rounded-xl object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = "none";
                                                }}
                                            />
                                        ) : (
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                                <Tag className="h-4 w-4 text-primary" />
                                            </div>
                                        )}
                                        <span className="text-sm font-medium leading-snug text-foreground">{tag.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {amenities.length > 0 && (
                        <div>
                            <SectionTitle hint={`${amenities.length}`}>{t("hotelInfo.amenities")}</SectionTitle>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                {amenities.map((a) => (
                                    <div
                                        key={a.id}
                                        className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted"
                                    >
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                            <AmenityGlyph amenity={a} />
                                        </div>
                                        <span className="text-sm text-foreground">{a.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {facilityGroups.length > 0 && (
                        <div>
                            <SectionTitle>{t("hotelInfo.facilities")}</SectionTitle>
                            <Accordion
                                type="multiple"
                                defaultValue={facilityGroups.slice(0, 2).map(([c]) => c)}
                                className="rounded-3xl border border-border bg-card px-4"
                            >
                                {facilityGroups.map(([cat, titles]) => (
                                    <AccordionItem key={cat} value={cat} className="border-border last:border-0">
                                        <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                                            <span className="flex items-center gap-2">
                                                {cat}
                                                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                                    {titles.length}
                                                </span>
                                            </span>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="flex flex-wrap gap-2 pb-1">
                                                {titles.map((title, i) => (
                                                    <span
                                                        key={`${title}-${i}`}
                                                        className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground"
                                                    >
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                                                        {title}
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

                {/* ── Dining & options ──────────────────────────────── */}
                <TabsContent value="dining" className="mt-0 space-y-8 focus-visible:outline-none">
                    {boardings && boardings.length > 0 && (
                        <div>
                            <SectionTitle>{t("hotelInfo.boardings")}</SectionTitle>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {boardings.map((b) => (
                                    <div
                                        key={b.id}
                                        className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                                <UtensilsCrossed className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-foreground">{b.name || b.code}</p>
                                                {b.code && b.name && (
                                                    <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                                                        {b.code}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {b.description && (
                                            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{b.description}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {options && options.length > 0 && (
                        <div>
                            <SectionTitle hint={t("hotelInfo.onRequest")}>{t("hotelInfo.options")}</SectionTitle>
                            <div className="flex flex-wrap gap-2">
                                {options.map((o) => (
                                    <Pill key={o.id} icon={CheckCircle2}>
                                        {o.title}
                                    </Pill>
                                ))}
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* ── Practical ─────────────────────────────────────── */}
                <TabsContent value="practical" className="mt-0 space-y-6 focus-visible:outline-none">
                    <div>
                        <SectionTitle>{t("hotelInfo.practical")}</SectionTitle>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {checkIn && <Tile icon={LogIn} label={t("hotelInfo.checkIn")} value={checkIn} />}
                            {checkOut && <Tile icon={LogOut} label={t("hotelInfo.checkOut")} value={checkOut} />}
                            {address && (
                                <Tile
                                    icon={MapPin}
                                    label={t("hotelInfo.address")}
                                    value={address}
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                                />
                            )}
                            {phones.map((p) => (
                                <Tile
                                    key={p}
                                    icon={Phone}
                                    label={t("hotelInfo.phone")}
                                    value={p}
                                    href={`tel:${p.replace(/\s/g, "")}`}
                                />
                            ))}
                        </div>
                    </div>

                    {emails.length > 0 && (
                        <div className="rounded-2xl border border-border bg-card p-4">
                            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                                <Mail className="h-4 w-4 text-primary" /> {t("hotelInfo.email")}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {emails.map((e) => (
                                    <span
                                        key={e}
                                        className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs text-foreground"
                                    >
                                        <a href={`mailto:${e}`} className="hover:text-primary">
                                            {e}
                                        </a>
                                        <button
                                            type="button"
                                            aria-label={t("hotelInfo.copy")}
                                            onClick={() => navigator.clipboard?.writeText(e)}
                                            className="text-muted-foreground transition-colors hover:text-primary"
                                        >
                                            <Copy className="h-3.5 w-3.5" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {noteText && (
                        <div className="rounded-2xl border border-secondary/30 bg-secondary/10 p-4">
                            <button
                                type="button"
                                onClick={() => setShowNote((v) => !v)}
                                className="flex w-full items-center gap-3 text-left"
                            >
                                <Info className="h-5 w-5 shrink-0 text-secondary" />
                                <span className="flex-1 text-sm font-semibold text-foreground">
                                    {t("hotelInfo.importantNote")}
                                </span>
                                <ChevronDown
                                    className={cn("h-4 w-4 text-muted-foreground transition-transform", showNote && "rotate-180")}
                                />
                            </button>
                            {showNote && (
                                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                                    {noteText}
                                </p>
                            )}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </motion.section>
    );
}