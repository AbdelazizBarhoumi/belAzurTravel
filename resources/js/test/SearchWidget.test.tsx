import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SearchWidget } from '@/components/SearchWidget';
import { LanguageProvider } from '@/contexts/LanguageContext';

function renderSearchWidget() {
    return render(
        <LanguageProvider>
            <SearchWidget />
        </LanguageProvider>,
    );
}

describe('SearchWidget', () => {
    it('shows hotel search controls by default', () => {
        renderSearchWidget();

        expect(screen.getByRole('tab', { name: /Hôtels/i })).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByLabelText(/Destination/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Rechercher des hôtels/i })).toBeInTheDocument();
    });

    it('switches the form when a different tab is selected', () => {
        renderSearchWidget();

        fireEvent.click(screen.getByRole('tab', { name: /Circuits/i }));

        expect(screen.getByRole('tab', { name: /Circuits/i })).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByText(/Style du circuit/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Rechercher des circuits/i })).toBeInTheDocument();
    });
});
