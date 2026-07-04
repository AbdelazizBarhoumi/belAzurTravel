import { useQuery } from "@tanstack/react-query";
import { Search, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";
import { apiFetch } from "@/api/http";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface Country {
  code: string;
  name: string;
  flag: string;
  region: string;
  processing: string;
  price: number;
}

const schema = z.object({
  fullName: z.string().trim().min(2, "Nom requis").max(100),
  email: z.string().trim().email("Email invalide").max(255),
  phone: z.string().trim().min(6, "Téléphone requis").max(20),
  passport: z.string().trim().min(4, "N° de passeport requis").max(30),
  birthDate: z.string().min(1, "Date requise"),
  travelDate: z.string().min(1, "Date requise"),
  visaType: z.string().min(1, "Type requis"),
  notes: z.string().max(1000).optional(),
});

export default function Visa() {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<string>("all");
  const [selected, setSelected] = useState<Country | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    passport: "",
    birthDate: "",
    travelDate: "",
    visaType: "tourism",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: countries = [], isLoading } = useQuery({
    queryKey: ["visas"],
    queryFn: () =>
      apiFetch<{ data: Country[] }>("/api/visas").then((res) => res.data ?? []),
  });

  const regions = useMemo(() => ["all", ...Array.from(new Set(countries.map((c) => c.region)))], [countries]);
  const filtered = useMemo(
    () =>
      countries.filter((c) => (region === "all" || c.region === region) && c.name.toLowerCase().includes(query.toLowerCase())),
    [query, region, countries],
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[i.path[0] as string] = i.message));
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitted(true);
    toast({ title: "Demande envoyée", description: `Votre demande de visa pour ${selected?.name} a été reçue.` });
  };

  if (isLoading) {
    return (
      <PageShell title="Demande de Visa" subtitle="Chargement...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageShell>
    );
  }

  if (submitted && selected) {
    return (
      <PageShell title="Demande de visa envoyée" subtitle="Nous vous contacterons très prochainement.">
        <div className="max-w-md mx-auto text-center bg-card rounded-2xl p-8 card-elevated">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <p className="text-6xl mb-2">{selected.flag}</p>
          <h3 className="font-serif text-2xl font-bold text-foreground mb-2">Visa pour {selected.name}</h3>
          <p className="text-muted-foreground mb-6">Un conseiller vous contactera sous 24h pour finaliser votre dossier.</p>
          <Button
            onClick={() => {
              setSubmitted(false);
              setSelected(null);
            }}
          >
            Nouvelle demande
          </Button>
        </div>
      </PageShell>
    );
  }

  if (selected) {
    return (
      <PageShell title={`Visa ${selected.name} ${selected.flag}`} subtitle={`Traitement : ${selected.processing} · À partir de ${selected.price} DT`}>
        <div className="max-w-2xl mx-auto">
          <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" /> Choisir un autre pays
          </button>
          <form onSubmit={submit} className="bg-card rounded-2xl p-6 md:p-8 card-elevated space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nom complet *</Label>
                <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} maxLength={100} />
                {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName}</p>}
              </div>
              <div>
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={255} />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
              </div>
              <div>
                <Label>Téléphone *</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={20} />
                {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
              </div>
              <div>
                <Label>N° de passeport *</Label>
                <Input value={form.passport} onChange={(e) => setForm({ ...form, passport: e.target.value })} maxLength={30} />
                {errors.passport && <p className="text-xs text-destructive mt-1">{errors.passport}</p>}
              </div>
              <div>
                <Label>Date de naissance *</Label>
                <Input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
                {errors.birthDate && <p className="text-xs text-destructive mt-1">{errors.birthDate}</p>}
              </div>
              <div>
                <Label>Date de voyage prévue *</Label>
                <Input type="date" value={form.travelDate} onChange={(e) => setForm({ ...form, travelDate: e.target.value })} />
                {errors.travelDate && <p className="text-xs text-destructive mt-1">{errors.travelDate}</p>}
              </div>
              <div className="md:col-span-2">
                <Label>Type de visa *</Label>
                <Select value={form.visaType} onValueChange={(v) => setForm({ ...form, visaType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tourism">Tourisme</SelectItem>
                    <SelectItem value="business">Affaires</SelectItem>
                    <SelectItem value="study">Études</SelectItem>
                    <SelectItem value="family">Visite familiale</SelectItem>
                    <SelectItem value="transit">Transit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Notes complémentaires</Label>
                <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={1000} />
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg">Envoyer la demande</Button>
          </form>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Demande de Visa" subtitle="Sélectionnez le pays de destination pour démarrer votre demande.">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row gap-3 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher un pays..." className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {regions.map((r) => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  region === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {r === "all" ? "Tous" : r}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((c) => (
            <button
              key={c.code}
              onClick={() => setSelected(c)}
              className="group bg-card rounded-2xl p-5 card-elevated text-left hover:border-primary border border-transparent transition-all"
            >
              <p className="text-5xl mb-3">{c.flag}</p>
              <h3 className="font-serif text-lg font-bold text-foreground group-hover:text-primary transition-colors">{c.name}</h3>
              <p className="text-xs text-muted-foreground">{c.region}</p>
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{c.processing}</span>
                <span className="text-sm font-bold text-secondary">{c.price} DT</span>
              </div>
            </button>
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">Aucun pays trouvé.</p>
        )}
      </div>
    </PageShell>
  );
}
