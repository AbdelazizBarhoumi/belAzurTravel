export interface TourFilterOption {
    key: string;
    label: { en: string; fr: string; ar: string };
}

export interface TourFilterGroup {
    key: string;
    label: { en: string; fr: string; ar: string };
    type: 'checkbox';
    options?: TourFilterOption[];
    dynamic?: boolean;
}

export const TOUR_FILTER_GROUPS: TourFilterGroup[] = [
    {
        key: 'destination',
        label: { en: 'Destination', fr: 'Destination', ar: 'الوجهة' },
        type: 'checkbox',
        options: [
            { key: 'djerba', label: { en: 'Djerba', fr: 'Djerba', ar: 'جربة' } },
            { key: 'nord_tunisien', label: { en: 'North Tunisia', fr: 'Nord Tunisien', ar: 'شمال تونس' } },
            { key: 'sud_tunisien', label: { en: 'South Tunisia', fr: 'Sud Tunisien', ar: 'جنوب تونس' } },
            { key: 'tunisia', label: { en: 'Tunisia', fr: 'Tunisia', ar: 'تونس' } },
        ],
    },
    {
        key: 'niveau_physique',
        label: { en: 'Physical Level', fr: 'Niveau physique', ar: 'المستوى البدني' },
        type: 'checkbox',
        options: [
            { key: 'tranquille', label: { en: 'Easy', fr: 'Tranquille', ar: 'هادئ' } },
        ],
    },
    {
        key: 'famille',
        label: { en: 'Family', fr: 'Famille', ar: 'عائلة' },
        type: 'checkbox',
        options: [
            { key: 'famille', label: { en: 'Family', fr: 'Famille', ar: 'عائلة' } },
            { key: 'djerba_by_vol', label: { en: 'DjerbaByVol', fr: 'DjerbaByVol', ar: 'جربة بالطائرة' } },
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
        key: 'region',
        label: { en: 'Region', fr: 'Région', ar: 'المنطقة' },
        type: 'checkbox',
        options: [
            { key: 'nord', label: { en: 'North', fr: 'Nord', ar: 'شمال' } },
        ],
    },
    {
        key: 'voyages_groupe',
        label: { en: 'Group Tours', fr: 'Voyages en groupe', ar: 'رحلات جماعية' },
        type: 'checkbox',
        options: [
            { key: 'tranquille_groupe', label: { en: 'Easy', fr: 'Tranquille', ar: 'هادئ' } },
        ],
    },
];

export const TOUR_FILTER_KEYS = TOUR_FILTER_GROUPS.flatMap(
    (group) => group.options?.map((opt) => opt.key) ?? []
);
