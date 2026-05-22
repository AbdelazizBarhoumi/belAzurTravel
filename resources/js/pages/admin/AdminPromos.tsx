import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
    deleteAdminEntity,
    listAdminEntities,
    saveAdminEntity,
    type AdminRow,
} from '@/api/admin.api';
import { StatusSelect } from '@/components/ui/StatusSelect';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
    EntityFormDialog,
    type SectionDef,
} from '@/components/forms/EntityFormDialog';
import {
    JsonListEditor,
    type JsonFieldDef,
} from '@/components/forms/JsonListEditor';
import LangBadge from '@/components/forms/LangBadge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import type { Lang } from '@/i18n/translations';
import { isHexColor } from '@/lib/promoColor';
import { localizeAdminValue } from '@/lib/adminI18n';
import { useEffect } from 'react';

type Copy = Record<Lang, string>;

const copy = (en: string, fr: string, ar: string): Copy => ({ en, fr, ar });

const columns: Array<{ key: string; label: Copy }> = [
    { key: 'code', label: copy('Code', 'Code', 'الرمز') },
    { key: 'title', label: copy('Title', 'Titre', 'العنوان') },
    {
        key: 'discount',
        label: copy('Discount', 'Remise', 'الخصم'),
    },
    {
        key: 'expires',
        label: copy('Expires', 'Expiration', 'ينتهي'),
    },
];

const simpleLocalizedSchema: JsonFieldDef[] = [
    { key: 'name', labelKey: 'admin.promos.fieldName', translatable: true },
];

const FALLBACK_PICKER_COLOR = '#0ea5e9';

// Applicable to options from config/promos.php
const APPLICABLE_TO_OPTIONS = [
    { value: 'all', labelKey: 'admin.promos.applicableTo.all' },
    { value: 'flights', labelKey: 'admin.promos.applicableTo.flights' },
    { value: 'hotels', labelKey: 'admin.promos.applicableTo.hotels' },
    { value: 'tours', labelKey: 'admin.promos.applicableTo.tours' },
    { value: 'deals', labelKey: 'admin.promos.applicableTo.deals' },
    { value: 'cars', labelKey: 'admin.promos.applicableTo.cars' },
    { value: 'events', labelKey: 'admin.promos.applicableTo.events' },
    {
        value: 'new_customers',
        labelKey: 'admin.promos.applicableTo.new_customers',
    },
    {
        value: 'existing_customers',
        labelKey: 'admin.promos.applicableTo.existing_customers',
    },
];

function PromoColorPicker({
    value,
    onChange,
}: {
    value: string;
    onChange: (next: string) => void;
}) {
    const [pickerValue, setPickerValue] = useState(
        isHexColor(value) ? value : FALLBACK_PICKER_COLOR,
    );

    useEffect(() => {
        setPickerValue(isHexColor(value) ? value : FALLBACK_PICKER_COLOR);
    }, [value]);

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-3">
                <input
                    type="color"
                    value={pickerValue}
                    onChange={(event) => {
                        setPickerValue(event.target.value);
                        onChange(event.target.value);
                    }}
                    className="h-10 w-14 cursor-pointer rounded-md border border-border bg-background p-1"
                    aria-label="Promo color picker"
                />
                <span className="text-xs text-muted-foreground">
                    {pickerValue.toUpperCase()}
                </span>
            </div>
            <p className="text-[10px] text-muted-foreground">
                Choose the promo background color.
            </p>
        </div>
    );
}

type ApiValidationError = {
    status?: number;
    data?: {
        message?: string;
        errors?: Record<string, string | string[]>;
    };
};

function flattenValidationErrors(
    error: unknown,
): Record<string, string> | null {
    const apiError = error as ApiValidationError | null | undefined;
    const validationErrors = apiError?.data?.errors;

    if (!validationErrors || typeof validationErrors !== 'object') {
        return null;
    }

    return Object.entries(validationErrors).reduce(
        (acc: Record<string, string>, [key, value]) => {
            if (Array.isArray(value)) {
                const firstMessage = value.find(
                    (item) => typeof item === 'string',
                );
                if (firstMessage) acc[key] = firstMessage;
                return acc;
            }

            if (typeof value === 'string') {
                acc[key] = value;
            }

            return acc;
        },
        {},
    );
}

export default function AdminPromos() {
    useAdminGuard();
    const { t, lang } = useLanguage();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<AdminRow | null>(null);
    const [pendingDelete, setPendingDelete] = useState<AdminRow | null>(null);

    const queryKey = useMemo(() => ['admin', 'promos'], []);
    const { data: rows = [] } = useQuery<AdminRow[]>({
        queryKey,
        queryFn: () => listAdminEntities<AdminRow>('promos'),
    });

    const saveMutation = useMutation({
        mutationFn: (row: Record<string, unknown>) =>
            saveAdminEntity('promos', row as { id?: string | number | null }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAdminEntity('promos', id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            toast.success(t('actions.deleted'));
        },
    });

    const dialogInitial: Record<string, unknown> | null = useMemo(() => {
        if (!editing) return null;

        return {
            ...editing,
            // StatusSelect expects '1' or '0' string values. Ensure active is mapped accordingly
            active:
                editing.active === undefined || editing.active === null
                    ? '1'
                    : editing.active
                      ? '1'
                      : '0',
            eligibility: Array.isArray(editing.eligibility)
                ? editing.eligibility
                : [],
            howToUse: Array.isArray(editing.howToUse) ? editing.howToUse : [],
            terms: Array.isArray(editing.terms) ? editing.terms : [],
        };
    }, [editing]);

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Reset errors when modal opens/closes
    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            setErrors({});
            setEditing(null);
        }
    };

    const validate = (
        values: Record<string, unknown>,
    ): Record<string, string> => {
        const errs: Record<string, string> = {};
        if (!values.code) errs.code = t('admin.errors.required');
        if (!values.title_en) errs.title_en = t('admin.errors.required');
        return errs;
    };

    function handleSave(
        values: Record<string, unknown>,
        callback?: (success: boolean) => void,
    ) {
        const errs = validate(values);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            toast.error(t('admin.pleaseFixErrors'));
            callback?.(false);
            return;
        }

        setErrors({});

        const payload: Record<string, unknown> = {
            ...values,
            id: editing?.id ?? '',
            usage_limit: values.usage_limit ? Number(values.usage_limit) : null,
            per_user_limit: values.per_user_limit
                ? Number(values.per_user_limit)
                : null,
            active: values.active === '1',
            eligibility: Array.isArray(values.eligibility)
                ? values.eligibility
                : [],
            howToUse: Array.isArray(values.howToUse) ? values.howToUse : [],
            terms: Array.isArray(values.terms) ? values.terms : [],
        };

        saveMutation.mutate(payload, {
            onSuccess: () => {
                toast.success(
                    editing ? t('actions.saved') : t('actions.added'),
                );
                setEditing(null);
                setErrors({});
                setOpen(false);
                callback?.(true);
            },
            onError: (error) => {
                const validationErrors = flattenValidationErrors(error);

                if (validationErrors) {
                    setErrors(validationErrors);
                    toast.error(t('admin.pleaseFixErrors'));
                } else {
                    toast.error(t('admin.saveError'));
                }
                callback?.(false);
            },
        });
    }

    const promoSections: SectionDef[] = [
        {
            title: t('admin.promos.coreInfoTitle'),
            description: t('admin.promos.coreInfoDescription'),
            render: ({ values, setField, activeLang, errors }) => (
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground">
                                {t('admin.promos.code')}
                            </label>
                            <input
                                value={String(values.code ?? '')}
                                onChange={(e) =>
                                    setField('code', e.target.value)
                                }
                                placeholder={t('admin.promos.codePlaceholder')}
                                className={`w-full rounded-lg border px-3 py-2 text-sm ${errors?.code ? 'border-destructive ring-1 ring-destructive' : 'border-border'}`}
                            />
                            {errors?.code && (
                                <p className="text-xs text-destructive">
                                    {errors.code}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground">
                                {t('admin.promos.colorToken')}
                            </label>
                            <PromoColorPicker
                                value={String(values.color ?? '')}
                                onChange={(next) => setField('color', next)}
                            />
                        </div>
                        {[
                            {
                                key: 'title',
                                label: t('admin.promos.titleLabel'),
                                placeholder: t('admin.promos.titlePlaceholder'),
                            },
                            {
                                key: 'discount',
                                label: t('admin.promos.discount'),
                                placeholder: t(
                                    'admin.promos.discountPlaceholder',
                                ),
                            },
                            {
                                key: 'expires',
                                label: t('admin.promos.expires'),
                                placeholder: t(
                                    'admin.promos.expiresPlaceholder',
                                ),
                            },
                        ].map((field) => {
                            const fieldKey = `${field.key}_${activeLang}`;
                            const isTitle = field.key === 'title';
                            const fieldError = errors?.[fieldKey] as
                                | string
                                | undefined;

                            return (
                                <div key={fieldKey} className="space-y-2">
                                    <label
                                        htmlFor={fieldKey}
                                        className="text-xs font-semibold text-muted-foreground"
                                    >
                                        {field.label}
                                        <LangBadge lang={activeLang} />
                                    </label>
                                    <input
                                        id={fieldKey}
                                        value={String(values[fieldKey] ?? '')}
                                        placeholder={field.placeholder}
                                        onChange={(event) =>
                                            setField(
                                                fieldKey,
                                                event.target.value,
                                            )
                                        }
                                        className={`w-full rounded-lg border px-3 py-2 text-sm ${fieldError ? 'border-destructive ring-1 ring-destructive' : 'border-border'}`}
                                    />
                                    {fieldError && (
                                        <p className="text-xs text-destructive">
                                            {fieldError}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ),
        },
        {
            title: t('admin.promos.descriptionRulesTitle'),
            description: t('admin.promos.descriptionRulesDescription'),
            render: ({ values, setField, activeLang, errors }) => (
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">
                            {t('admin.promos.description')}{' '}
                            <LangBadge lang={activeLang} />
                        </label>
                        <textarea
                            value={String(
                                values[`description_${activeLang}`] ?? '',
                            )}
                            onChange={(e) =>
                                setField(
                                    `description_${activeLang}`,
                                    e.target.value,
                                )
                            }
                            rows={3}
                            placeholder={t(
                                'admin.promos.descriptionPlaceholder',
                            )}
                            className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-sm ${errors?.[`description_${activeLang}`] ? 'border-destructive ring-1 ring-destructive' : ''}`}
                        />
                        {errors?.[`description_${activeLang}`] && (
                            <p className="text-xs text-destructive">
                                {errors[`description_${activeLang}`]}
                            </p>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-xl border border-border bg-muted/20 p-4">
                            <p className="text-xs text-muted-foreground">
                                {t('admin.promos.eligibilityHint')}
                            </p>
                        </div>
                        <JsonListEditor
                            title={t('admin.promos.eligibility')}
                            items={
                                Array.isArray(values.eligibility)
                                    ? values.eligibility
                                    : []
                            }
                            onItemsChange={(items) =>
                                setField('eligibility', items)
                            }
                            schema={simpleLocalizedSchema}
                            activeLang={activeLang}
                            addButtonLabel={t('admin.promos.addRule')}
                            itemLabel={(item, index) =>
                                (
                                    item.name as
                                        | Record<string, string>
                                        | undefined
                                )?.[activeLang] ||
                                `${t('admin.promos.rule')} ${index + 1}`
                            }
                        />
                    </div>

                    <div className="space-y-4 border-t border-border pt-6">
                        <div className="rounded-xl border border-border bg-muted/20 p-4">
                            <p className="text-xs text-muted-foreground">
                                {t('admin.promos.howToUseHint')}
                            </p>
                        </div>
                        <JsonListEditor
                            title={t('admin.promos.howToUse')}
                            items={
                                Array.isArray(values.howToUse)
                                    ? values.howToUse
                                    : []
                            }
                            onItemsChange={(items) =>
                                setField('howToUse', items)
                            }
                            schema={simpleLocalizedSchema}
                            activeLang={activeLang}
                            addButtonLabel={t('admin.promos.addStep')}
                            itemLabel={(item, index) =>
                                (
                                    item.name as
                                        | Record<string, string>
                                        | undefined
                                )?.[activeLang] ||
                                `${t('admin.promos.step')} ${index + 1}`
                            }
                        />
                    </div>

                    <div className="space-y-4 border-t border-border pt-6">
                        <div className="rounded-xl border border-border bg-muted/20 p-4">
                            <p className="text-xs text-muted-foreground">
                                {t('admin.promos.termsHint')}
                            </p>
                        </div>
                        <JsonListEditor
                            title={t('admin.promos.terms')}
                            items={
                                Array.isArray(values.terms) ? values.terms : []
                            }
                            onItemsChange={(items) => setField('terms', items)}
                            schema={simpleLocalizedSchema}
                            activeLang={activeLang}
                            addButtonLabel={t('admin.promos.addTerm')}
                            itemLabel={(item, index) =>
                                (
                                    item.name as
                                        | Record<string, string>
                                        | undefined
                                )?.[activeLang] ||
                                `${t('admin.promos.term')} ${index + 1}`
                            }
                        />
                    </div>
                </div>
            ),
        },
        {
            title: t('admin.promos.limitsTitle'),
            description: t('admin.promos.limitsDescription'),
            render: ({ values, setField }) => (
                <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label
                                htmlFor="promo-usage_limit"
                                className="text-xs font-semibold text-muted-foreground"
                            >
                                {t('admin.promos.usageLimit')}
                            </label>
                            <input
                                id="promo-usage_limit"
                                type="number"
                                min="0"
                                placeholder="0"
                                value={String(values.usage_limit ?? '')}
                                onChange={(event) =>
                                    setField('usage_limit', event.target.value)
                                }
                                className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-sm ${/* show errors if any */ ''}`}
                            />
                            <p className="text-[10px] text-muted-foreground">
                                {t('admin.promos.usageLimitHelp')}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label
                                htmlFor="promo-per_user_limit"
                                className="text-xs font-semibold text-muted-foreground"
                            >
                                {t('admin.promos.perUserLimit')}
                            </label>
                            <input
                                id="promo-per_user_limit"
                                type="number"
                                min="0"
                                placeholder="1"
                                value={String(values.per_user_limit ?? '')}
                                onChange={(event) =>
                                    setField(
                                        'per_user_limit',
                                        event.target.value,
                                    )
                                }
                                className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-sm ${/* show errors if any */ ''}`}
                            />
                            <p className="text-[10px] text-muted-foreground">
                                {t('admin.promos.perUserLimitHelp')}
                            </p>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label
                                htmlFor="promo-applicable_to"
                                className="text-xs font-semibold text-muted-foreground"
                            >
                                {t('admin.promos.applicableTo')}
                            </label>
                            {(() => {
                                const applicableToError = (
                                    errors as Record<string, string> | undefined
                                )?.applicable_to;
                                return (
                                    <>
                                        <Select
                                            value={String(
                                                values.applicable_to ?? '',
                                            )}
                                            onValueChange={(val) =>
                                                setField('applicable_to', val)
                                            }
                                        >
                                            <SelectTrigger
                                                id="promo-applicable_to"
                                                className={`w-full rounded-lg ${applicableToError ? 'border-destructive ring-1 ring-destructive' : 'border-border'}`}
                                            >
                                                <SelectValue
                                                    placeholder={t(
                                                        'admin.promos.applicableToPlaceholder',
                                                    )}
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {APPLICABLE_TO_OPTIONS.map(
                                                    (option) => (
                                                        <SelectItem
                                                            key={option.value}
                                                            value={option.value}
                                                        >
                                                            {t(option.labelKey)}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {applicableToError && (
                                            <p className="text-xs text-destructive">
                                                {applicableToError}
                                            </p>
                                        )}
                                    </>
                                );
                            })()}
                            <p className="text-[10px] text-muted-foreground">
                                {t('admin.promos.applicableToHelp')}
                            </p>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label
                                htmlFor="promo-active"
                                className="text-xs font-semibold text-muted-foreground"
                            >
                                {t('admin.promos.active')}
                            </label>
                            {(() => {
                                const activeError = (
                                    errors as Record<string, string> | undefined
                                )?.active;
                                return (
                                    <>
                                        <StatusSelect
                                            value={String(values.active ?? '1')}
                                            onValueChange={(val) =>
                                                setField('active', val)
                                            }
                                            options={[
                                                {
                                                    value: '1',
                                                    label: t(
                                                        'admin.promos.active',
                                                    ),
                                                },
                                                {
                                                    value: '0',
                                                    label: t(
                                                        'admin.promos.inactive',
                                                    ),
                                                },
                                            ]}
                                            className={`w-full rounded-xl ${activeError ? 'border-destructive ring-1 ring-destructive' : ''}`}
                                        />
                                        {activeError && (
                                            <p className="text-xs text-destructive">
                                                {activeError}
                                            </p>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            ),
        },
    ];

    return (
        <AdminLayout
            title={t('admin.promos.title')}
            subtitle={t('admin.promos.subtitle')}
            actions={
                <Button
                    onClick={() => {
                        setEditing(null);
                        setOpen(true);
                    }}
                    className="gap-2 bg-primary text-primary-foreground"
                >
                    <Plus className="h-4 w-4" /> {t('actions.add')}
                </Button>
            }
        >
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                {columns.map((column, index) => (
                                    <th
                                        key={column.key}
                                        className={`px-4 py-3 text-xs font-semibold uppercase text-muted-foreground ${index === 1 ? (lang === 'ar' ? 'text-right' : 'text-left') : 'text-center'}`}
                                    >
                                        {column.label[lang]}
                                    </th>
                                ))}
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-muted-foreground">
                                    {t('admin.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row: AdminRow) => (
                                <tr
                                    key={String(row.id)}
                                    className="border-b border-border last:border-0 hover:bg-muted/20"
                                >
                                    {columns.map((column, index) => (
                                        <td
                                            key={column.key}
                                            className={`max-w-64 truncate px-4 py-3 text-sm ${index === 1 ? (lang === 'ar' ? 'text-right' : 'text-left') : 'text-center'}`}
                                        >
                                            {column.key === 'code'
                                                ? String(row[column.key] ?? '')
                                                : localizeAdminValue(
                                                      row,
                                                      column.key,
                                                      lang,
                                                  )}
                                        </td>
                                    ))}
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditing(row);
                                                    setOpen(true);
                                                }}
                                                className="rounded-lg p-1.5 hover:bg-muted"
                                                aria-label={t('actions.edit')}
                                            >
                                                <Edit className="h-4 w-4 text-muted-foreground" />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setPendingDelete(row)
                                                }
                                                className="rounded-lg p-1.5 hover:bg-destructive/10"
                                                aria-label={t('actions.delete')}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmDialog
                open={!!pendingDelete}
                onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        setPendingDelete(null);
                    }
                }}
                title={t('admin.deleteItemTitle')}
                description={
                    pendingDelete
                        ? `${t('admin.deleteItemPrompt')} “${String(pendingDelete.title_en ?? '')}”? ${t('admin.deleteItemWarning')}`
                        : t('admin.deleteItemFallback')
                }
                confirmText={t('actions.delete')}
                cancelText={t('actions.cancel')}
                onConfirm={() => {
                    if (!pendingDelete) return;
                    deleteMutation.mutate(String(pendingDelete.id));
                    setPendingDelete(null);
                }}
            />

            <EntityFormDialog<Record<string, unknown>>
                open={open}
                onOpenChange={handleOpenChange}
                title={
                    editing
                        ? `${t('actions.edit')} ${t('admin.promos.title')}`
                        : `${t('actions.add')} ${t('admin.promos.title')}`
                }
                sections={promoSections}
                initial={dialogInitial}
                onSubmit={handleSave}
                languages={['en', 'fr', 'ar']}
                layout="grid-2"
                errors={errors}
                isSubmitting={saveMutation.isPending}
            />
        </AdminLayout>
    );
}
