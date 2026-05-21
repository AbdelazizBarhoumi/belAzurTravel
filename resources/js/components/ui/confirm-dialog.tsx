import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    // make title/description optional so callers can omit them for simple confirms
    title?: string;
    description?: string;
    children?: ReactNode;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    // direction: 'ltr' | 'rtl' | 'auto' (auto will read document.dir if available)
    dir?: 'ltr' | 'rtl' | 'auto';
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    children,
    confirmText = 'Delete',
    cancelText = 'Cancel',
    onConfirm,
    dir = 'auto',
}: ConfirmDialogProps) {
    // Resolve direction. If caller passes 'auto', try to read document.documentElement.dir; fallback to 'ltr'.
    const resolvedDir = (() => {
        if (dir !== 'auto') return dir;
        if (typeof document === 'undefined') return 'ltr';

        const htmlDir = document.documentElement?.dir;
        if (htmlDir === 'rtl' || htmlDir === 'ltr') return htmlDir as 'rtl' | 'ltr';

        try {
            const computed = getComputedStyle(document.documentElement).direction;
            if (computed === 'rtl' || computed === 'ltr') return computed as 'rtl' | 'ltr';
        } catch {
            // Ignore environments where computed styles are unavailable.
        }

        return 'ltr';
    })();
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* set native dir on the dialog content so text and forms respect direction */}
            <DialogContent dir={resolvedDir} className="max-w-xl">
                <DialogHeader className="px-6 py-5">
                    <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-destructive/10 p-3 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                            <DialogTitle className="text-2xl">{title ?? 'Confirm'}</DialogTitle>
                            <DialogDescription className="max-w-xl">{description ?? ''}</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                {children ? <div className="space-y-4">{children}</div> : null}
                <DialogFooter className="border-t border-border px-6 py-4 gap-3 flex justify-end">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        {cancelText}
                    </Button>
                    <Button type="button" onClick={onConfirm} variant="destructive">
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}