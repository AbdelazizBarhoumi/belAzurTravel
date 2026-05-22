import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

describe('ConfirmDialog', () => {
    it('renders in ltr mode by default', () => {
        const onConfirm = vi.fn();
        const onOpenChange = vi.fn();

        render(
            <ConfirmDialog
                open
                onOpenChange={onOpenChange}
                title="Delete destination?"
                description="This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={onConfirm}
            />,
        );

        const dialog = screen.getByRole('dialog');

        expect(dialog).toHaveClass('left-1/2');
        expect(dialog).toHaveAttribute('dir', 'ltr');
        expect(screen.getByText('Delete destination?')).toBeInTheDocument();
        expect(
            screen.getByText('This action cannot be undone.'),
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Close' })).toHaveClass(
            'end-4',
        );

        fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('renders rtl mode when requested', () => {
        const onConfirm = vi.fn();
        const onOpenChange = vi.fn();

        render(
            <ConfirmDialog
                open
                onOpenChange={onOpenChange}
                dir="rtl"
                title="حذف العنصر؟"
                description="هل أنت متأكد أنك تريد حذف هذا العنصر؟"
                confirmText="حذف"
                cancelText="إلغاء"
                onConfirm={onConfirm}
            />,
        );

        const dialog = screen.getByRole('dialog');

        expect(dialog).toHaveClass('left-1/2');
        expect(dialog).toHaveAttribute('dir', 'rtl');
        expect(screen.getByText('حذف العنصر؟')).toBeInTheDocument();
        expect(
            screen.getByText('هل أنت متأكد أنك تريد حذف هذا العنصر؟'),
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Close' })).toHaveClass(
            'end-4',
        );

        fireEvent.click(screen.getByRole('button', { name: 'حذف' }));

        expect(onConfirm).toHaveBeenCalledTimes(1);
    });
});
