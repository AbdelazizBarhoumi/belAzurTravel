import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
    EntityFormDialog,
    type SectionDef,
} from '@/components/forms/EntityFormDialog';
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
            { key: 'notes', label: 'Notes', type: 'textarea', rows: 3 },
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
        fireEvent.change(screen.getByLabelText('Notes'), {
            target: { value: 'A sectioned dialog is alive and well.' },
        });
        fireEvent.click(
            screen.getByRole('button', { name: /save|enregistrer/i }),
        );

        expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Santorini',
                notes: 'A sectioned dialog is alive and well.',
            }),
            expect.any(Function),
        );
    });

    it('shows the shared language selector and passes the active language to section renderers', () => {
        renderWithLanguage(
            <EntityFormDialog
                open
                onOpenChange={vi.fn()}
                title="Localized entity"
                sections={[
                    {
                        title: 'Localized section',
                        render: ({ activeLang }) => (
                            <p>Current language: {activeLang}</p>
                        ),
                    },
                ]}
                initial={{}}
                onSubmit={vi.fn()}
                languages={['en', 'fr', 'ar']}
            />,
        );

        expect(screen.getByRole('button', { name: 'EN' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'FR' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'AR' })).toBeInTheDocument();
        expect(screen.getByText('Current language: en')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'FR' }));

        expect(screen.getByText('Current language: fr')).toBeInTheDocument();
    });

    it('disables the submit button while saving', () => {
        renderWithLanguage(
            <EntityFormDialog
                open
                onOpenChange={vi.fn()}
                title="Busy entity"
                sections={sections}
                initial={{}}
                onSubmit={vi.fn()}
                isSubmitting
            />,
        );

        expect(
            screen.getByRole('button', { name: /save|enregistrer/i }),
        ).toBeDisabled();
    });

    it('runs validation before submit and blocks save when invalid', () => {
        const onSubmit = vi.fn();
        const validate = vi.fn().mockReturnValue({
            name: 'Name is required',
        });

        renderWithLanguage(
            <EntityFormDialog
                open
                onOpenChange={vi.fn()}
                title="Validated entity"
                sections={sections}
                initial={{}}
                onSubmit={onSubmit}
                validate={validate}
            />,
        );

        fireEvent.click(
            screen.getByRole('button', { name: /save|enregistrer/i }),
        );

        expect(validate).toHaveBeenCalledTimes(1);
        expect(onSubmit).not.toHaveBeenCalled();
        expect(screen.getByText('Name is required')).toBeInTheDocument();
    });

    it('renders a date field that submits a serialized yyyy-MM-dd value', () => {
        const onSubmit = vi.fn();

        renderWithLanguage(
            <EntityFormDialog
                open
                onOpenChange={vi.fn()}
                title="Dated entity"
                sections={[
                    {
                        title: 'Schedule',
                        fields: [
                            {
                                key: 'startsAt',
                                label: 'Starts on',
                                type: 'date',
                            },
                        ],
                    },
                ]}
                initial={{ startsAt: '2026-08-05' }}
                onSubmit={onSubmit}
            />,
        );

        expect(screen.getByText('Starts on')).toBeInTheDocument();
        expect(screen.getByText(/2026/)).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole('button', { name: /save|enregistrer/i }),
        );

        expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({ startsAt: '2026-08-05' }),
            expect.any(Function),
        );
    });

    it('preserves array-backed values when requested', () => {
        const onSubmit = vi.fn();

        renderWithLanguage(
            <EntityFormDialog
                open
                onOpenChange={vi.fn()}
                title="Array entity"
                sections={[
                    {
                        title: 'Array section',
                        render: ({ values }) => (
                            <p>
                                {Array.isArray(values.highlights)
                                    ? 'array'
                                    : 'string'}
                            </p>
                        ),
                    },
                ]}
                initial={{ highlights: ['one', 'two'] }}
                onSubmit={onSubmit}
                preserveArrayKeys={['highlights']}
            />,
        );

        expect(screen.getByText('array')).toBeInTheDocument();
    });

    it('re-renders safely when preserveArrayKeys is omitted', () => {
        const onSubmit = vi.fn();

        const { rerender } = renderWithLanguage(
            <EntityFormDialog
                open
                onOpenChange={vi.fn()}
                title="Stable entity"
                sections={sections}
                initial={{ name: 'Santorini' }}
                onSubmit={onSubmit}
            />,
        );

        rerender(
            <LanguageProvider>
                <EntityFormDialog
                    open
                    onOpenChange={vi.fn()}
                    title="Stable entity"
                    sections={sections}
                    initial={{ name: 'Santorini' }}
                    onSubmit={onSubmit}
                />
            </LanguageProvider>,
        );

        expect(screen.getByLabelText('Name')).toBeInTheDocument();
        expect(screen.getAllByDisplayValue('Santorini').length).toBeGreaterThan(
            0,
        );
    });

    it('keeps user edits when the dialog rerenders after validation state changes', () => {
        const onSubmit = vi.fn();

        const { rerender } = renderWithLanguage(
            <EntityFormDialog
                open
                onOpenChange={vi.fn()}
                title="Persistent entity"
                sections={sections}
                initial={{ name: 'Original name' }}
                onSubmit={onSubmit}
                preserveArrayKeys={['highlights']}
            />,
        );

        fireEvent.change(screen.getByLabelText('Name'), {
            target: { value: 'Edited name' },
        });

        rerender(
            <LanguageProvider>
                <EntityFormDialog
                    open
                    onOpenChange={vi.fn()}
                    title="Persistent entity"
                    sections={sections}
                    initial={{ name: 'Original name' }}
                    onSubmit={onSubmit}
                    preserveArrayKeys={['highlights']}
                    errors={{ name: 'Validation error' }}
                />
            </LanguageProvider>,
        );

        expect(screen.getByDisplayValue('Edited name')).toBeInTheDocument();
    });
});
