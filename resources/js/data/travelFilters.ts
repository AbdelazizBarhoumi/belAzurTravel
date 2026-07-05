export interface TravelFilterOption {
    key: string;
    label: { en: string; fr: string; ar: string };
}

export interface TravelFilterGroup {
    key: string;
    label: { en: string; fr: string; ar: string };
    type: 'checkbox' | 'price';
    options?: TravelFilterOption[];
    dynamic?: boolean;
}

export const TRAVEL_FILTER_GROUPS: TravelFilterGroup[] = [
    {
        key: 'destination',
        label: { en: 'Destination', fr: 'Destination', ar: 'الوجهة' },
        type: 'checkbox',
        options: [
            { key: 'istanbul', label: { en: 'Istanbul', fr: 'Istanbul', ar: 'اسطنبول' } },
            { key: 'asie', label: { en: 'Asia', fr: 'Asie', ar: 'آسيا' } },
            { key: 'europe', label: { en: 'Europe', fr: 'Europe', ar: 'أوروبا' } },
            { key: 'afrique_nord', label: { en: 'North Africa', fr: 'Afrique du Nord', ar: 'شمال أفريقيا' } },
        ],
    },
    {
        key: 'jeunes',
        label: { en: 'Young', fr: 'Jeunes', ar: 'شباب' },
        type: 'checkbox',
        options: [
            { key: 'jeune', label: { en: 'Young', fr: 'Jeune', ar: 'شباب' } },
        ],
    },
    {
        key: 'pays',
        label: { en: 'Country', fr: 'Pays', ar: 'البلد' },
        type: 'checkbox',
        dynamic: true,
    },
    {
        key: 'niveau_physique',
        label: { en: 'Physical Level', fr: 'Niveau physique', ar: 'المستوى البدني' },
        type: 'checkbox',
        options: [
            { key: 'tranquille', label: { en: 'Easy', fr: 'Tranquille', ar: 'هادئ' } },
        ],
    },
];

export const TRAVEL_FILTER_KEYS = TRAVEL_FILTER_GROUPS.flatMap(
    (group) => group.options?.map((opt) => opt.key) ?? []
);
