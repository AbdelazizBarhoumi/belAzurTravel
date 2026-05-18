import { render, screen, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import EntityFormDialog from '@/components/forms/EntityFormDialog';
import { LanguageProvider } from '@/contexts/LanguageContext';
import type { AdminDestination } from '@/hooks/useAdminStore';

function renderWithLanguage(ui: ReactElement) {
    return render(<LanguageProvider>{ui}</LanguageProvider>);
}

const destination: AdminDestination = {
    id: 'd1',
    name: 'Santorini',
    country: 'Greece',
    category: 'Beach',
    price: 1299,
    rating: 4.9,
    image: '/images/uploads/destination-santorini.jpg',
    description: 'Iconic white-washed buildings overlooking the Aegean Sea.',
    about: 'A romantic destination with cliffside sunsets.',
    highlights: ['Sunset views', 'Caldera cruises'],
    gallery: ['/images/uploads/destination-santorini.jpg'],
    bestTime: 'April to June',
    language: 'Greek',
    currency: 'EUR',
    weather: 'Mediterranean',
};

describe('AdminDestinationDialog', () => {
    beforeEach(() => {
        localStorage.setItem('lang', 'en');
    });

    afterEach(() => {
        localStorage.removeItem('lang');
        vi.clearAllMocks();
    });

    it('shows a translated add dialog with all fields and image preview', () => {
        renderWithLanguage(
            <EntityFormDialog
                open
                onOpenChange={vi.fn()}
                title="Add destination"
                subtitle="All fields are visible at once, with a live image preview."
                sections={[
                    {
                        title: 'Core information',
                        fields: [
                            { key: 'name', label: 'Name', type: 'text' },
                            { key: 'country', label: 'Country', type: 'text' },
                            { key: 'category', label: 'Category', type: 'text' },
                            { key: 'price', label: 'Price (USD)', type: 'number' },
                            { key: 'rating', label: 'Rating', type: 'number' },
                        ],
                    },
                    {
                        title: 'Media and highlights',
                        fields: [
                            { key: 'image', label: 'Main image', type: 'text' },
                            { key: 'description', label: 'Description', type: 'textarea' },
                            { key: 'about', label: 'About section', type: 'textarea' },
                            { key: 'highlights', label: 'Highlights', type: 'textarea' },
                            { key: 'gallery', label: 'Gallery', type: 'textarea' },
                        ],
                    },
                    {
                        title: 'Destination facts',
                        fields: [
                            { key: 'bestTime', label: 'Best time to visit', type: 'text' },
                            { key: 'language', label: 'Language', type: 'text' },
                            { key: 'currency', label: 'Currency', type: 'text' },
                            { key: 'weather', label: 'Weather', type: 'text' },
                        ],
                    },
                ]}
                onSubmit={vi.fn()}
            />,
        );

        const dialog = screen.getByRole('dialog');

        expect(within(dialog).getByText('Add destination')).toBeInTheDocument();
        expect(within(dialog).getByText('Core information')).toBeInTheDocument();
        expect(within(dialog).getByText('Media and highlights')).toBeInTheDocument();
        expect(within(dialog).getByText('Destination facts')).toBeInTheDocument();
        expect(within(dialog).getByLabelText('Name')).toBeInTheDocument();
        expect(within(dialog).getByLabelText('Country')).toBeInTheDocument();
        expect(within(dialog).getByLabelText('Category')).toBeInTheDocument();
        expect(within(dialog).getByLabelText('Price (USD)')).toBeInTheDocument();
        expect(within(dialog).getByLabelText('Rating')).toBeInTheDocument();
        expect(within(dialog).getByLabelText('Main image')).toBeInTheDocument();
        expect(within(dialog).getByLabelText('Description')).toBeInTheDocument();
        expect(within(dialog).getByLabelText('About section')).toBeInTheDocument();
        expect(within(dialog).getByLabelText('Highlights')).toBeInTheDocument();
        expect(within(dialog).getByLabelText('Gallery')).toBeInTheDocument();
        expect(within(dialog).getByLabelText('Best time to visit')).toBeInTheDocument();
        expect(within(dialog).getByLabelText('Language')).toBeInTheDocument();
        expect(within(dialog).getByLabelText('Currency')).toBeInTheDocument();
        expect(within(dialog).getByLabelText('Weather')).toBeInTheDocument();
        expect(
            within(dialog).getByText('All fields are visible at once, with a live image preview.'),
        ).toBeInTheDocument();
    });

    it('pre-fills existing values when editing a destination', () => {
        renderWithLanguage(
            <EntityFormDialog
                open
                onOpenChange={vi.fn()}
                title="Edit destination"
                fields={[
                    { key: 'name', label: 'Name', type: 'text' },
                    { key: 'country', label: 'Country', type: 'text' },
                    { key: 'category', label: 'Category', type: 'text' },
                    { key: 'price', label: 'Price (USD)', type: 'number' },
                    { key: 'rating', label: 'Rating', type: 'number' },
                    { key: 'image', label: 'Main image', type: 'text' },
                    { key: 'description', label: 'Description', type: 'textarea' },
                    { key: 'about', label: 'About section', type: 'textarea' },
                    { key: 'highlights', label: 'Highlights', type: 'textarea' },
                    { key: 'gallery', label: 'Gallery', type: 'textarea' },
                    { key: 'bestTime', label: 'Best time to visit', type: 'text' },
                    { key: 'language', label: 'Language', type: 'text' },
                    { key: 'currency', label: 'Currency', type: 'text' },
                    { key: 'weather', label: 'Weather', type: 'text' },
                ]}
                initial={destination}
                onSubmit={vi.fn()}
            />,
        );

        const dialog = screen.getByRole('dialog');

        const idForLabel: Record<string, string> = {
            'Name': 'name',
            'Country': 'country',
            'Category': 'category',
            'Price (USD)': 'price',
            'Rating': 'rating',
            'Main image': 'image',
            'Description': 'description',
            'About section': 'about',
            'Highlights': 'highlights',
            'Gallery': 'gallery',
            'Best time to visit': 'bestTime',
            'Language': 'language',
            'Currency': 'currency',
            'Weather': 'weather',
        };

        const fieldValue = (label: string) => {
            const id = idForLabel[label] ?? label.toLowerCase();
            const el = dialog.querySelector(`#${id}`) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
            return el ? el.value : '';
        };
        expect(fieldValue('Price (USD)')).toBe('1299');
        expect(fieldValue('Rating')).toBe('4.9');
        expect(fieldValue('Main image')).toBe('/images/uploads/destination-santorini.jpg');
        expect(fieldValue('Description')).toBe('Iconic white-washed buildings overlooking the Aegean Sea.');
        expect(fieldValue('About section')).toBe('A romantic destination with cliffside sunsets.');
        expect(fieldValue('Highlights')).toBe('Sunset views\nCaldera cruises');
        expect(fieldValue('Gallery')).toBe('/images/uploads/destination-santorini.jpg');
        expect(fieldValue('Best time to visit')).toBe('April to June');
        expect(fieldValue('Language')).toBe('Greek');
        expect(fieldValue('Currency')).toBe('EUR');
        expect(fieldValue('Weather')).toBe('Mediterranean');
    });

    it.each([
        {
            lang: 'fr',
            title: 'Ajouter une destination',
            core: 'Informations principales',
            media: 'Média et points forts',
            facts: 'Faits sur la destination',
            name: 'Nom',
            country: 'Pays',
            category: 'Catégorie',
            price: 'Prix (USD)',
            rating: 'Note',
            image: 'Image principale',
            description: 'Description',
            about: 'À propos',
            highlights: 'Points forts',
            gallery: 'Galerie',
            bestTime: 'Meilleure période pour visiter',
            language: 'Langue',
            currency: 'Devise',
            weather: 'Météo',
            categoryOptions: ['Plage', 'Ville', 'Nature', 'Luxe', 'Aventure'],
            helper: 'Tous les champs sont visibles en même temps, avec un aperçu de l’image en direct.',
        },
        {
            lang: 'ar',
            title: 'إضافة وجهة',
            core: 'المعلومات الأساسية',
            media: 'الوسائط وأبرز النقاط',
            facts: 'حقائق عن الوجهة',
            name: 'الاسم',
            country: 'البلد',
            category: 'الفئة',
            price: 'السعر (USD)',
            rating: 'التقييم',
            image: 'الصورة الرئيسية',
            description: 'الوصف',
            about: 'حول الوجهة',
            highlights: 'أبرز النقاط',
            gallery: 'معرض الصور',
            bestTime: 'أفضل وقت للزيارة',
            language: 'اللغة',
            currency: 'العملة',
            weather: 'الطقس',
            categoryOptions: ['شاطئ', 'مدينة', 'طبيعة', 'فاخر', 'مغامرة'],
            helper: 'كل الحقول ظاهرة في نفس الوقت مع معاينة مباشرة للصورة.',
        },
    ])('renders destination form copy in $lang', ({
        lang,
        title,
        core,
        media,
        facts,
        name,
        country,
        category,
        price,
        rating,
        image,
        description,
        about,
        highlights,
        gallery,
        bestTime,
        language,
        currency,
        weather,
        categoryOptions,
        helper,
    }) => {
        localStorage.setItem('lang', lang);

        renderWithLanguage(
            <EntityFormDialog
                open
                onOpenChange={vi.fn()}
                title={title}
                subtitle={helper}
                sections={[
                    { title: core, fields: [
                        { key: 'name', label: name, type: 'text' },
                        { key: 'country', label: country, type: 'text' },
                        { key: 'category', label: category, type: 'select', options: categoryOptions.map(o => ({ label: o, value: o })) },
                        { key: 'price', label: price, type: 'number' },
                        { key: 'rating', label: rating, type: 'number' },
                    ]},
                    { title: media, fields: [
                        { key: 'image', label: image, type: 'text' },
                        { key: 'description', label: description, type: 'textarea' },
                        { key: 'about', label: about, type: 'textarea' },
                        { key: 'highlights', label: highlights, type: 'textarea' },
                        { key: 'gallery', label: gallery, type: 'textarea' },
                    ]},
                    { title: facts, fields: [
                        { key: 'bestTime', label: bestTime, type: 'text' },
                        { key: 'language', label: language, type: 'text' },
                        { key: 'currency', label: currency, type: 'text' },
                        { key: 'weather', label: weather, type: 'text' },
                    ]},
                ]}
                onSubmit={vi.fn()}
            />,
        );

        const dialog = screen.getByRole('dialog');

        expect(within(dialog).getByText(title)).toBeInTheDocument();
        expect(within(dialog).getByText(core)).toBeInTheDocument();
        expect(within(dialog).getByText(media)).toBeInTheDocument();
        expect(within(dialog).getByText(facts)).toBeInTheDocument();
        // assert labels exist (use getByText to avoid library label association quirks)
        expect(within(dialog).getByText(name)).toBeInTheDocument();
        expect(within(dialog).getByText(country)).toBeInTheDocument();
        expect(within(dialog).getByText(category)).toBeInTheDocument();
        expect(within(dialog).getByText(price)).toBeInTheDocument();
        expect(within(dialog).getByText(rating)).toBeInTheDocument();
        expect(within(dialog).getByText(image)).toBeInTheDocument();
        expect(within(dialog).getByText(description)).toBeInTheDocument();
        expect(within(dialog).getByText(about)).toBeInTheDocument();
        expect(within(dialog).getByText(highlights)).toBeInTheDocument();
        expect(within(dialog).getByText(gallery)).toBeInTheDocument();
        expect(within(dialog).getByText(bestTime)).toBeInTheDocument();
        expect(within(dialog).getByText(language)).toBeInTheDocument();
        expect(within(dialog).getByText(currency)).toBeInTheDocument();
        expect(within(dialog).getByText(weather)).toBeInTheDocument();
        expect(within(dialog).getByText(helper)).toBeInTheDocument();

        categoryOptions.forEach((option) => {
            expect(within(dialog).getByRole('option', { name: option })).toBeInTheDocument();
        });
    });
});

