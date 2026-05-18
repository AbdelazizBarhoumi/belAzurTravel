import { useMemo, useState, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Lang } from '@/i18n/translations';

export type FieldType = 'text' | 'number' | 'textarea' | 'select' | 'checkbox';

export interface FieldOption {
    label: string;
    value: string;
}

export interface FieldDef {
    key: string;
    label: string;
    type?: FieldType;
    options?: Array<string | FieldOption>;
    placeholder?: string;
    helpText?: string;
    required?: boolean;
    disabled?: boolean;
    rows?: number;
    colSpan?: 1 | 2 | 3 | 4;
}

export interface SectionDef {
    id?: string;
    title?: string;
    description?: string;
    columns?: 1 | 2 | 3 | 4;
    fields?: FieldDef[];
    render?: (api: SectionRenderApi) => ReactNode;
    // when using a multi-column dialog layout, allow this section to span both columns
    gridSpan?: 1 | 2;
}

export interface SectionRenderApi {
    values: Record<string, unknown>;
    setField: (key: string, value: unknown) => void;
}

export interface EntityFormDialogProps<T extends object> {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    subtitle?: string;
    initial?: T | null;
    sections?: SectionDef[];
    fields?: FieldDef[];
    onSubmit: (values: T) => void;
    submitLabel?: string;
    // optional language controls to match the destinations dialog style
    languages?: Lang[];
    // if provided, the component will show a language badge and buttons in the header
    layout?: 'stack' | 'grid-2';
    // controlled active language (optional)
    activeLang?: Lang;
    onActiveLangChange?: (lang: Lang) => void;
}

function toRecord(value?: object | null): Record<string, unknown> {
    if (!value) return {};
    const out: Record<string, unknown> = {};
    const rec = value as Record<string, unknown>;
    for (const [k, v] of Object.entries(rec)) {
        if (Array.isArray(v)) {
            if (v.every((i) => typeof i === 'string' || typeof i === 'number')) {
                out[k] = (v as Array<string | number>).map((i) => String(i)).join('\n');
                continue;
            }
        }
        out[k] = v;
    }
    return out;
}

function normalizeValue(value: unknown): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return value ? '1' : '0';
    return '';
}

function normalizeColumns(columns?: 1 | 2 | 3 | 4): string {
    switch (columns ?? 1) {
        case 2:
            return 'grid gap-4 md:grid-cols-2';
        case 3:
            return 'grid gap-4 md:grid-cols-2 xl:grid-cols-3';
        case 4:
            return 'grid gap-4 md:grid-cols-2 xl:grid-cols-4';
        default:
            return 'grid gap-4';
    }
}

function normalizeSpan(span?: 1 | 2 | 3 | 4): string {
    switch (span ?? 1) {
        case 2:
            return 'md:col-span-2';
        case 3:
            return 'md:col-span-2 xl:col-span-3';
        case 4:
            return 'md:col-span-2 xl:col-span-4';
        default:
            return '';
    }
}

function optionToValue(option: string | FieldOption): string {
    return typeof option === 'string' ? option : option.value;
}

function optionToLabel(option: string | FieldOption): string {
    return typeof option === 'string' ? option : option.label;
}

function FieldControl({
    field,
    value,
    onChange,
}: {
    field: FieldDef;
    value: unknown;
    onChange: (next: string | boolean) => void;
}) {
    const commonInputClass =
        'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';
    const stringValue = normalizeValue(value);

    return (
        <div className={`space-y-2 ${normalizeSpan(field.colSpan)}`}>
            <Label htmlFor={field.key} className="text-xs font-semibold text-muted-foreground">
                {field.label}
            </Label>

            {field.type === 'textarea' ? (
                <Textarea
                    id={field.key}
                    value={stringValue}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={field.placeholder}
                    rows={field.rows ?? 4}
                    required={field.required}
                    disabled={field.disabled}
                    className="min-h-24"
                />
            ) : field.type === 'select' ? (
                <select
                    id={field.key}
                    value={stringValue}
                    onChange={(event) => onChange(event.target.value)}
                    required={field.required}
                    disabled={field.disabled}
                    className={commonInputClass}
                >
                    <option value="">Select an option</option>
                    {(field.options ?? []).map((option) => {
                        const optionValue = optionToValue(option);
                        return (
                            <option key={optionValue} value={optionValue}>
                                {optionToLabel(option)}
                            </option>
                        );
                    })}
                </select>
            ) : field.type === 'checkbox' ? (
                <label className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    <input
                        id={field.key}
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(event) => onChange(event.target.checked)}
                        disabled={field.disabled}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span>{field.placeholder ?? field.label}</span>
                </label>
            ) : (
                <Input
                    id={field.key}
                    type={field.type === 'number' ? 'number' : 'text'}
                    value={stringValue}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    disabled={field.disabled}
                    className={commonInputClass}
                />
            )}

            {field.helpText ? (
                <p className="text-xs text-muted-foreground">{field.helpText}</p>
            ) : null}
        </div>
    );
}

function SectionCard({
    section,
    values,
    setField,
}: {
    section: SectionDef;
    values: Record<string, unknown>;
    setField: (key: string, value: unknown) => void;
}) {
    const hasFields = (section.fields?.length ?? 0) > 0;

    return (
        <section className="space-y-4 rounded-3xl border border-border bg-muted/20 p-5 shadow-sm">
            {section.title || section.description ? (
                <div className="space-y-1">
                    {section.title ? (
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                            {section.title}
                        </h3>
                    ) : null}
                    {section.description ? (
                        <p className="text-sm text-muted-foreground">{section.description}</p>
                    ) : null}
                </div>
            ) : null}

            {hasFields ? (
                <div className={normalizeColumns(section.columns)}>
                    {section.fields?.map((field) => (
                        <FieldControl
                            key={field.key}
                            field={field}
                            value={values[field.key]}
                            onChange={(next) => setField(field.key, next)}
                        />
                    ))}
                </div>
            ) : null}

            {section.render ? section.render({ values, setField }) : null}
        </section>
    );
}

export function EntityFormDialog<T extends object>({
    open,
    onOpenChange,
    title,
    subtitle,
    initial,
    sections,
    fields,
    onSubmit,
    submitLabel,
    languages,
    layout = 'stack',
    activeLang: activeLangProp,
    onActiveLangChange,
}: EntityFormDialogProps<T>) {
    const { t } = useLanguage();
    const [values, setValues] = useState<Record<string, unknown>>(() => toRecord(initial));
    const [internalActiveLang, setInternalActiveLang] = useState<Lang>(
        languages && languages.length > 0 ? languages[0] : ('en' as Lang),
    );
    const activeLang = activeLangProp ?? internalActiveLang;
    const formKey = useMemo(() => JSON.stringify(initial ?? {}), [initial]);

    const effectiveSections = useMemo<SectionDef[]>(() => {
        if (sections && sections.length > 0) {
            return sections;
        }

        if (fields && fields.length > 0) {
            return [{ fields }];
        }

        return [];
    }, [fields, sections]);

    const setField = (key: string, value: unknown) => {
        setValues((current) => ({
            ...current,
            [key]: value,
        }));
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSubmit(values as T);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] max-w-6xl overflow-hidden p-0">
                <form key={formKey} onSubmit={handleSubmit} className="flex max-h-[92vh] flex-col">
                    <DialogHeader className="border-b border-border px-6 py-5 text-left">
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="space-y-1">
                                    <DialogTitle className="text-2xl">{title}</DialogTitle>
                                    {subtitle ? (
                                        <DialogDescription className="max-w-3xl">{subtitle}</DialogDescription>
                                    ) : null}
                                </div>

                                {languages ? (
                                    <Badge variant="secondary" className="text-xs uppercase tracking-wide">
                                        {activeLang.toUpperCase()}
                                    </Badge>
                                ) : null}
                            </div>

                            {languages ? (
                                <div className="flex flex-wrap gap-2">
                                    {languages.map((code) => (
                                        <Button
                                            key={code}
                                            type="button"
                                            variant={activeLang === code ? 'default' : 'outline'}
                                            className="min-w-14"
                                            onClick={() => {
                                                setInternalActiveLang(code);
                                                onActiveLangChange?.(code);
                                            }}
                                        >
                                            {code.toUpperCase()}
                                        </Button>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-6 py-6">
                        {layout === 'grid-2' ? (
                            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                                {effectiveSections.map((section, index) => (
                                    <div
                                        key={section.id ?? `${section.title ?? 'section'}-${index}`}
                                        className={section.gridSpan === 2 ? 'lg:col-span-2' : ''}
                                    >
                                        <SectionCard section={section} values={values} setField={setField} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {effectiveSections.map((section, index) => (
                                    <SectionCard
                                        key={section.id ?? `${section.title ?? 'section'}-${index}`}
                                        section={section}
                                        values={values}
                                        setField={setField}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="border-t border-border px-6 py-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            {t('actions.cancel')}
                        </Button>
                        <Button type="submit" className="bg-primary text-primary-foreground">
                            {submitLabel ?? t('actions.save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default EntityFormDialog;
