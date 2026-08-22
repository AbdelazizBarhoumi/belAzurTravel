import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin,
    Hotel,
    Plane,
    Car,
    Train,
    Ship,
    Utensils,
    Camera,
    Mountain,
    Waves,
    Sparkles,
    Heart,
    Sun,
    Snowflake,
    Users,
    Calendar,
    Wallet,
    Check,
    ChevronRight,
    ChevronLeft,
    Compass,
    Music,
    BookOpen,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/DatePicker';
import { Label } from '@/components/ui/label';
type Option = { id: string; label: string; icon: LucideIcon; desc?: string };
const destinations: Option[] = [
    { id: 'santorini', label: 'Santorini', icon: Waves, desc: 'Greece' },
    { id: 'bali', label: 'Bali', icon: Sun, desc: 'Indonesia' },
    { id: 'paris', label: 'Paris', icon: Sparkles, desc: 'France' },
    { id: 'tokyo', label: 'Tokyo', icon: Camera, desc: 'Japan' },
    { id: 'dubai', label: 'Dubai', icon: Mountain, desc: 'UAE' },
    { id: 'maldives', label: 'Maldives', icon: Waves, desc: 'Indian Ocean' },
    { id: 'marrakech', label: 'Marrakech', icon: Sun, desc: 'Morocco' },
    { id: 'iceland', label: 'Iceland', icon: Snowflake, desc: 'Nordic' },
];
const interests: Option[] = [
    { id: 'beach', label: 'Beach & Relaxation', icon: Waves },
    { id: 'culture', label: 'Culture & History', icon: BookOpen },
    { id: 'adventure', label: 'Adventure', icon: Mountain },
    { id: 'food', label: 'Food & Wine', icon: Utensils },
    { id: 'nightlife', label: 'Nightlife', icon: Music },
    { id: 'photography', label: 'Photography', icon: Camera },
    { id: 'wellness', label: 'Wellness & Spa', icon: Heart },
    { id: 'nature', label: 'Nature & Wildlife', icon: Compass },
];
const accommodations: Option[] = [
    {
        id: 'luxury',
        label: '5★ Luxury',
        icon: Sparkles,
        desc: 'Premium suites',
    },
    { id: 'boutique', label: 'Boutique', icon: Heart, desc: 'Unique stays' },
    { id: 'resort', label: 'Resort', icon: Hotel, desc: 'All-inclusive' },
    { id: 'budget', label: 'Budget', icon: Wallet, desc: 'Smart picks' },
];
const transports: Option[] = [
    { id: 'flight', label: 'Flight', icon: Plane },
    { id: 'car', label: 'Car Rental', icon: Car },
    { id: 'train', label: 'Train', icon: Train },
    { id: 'cruise', label: 'Cruise', icon: Ship },
];
const budgets: Option[] = [
    { id: 'eco', label: 'Economy', icon: Wallet, desc: '< 1,500 TND / pp' },
    {
        id: 'comfort',
        label: 'Comfort',
        icon: Hotel,
        desc: '1,500 TND – 3,500 TND',
    },
    {
        id: 'premium',
        label: 'Premium',
        icon: Sparkles,
        desc: '3,500 TND – 7,000 TND',
    },
    { id: 'luxury', label: 'Luxury', icon: Heart, desc: '7,000 TND+' },
];
const steps = [
    {
        key: 'destinations',
        title: 'Choose Destinations',
        subtitle: 'Pick one or more places to visit',
        icon: MapPin,
    },
    {
        key: 'interests',
        title: 'What do you love?',
        subtitle: 'Select all that interest you',
        icon: Heart,
    },
    {
        key: 'accommodation',
        title: 'Where will you stay?',
        subtitle: 'Pick your preferred style',
        icon: Hotel,
    },
    {
        key: 'transport',
        title: 'How will you travel?',
        subtitle: 'Select transportation modes',
        icon: Plane,
    },
    {
        key: 'details',
        title: 'Trip Details',
        subtitle: 'Dates and travelers',
        icon: Calendar,
    },
    {
        key: 'budget',
        title: 'Your Budget',
        subtitle: 'Per person estimate',
        icon: Wallet,
    },
    {
        key: 'summary',
        title: 'Your Custom Trip',
        subtitle: 'Review and confirm',
        icon: Check,
    },
];
const DesignTrip = () => {
    const [step, setStep] = useState(0);
    const [data, setData] = useState({
        destinations: [] as string[],
        interests: [] as string[],
        accommodation: '' as string,
        transport: [] as string[],
        transportSingle: '' as string,
        startDate: '',
        endDate: '',
        guests: 2,
        travelers: 2,
        budget: '',
    });
    const toggle = (key: keyof typeof data, id: string) => {
        setData((d) => {
            const arr = d[key] as string[];
            return {
                ...d,
                [key]: arr.includes(id)
                    ? arr.filter((x) => x !== id)
                    : [...arr, id],
            };
        });
    };
    const set = (key: keyof typeof data, val: string | string[] | number) =>
        setData((d) => ({ ...d, [key]: val }));
    const progress = ((step + 1) / steps.length) * 100;
    const current = steps[step];
    const canNext = useMemo(() => {
        switch (current.key) {
            case 'destinations':
                return data.destinations.length > 0;
            case 'interests':
                return data.interests.length > 0;
            case 'accommodation':
                return !!data.accommodation;
            case 'transport':
                return data.transport.length > 0;
            case 'details':
                return data.startDate && data.endDate && data.travelers > 0;
            case 'budget':
                return !!data.budget;
            default:
                return true;
        }
    }, [current.key, data]);
    const estimate = useMemo(() => {
        const base: Record<string, number> = {
            eco: 1200,
            comfort: 2500,
            premium: 5000,
            luxury: 8500,
        };
        const per = base[data.budget] || 2500;
        return per * data.destinations.length * data.travelers;
    }, [data.budget, data.destinations.length, data.travelers]);
    const submit = () => {
        toast.success(
            'Trip request sent! Our travel designers will contact you within 24h.',
        );
        setStep(0);
        setData({
            destinations: [],
            interests: [],
            accommodation: '',
            transport: [],
            transportSingle: '',
            startDate: '',
            endDate: '',
            guests: 2,
            travelers: 2,
            budget: '',
        });
    };
    return (
        <div className="min-h-screen bg-background">
            {/* Hero */}
            <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 pb-12 pt-28">
                <div className="container mx-auto max-w-3xl px-4 text-center">
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-3 text-sm uppercase tracking-widest text-secondary"
                    >
                        Bespoke Travel
                    </motion.p>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 font-serif text-4xl font-bold text-foreground md:text-6xl"
                    >
                        Design Your{' '}
                        <span className="italic text-primary">Dream Trip</span>
                    </motion.h1>
                    <p className="text-lg text-muted-foreground">
                        Build a fully personalized itinerary in a few steps.
                        Pick destinations, activities, comfort and more.
                    </p>
                </div>
            </section>
            {/* Builder */}
            <section className="py-12">
                <div className="container mx-auto max-w-5xl px-4">
                    {/* Progress */}
                    <div className="mb-8">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm font-semibold text-foreground">
                                Step {step + 1} of {steps.length}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {Math.round(progress)}%
                            </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <motion.div
                                className="h-full bg-gradient-to-r from-primary to-secondary"
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.4 }}
                            />
                        </div>
                        <div className="mt-4 hidden justify-between md:flex">
                            {steps.map((s, i) => (
                                <button
                                    key={s.key}
                                    onClick={() => i < step && setStep(i)}
                                    className={`flex flex-col items-center gap-1 text-xs transition-colors ${i === step ? 'text-primary' : i < step ? 'text-foreground' : 'text-muted-foreground'}`}
                                >
                                    <div
                                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                                            i === step
                                                ? 'border-primary bg-primary text-primary-foreground'
                                                : i < step
                                                  ? 'border-primary bg-primary/10 text-primary'
                                                  : 'border-border'
                                        }`}
                                    >
                                        {i < step ? (
                                            <Check className="h-4 w-4" />
                                        ) : (
                                            <s.icon className="h-4 w-4" />
                                        )}
                                    </div>
                                    <span className="hidden lg:block">
                                        {s.title.split(' ')[0]}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Step content */}
                    <div className="card-elevated rounded-3xl border border-border bg-card p-6 md:p-10">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={current.key}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="mb-8 text-center">
                                    <h2 className="mb-2 font-serif text-2xl font-bold text-foreground md:text-3xl">
                                        {current.title}
                                    </h2>
                                    <p className="text-muted-foreground">
                                        {current.subtitle}
                                    </p>
                                </div>
                                {current.key === 'destinations' && (
                                    <Grid
                                        options={destinations}
                                        selected={data.destinations}
                                        onToggle={(id) =>
                                            toggle('destinations', id)
                                        }
                                    />
                                )}
                                {current.key === 'interests' && (
                                    <Grid
                                        options={interests}
                                        selected={data.interests}
                                        onToggle={(id) =>
                                            toggle('interests', id)
                                        }
                                        cols={4}
                                    />
                                )}
                                {current.key === 'accommodation' && (
                                    <Grid
                                        options={accommodations}
                                        selected={
                                            data.accommodation
                                                ? [data.accommodation]
                                                : []
                                        }
                                        onToggle={(id) =>
                                            set('accommodation', id)
                                        }
                                        cols={4}
                                    />
                                )}
                                {current.key === 'transport' && (
                                    <Grid
                                        options={transports}
                                        selected={data.transport}
                                        onToggle={(id) =>
                                            toggle('transport', id)
                                        }
                                        cols={4}
                                    />
                                )}
                                {current.key === 'details' && (
                                    <div className="mx-auto max-w-xl space-y-5">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label className="mb-2 block">
                                                    Start Date
                                                </Label>
                                                <DatePicker
                                                    date={
                                                        data.startDate
                                                            ? new Date(
                                                                  data.startDate,
                                                              )
                                                            : undefined
                                                    }
                                                    onDateChange={(date) =>
                                                        set(
                                                            'startDate',
                                                            date
                                                                ? date
                                                                      .toISOString()
                                                                      .split(
                                                                          'T',
                                                                      )[0]
                                                                : '',
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label className="mb-2 block">
                                                    End Date
                                                </Label>
                                                <DatePicker
                                                    date={
                                                        data.endDate
                                                            ? new Date(
                                                                  data.endDate,
                                                              )
                                                            : undefined
                                                    }
                                                    onDateChange={(date) =>
                                                        set(
                                                            'endDate',
                                                            date
                                                                ? date
                                                                      .toISOString()
                                                                      .split(
                                                                          'T',
                                                                      )[0]
                                                                : '',
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="mb-2 block flex items-center gap-2">
                                                <Users className="h-4 w-4" />{' '}
                                                Travelers
                                            </Label>
                                            <div className="flex items-center gap-3">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() =>
                                                        set(
                                                            'travelers',
                                                            Math.max(
                                                                1,
                                                                data.travelers -
                                                                    1,
                                                            ),
                                                        )
                                                    }
                                                >
                                                    −
                                                </Button>
                                                <div className="flex-1 text-center text-2xl font-bold text-foreground">
                                                    {data.travelers}
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() =>
                                                        set(
                                                            'travelers',
                                                            data.travelers + 1,
                                                        )
                                                    }
                                                >
                                                    +
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {current.key === 'budget' && (
                                    <Grid
                                        options={budgets}
                                        selected={
                                            data.budget ? [data.budget] : []
                                        }
                                        onToggle={(id) => set('budget', id)}
                                        cols={4}
                                    />
                                )}
                                {current.key === 'summary' && (
                                    <div className="mx-auto max-w-2xl space-y-5">
                                        <SummaryRow
                                            label="Destinations"
                                            items={data.destinations.map(
                                                (id) =>
                                                    destinations.find(
                                                        (d) => d.id === id,
                                                    )?.label || id,
                                            )}
                                        />
                                        <SummaryRow
                                            label="Interests"
                                            items={data.interests.map(
                                                (id) =>
                                                    interests.find(
                                                        (d) => d.id === id,
                                                    )?.label || id,
                                            )}
                                        />
                                        <SummaryRow
                                            label="Accommodation"
                                            items={[
                                                accommodations.find(
                                                    (d) =>
                                                        d.id ===
                                                        data.accommodation,
                                                )?.label || '',
                                            ]}
                                        />
                                        <SummaryRow
                                            label="Transport"
                                            items={data.transport.map(
                                                (id) =>
                                                    transports.find(
                                                        (d) => d.id === id,
                                                    )?.label || id,
                                            )}
                                        />
                                        <SummaryRow
                                            label="Dates"
                                            items={[
                                                `${data.startDate} → ${data.endDate}`,
                                            ]}
                                        />
                                        <SummaryRow
                                            label="Travelers"
                                            items={[
                                                `${data.travelers} person(s)`,
                                            ]}
                                        />
                                        <SummaryRow
                                            label="Budget"
                                            items={[
                                                budgets.find(
                                                    (d) => d.id === data.budget,
                                                )?.label || '',
                                            ]}
                                        />
                                        <div className="mt-6 rounded-2xl bg-gradient-to-br from-primary to-secondary p-6 text-center text-primary-foreground">
                                            <p className="mb-1 text-sm opacity-80">
                                                Estimated Total
                                            </p>
                                            <p className="font-serif text-4xl font-bold">
                                                ${estimate.toLocaleString()}
                                            </p>
                                            <p className="mt-2 text-xs opacity-70">
                                                Final price confirmed by your
                                                travel designer
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                        {/* Navigation */}
                        <div className="mt-10 flex justify-between gap-3 border-t border-border pt-6">
                            <Button
                                variant="outline"
                                onClick={() => setStep(Math.max(0, step - 1))}
                                disabled={step === 0}
                                className="gap-2"
                            >
                                <ChevronLeft className="h-4 w-4" /> Back
                            </Button>
                            {step < steps.length - 1 ? (
                                <Button
                                    onClick={() => setStep(step + 1)}
                                    disabled={!canNext}
                                    className="gap-2 bg-primary text-primary-foreground"
                                >
                                    Next <ChevronRight className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={submit}
                                    className="gap-2 bg-secondary text-secondary-foreground"
                                >
                                    <Sparkles className="h-4 w-4" /> Confirm
                                    Trip
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
function Grid({
    options,
    selected,
    onToggle,
    cols = 4,
}: {
    options: Option[];
    selected: string[];
    onToggle: (id: string) => void;
    cols?: number;
}) {
    const gridCls =
        cols === 4
            ? 'grid-cols-2 md:grid-cols-4'
            : 'grid-cols-2 md:grid-cols-4';
    return (
        <div className={`grid ${gridCls} gap-3`}>
            {options.map((o) => {
                const active = selected.includes(o.id);
                const Icon = o.icon;
                return (
                    <button
                        key={o.id}
                        onClick={() => onToggle(o.id)}
                        className={`relative rounded-2xl border-2 p-5 text-left transition-all hover:shadow-md ${
                            active
                                ? 'border-primary bg-primary/5'
                                : 'border-border bg-card hover:border-primary/40'
                        }`}
                    >
                        {active && (
                            <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <Check className="h-3.5 w-3.5" />
                            </div>
                        )}
                        <div
                            className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}
                        >
                            <Icon className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                            {o.label}
                        </p>
                        {o.desc && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {o.desc}
                            </p>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
function SummaryRow({ label, items }: { label: string; items: string[] }) {
    return (
        <div className="flex flex-col gap-2 border-b border-border pb-3 md:flex-row md:items-center">
            <span className="text-sm font-semibold text-muted-foreground md:w-40">
                {label}
            </span>
            <div className="flex flex-wrap gap-2">
                {items.filter(Boolean).map((it, i) => (
                    <span
                        key={i}
                        className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                    >
                        {it}
                    </span>
                ))}
                {items.filter(Boolean).length === 0 && (
                    <span className="text-sm italic text-muted-foreground">
                        —
                    </span>
                )}
            </div>
        </div>
    );
}
export default DesignTrip;
