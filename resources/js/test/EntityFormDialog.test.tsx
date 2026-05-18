import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EntityFormDialog, type SectionDef } from '@/components/forms/EntityFormDialog';
import { LanguageProvider } from '@/contexts/LanguageContext';

function renderWithLanguage(ui: React.ReactElement) {
    return render(<LanguageProvider>{ui}</LanguageProvider>);
}

const sections: SectionDef[] = [
    {
        title: 'Core details',
        description: 'Shared shell test',
        columns: 2,
        fields: [
            { key: 'name', label: 'Name', required: true },
            {
                key: 'category',
                label: 'Category',
                type: 'select',
                options: ['Beach', 'City'],
            },
            {
                key: 'notes',
                label: 'Notes',
                type: 'textarea',
                rows: 3,
            },
        ],
    },
];

describe('EntityFormDialog', () => {
    it('renders sectioned fields and submits the collected values', () => {
        const onSubmit = vi.fn();

        renderWithLanguage(
            <EntityFormDialog
                open
                onOpenChange={vi.fn()}
                title="Test entity"
                subtitle="Builds a shared admin form shell"
                sections={sections}
                initial={{}}
                onSubmit={onSubmit}
            />,
        );

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Core details')).toBeInTheDocument();
        expect(screen.getByText('Shared shell test')).toBeInTheDocument();
        expect(screen.getByLabelText('Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Category')).toBeInTheDocument();
        expect(screen.getByLabelText('Notes')).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText('Name'), {
            target: { value: 'Santorini' },
        });
        fireEvent.change(screen.getByLabelText('Category'), {
            target: { value: 'Beach' },
        });
        fireEvent.change(screen.getByLabelText('Notes'), {
            target: { value: 'A sectioned dialog is alive and well.' },
        });
        fireEvent.click(screen.getByRole('button', { name: /save|enregistrer/i }));

        expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Santorini',
                category: 'Beach',
                notes: 'A sectioned dialog is alive and well.',
            }),
        );
    });
});
