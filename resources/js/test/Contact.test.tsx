import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import Contact from '@/pages/Contact';

describe('Contact page', () => {
    it('shows the main contact methods and location', () => {
        render(
            <LanguageProvider>
                <FavoritesProvider>
                    <Contact />
                </FavoritesProvider>
            </LanguageProvider>,
        );

        expect(
            screen.getByText(/Contact Us|Contactez-nous|اتصل بنا/i),
        ).toBeInTheDocument();
        expect(screen.getByText(/WhatsApp/i)).toBeInTheDocument();
        expect(screen.getByText(/Facebook/i)).toBeInTheDocument();
        expect(
            screen.getByText(/Office map|Carte du bureau|خريطة المكتب/i),
        ).toBeInTheDocument();
    });
});
