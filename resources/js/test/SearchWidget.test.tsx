import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { SearchWidget } from '@/components/SearchWidget';
import { LanguageProvider } from '@/contexts/LanguageContext';

function renderSearchWidget() {
    return render(
        <LanguageProvider>
            <MemoryRouter>
                <SearchWidget />
            </MemoryRouter>
        </LanguageProvider>,
    );
}

describe('SearchWidget', () => {
    afterEach(() => {
        cleanup();
    });

    it('shows hotel search controls by default', () => {
        renderSearchWidget();

        expect(screen.getByRole('tab', { name: /Hôtels/i })).toHaveAttribute(
            'aria-selected',
            'true',
        );
        expect(screen.getByLabelText(/Destination/i)).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /Rechercher des hôtels/i }),
        ).toBeInTheDocument();
    });

    it('renders the other search tabs', () => {
        renderSearchWidget();

        expect(
            screen.getByRole('tab', { name: /Circuits/i }),
        ).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /Vols/i })).toBeInTheDocument();
    });
});
