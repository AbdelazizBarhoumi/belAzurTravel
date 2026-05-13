import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Hotel, Plane, Car, Train, Ship, Utensils, Camera, Mountain,
  Waves, Sparkles, Heart, Sun, Snowflake, Users, Calendar, Wallet,
  Check, ChevronRight, ChevronLeft, Compass, Music, BookOpen
} from "lucide-react";
import type { LucideIcon } from 'lucide-react';
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
type Option = { id: string; label: string; icon: LucideIcon; desc?: string };
const destinations: Option[] = [
  { id: "santorini", label: "Santorini", icon: Waves, desc: "Greece" },
  { id: "bali", label: "Bali", icon: Sun, desc: "Indonesia" },
  { id: "paris", label: "Paris", icon: Sparkles, desc: "France" },
  { id: "tokyo", label: "Tokyo", icon: Camera, desc: "Japan" },
  { id: "dubai", label: "Dubai", icon: Mountain, desc: "UAE" },
  { id: "maldives", label: "Maldives", icon: Waves, desc: "Indian Ocean" },
  { id: "marrakech", label: "Marrakech", icon: Sun, desc: "Morocco" },
  { id: "iceland", label: "Iceland", icon: Snowflake, desc: "Nordic" },
];
const interests: Option[] = [
  { id: "beach", label: "Beach & Relaxation", icon: Waves },
  { id: "culture", label: "Culture & History", icon: BookOpen },
  { id: "adventure", label: "Adventure", icon: Mountain },
  { id: "food", label: "Food & Wine", icon: Utensils },
  { id: "nightlife", label: "Nightlife", icon: Music },
  { id: "photography", label: "Photography", icon: Camera },
  { id: "wellness", label: "Wellness & Spa", icon: Heart },
  { id: "nature", label: "Nature & Wildlife", icon: Compass },
];
const accommodations: Option[] = [
  { id: "luxury", label: "5★ Luxury", icon: Sparkles, desc: "Premium suites" },
  { id: "boutique", label: "Boutique", icon: Heart, desc: "Unique stays" },
  { id: "resort", label: "Resort", icon: Hotel, desc: "All-inclusive" },
  { id: "budget", label: "Budget", icon: Wallet, desc: "Smart picks" },
];
const transports: Option[] = [
  { id: "flight", label: "Flight", icon: Plane },
  { id: "car", label: "Car Rental", icon: Car },
  { id: "train", label: "Train", icon: Train },
  { id: "cruise", label: "Cruise", icon: Ship },
];
const budgets: Option[] = [
  { id: "eco", label: "Economy", icon: Wallet, desc: "< $1,500 / pp" },
  { id: "comfort", label: "Comfort", icon: Hotel, desc: "$1,500 – $3,500" },
  { id: "premium", label: "Premium", icon: Sparkles, desc: "$3,500 – $7,000" },
  { id: "luxury", label: "Luxury", icon: Heart, desc: "$7,000+" },
];
const steps = [
  { key: "destinations", title: "Choose Destinations", subtitle: "Pick one or more places to visit", icon: MapPin },
  { key: "interests", title: "What do you love?", subtitle: "Select all that interest you", icon: Heart },
  { key: "accommodation", title: "Where will you stay?", subtitle: "Pick your preferred style", icon: Hotel },
  { key: "transport", title: "How will you travel?", subtitle: "Select transportation modes", icon: Plane },
  { key: "details", title: "Trip Details", subtitle: "Dates and travelers", icon: Calendar },
  { key: "budget", title: "Your Budget", subtitle: "Per person estimate", icon: Wallet },
  { key: "summary", title: "Your Custom Trip", subtitle: "Review and confirm", icon: Check },
];
const DesignTrip = () => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    destinations: [] as string[],
    interests: [] as string[],
    accommodation: "" as string,
    transport: [] as string[],
    transportSingle: "" as string,
    startDate: "",
    endDate: "",
    travelers: 2,
    budget: "",
  });
  const toggle = (key: keyof typeof data, id: string) => {
    setData((d) => {
      const arr = d[key] as string[];
      return { ...d, [key]: arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id] };
    });
  };
  const set = (key: keyof typeof data, val: string | string[] | number) => setData((d) => ({ ...d, [key]: val }));
  const progress = ((step + 1) / steps.length) * 100;
  const current = steps[step];
  const canNext = useMemo(() => {
    switch (current.key) {
      case "destinations": return data.destinations.length > 0;
      case "interests": return data.interests.length > 0;
      case "accommodation": return !!data.accommodation;
      case "transport": return data.transport.length > 0;
      case "details": return data.startDate && data.endDate && data.travelers > 0;
      case "budget": return !!data.budget;
      default: return true;
    }
  }, [current.key, data]);
  const estimate = useMemo(() => {
    const base: Record<string, number> = { eco: 1200, comfort: 2500, premium: 5000, luxury: 8500 };
    const per = base[data.budget] || 2500;
    return per * data.destinations.length * data.travelers;
  }, [data.budget, data.destinations.length, data.travelers]);
  const submit = () => {
    toast.success("Trip request sent! Our travel designers will contact you within 24h.");
    setStep(0);
    setData({ destinations: [], interests: [], accommodation: "", transport: [], transportSingle: "", startDate: "", endDate: "", travelers: 2, budget: "" });
  };
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Hero */}
      <section className="pt-28 pb-12 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-secondary text-sm tracking-widest uppercase mb-3">
            Bespoke Travel
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-serif text-4xl md:text-6xl font-bold text-foreground mb-4">
            Design Your <span className="italic text-primary">Dream Trip</span>
          </motion.h1>
          <p className="text-muted-foreground text-lg">
            Build a fully personalized itinerary in a few steps. Pick destinations, activities, comfort and more.
          </p>
        </div>
      </section>
      {/* Builder */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">Step {step + 1} of {steps.length}</span>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-primary to-secondary" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
            </div>
            <div className="hidden md:flex justify-between mt-4">
              {steps.map((s, i) => (
                <button key={s.key} onClick={() => i < step && setStep(i)}
                  className={`flex flex-col items-center gap-1 text-xs transition-colors ${i === step ? "text-primary" : i < step ? "text-foreground" : "text-muted-foreground"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                    i === step ? "border-primary bg-primary text-primary-foreground" :
                    i < step ? "border-primary bg-primary/10 text-primary" : "border-border"
                  }`}>
                    {i < step ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                  </div>
                  <span className="hidden lg:block">{s.title.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>
          {/* Step content */}
          <div className="bg-card rounded-3xl border border-border p-6 md:p-10 card-elevated">
            <AnimatePresence mode="wait">
              <motion.div key={current.key} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-8 text-center">
                  <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-2">{current.title}</h2>
                  <p className="text-muted-foreground">{current.subtitle}</p>
                </div>
                {current.key === "destinations" && (
                  <Grid options={destinations} selected={data.destinations} onToggle={(id) => toggle("destinations", id)} />
                )}
                {current.key === "interests" && (
                  <Grid options={interests} selected={data.interests} onToggle={(id) => toggle("interests", id)} cols={4} />
                )}
                {current.key === "accommodation" && (
                  <Grid options={accommodations} selected={data.accommodation ? [data.accommodation] : []}
                    onToggle={(id) => set("accommodation", id)} cols={4} />
                )}
                {current.key === "transport" && (
                  <Grid options={transports} selected={data.transport} onToggle={(id) => toggle("transport", id)} cols={4} />
                )}
                {current.key === "details" && (
                  <div className="max-w-xl mx-auto space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-2 block">Start Date</Label>
                        <Input type="date" value={data.startDate} onChange={(e) => set("startDate", e.target.value)} />
                      </div>
                      <div>
                        <Label className="mb-2 block">End Date</Label>
                        <Input type="date" value={data.endDate} onChange={(e) => set("endDate", e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <Label className="mb-2 block flex items-center gap-2"><Users className="h-4 w-4" /> Travelers</Label>
                      <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" onClick={() => set("travelers", Math.max(1, data.travelers - 1))}>−</Button>
                        <div className="flex-1 text-center text-2xl font-bold text-foreground">{data.travelers}</div>
                        <Button variant="outline" size="icon" onClick={() => set("travelers", data.travelers + 1)}>+</Button>
                      </div>
                    </div>
                  </div>
                )}
                {current.key === "budget" && (
                  <Grid options={budgets} selected={data.budget ? [data.budget] : []}
                    onToggle={(id) => set("budget", id)} cols={4} />
                )}
                {current.key === "summary" && (
                  <div className="max-w-2xl mx-auto space-y-5">
                    <SummaryRow label="Destinations" items={data.destinations.map((id) => destinations.find((d) => d.id === id)?.label || id)} />
                    <SummaryRow label="Interests" items={data.interests.map((id) => interests.find((d) => d.id === id)?.label || id)} />
                    <SummaryRow label="Accommodation" items={[accommodations.find((d) => d.id === data.accommodation)?.label || ""]} />
                    <SummaryRow label="Transport" items={data.transport.map((id) => transports.find((d) => d.id === id)?.label || id)} />
                    <SummaryRow label="Dates" items={[`${data.startDate} → ${data.endDate}`]} />
                    <SummaryRow label="Travelers" items={[`${data.travelers} person(s)`]} />
                    <SummaryRow label="Budget" items={[budgets.find((d) => d.id === data.budget)?.label || ""]} />
                    <div className="bg-gradient-to-br from-primary to-secondary text-primary-foreground rounded-2xl p-6 text-center mt-6">
                      <p className="text-sm opacity-80 mb-1">Estimated Total</p>
                      <p className="font-serif text-4xl font-bold">${estimate.toLocaleString()}</p>
                      <p className="text-xs opacity-70 mt-2">Final price confirmed by your travel designer</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            {/* Navigation */}
            <div className="flex justify-between gap-3 mt-10 pt-6 border-t border-border">
              <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="gap-2">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              {step < steps.length - 1 ? (
                <Button onClick={() => setStep(step + 1)} disabled={!canNext} className="bg-primary text-primary-foreground gap-2">
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={submit} className="bg-secondary text-secondary-foreground gap-2">
                  <Sparkles className="h-4 w-4" /> Confirm Trip
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};
function Grid({ options, selected, onToggle, cols = 4 }: { options: Option[]; selected: string[]; onToggle: (id: string) => void; cols?: number }) {
  const gridCls = cols === 4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-4";
  return (
    <div className={`grid ${gridCls} gap-3`}>
      {options.map((o) => {
        const active = selected.includes(o.id);
        const Icon = o.icon;
        return (
          <button key={o.id} onClick={() => onToggle(o.id)}
            className={`relative p-5 rounded-2xl border-2 text-left transition-all hover:shadow-md ${
              active ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
            }`}>
            {active && (
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <Check className="h-3.5 w-3.5" />
              </div>
            )}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="font-semibold text-foreground text-sm">{o.label}</p>
            {o.desc && <p className="text-xs text-muted-foreground mt-0.5">{o.desc}</p>}
          </button>
        );
      })}
    </div>
  );
}
function SummaryRow({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-2 pb-3 border-b border-border">
      <span className="text-sm font-semibold text-muted-foreground md:w-40">{label}</span>
      <div className="flex flex-wrap gap-2">
        {items.filter(Boolean).map((it, i) => (
          <span key={i} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">{it}</span>
        ))}
        {items.filter(Boolean).length === 0 && <span className="text-sm text-muted-foreground italic">—</span>}
      </div>
    </div>
  );
}
export default DesignTrip;
