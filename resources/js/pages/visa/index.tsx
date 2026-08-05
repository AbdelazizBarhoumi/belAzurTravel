import { useMutation } from '@tanstack/react-query';
import {
    Search,
    CheckCircle2,
    ArrowLeft,
    ArrowRight,
    Loader2,
    Upload,
    X,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { z } from 'zod';
import { apiFetch } from '@/api/http';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeroCarousel } from '@/components/sections/PageHeroCarousel';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import { toast } from '@/hooks/use-toast';
import { useVisas } from '@/hooks/usePublicData';

interface Country {
    id: number;
    code: string;
    name: Record<string, string>;
    flag: string;
    processing: Record<string, string>;
    price: number;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const makeSchema = (t: (key: string) => string) =>
    z.object({
        firstName: z
            .string()
            .trim()
            .min(2, t('visa.firstNameRequired'))
            .max(100),
        lastName: z.string().trim().min(2, t('visa.lastNameRequired')).max(100),
        email: z.string().trim().email(t('visa.emailInvalid')).max(255),
        phone: z.string().trim().min(6, t('visa.phoneRequired')).max(20),
        passport: z.string().trim().min(4, t('visa.passportRequired')).max(30),
        birthDate: z.string().min(1, t('visa.dateRequired')),
        travelDate: z.string().min(1, t('visa.dateRequired')),
        visaType: z.string().min(1, t('visa.typeRequired')),
        previousVisa: z.boolean(),
        confirmData: z.literal(true, {
            errorMap: () => ({ message: t('visa.confirmRequired') }),
        }),
        notes: z.string().max(1000).optional(),
    });

export default function Visa() {
    const { t, lang, dir } = useLanguage();
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState<Country | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [passportCopy, setPassportCopy] = useState<File | null>(null);
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        passport: '',
        birthDate: '',
        travelDate: '',
        visaType: 'tourism',
        previousVisa: false,
        confirmData: false,
        notes: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const { data: response, isLoading } = useVisas();
    const countries = useMemo(() => response?.data ?? [], [response?.data]);
    const schema = makeSchema(t);

    const submitMutation = useMutation({
        mutationFn: async (data: FormData) => {
            return apiFetch<{ message: string }>('/api/visa-applications', {
                method: 'POST',
                body: data,
            });
        },
        onSuccess: () => {
            setSubmitted(true);
            const name = selected ? localizeText(selected.name, lang) : '';
            toast({
                title: t('visa.toastSuccessTitle'),
                description: t('visa.toastSuccessDescription').replace(
                    '{name}',
                    name,
                ),
            });
        },
        onError: () => {
            toast({
                title: t('visa.toastErrorTitle'),
                description: t('visa.toastErrorDescription'),
                variant: 'destructive',
            });
        },
    });

    const filtered = useMemo(
        () =>
            countries.filter((c) =>
                localizeText(c.name, lang)
                    .toLowerCase()
                    .includes(query.toLowerCase()),
            ),
        [query, countries, lang],
    );

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setUploadError('');
        if (!file) return;
        if (!ACCEPTED_TYPES.includes(file.type)) {
            setUploadError(t('visa.invalidFileType'));
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            setUploadError(t('visa.fileTooLarge'));
            return;
        }
        setPassportCopy(file);
    };

    const removeFile = () => {
        setPassportCopy(null);
        setUploadError('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const parsed = schema.safeParse(form);
        if (!parsed.success) {
            const errs: Record<string, string> = {};
            parsed.error.issues.forEach(
                (i) => (errs[i.path[0] as string] = i.message),
            );
            setErrors(errs);
            return;
        }
        setErrors({});

        const formData = new FormData();
        formData.append('visa_id', String(selected!.id));
        formData.append('first_name', form.firstName.trim());
        formData.append('last_name', form.lastName.trim());
        formData.append('email', form.email.trim());
        formData.append('phone', form.phone.trim());
        formData.append('passport_number', form.passport.trim());
        formData.append('birth_date', form.birthDate);
        formData.append('travel_date', form.travelDate);
        formData.append('visa_type', form.visaType);
        formData.append('previous_visa', form.previousVisa ? '1' : '0');
        if (form.notes.trim()) formData.append('notes', form.notes.trim());
        if (passportCopy) formData.append('passport_copy', passportCopy);

        submitMutation.mutate(formData);
    };

    if (isLoading) {
        return (
            <PageShell titleKey="visa.title" subtitleKey="visa.loading">
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </PageShell>
        );
    }

    if (submitted && selected) {
        return (
            <PageShell
                titleKey="visa.submittedTitle"
                subtitleKey="visa.submittedSubtitle"
            >
                <div className="card-elevated mx-auto max-w-md rounded-2xl bg-card p-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <CheckCircle2 className="h-8 w-8 text-primary" />
                    </div>
                    <p className="mb-2 text-6xl">{selected.flag}</p>
                    <h3 className="mb-2 font-serif text-2xl font-bold text-foreground">
                        {t('visa.forCountry').replace(
                            '{name}',
                            localizeText(selected.name, lang),
                        )}
                    </h3>
                    <p className="mb-6 text-muted-foreground">
                        {t('visa.advisorNote')}
                    </p>
                    <Button
                        onClick={() => {
                            setSubmitted(false);
                            setSelected(null);
                            setPassportCopy(null);
                            setForm({
                                firstName: '',
                                lastName: '',
                                email: '',
                                phone: '',
                                passport: '',
                                birthDate: '',
                                travelDate: '',
                                visaType: 'tourism',
                                previousVisa: false,
                                confirmData: false,
                                notes: '',
                            });
                        }}
                    >
                        {t('visa.newRequest')}
                    </Button>
                </div>
            </PageShell>
        );
    }

    if (selected) {
        return (
            <PageShell
                title={`${t('visa.forCountry').replace('{name}', localizeText(selected.name, lang))} ${selected.flag}`}
                subtitle={`${t('visa.processingLabel')} : ${localizeText(selected.processing, lang)} · ${t('common.from')} ${selected.price} ${t('visa.currency')}`}
            >
                <div className="mx-auto max-w-2xl">
                    <button
                        onClick={() => setSelected(null)}
                        className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                        {dir === 'rtl' ? (
                            <ArrowRight className="h-4 w-4" />
                        ) : (
                            <ArrowLeft className="h-4 w-4" />
                        )}{' '}
                        {t('visa.chooseAnotherCountry')}
                    </button>
                    <form
                        onSubmit={submit}
                        className="card-elevated space-y-4 rounded-2xl bg-card p-6 md:p-8"
                    >
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <Label>{t('visa.firstName')} *</Label>
                                <Input
                                    value={form.firstName}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            firstName: e.target.value,
                                        })
                                    }
                                    maxLength={100}
                                />
                                {errors.firstName && (
                                    <p className="mt-1 text-xs text-destructive">
                                        {errors.firstName}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label>{t('visa.lastName')} *</Label>
                                <Input
                                    value={form.lastName}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            lastName: e.target.value,
                                        })
                                    }
                                    maxLength={100}
                                />
                                {errors.lastName && (
                                    <p className="mt-1 text-xs text-destructive">
                                        {errors.lastName}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label>{t('visa.email')} *</Label>
                                <Input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            email: e.target.value,
                                        })
                                    }
                                    maxLength={255}
                                />
                                {errors.email && (
                                    <p className="mt-1 text-xs text-destructive">
                                        {errors.email}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label>{t('visa.phone')} *</Label>
                                <Input
                                    value={form.phone}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            phone: e.target.value,
                                        })
                                    }
                                    maxLength={20}
                                />
                                {errors.phone && (
                                    <p className="mt-1 text-xs text-destructive">
                                        {errors.phone}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label>{t('visa.passport')} *</Label>
                                <Input
                                    value={form.passport}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            passport: e.target.value,
                                        })
                                    }
                                    maxLength={30}
                                />
                                {errors.passport && (
                                    <p className="mt-1 text-xs text-destructive">
                                        {errors.passport}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label>{t('visa.birthDate')} *</Label>
                                <Input
                                    type="date"
                                    value={form.birthDate}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            birthDate: e.target.value,
                                        })
                                    }
                                />
                                {errors.birthDate && (
                                    <p className="mt-1 text-xs text-destructive">
                                        {errors.birthDate}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label>{t('visa.travelDate')} *</Label>
                                <Input
                                    type="date"
                                    value={form.travelDate}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            travelDate: e.target.value,
                                        })
                                    }
                                />
                                {errors.travelDate && (
                                    <p className="mt-1 text-xs text-destructive">
                                        {errors.travelDate}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label>{t('visa.visaType')} *</Label>
                                <Select
                                    value={form.visaType}
                                    onValueChange={(v) =>
                                        setForm({ ...form, visaType: v })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="tourism">
                                            {t('visa.typeTourism')}
                                        </SelectItem>
                                        <SelectItem value="business">
                                            {t('visa.typeBusiness')}
                                        </SelectItem>
                                        <SelectItem value="study">
                                            {t('visa.typeStudy')}
                                        </SelectItem>
                                        <SelectItem value="family">
                                            {t('visa.typeFamily')}
                                        </SelectItem>
                                        <SelectItem value="transit">
                                            {t('visa.typeTransit')}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Passport copy upload */}
                            <div className="md:col-span-2">
                                <Label>{t('visa.passportCopy')}</Label>
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
                                            className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border p-4 transition-colors hover:border-primary/50 hover:bg-muted/30"
                                        >
                                            <Upload className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm font-medium text-foreground">
                                                    {t('visa.chooseFile')}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {t('visa.fileHint')}
                                                </p>
                                            </div>
                                        </label>
                                    ) : (
                                        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-foreground">
                                                    {passportCopy.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {(
                                                        passportCopy.size /
                                                        1024 /
                                                        1024
                                                    ).toFixed(2)}{' '}
                                                    {t('visa.mb')}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={removeFile}
                                                className="rounded-full p-1 hover:bg-muted"
                                            >
                                                <X className="h-4 w-4 text-muted-foreground" />
                                            </button>
                                        </div>
                                    )}
                                    {uploadError && (
                                        <p className="mt-1 text-xs text-destructive">
                                            {uploadError}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Previous visa question */}
                            <div className="md:col-span-2">
                                <Label>
                                    {t('visa.previousVisaQuestion')} *
                                </Label>
                                <RadioGroup
                                    value={form.previousVisa ? 'yes' : 'no'}
                                    onValueChange={(val) =>
                                        setForm({
                                            ...form,
                                            previousVisa: val === 'yes',
                                        })
                                    }
                                    className="mt-2 flex gap-6"
                                >
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem
                                            value="yes"
                                            id="prev-yes"
                                        />
                                        <Label
                                            htmlFor="prev-yes"
                                            className="cursor-pointer font-normal"
                                        >
                                            {t('visa.yes')}
                                        </Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem
                                            value="no"
                                            id="prev-no"
                                        />
                                        <Label
                                            htmlFor="prev-no"
                                            className="cursor-pointer font-normal"
                                        >
                                            {t('visa.no')}
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {/* Notes */}
                            <div className="md:col-span-2">
                                <Label>{t('visa.notes')}</Label>
                                <Textarea
                                    rows={3}
                                    value={form.notes}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            notes: e.target.value,
                                        })
                                    }
                                    maxLength={1000}
                                />
                            </div>

                            {/* Confirmation checkbox */}
                            <div className="md:col-span-2">
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        id="confirmData"
                                        checked={form.confirmData}
                                        onCheckedChange={(checked) =>
                                            setForm({
                                                ...form,
                                                confirmData: checked === true,
                                            })
                                        }
                                        className="mt-0.5"
                                    />
                                    <Label
                                        htmlFor="confirmData"
                                        className="cursor-pointer text-sm font-normal leading-relaxed text-muted-foreground"
                                    >
                                        {t('visa.confirmData')} *
                                    </Label>
                                </div>
                                {errors.confirmData && (
                                    <p className="ms-7 mt-1 text-xs text-destructive">
                                        {errors.confirmData}
                                    </p>
                                )}
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            disabled={submitMutation.isPending}
                        >
                            {submitMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
                                    {t('visa.submitting')}
                                </>
                            ) : (
                                t('visa.submit')
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
            <PageShell
                titleKey="visa.title"
                subtitleKey="visa.selectCountrySubtitle"
            >
                <div className="mx-auto max-w-5xl">
                    <div className="mb-8 flex flex-col gap-3 md:flex-row">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder={t('visa.searchPlaceholder')}
                                className="pl-9"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        {filtered.map((c) => (
                            <button
                                key={c.code}
                                onClick={() => setSelected(c)}
                                className="card-elevated group rounded-2xl border border-transparent bg-card p-5 text-start transition-all hover:border-primary"
                            >
                                <p className="mb-3 text-5xl">{c.flag}</p>
                                <h3 className="font-serif text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                                    {localizeText(c.name, lang)}
                                </h3>
                                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                                    <span className="text-xs text-muted-foreground">
                                        {localizeText(c.processing, lang)}
                                    </span>
                                    <span className="text-sm font-bold text-secondary">
                                        {c.price} {t('visa.currency')}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                    {filtered.length === 0 && (
                        <p className="py-12 text-center text-muted-foreground">
                            {t('visa.noCountries')}
                        </p>
                    )}
                </div>
            </PageShell>
        </div>
    );
}
