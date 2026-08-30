import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export interface FieldDef {
    key: string;
    label: string;
    type?:
        | 'text'
        | 'number'
        | 'textarea'
        | 'select'
        | 'i18n'
        | 'i18n-textarea'
        | 'image';
    // options can be a simple string list (value and label same)
    // or objects with explicit value/label for localized or keyed options
    options?: Array<string | { value: string; label: string }>;
}

import { ImagePicker } from '@/components/ui/ImagePicker';

// ... (in ImageField component)

function ImageField({
    value,
    onChange,
    error,
    label,
}: {
    value: string;
    onChange: (v: string) => void;
    error?: string;
    label?: string;
}) {
    return (
        <ImagePicker
            label={label}
            value={value}
            onChange={(file) => {
                if (!file) return;
                const targetFile = Array.isArray(file) ? file[0] : file;
                const reader = new FileReader();
                reader.onload = () => onChange(String(reader.result));
                reader.readAsDataURL(targetFile);
            }}
            error={error}
        />
    );
}

interface Props<T> {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    fields: FieldDef[];
    initial?: T | null;
    onSubmit: (values: T) => void;
    errors?: Record<string, string>;
}

function I18nInput({
    value,
    onChange,
    multiline,
    errors,
}: {
    value: any;
    onChange: (v: any) => void;
    multiline?: boolean;
    errors?: Record<string, any>;
}) {
    const obj =
        typeof value === 'object' && value !== null
            ? value
            : { fr: value || '', ar: '' };
    const Input = multiline ? 'textarea' : 'input';
    return (
        <div className="grid grid-cols-1 gap-2">
            <div className="space-y-1">
                <Input
                    type="text"
                    value={obj.fr ?? ''}
                    onChange={(e: any) =>
                        onChange({ ...obj, fr: e.target.value })
                    }
                    className={`w-full rounded-lg border px-3 py-2 text-sm ${errors?.fr ? 'border-destructive ring-1 ring-destructive' : 'border-border'} ${multiline ? 'min-h-20' : ''}`}
                />
                {errors?.fr && (
                    <p className="text-xs text-destructive">{errors.fr}</p>
                )}
            </div>
        </div>
    );
}

export function EntityFormDialog<T extends Record<string, any>>({
    open,
    onOpenChange,
    title,
    fields,
    initial,
    onSubmit,
    errors,
}: Props<T>) {
    const [values, setValues] = useState<Record<string, any>>({});

    useEffect(() => {
        if (open) {
            const init: Record<string, any> = {};
            fields.forEach((f) => {
                if (f.type === 'i18n' || f.type === 'i18n-textarea') {
                    const v = (initial as any)?.[f.key];
                    init[f.key] =
                        typeof v === 'object' && v !== null
                            ? v
                            : { fr: v || '', ar: '' };
                } else {
                    init[f.key] =
                        (initial as any)?.[f.key] ??
                        (f.type === 'number' ? 0 : '');
                }
            });
            setValues(init);
        } else {
            setValues({});
        }
    }, [open, initial, fields]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(values as T);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {fields.map((f) => {
                        const error = errors?.[f.key];
                        return (
                            <div key={f.key}>
                                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                                    {f.label}
                                </label>
                                {f.type === 'i18n' ||
                                f.type === 'i18n-textarea' ? (
                                    <I18nInput
                                        value={values[f.key]}
                                        onChange={(v) =>
                                            setValues({ ...values, [f.key]: v })
                                        }
                                        multiline={f.type === 'i18n-textarea'}
                                        errors={
                                            typeof error === 'object'
                                                ? error
                                                : undefined
                                        }
                                    />
                                ) : f.type === 'image' ? (
                                    <ImageField
                                        value={values[f.key] ?? ''}
                                        onChange={(v) =>
                                            setValues({ ...values, [f.key]: v })
                                        }
                                        error={
                                            typeof error === 'string'
                                                ? error
                                                : undefined
                                        }
                                    />
                                ) : f.type === 'textarea' ? (
                                    <textarea
                                        value={values[f.key] ?? ''}
                                        onChange={(e) =>
                                            setValues({
                                                ...values,
                                                [f.key]: e.target.value,
                                            })
                                        }
                                        className={`min-h-20 w-full rounded-lg border px-3 py-2 text-sm ${error ? 'border-destructive ring-1 ring-destructive' : 'border-border'}`}
                                    />
                                ) : f.type === 'select' ? (
                                    <select
                                        value={values[f.key] ?? ''}
                                        onChange={(e) =>
                                            setValues({
                                                ...values,
                                                [f.key]: e.target.value,
                                            })
                                        }
                                        className={`w-full rounded-lg border px-3 py-2 text-sm ${error ? 'border-destructive ring-1 ring-destructive' : 'border-border'}`}
                                    >
                                        <option value="">Select...</option>
                                        {f.options?.map((o) => {
                                            if (typeof o === 'string') {
                                                return (
                                                    <option key={o} value={o}>
                                                        {o}
                                                    </option>
                                                );
                                            }

                                            return (
                                                <option
                                                    key={o.value}
                                                    value={o.value}
                                                >
                                                    {o.label}
                                                </option>
                                            );
                                        })}
                                    </select>
                                ) : (
                                    <input
                                        type={
                                            f.type === 'number'
                                                ? 'number'
                                                : 'text'
                                        }
                                        step={
                                            f.type === 'number'
                                                ? 'any'
                                                : undefined
                                        }
                                        value={values[f.key] ?? ''}
                                        onChange={(e) =>
                                            setValues({
                                                ...values,
                                                [f.key]:
                                                    f.type === 'number'
                                                        ? parseFloat(
                                                              e.target.value,
                                                          ) || 0
                                                        : e.target.value,
                                            })
                                        }
                                        className={`w-full rounded-lg border px-3 py-2 text-sm ${error ? 'border-destructive ring-1 ring-destructive' : 'border-border'}`}
                                    />
                                )}
                                {error && typeof error === 'string' && (
                                    <p className="mt-1 text-xs text-destructive">
                                        {error}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-primary text-primary-foreground"
                        >
                            Save
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
