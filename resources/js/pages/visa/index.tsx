import { useMutation, useQuery } from "@tanstack/react-query";
import { Search, CheckCircle2, ArrowLeft, Loader2, Upload, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { z } from "zod";
import { apiFetch } from "@/api/http";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeroCarousel } from "@/components/sections/PageHeroCarousel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface Country {
  id: number;
  code: string;
  name: string;
  flag: string;
  processing: string;
  price: number;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const schema = z.object({
  firstName: z.string().trim().min(2, "Prénom requis").max(100),
  lastName: z.string().trim().min(2, "Nom requis").max(100),
  email: z.string().trim().email("Email invalide").max(255),
  phone: z.string().trim().min(6, "Téléphone requis").max(20),
  passport: z.string().trim().min(4, "N° de passeport requis").max(30),
  birthDate: z.string().min(1, "Date requise"),
  travelDate: z.string().min(1, "Date requise"),
  visaType: z.string().min(1, "Type requis"),
  previousVisa: z.boolean(),
  confirmData: z.literal(true, { errorMap: () => ({ message: "Vous devez confirmer l'exactitude de vos données" }) }),
  notes: z.string().max(1000).optional(),
});

export default function Visa() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Country | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [passportCopy, setPassportCopy] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    passport: "",
    birthDate: "",
    travelDate: "",
    visaType: "tourism",
    previousVisa: false,
    confirmData: false,
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: countries = [], isLoading } = useQuery({
    queryKey: ["visas"],
    queryFn: () =>
      apiFetch<{ data: Country[] }>("/api/visas").then((res) => res.data ?? []),
  });

  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiFetch<{ message: string }>("/api/visa-applications", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({ title: "Demande envoyée", description: `Votre demande de visa pour ${selected?.name} a été reçue.` });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Une erreur est survenue lors de l'envoi. Veuillez réessayer.", variant: "destructive" });
    },
  });

  const filtered = useMemo(
    () =>
      countries.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())),
    [query, countries],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError("");
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError("Format accepté : JPG, PNG ou PDF");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError("Le fichier ne doit pas dépasser 5 Mo");
      return;
    }
    setPassportCopy(file);
  };

  const removeFile = () => {
    setPassportCopy(null);
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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

    const formData = new FormData();
    formData.append("visa_id", String(selected!.id));
    formData.append("first_name", form.firstName.trim());
    formData.append("last_name", form.lastName.trim());
    formData.append("email", form.email.trim());
    formData.append("phone", form.phone.trim());
    formData.append("passport_number", form.passport.trim());
    formData.append("birth_date", form.birthDate);
    formData.append("travel_date", form.travelDate);
    formData.append("visa_type", form.visaType);
    formData.append("previous_visa", form.previousVisa ? "1" : "0");
    if (form.notes.trim()) formData.append("notes", form.notes.trim());
    if (passportCopy) formData.append("passport_copy", passportCopy);

    submitMutation.mutate(formData);
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
              setPassportCopy(null);
              setForm({
                firstName: "", lastName: "", email: "", phone: "", passport: "",
                birthDate: "", travelDate: "", visaType: "tourism",
                previousVisa: false, confirmData: false, notes: "",
              });
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
                <Label>Prénom *</Label>
                <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} maxLength={100} />
                {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <Label>Nom de la famille *</Label>
                <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} maxLength={100} />
                {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName}</p>}
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
              <div>
                <Label>Type de visa *</Label>
                <Select value={form.visaType} onValueChange={(v) => setForm({ ...form, visaType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tourism">Touristique</SelectItem>
                    <SelectItem value="business">Affaires</SelectItem>
                    <SelectItem value="study">Études</SelectItem>
                    <SelectItem value="family">Visite familiale</SelectItem>
                    <SelectItem value="transit">Transit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Passport copy upload */}
              <div className="md:col-span-2">
                <Label>Copie du passeport</Label>
                <div className="mt-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="passport-copy"
                  />
                  {!passportCopy ? (
                    <label
                      htmlFor="passport-copy"
                      className="flex items-center gap-3 rounded-lg border border-dashed border-border p-4 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                    >
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Choisir un fichier</p>
                        <p className="text-xs text-muted-foreground">JPG, PNG ou PDF — max 5 Mo</p>
                      </div>
                    </label>
                  ) : (
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{passportCopy.name}</p>
                        <p className="text-xs text-muted-foreground">{(passportCopy.size / 1024 / 1024).toFixed(2)} Mo</p>
                      </div>
                      <button type="button" onClick={removeFile} className="rounded-full p-1 hover:bg-muted">
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  )}
                  {uploadError && <p className="text-xs text-destructive mt-1">{uploadError}</p>}
                </div>
              </div>

              {/* Previous visa question */}
              <div className="md:col-span-2">
                <Label>Avez-vous obtenu un visa auparavant ? *</Label>
                <RadioGroup
                  value={form.previousVisa ? "yes" : "no"}
                  onValueChange={(val) => setForm({ ...form, previousVisa: val === "yes" })}
                  className="flex gap-6 mt-2"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="yes" id="prev-yes" />
                    <Label htmlFor="prev-yes" className="font-normal cursor-pointer">Oui</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="no" id="prev-no" />
                    <Label htmlFor="prev-no" className="font-normal cursor-pointer">Non</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <Label>Notes complémentaires</Label>
                <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={1000} />
              </div>

              {/* Confirmation checkbox */}
              <div className="md:col-span-2">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="confirmData"
                    checked={form.confirmData}
                    onCheckedChange={(checked) => setForm({ ...form, confirmData: checked === true })}
                    className="mt-0.5"
                  />
                  <Label htmlFor="confirmData" className="font-normal text-sm text-muted-foreground cursor-pointer leading-relaxed">
                    Je confirme l'exactitude des données fournies dans ce formulaire. *
                  </Label>
                </div>
                {errors.confirmData && <p className="text-xs text-destructive mt-1 ml-7">{errors.confirmData}</p>}
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={submitMutation.isPending}>
              {submitMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Envoi en cours...</>
              ) : (
                "Envoyer la demande"
              )}
            </Button>
          </form>
        </div>
      </PageShell>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeroCarousel pageKey="visas" height="300px" />
      <PageShell title="Demande de Visa" subtitle="Sélectionnez le pays de destination pour démarrer votre demande.">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row gap-3 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher un pays..." className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
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
    </div>
  );
}
