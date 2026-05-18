import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

describe('ConfirmDialog', () => {
    it('renders and calls confirm handler', () => {
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

        expect(screen.getByText('Delete destination?')).toBeInTheDocument();
        expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

        expect(onConfirm).toHaveBeenCalledTimes(1);
    });
});
