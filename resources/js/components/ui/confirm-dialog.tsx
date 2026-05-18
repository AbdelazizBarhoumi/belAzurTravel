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
    title: string;
    description: string;
    children?: ReactNode;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
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
}: ConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader className="border-b border-border px-6 py-5 text-left">
                    <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-destructive/10 p-3 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                            <DialogTitle className="text-2xl">{title}</DialogTitle>
                            <DialogDescription className="max-w-xl">{description}</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                {children ? <div className="space-y-4">{children}</div> : null}
                <DialogFooter className="border-t border-border px-6 py-4">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        onClick={onConfirm}
                        variant="destructive"
                    >
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}