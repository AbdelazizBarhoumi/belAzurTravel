import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface ImagePickerProps {
    value?: File | File[] | string | string[] | null;
    onChange: (file: File | File[] | null) => void;
    error?: string;
    label?: string;
    className?: string;
    multiple?: boolean;
    showPreview?: boolean;
    id?: string;
}

export const ImagePicker = ({
    value,
    onChange,
    error,
    label,
    className,
    multiple = false,
    showPreview = true,
    id,
}: ImagePickerProps) => {
    const [preview, setPreview] = useState<string | string[] | null>(null);
    const { t } = useLanguage();

    useEffect(() => {
        if (typeof value === 'string' || Array.isArray(value)) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setPreview(value as string | string[]);
        }
        // Cleanup previews if needed would be complex with multiple files
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (multiple) {
            const files = e.target.files ? Array.from(e.target.files) : null;
            onChange(files);
            if (files) {
                setPreview(files.map(f => URL.createObjectURL(f)));
            }
        } else {
            const file = e.target.files?.[0] ?? null;
            onChange(file);
            if (file) {
                setPreview(URL.createObjectURL(file));
            } else {
                setPreview(typeof value === 'string' ? value : null);
            }
        }
    };

    return (
        <div className={cn("space-y-2", className)}>
            {label && <label className={cn("text-xs font-semibold", error ? "text-destructive" : "text-muted-foreground")}>{label}</label>}
            {showPreview && preview && (
                <div className="mb-2 flex flex-wrap gap-2">
                    {Array.isArray(preview)
                        ? preview.map((p, i) => <img key={i} src={p} alt="Preview" className="h-20 w-20 rounded-lg object-cover border border-border" />)
                        : <img src={preview} alt="Preview" className="h-20 w-20 rounded-lg object-cover border border-border" />
                    }
                </div>
            )}
            <input
                id={id}
                type="file"
                multiple={multiple}
                onChange={handleChange}
                title={t('admin.teamForm.noFileChosen')}
                className={cn(
                    "w-full rounded-lg bg-background px-3 py-2 text-sm file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 border",
                    error ? "border-destructive ring-1 ring-destructive" : "border-border"
                )}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
};
