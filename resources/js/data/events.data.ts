import type { Lang } from '@/i18n/translations';

export type LocalizedText = Record<Lang, string>;

export interface EventScheduleItem {
    day: LocalizedText;
    activity: LocalizedText;
    details: LocalizedText;
}

export interface EventItem {
    slug: string;
    title: LocalizedText;
    location: LocalizedText;
    date: LocalizedText;
    attendees: LocalizedText;
    image: string;
    gallery: string[];
    description: LocalizedText;
    about: LocalizedText;
    price: number;
    schedule: EventScheduleItem[];
}

export const eventsData: EventItem[] = [
    {
        slug: 'cherry-blossom-festival',
        title: {
            fr: 'Festival des Cerisiers',
            ar: 'مهرجان أزهار الكرز',
            en: 'Cherry Blossom Festival',
        },
        location: {
            fr: 'Tokyo, Japon',
            ar: 'طوكيو، اليابان',
            en: 'Tokyo, Japan',
        },
        date: {
            fr: '5 – 12 avril 2026',
            ar: '5 – 12 أبريل 2026',
            en: 'April 5 – 12, 2026',
        },
        attendees: {
            fr: '32 participants',
            ar: '32 مشاركًا',
            en: '32 participants',
        },
        image: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=1600&h=900&fit=crop',
        gallery: [
            'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=1600&h=900&fit=crop',
            'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600&h=900&fit=crop',
            'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1600&h=900&fit=crop',
        ],
        description: {
            fr: 'Vivez la saison du hanami avec des jardins paisibles, des temples historiques et des soirées au bord de la rivière.',
            ar: 'عِش موسم الهانامي مع حدائق هادئة ومعابد تاريخية وأمسيات على ضفاف النهر.',
            en: 'Experience hanami season with peaceful gardens, historic temples, and riverside evenings.',
        },
        about: {
            fr: 'Ce voyage de groupe combine les plus beaux cerisiers en fleurs de Tokyo, des dégustations saisonnières et une immersion culturelle douce pour profiter du printemps japonais sans précipitation.',
            ar: 'تجمع هذه الرحلة الجماعية بين أجمل أزهار الكرز في طوكيو وتذوّق المواسم وتجربة ثقافية هادئة للاستمتاع بربيع اليابان دون استعجال.',
            en: 'This group journey combines Tokyo’s best cherry blossom spots, seasonal tastings, and a gentle cultural immersion so you can enjoy Japanese spring without rushing.',
        },
        price: 2490,
        schedule: [
            {
                day: { fr: 'Jour 1', ar: 'اليوم 1', en: 'Day 1' },
                activity: {
                    fr: 'Arrivée et promenade au parc Ueno',
                    ar: 'الوصول والتنزه في حديقة أوينو',
                    en: 'Arrival and Ueno Park stroll',
                },
                details: {
                    fr: 'Installation à l’hôtel, accueil du groupe et première promenade sous les cerisiers en fleurs.',
                    ar: 'الاستقرار في الفندق، ترحيب بالمجموعة وأول نزهة تحت أزهار الكرز.',
                    en: 'Settle into your hotel, meet the group, and enjoy your first walk beneath the blossoms.',
                },
            },
            {
                day: { fr: 'Jour 2', ar: 'اليوم 2', en: 'Day 2' },
                activity: {
                    fr: 'Temple Senso-ji et croisière sur la Sumida',
                    ar: 'معبد سينسو-جي ورحلة في نهر سوميدا',
                    en: 'Senso-ji Temple and Sumida cruise',
                },
                details: {
                    fr: 'Visite guidée du quartier d’Asakusa suivie d’une croisière pour admirer Tokyo depuis l’eau.',
                    ar: 'جولة إرشادية في حي أساكوسا تتبعها رحلة مائية لمشاهدة طوكيو من النهر.',
                    en: 'Guided sightseeing in Asakusa followed by a river cruise to admire Tokyo from the water.',
                },
            },
            {
                day: { fr: 'Jour 3', ar: 'اليوم 3', en: 'Day 3' },
                activity: {
                    fr: 'Atelier cuisine et dîner saisonnier',
                    ar: 'ورشة طهي وعشاء موسمي',
                    en: 'Cooking workshop and seasonal dinner',
                },
                details: {
                    fr: 'Préparez des spécialités japonaises avec un chef local puis savourez un dîner au sakura bar.',
                    ar: 'أعد أطباقًا يابانية مع طاهٍ محلي ثم استمتع بعشاء في أجواء الساكورا.',
                    en: 'Prepare Japanese specialties with a local chef, then enjoy a dinner in a sakura-inspired setting.',
                },
            },
        ],
    },
    {
        slug: 'la-tomatina',
        title: { fr: 'La Tomatina', ar: 'لا توماتينا', en: 'La Tomatina' },
        location: {
            fr: 'Buñol, Espagne',
            ar: 'بنيول، إسبانيا',
            en: 'Buñol, Spain',
        },
        date: {
            fr: '26 août 2026',
            ar: '26 أغسطس 2026',
            en: 'August 26, 2026',
        },
        attendees: {
            fr: '18 participants',
            ar: '18 مشاركًا',
            en: '18 participants',
        },
        image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1600&h=900&fit=crop',
        gallery: [
            'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1600&h=900&fit=crop',
            'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&h=900&fit=crop',
            'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1600&h=900&fit=crop',
        ],
        description: {
            fr: 'Rejoignez la fête la plus colorée d’Espagne avec des traditions locales, des saveurs régionales et une ambiance unique.',
            ar: 'انضم إلى ألوان الاحتفال الأكثر حيوية في إسبانيا مع التقاليد المحلية والنكهات الإقليمية وأجواء فريدة.',
            en: 'Join Spain’s most colorful celebration with local traditions, regional flavors, and a one-of-a-kind atmosphere.',
        },
        about: {
            fr: 'Ce séjour inclut les festivités de La Tomatina, des expériences culinaires valenciennes et des moments de détente avant et après la bataille de tomates.',
            ar: 'تشمل هذه الرحلة احتفالات لا توماتينا وتجارب طعام فالنسية ولحظات استرخاء قبل وبعد معركة الطماطم.',
            en: 'This trip includes the La Tomatina festivities, Valencian food experiences, and relaxed downtime before and after the tomato battle.',
        },
        price: 1790,
        schedule: [
            {
                day: { fr: 'Jour 1', ar: 'اليوم 1', en: 'Day 1' },
                activity: {
                    fr: 'Arrivée à Valence',
                    ar: 'الوصول إلى فالنسيا',
                    en: 'Arrival in Valencia',
                },
                details: {
                    fr: 'Accueil du groupe, installation et dîner de bienvenue avec cuisine locale.',
                    ar: 'استقبال المجموعة والاستقرار وعشاء ترحيبي مع المطبخ المحلي.',
                    en: 'Meet the group, check in, and enjoy a welcome dinner with local cuisine.',
                },
            },
            {
                day: { fr: 'Jour 2', ar: 'اليوم 2', en: 'Day 2' },
                activity: {
                    fr: 'Visite de Buñol',
                    ar: 'جولة في بنيول',
                    en: 'Buñol village tour',
                },
                details: {
                    fr: 'Découverte du village, briefing sur l’événement et après-midi libre.',
                    ar: 'استكشاف القرية، إحاطة عن الفعالية، وبعدها فترة حرة في المساء.',
                    en: 'Explore the village, get event briefing, and enjoy a free afternoon.',
                },
            },
            {
                day: { fr: 'Jour 3', ar: 'اليوم 3', en: 'Day 3' },
                activity: {
                    fr: 'La Tomatina',
                    ar: 'لا توماتينا',
                    en: 'La Tomatina',
                },
                details: {
                    fr: 'Préparez-vous pour la bataille de tomates la plus célèbre au monde, avec assistance de l’équipe locale.',
                    ar: 'استعد لمعركة الطماطم الأشهر في العالم مع دعم من الفريق المحلي.',
                    en: 'Get ready for the world-famous tomato fight with support from the local team.',
                },
            },
        ],
    },
    {
        slug: 'northern-lights-retreat',
        title: {
            fr: 'Retraite Aurores Boréales',
            ar: 'منتجع الشفق القطبي',
            en: 'Northern Lights Retreat',
        },
        location: {
            fr: 'Tromsø, Norvège',
            ar: 'ترومسو، النرويج',
            en: 'Tromsø, Norway',
        },
        date: {
            fr: '15 – 22 fév. 2026',
            ar: '15 – 22 فبراير 2026',
            en: 'Feb 15 – 22, 2026',
        },
        attendees: {
            fr: '12 participants',
            ar: '12 مشاركًا',
            en: '12 participants',
        },
        image: 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=1600&h=900&fit=crop',
        gallery: [
            'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=1600&h=900&fit=crop',
            'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&h=900&fit=crop',
            'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1600&h=900&fit=crop',
        ],
        description: {
            fr: 'Chasse aux aurores, traîneau à chiens et soirées chaleureuses au cœur de l’Arctique.',
            ar: 'مطاردة الشفق القطبي وركوب زلاجات الكلاب وأمسيات دافئة في قلب القطب الشمالي.',
            en: 'Aurora chasing, husky sledding, and warm evenings in the heart of the Arctic.',
        },
        about: {
            fr: 'Conçu pour les voyageurs qui rêvent de paysages arctiques, ce séjour associe observations d’aurores, confort nordique et moments culturels samis.',
            ar: 'صُممت هذه الرحلة لمن يحلمون بالمناظر القطبية؛ فهي تجمع بين مشاهدة الشفق القطبي والراحة النوردية واللحظات الثقافية السامية.',
            en: 'Designed for travelers chasing Arctic scenery, this stay blends aurora viewing, Nordic comfort, and Sami cultural moments.',
        },
        price: 2980,
        schedule: [
            {
                day: { fr: 'Jour 1', ar: 'اليوم 1', en: 'Day 1' },
                activity: {
                    fr: 'Arrivée à Tromsø',
                    ar: 'الوصول إلى ترومسو',
                    en: 'Arrival in Tromsø',
                },
                details: {
                    fr: 'Transfert à l’hôtel, introduction au groupe et dîner chaleureux.',
                    ar: 'انتقال إلى الفندق، تعريف بالمجموعة، وعشاء دافئ.',
                    en: 'Transfer to the hotel, group introduction, and a cozy dinner.',
                },
            },
            {
                day: { fr: 'Jour 2', ar: 'اليوم 2', en: 'Day 2' },
                activity: {
                    fr: 'Safari aurore boréale',
                    ar: 'رحلة الشفق القطبي',
                    en: 'Aurora safari',
                },
                details: {
                    fr: 'Partez à la recherche des aurores avec un guide expert et des arrêts photo panoramiques.',
                    ar: 'انطلق للبحث عن الأضواء الشمالية مع مرشد خبير وتوقفات تصوير بانورامية.',
                    en: 'Head out with an expert guide to chase the aurora and stop for panoramic photos.',
                },
            },
            {
                day: { fr: 'Jour 3', ar: 'اليوم 3', en: 'Day 3' },
                activity: {
                    fr: 'Traîneau à chiens et culture samie',
                    ar: 'زلاجات الكلاب وثقافة السامي',
                    en: 'Husky sledding and Sami culture',
                },
                details: {
                    fr: 'Vivez une balade en traîneau puis découvrez les traditions et récits samis autour d’un feu.',
                    ar: 'استمتع برحلة زلاجات ثم تعرّف إلى التقاليد والقصص السامية حول النار.',
                    en: 'Enjoy a husky ride, then learn Sami traditions and stories around a fire.',
                },
            },
        ],
    },
    {
        slug: 'venice-carnival',
        title: {
            fr: 'Carnaval de Venise',
            ar: 'كرنفال البندقية',
            en: 'Carnival of Venice',
        },
        location: {
            fr: 'Venise, Italie',
            ar: 'البندقية، إيطاليا',
            en: 'Venice, Italy',
        },
        date: {
            fr: '8 – 17 fév. 2026',
            ar: '8 – 17 فبراير 2026',
            en: 'Feb 8 – 17, 2026',
        },
        attendees: {
            fr: '24 participants',
            ar: '24 مشاركًا',
            en: '24 participants',
        },
        image: 'https://images.unsplash.com/photo-1495904786722-d2b5a19a8535?w=1600&h=900&fit=crop',
        gallery: [
            'https://images.unsplash.com/photo-1495904786722-d2b5a19a8535?w=1600&h=900&fit=crop',
            'https://images.unsplash.com/photo-1514894780887-121968d00567?w=1600&h=900&fit=crop',
            'https://images.unsplash.com/photo-1512758882389-6c8f5b3f0f26?w=1600&h=900&fit=crop',
        ],
        description: {
            fr: 'Masques élégants, gondoles et palais historiques dans l’un des festivals les plus iconiques d’Italie.',
            ar: 'أقنعة أنيقة وجندول وقصور تاريخية في أحد أشهر مهرجانات إيطاليا.',
            en: 'Elegant masks, gondolas, and historic palazzos in one of Italy’s most iconic festivals.',
        },
        about: {
            fr: 'Ce voyage d’hiver vous plonge dans l’atmosphère du carnaval avec ateliers de masques, bal vénitien et découverte des canaux au rythme des traditions locales.',
            ar: 'تغمرك هذه الرحلة الشتوية في أجواء الكرنفال عبر ورش الأقنعة واحتفال فينيسي واكتشاف القنوات على إيقاع التقاليد المحلية.',
            en: 'This winter getaway immerses you in carnival atmosphere with mask workshops, a Venetian ball, and canal discovery set to local traditions.',
        },
        price: 2640,
        schedule: [
            {
                day: { fr: 'Jour 1', ar: 'اليوم 1', en: 'Day 1' },
                activity: {
                    fr: 'Arrivée et promenade dans Venise',
                    ar: 'الوصول والتنزه في البندقية',
                    en: 'Arrival and Venice walk',
                },
                details: {
                    fr: 'Installation à l’hôtel et première balade sur les canaux illuminés.',
                    ar: 'الاستقرار في الفندق وأول جولة بين القنوات المضيئة.',
                    en: 'Check in and enjoy your first walk through Venice’s illuminated canals.',
                },
            },
            {
                day: { fr: 'Jour 2', ar: 'اليوم 2', en: 'Day 2' },
                activity: {
                    fr: 'Atelier masques vénitiens',
                    ar: 'ورشة الأقنعة الفينيسية',
                    en: 'Venetian mask workshop',
                },
                details: {
                    fr: 'Créez votre propre masque avant un dîner raffiné dans un palais historique.',
                    ar: 'اصنع قناعك الخاص قبل عشاء فاخر في قصر تاريخي.',
                    en: 'Create your own mask before a refined dinner in a historic palazzo.',
                },
            },
            {
                day: { fr: 'Jour 3', ar: 'اليوم 3', en: 'Day 3' },
                activity: {
                    fr: 'Bal du carnaval et gondoles',
                    ar: 'احتفال الكرنفال والجندول',
                    en: 'Carnival ball and gondolas',
                },
                details: {
                    fr: 'Profitez d’un bal masqué puis d’une balade en gondole au coucher du soleil.',
                    ar: 'استمتع بحفل تنكري ثم جولة بالجندول عند الغروب.',
                    en: 'Enjoy a masquerade ball and a gondola ride at sunset.',
                },
            },
        ],
    },
];
