import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { LanguageProvider } from '@/contexts/LanguageContext';
import Promos from '@/pages/Promos';

function renderPromos() {
    return render(
        <LanguageProvider>
            <MemoryRouter>
                <Promos />
            </MemoryRouter>
        </LanguageProvider>,
    );
}

describe('Promos page', () => {
    beforeEach(() => {
        localStorage.setItem('lang', 'en');
    });

    afterEach(() => {
        localStorage.removeItem('lang');
    });

    it('shows a translated view details CTA', () => {
        renderPromos();

        expect(screen.getAllByRole('link', { name: /View details/i }).length).toBeGreaterThan(0);
    });
});
