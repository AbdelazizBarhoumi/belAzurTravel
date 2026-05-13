import type { Lang } from '@/i18n/translations';

type LocalizedText = Record<Lang, string>;

export interface DealItem {
    slug: string;
    title: LocalizedText;
    description: LocalizedText;
    discount: LocalizedText;
    expires: LocalizedText;
    category: LocalizedText;
    highlights: LocalizedText[];
    terms: LocalizedText[];
}

export const dealsData: DealItem[] = [
    {
        slug: 'early-bird-summer-2026',
        title: { fr: 'Réservation Anticipée Été 2026', ar: 'احجز مبكرًا لصيف 2026', en: 'Early Bird Summer 2026' },
        description: {
            fr: 'Réservez vos vacances d’été avant le 31 mars et économisez jusqu’à 35 % sur certaines destinations balnéaires.',
            ar: 'احجز عطلتك الصيفية قبل 31 مارس ووفر حتى 35٪ على وجهات شاطئية مختارة.',
            en: 'Book your summer getaway before March 31st and save up to 35% on selected beach destinations.',
        },
        discount: { fr: '35 % DE RÉDUCTION', ar: 'خصم 35%', en: '35% OFF' },
        expires: { fr: '31 mars 2026', ar: '31 مارس 2026', en: 'Mar 31, 2026' },
        category: { fr: 'Saisonnière', ar: 'موسمية', en: 'Seasonal' },
        highlights: [
            { fr: 'Meilleur stock balnéaire', ar: 'أفضل توفر للوجهات الشاطئية', en: 'Best beach inventory' },
            { fr: 'Changements de dates flexibles', ar: 'تغيير مرن للتواريخ', en: 'Flexible date changes' },
            { fr: 'Prise en charge aéroport gratuite dans certaines destinations', ar: 'استقبال مجاني من المطار في وجهات محددة', en: 'Free airport pickup in select destinations' },
        ],
        terms: [
            { fr: 'Valable uniquement sur certaines propriétés', ar: 'ساري على بعض المنشآت فقط', en: 'Valid for selected properties only' },
            { fr: 'Non transférable', ar: 'غير قابل للتحويل', en: 'Non-transferable' },
            { fr: 'Ne peut pas être combiné avec d’autres coupons', ar: 'لا يمكن دمجه مع كوبونات أخرى', en: 'Cannot be combined with other coupons' },
        ],
    },
    {
        slug: 'last-minute-escapes',
        title: { fr: 'Échappées de Dernière Minute', ar: 'عروض اللحظة الأخيرة', en: 'Last Minute Escapes' },
        description: {
            fr: 'Des prix incroyables sur les départs dans les 14 prochains jours. Parfait pour les voyageurs spontanés.',
            ar: 'أسعار رائعة على المغادرات خلال الـ 14 يومًا القادمة. مثالي للمسافرين العفويين.',
            en: 'Incredible prices on departures within the next 14 days. Perfect for spontaneous travelers.',
        },
        discount: { fr: 'Jusqu’à 50 %', ar: 'حتى 50%', en: 'Up to 50%' },
        expires: { fr: 'En continu', ar: 'مستمر', en: 'Rolling' },
        category: { fr: 'Dernière minute', ar: 'اللحظة الأخيرة', en: 'Last minute' },
        highlights: [
            { fr: 'Inventaire actualisé quotidiennement', ar: 'تحديث يومي للمخزون', en: 'Daily refresh of inventory' },
            { fr: 'Sélectionné par nos agents', ar: 'منسق من قبل الوكلاء', en: 'Curated by agents' },
            { fr: 'Confirmation rapide en quelques minutes', ar: 'تأكيد سريع خلال دقائق', en: 'Fast confirmation within minutes' },
        ],
        terms: [
            { fr: 'Sous réserve de disponibilité', ar: 'حسب التوفر', en: 'Subject to availability' },
            { fr: 'Paiement immédiat requis', ar: 'الدفع الفوري مطلوب', en: 'Immediate payment required' },
            { fr: 'Des frais peuvent s’appliquer pour les changements de dates', ar: 'قد تُطبق رسوم عند تغيير التواريخ', en: 'Date changes may incur fees' },
        ],
    },
    {
        slug: 'honeymoon-packages',
        title: { fr: 'Forfaits Lune de Miel', ar: 'باقات شهر العسل', en: 'Honeymoon Packages' },
        description: {
            fr: 'Escapades romantiques tout compris avec spa, dîner et excursions privées. Surclassement offert.',
            ar: 'رحلات رومانسية شاملة مع سبا وطعام ورحلات خاصة. ترقية مجانية.',
            en: 'All-inclusive romantic getaways with spa, dining, and private excursions. Complimentary upgrade.',
        },
        discount: { fr: 'Surclassement offert', ar: 'ترقية مجانية', en: 'Free Upgrade' },
        expires: { fr: '31 déc. 2026', ar: '31 ديسمبر 2026', en: 'Dec 31, 2026' },
        category: { fr: 'Romance', ar: 'رومانسي', en: 'Romance' },
        highlights: [
            { fr: 'Dîner privé préparé', ar: 'ترتيب عشاء خاص', en: 'Private dinner setup' },
            { fr: 'Crédits pour soins spa', ar: 'رصيد لعلاجات السبا', en: 'Spa treatment credits' },
            { fr: 'Décoration de chambre à l’arrivée', ar: 'تزيين الغرفة عند الوصول', en: 'Room décor on arrival' },
        ],
        terms: [
            { fr: 'Couples uniquement', ar: 'للأزواج فقط', en: 'Couples only' },
            { fr: 'Séjour minimum de 3 nuits', ar: 'إقامة 3 ليالٍ على الأقل', en: 'Minimum 3-night stay' },
            { fr: 'La catégorie de surclassement dépend du stock du resort', ar: 'تعتمد فئة الترقية على توفر المنتجع', en: 'Upgrade category depends on resort inventory' },
        ],
    },
];
