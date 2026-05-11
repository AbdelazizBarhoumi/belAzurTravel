export interface DealItem {
    slug: string;
    title: string;
    description: string;
    discount: string;
    expires: string;
    category: 'seasonal' | 'last-minute' | 'romance';
    highlights: string[];
    terms: string[];
}

export const dealsData: DealItem[] = [
    {
        slug: 'early-bird-summer-2026',
        title: 'Early Bird Summer 2026',
        description:
            'Book your summer getaway before March 31st and save up to 35% on selected beach destinations.',
        discount: '35% OFF',
        expires: 'Mar 31, 2026',
        category: 'seasonal',
        highlights: ['Best beach inventory', 'Flexible date changes', 'Free airport pickup in select destinations'],
        terms: ['Valid for selected properties only', 'Non-transferable', 'Cannot be combined with other coupons'],
    },
    {
        slug: 'last-minute-escapes',
        title: 'Last Minute Escapes',
        description:
            'Incredible prices on departures within the next 14 days. Perfect for spontaneous travelers.',
        discount: 'Up to 50%',
        expires: 'Rolling',
        category: 'last-minute',
        highlights: ['Daily refresh of inventory', 'Curated by agents', 'Fast confirmation within minutes'],
        terms: ['Subject to availability', 'Immediate payment required', 'Date changes may incur fees'],
    },
    {
        slug: 'honeymoon-packages',
        title: 'Honeymoon Packages',
        description:
            'All-inclusive romantic getaways with spa, dining, and private excursions. Complimentary upgrade.',
        discount: 'Free Upgrade',
        expires: 'Dec 31, 2026',
        category: 'romance',
        highlights: ['Private dinner setup', 'Spa treatment credits', 'Room décor on arrival'],
        terms: ['Couples only', 'Minimum 3-night stay', 'Upgrade category depends on resort inventory'],
    },
];
