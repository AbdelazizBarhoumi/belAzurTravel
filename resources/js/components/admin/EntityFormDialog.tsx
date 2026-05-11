import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';

export interface FieldDef {
    key: string;
    label: string;
    type?: 'text' | 'number' | 'textarea' | 'select';
    options?: string[];
}

interface Props<T> {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    fields: FieldDef[];
    initial?: T | null;
    onSubmit: (values: T) => void;
}

export function EntityFormDialog<T>({
    open,
    onOpenChange,
    title,
    fields,
    initial,
    onSubmit,
}: Props<T>) {
    const initializeValues = useCallback((): Record<
        string,
        string | number
    > => {
        const init: Record<string, string | number> = {};
        fields.forEach((f) => {
            const value = initial
                ? (initial as Record<string, unknown>)[f.key]
                : undefined;
            init[f.key] =
                (value as string | number) ?? (f.type === 'number' ? 0 : '');
        });
        return init;
    }, [fields, initial]);

    const [values, setValues] =
        useState<Record<string, string | number>>(initializeValues());

    useEffect(() => {
        if (open) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setValues(initializeValues());
        }
    }, [open, initializeValues]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(values as T);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {fields.map((f) => (
                        <div key={f.key}>
                            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                                {f.label}
                            </label>
                            {f.type === 'textarea' ? (
                                <textarea
                                    value={values[f.key] ?? ''}
                                    onChange={(e) =>
                                        setValues({
                                            ...values,
                                            [f.key]: e.target.value,
                                        })
                                    }
                                    className="min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
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
                                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                >
                                    <option value="">Select...</option>
                                    {f.options?.map((o) => (
                                        <option key={o} value={o}>
                                            {o}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type={
                                        f.type === 'number' ? 'number' : 'text'
                                    }
                                    step={
                                        f.type === 'number' ? 'any' : undefined
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
                                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                />
                            )}
                        </div>
                    ))}
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
