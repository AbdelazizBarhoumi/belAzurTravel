export type Lang = 'fr' | 'ar' | 'en';

type TranslationEntry = {
    fr: string;
    ar: string;
    en: string;
};

const tr = (fr: string, ar: string, en: string): TranslationEntry => ({
    fr,
    ar,
    en,
});

const DESTINATIONS = tr('Destinations', 'الوجهات', 'Destinations');
const HOTELS = tr('Hôtels', 'الفنادق', 'Hotels');
const TOURS = tr('Circuits', 'الجولات', 'Tours');
const GALLERY = tr('Galerie', 'المعرض', 'Gallery');
const BLOG = tr('Blog', 'المدونة', 'Blog');
const BOOK = tr('Réserver', 'احجز', 'Book');
const SIGN_OUT = tr('Se Déconnecter', 'تسجيل الخروج', 'Sign Out');
const SETTINGS = tr('Paramètres', 'الإعدادات', 'Settings');
const PROFILE = tr('Profil', 'الملف الشخصي', 'Profile');
const PAYMENTS = tr('Paiements', 'المدفوعات', 'Payments');
const ITINERARIES = tr('Itinéraires', 'الخطط', 'Itineraries');
const WISHLIST = tr('Liste de souhaits', 'قائمة الرغبات', 'Wishlist');
const VIEW_ALL = tr('Tout Voir', 'عرض الكل', 'View All');
const VIEW_DETAILS = tr('Voir les détails', 'عرض التفاصيل', 'View details');
const ALL = tr('Tout', 'الكل', 'All');
const OWNER = tr('Propriétaire', 'المالك', 'Owner');
const SUPERADMIN = tr('Super Admin', 'مدير عام', 'Super Admin');
const CLIENT = tr('Client', 'العميل', 'Client');
const ADMIN = tr('Admin', 'مدير', 'Admin');
const ASSISTANT = tr('Assistant', 'مساعد', 'Assistant');

export const translations: Record<string, TranslationEntry> = {
    // Navbar
    'nav.destinations': DESTINATIONS,
    'nav.hotels': HOTELS,
    'nav.tours': TOURS,
    'nav.deals': { fr: 'Offres', ar: 'العروض', en: 'Deals' },
    'nav.gallery': GALLERY,
    'nav.events': { fr: 'Événements', ar: 'الفعاليات', en: 'Events' },
    'nav.blog': BLOG,
    'nav.more': { fr: 'Plus', ar: 'المزيد', en: 'More' },
    'nav.cars': { fr: 'Voitures', ar: 'السيارات', en: 'Cars' },
    'nav.flights': { fr: 'Vols', ar: 'الرحلات', en: 'Flights' },
    'nav.promos': { fr: 'Promotions', ar: 'العروض الترويجية', en: 'Promos' },
    'nav.team': { fr: 'Notre Équipe', ar: 'فريقنا', en: 'Our Team' },
    'nav.partners': { fr: 'Partenaires', ar: 'الشركاء', en: 'Partners' },
    'nav.contact': { fr: 'Contact', ar: 'اتصل بنا', en: 'Contact Us' },
    'nav.legal': {
        fr: 'Mentions Légales',
        ar: 'الإشعارات القانونية',
        en: 'Legal',
    },
    'nav.privacy-policy': {
        fr: 'Politique de confidentialité',
        ar: 'سياسة الخصوصية',
        en: 'Privacy Policy',
    },
    'nav.purchase-policy': {
        fr: "Politique d'achat",
        ar: 'سياسة الشراء',
        en: 'Purchase Policy',
    },
    'nav.visa': { fr: 'Visa', ar: 'تأشيرة', en: 'Visa' },
    'nav.dashboard': {
        fr: 'Tableau de bord',
        ar: 'لوحة القيادة',
        en: 'Dashboard',
    },

    // Cookie / Privacy
    'cookie.banner.title': {
        fr: 'Cookies & Confidentialité',
        ar: 'ملفات تعريف الارتباط والخصوصية',
        en: 'Cookies & Privacy',
    },
    'cookie.banner.description': {
        fr: 'Nous utilisons des cookies pour améliorer votre expérience. Vous pouvez accepter ou gérer vos préférences.',
        ar: 'نستخدم ملفات تعريف الارتباط لتحسين تجربتك. يمكنك قبولها أو إدارة تفضيلاتك.',
        en: 'We use cookies to improve your experience. You can accept or manage your preferences.',
    },
    'cookie.accept': { fr: 'Accepter', ar: 'قبول', en: 'Accept' },
    'cookie.decline': { fr: 'Refuser', ar: 'رفض', en: 'Decline' },
    'cookie.learnMore': {
        fr: 'En savoir plus',
        ar: 'تعرف على المزيد',
        en: 'Learn more',
    },
    'cookie.settings': {
        fr: 'Paramètres des cookies',
        ar: 'إعدادات الكوكيز',
        en: 'Cookie settings',
    },
    'nav.home': { fr: 'Accueil', ar: 'الرئيسية', en: 'Home' },
    'nav.signin': { fr: 'Connexion', ar: 'تسجيل الدخول', en: 'Sign in' },
    'nav.start': { fr: 'Commencer', ar: 'ابدأ', en: 'Get Started' },
    'nav.favorites': { fr: 'Favoris', ar: 'المفضلة', en: 'Favorites' },
    'nav.profile': PROFILE,
    'admin.details': { fr: 'Détails', ar: 'التفاصيل', en: 'Details' },
    'admin.eventForm.coreDetails': {
        fr: 'Détails de l’événement',
        ar: 'تفاصيل الفعالية',
        en: 'Event details',
    },
    'admin.eventForm.coreDetailsHint': {
        fr: 'Modifiez les champs de l’événement localisés un par un.',
        ar: 'قم بتحرير حقول الفعالية المترجمة لغة بلغة.',
        en: 'Edit localized event fields one language at a time.',
    },
    'admin.eventForm.about': {
        fr: 'À propos',
        ar: 'حول',
        en: 'About',
    },
    'admin.eventForm.attendees': {
        fr: 'Participants',
        ar: 'الحضور',
        en: 'Attendees',
    },
    'admin.eventForm.schedule': {
        fr: 'Programme',
        ar: 'البرنامج',
        en: 'Schedule',
    },
    'admin.eventForm.addDay': {
        fr: 'Ajouter un jour',
        ar: 'إضافة يوم',
        en: 'Add Day',
    },
    'admin.day': { fr: 'Jour', ar: 'يوم', en: 'Day' },
    'admin.activity': { fr: 'Activité', ar: 'نشاط', en: 'Activity' },
    'admin.settings.noSocialLinks': {
        fr: 'Aucun lien social ajouté.',
        ar: 'لم تتم إضافة روابط اجتماعية.',
        en: 'No social links yet.',
    },
    'admin.settings.noHours': {
        fr: 'Aucune heure définie.',
        ar: 'لم يتم تحديد ساعات العمل.',
        en: 'No hours set.',
    },
    'admin.settings.legalSectionsTitle': {
        fr: 'Sections Légales',
        ar: 'الأقسام القانونية',
        en: 'Legal Sections',
    },
    'admin.settings.legalSectionsDescription': {
        fr: 'Gérez la confidentialité, les conditions et autres contenus juridiques affichés sur le site.',
        ar: 'إدارة الخصوصية والشروط والمحتويات القانونية الأخرى المعروضة على الموقع.',
        en: 'Manage privacy, terms and other legal content shown on the site.',
    },
    'admin.settings.saveSuccess': {
        fr: 'Paramètres du site enregistrés',
        ar: 'تم حفظ إعدادات الموقع',
        en: 'Site settings saved',
    },
    'admin.settings.saveError': {
        fr: "Échec de l'enregistrement des paramètres du site",
        ar: 'فشل في حفظ إعدادات الموقع',
        en: 'Failed to save site settings',
    },
    'admin.settings.missingTranslation': {
        fr: 'Traduction :lang manquante',
        ar: 'ترجمة :lang مفقودة',
        en: 'Missing :lang translation',
    },
    'admin.settings.resetNavError': {
        fr: 'Échec de la réinitialisation des paramètres de navigation',
        ar: 'فشل في إعادة تعيين إعدادات التنقل',
        en: 'Failed to reset navigation settings',
    },
    'admin.required': {
        fr: 'Champ requis',
        ar: 'حقل مطلوب',
        en: 'Field required',
    },
    'admin.pleaseFixErrors': {
        fr: 'Veuillez corriger les erreurs avant d’enregistrer.',
        ar: 'يرجى تصحيح الأخطاء قبل الحفظ.',
        en: 'Please fix the errors before saving.',
    },

    // Flights
    'admin.promos.title': {
        fr: 'Promos',
        ar: 'الرموز الترويجية',
        en: 'Promos',
    },
    'admin.promos.subtitle': {
        fr: 'Gérer les codes promo',
        ar: 'إدارة الرموز الترويجية',
        en: 'Manage promo codes',
    },
    'admin.promos.code': { fr: 'Code', ar: 'الرمز', en: 'Code' },
    'admin.promos.titleLabel': { fr: 'Titre', ar: 'العنوان', en: 'Title' },
    'admin.promos.discount': { fr: 'Remise', ar: 'الخصم', en: 'Discount' },
    'admin.promos.expires': { fr: 'Expiration', ar: 'ينتهي', en: 'Expires' },
    'admin.promos.eligibility': {
        fr: 'Éligibilité',
        ar: 'الأهلية',
        en: 'Eligibility',
    },
    'admin.promos.howToUse': {
        fr: 'Comment utiliser',
        ar: 'كيفية الاستخدام',
        en: 'How to use',
    },
    'admin.promos.terms': {
        fr: 'Termes et conditions',
        ar: 'الشروط والأحكام',
        en: 'Terms & Conditions',
    },
    'admin.promos.addRule': {
        fr: 'Ajouter une règle',
        ar: 'إضافة قاعدة',
        en: 'Add rule',
    },
    'admin.promos.addStep': {
        fr: 'Ajouter une étape',
        ar: 'إضافة خطوة',
        en: 'Add step',
    },
    'admin.promos.addTerm': {
        fr: 'Ajouter un terme',
        ar: 'إضافة شرط',
        en: 'Add term',
    },
    'admin.promos.gallery': {
        fr: "Galerie d'images",
        ar: 'معرض الصور',
        en: 'Gallery images',
    },
    'admin.promos.usageLimit': {
        fr: "Limite d'utilisation",
        ar: 'حد الاستخدام',
        en: 'Usage limit',
    },
    'admin.promos.perUserLimit': {
        fr: 'Limite par utilisateur',
        ar: 'الحد لكل مستخدم',
        en: 'Per-user limit',
    },
    'admin.promos.applicableTo': {
        fr: 'Applicable à',
        ar: 'ينطبق على',
        en: 'Applicable to',
    },
    'admin.promos.active': { fr: 'Actif', ar: 'نشط', en: 'Active' },
    'admin.promos.inactive': { fr: 'Inactif', ar: 'غير نشط', en: 'Inactive' },
    'admin.promos.limitsTitle': {
        fr: 'Limites et portée',
        ar: 'الحدود والنطاق',
        en: 'Limits and scope',
    },
    'admin.promos.limitsDescription': {
        fr: "Métadonnées d'utilisation de la campagne et état actif.",
        ar: 'بيانات استخدام الحملة وحالة النشاط.',
        en: 'Campaign usage metadata and active state.',
    },
    'admin.errors.required': {
        fr: 'Ce champ est requis.',
        ar: 'هذا الحقل مطلوب.',
        en: 'This field is required.',
    },
    'admin.saveError': {
        fr: "Échec de l'enregistrement des données.",
        ar: 'فشل حفظ البيانات.',
        en: 'Failed to save data.',
    },
    'admin.saveFailed': {
        fr: "Échec de la sauvegarde",
        ar: 'فشل الحفظ',
        en: 'Failed to save',
    },

    // Flights
    'admin.flights': { fr: 'Vols', ar: 'الرحلات', en: 'Flights' },
    'admin.flightsSubtitle': {
        fr: 'Gérez les vols disponibles sur le site.',
        ar: 'إدارة الرحلات المتاحة على الموقع.',
        en: 'Manage flights available on the site.',
    },
    'admin.technicalInfo': {
        fr: 'Informations techniques',
        ar: 'معلومات تقنية',
        en: 'Technical info',
    },
    'validation.required': {
        fr: 'Champ requis',
        ar: 'حقل مطلوب',
        en: 'Required field',
    },
    'validation.invalidPrice': {
        fr: 'Prix invalide',
        ar: 'سعر غير صالح',
        en: 'Invalid price',
    },
    'admin.flightForm.coreDetails': {
        fr: 'Détails du vol',
        ar: 'تفاصيل الرحلة',
        en: 'Flight details',
    },
    'admin.flightForm.coreDetailsHint': {
        fr: 'Modifiez les champs de vol localisés un par un.',
        ar: 'قم بتحرير حقول الرحلة المترجمة لغة بلغة.',
        en: 'Edit localized flight fields one language at a time.',
    },
    'admin.flightForm.routeAndAirline': {
        fr: 'Itinéraire et compagnie aérienne',
        ar: 'المسار وشركة الطيران',
        en: 'Route and airline',
    },
    'admin.flightForm.schedule': {
        fr: 'Programme',
        ar: 'الجدول الزمني',
        en: 'Schedule',
    },
    'admin.flightForm.cabinAndServiceDetails': {
        fr: 'Détails de la cabine et des services',
        ar: 'تفاصيل المقصورة والخدمات',
        en: 'Cabin and service details',
    },
    'admin.flightForm.departureTime': {
        fr: 'Heure de départ',
        ar: 'وقت المغادرة',
        en: 'Departure time',
    },
    'admin.flightForm.arrivalTime': {
        fr: "Heure d'arrivée",
        ar: 'وقت الوصول',
        en: 'Arrival time',
    },
    'admin.flightForm.travelDate': {
        fr: 'Date du voyage',
        ar: 'تاريخ السفر',
        en: 'Travel date',
    },
    'admin.flightForm.seats': {
        fr: 'Sièges',
        ar: 'المقاعد',
        en: 'Seats',
    },
    'admin.flightForm.refund': {
        fr: 'Remboursement',
        ar: 'الاسترداد',
        en: 'Refund',
    },
    'admin.flightForm.departurePlaceholder': {
        fr: '14:00',
        ar: '14:00',
        en: '14:00',
    },
    'admin.flightForm.arrivalPlaceholder': {
        fr: '22:30+1',
        ar: '22:30+1',
        en: '22:30+1',
    },
    'admin.flightForm.seatsPlaceholder': {
        fr: '250',
        ar: '250',
        en: '250',
    },
    'admin.flightForm.refundPlaceholder': {
        fr: 'Politique de remboursement',
        ar: 'سياسة الاسترداد',
        en: 'Refund policy',
    },
    'admin.airline': {
        fr: 'Compagnie aérienne',
        ar: 'شركة الطيران',
        en: 'Airline',
    },
    'admin.to': { fr: 'Destination', ar: 'الوجهة', en: 'Destination' },
    'admin.duration': { fr: 'Durée', ar: 'المدة', en: 'Duration' },
    'label.stops': { fr: 'Escales', ar: 'توقف', en: 'Stops' },
    'admin.price': { fr: 'Prix', ar: 'السعر', en: 'Price' },
    'admin.date': { fr: 'Date', ar: 'التاريخ', en: 'Date' },
    'admin.code': { fr: 'Code', ar: 'الرمز', en: 'Code' },
    'admin.from': { fr: 'Origine', ar: 'الأصل', en: 'Origin' },
    'admin.bio': { fr: 'Bio', ar: 'السيرة الذاتية', en: 'Bio' },
    'admin.promos.descriptionPlaceholder': {
        fr: 'Description',
        ar: 'وصف',
        en: 'Description',
    },

    'label.aircraft': { fr: 'Avion', ar: 'الطائرة', en: 'Aircraft' },
    'label.cabin': { fr: 'Cabine', ar: 'المقصورة', en: 'Cabin' },
    'admin.actions': { fr: 'Actions', ar: 'الإجراءات', en: 'Actions' },
    'actions.deleted': { fr: 'Supprimé', ar: 'تم الحذف', en: 'Deleted' },
    'actions.saved': { fr: 'Enregistré', ar: 'تم الحفظ', en: 'Saved' },
    'actions.added': { fr: 'Ajouté', ar: 'تمت الإضافة', en: 'Added' },
    'actions.edit': { fr: 'Modifier', ar: 'تعديل', en: 'Edit' },
    'actions.add': { fr: 'Ajouter', ar: 'إضافة', en: 'Add' },
    'actions.book_now': {
        fr: 'Réserver maintenant',
        ar: 'احجز الآن',
        en: 'Book now',
    },
    'actions.whatsapp': { fr: 'WhatsApp', ar: 'واتساب', en: 'WhatsApp' },
    'actions.call': { fr: 'Appeler', ar: 'اتصال', en: 'Call' },

    'cat.city': { fr: 'Ville', ar: 'مدينة', en: 'City' },
    'cat.nature': { fr: 'Nature', ar: 'طبيعة', en: 'Nature' },
    'cat.luxury': { fr: 'Luxe', ar: 'فاخر', en: 'Luxury' },
    'cat.adventure': { fr: 'Aventure', ar: 'مغامرة', en: 'Adventure' },
    'cat.boutique': { fr: 'Boutique', ar: 'بوتيك', en: 'Boutique' },
    'cat.resorts': { fr: 'Complexes', ar: 'منتجعات', en: 'Resorts' },
    'cat.budget': { fr: 'Économique', ar: 'اقتصادي', en: 'Budget' },
    'cat.family': { fr: 'Famille', ar: 'عائلي', en: 'Family' },

    // Hero
    'hero.kicker': {
        fr: 'Découvrez le Monde',
        ar: 'اكتشف العالم',
        en: 'Discover the World',
    },
    'hero.title1': { fr: 'Votre Prochaine', ar: 'مغامرتك', en: 'Your Next' },
    'hero.title2': { fr: 'Aventure', ar: 'القادمة', en: 'Adventure' },
    'hero.title3': { fr: 'vous Attend', ar: 'في انتظارك', en: 'Awaits You' },
    'hero.subtitle': {
        fr: 'Des voyages sur mesure vers les destinations les plus extraordinaires du monde.',
        ar: 'رحلات مصممة خصيصًا إلى أكثر الوجهات روعة في العالم.',
        en: "Tailor-made journeys to the world's most extraordinary destinations.",
    },
    'hero.where': {
        fr: 'Où voulez-vous aller ?',
        ar: 'إلى أين تريد الذهاب؟',
        en: 'Where do you want to go?',
    },
    'hero.when': { fr: 'Quand ?', ar: 'متى؟', en: 'When?' },
    'hero.guests': { fr: 'BelAzurTravels', ar: 'المسافرون', en: 'Guests' },
    'hero.search': { fr: 'Rechercher', ar: 'بحث', en: 'Search' },
    'hero.description': {
        fr: 'Des voyages artisanaux vers les destinations les plus extraordinaires du monde. Laissez-nous transformer vos rêves de voyage en souvenirs inoubliables.',
        ar: 'رحلات حرفية إلى أكثر الوجهات روعة في العالم. دعنا نحول أحلام رحلتك إلى ذكريات لا تُنسى.',
        en: "Handcrafted journeys to the world's most extraordinary destinations. Let us turn your travel dreams into unforgettable memories.",
    },
    'hero.searchHint': {
        fr: 'Commencez par une destination, puis affinez avec vos dates et le nombre de voyageurs.',
        ar: 'ابدأ بوجهة، ثم حدّد التواريخ وعدد المسافرين لتضييق النتائج.',
        en: 'Start with a destination, then refine by dates and travelers to narrow the best matches.',
    },

    // Design Trip page disabled for now.

    // Search Widget
    'search.tabs.hotels': { fr: 'Hôtels', ar: 'فنادق', en: 'Hotels' },
    'search.tabs.tours': { fr: 'Circuits', ar: 'جولات', en: 'Tours' },
    'search.tabs.flights': { fr: 'Vols', ar: 'رحلات', en: 'Flights' },

    'search.fields.destination': {
        fr: 'Destination',
        ar: 'الوجهة',
        en: 'Destination',
    },
    'search.fields.country': { fr: 'Pays', ar: 'البلد', en: 'Country' },
    'search.placeholders.country': { fr: 'Sélectionner un pays', ar: 'اختر البلد', en: 'Select country' },
    'search.fields.dates': { fr: 'Dates', ar: 'التواريخ', en: 'Dates' },
    'search.fields.guests': {
        fr: 'BelAzurTravels',
        ar: 'المسافرون',
        en: 'Guests',
    },
    'search.fields.travelers': {
        fr: 'BelAzurTravels',
        ar: 'المسافرون',
        en: 'Travelers',
    },
    'search.fields.passengers': {
        fr: 'Passagers',
        ar: 'الركاب',
        en: 'Passengers',
    },
    'search.fields.roomType': {
        fr: 'Type de chambre',
        ar: 'نوع الغرفة',
        en: 'Room type',
    },
    'search.fields.propertyClass': {
        fr: 'Catégorie',
        ar: 'تصنيف العقار',
        en: 'Property class',
    },
    'search.fields.tourStyle': {
        fr: 'Style du circuit',
        ar: 'نوع الجولة',
        en: 'Tour style',
    },
    'search.fields.duration': { fr: 'Durée', ar: 'المدة', en: 'Duration' },
    'search.fields.tripType': {
        fr: 'Type de trajet',
        ar: 'نوع الرحلة',
        en: 'Trip type',
    },
    'search.fields.cabinClass': {
        fr: 'Classe cabine',
        ar: 'درجة المقعد',
        en: 'Cabin class',
    },

    'search.placeholders.destination': {
        fr: 'Ville, hôtel ou lieu',
        ar: 'مدينة أو فندق أو موقع',
        en: 'City, hotel, or place',
    },
    'search.placeholders.checkIn': {
        fr: 'Arrivée',
        ar: 'تسجيل الوصول',
        en: 'Check in',
    },
    'search.placeholders.checkOut': {
        fr: 'Départ',
        ar: 'تسجيل المغادرة',
        en: 'Check out',
    },
    'search.placeholders.dates': {
        fr: 'Choisir des dates',
        ar: 'اختر التواريخ',
        en: 'Choose dates',
    },
    'search.placeholders.flexibleDates': {
        fr: 'Dates flexibles',
        ar: 'تواريخ مرنة',
        en: 'Flexible dates',
    },
    'search.placeholders.guest': { fr: 'voyageur', ar: 'مسافر', en: 'guest' },
    'search.placeholders.guests': {
        fr: 'voyageurs',
        ar: 'مسافرون',
        en: 'guests',
    },
    'search.placeholders.guestsHelp': {
        fr: 'Sélectionnez le nombre de voyageurs.',
        ar: 'اختر عدد المسافرين.',
        en: 'Select how many people are traveling.',
    },

    'search.actions.hotels': {
        fr: 'Rechercher des hôtels',
        ar: 'ابحث عن فنادق',
        en: 'Search Hotels',
    },
    'search.actions.tours': {
        fr: 'Rechercher des circuits',
        ar: 'ابحث عن جولات',
        en: 'Search Tours',
    },
    'search.actions.flights': {
        fr: 'Rechercher des vols',
        ar: 'ابحث عن رحلات',
        en: 'Search Flights',
    },
    'search.actions.decreaseGuests': {
        fr: 'Réduire le nombre de voyageurs',
        ar: 'تقليل عدد المسافرين',
        en: 'Decrease guests',
    },
    'search.actions.increaseGuests': {
        fr: 'Augmenter le nombre de voyageurs',
        ar: 'زيادة عدد المسافرين',
        en: 'Increase guests',
    },

    'search.options.any': { fr: 'Peu importe', ar: 'أي', en: 'Any' },
    'search.options.standard': { fr: 'Standard', ar: 'عادي', en: 'Standard' },
    'search.options.deluxe': { fr: 'Deluxe', ar: 'ديلوكس', en: 'Deluxe' },
    'search.options.suite': { fr: 'Suite', ar: 'جناح', en: 'Suite' },
    'search.options.threeStar': { fr: '3 étoiles', ar: '3 نجوم', en: '3 star' },
    'search.options.fourStar': { fr: '4 étoiles', ar: '4 نجوم', en: '4 star' },
    'search.options.fiveStar': { fr: '5 étoiles', ar: '5 نجوم', en: '5 star' },
    'search.options.guided': { fr: 'Guidé', ar: 'مرشد', en: 'Guided' },
    'search.options.private': { fr: 'Privé', ar: 'خاص', en: 'Private' },
    'search.options.group': { fr: 'Groupe', ar: 'مجموعة', en: 'Group' },
    'search.options.halfDay': {
        fr: 'Demi-journée',
        ar: 'نصف يوم',
        en: 'Half day',
    },
    'search.options.fullDay': {
        fr: 'Journée complète',
        ar: 'يوم كامل',
        en: 'Full day',
    },
    'search.options.multiDay': {
        fr: 'Plusieurs jours',
        ar: 'عدة أيام',
        en: 'Multi day',
    },
    'search.options.roundTrip': {
        fr: 'Aller-retour',
        ar: 'ذهاب وعودة',
        en: 'Round trip',
    },
    'search.options.oneWay': {
        fr: 'Aller simple',
        ar: 'ذهاب فقط',
        en: 'One way',
    },
    'search.options.multiCity': {
        fr: 'Multi-ville',
        ar: 'عدة مدن',
        en: 'Multi city',
    },
    'search.options.economy': { fr: 'Économie', ar: 'اقتصادي', en: 'Economy' },
    'search.options.premiumEconomy': {
        fr: 'Économie premium',
        ar: 'اقتصادي مميز',
        en: 'Premium economy',
    },
    'search.options.business': {
        fr: 'Affaires',
        ar: 'رجال الأعمال',
        en: 'Business',
    },
    'search.options.first': { fr: 'Première', ar: 'الأولى', en: 'First' },

    // Featured Destinations
    'featured.explore': { fr: 'Découvrir', ar: 'استكشاف', en: 'Explore' },
    'featured.title': {
        fr: 'Destinations Vedettes',
        ar: 'الوجهات المميزة',
        en: 'Featured Destinations',
    },
    'featured.subtitle': {
        fr: 'Sélections soigneusement choisies des endroits les plus époustouflants du monde, sélectionnés à la main par nos experts en voyages.',
        ar: 'تشكيلات منتقاة من أجمل الأماكن في العالم، اختيرت يدويًا من قبل خبرائنا في السفر.',
        en: "Curated selections of the world's most breathtaking places, handpicked by our travel experts.",
    },

    // Home trust strip
    'home.trust.eyebrow': {
        fr: 'Pourquoi nous choisir',
        ar: 'لماذا تختارنا',
        en: 'Why choose us',
    },
    'home.trust.title': {
        fr: 'Une expérience qui rassure avant même la réservation',
        ar: 'تجربة تمنحك الثقة قبل الحجز حتى',
        en: 'Confidence that starts before you even book',
    },
    'home.trust.subtitle': {
        fr: 'Les visiteurs veulent savoir si l’offre est fiable, simple et accompagnée. Cette section répond immédiatement à cette attente.',
        ar: 'يريد الزائرون أن يعرفوا ما إذا كانت الخدمة موثوقة وسهلة ومدعومة. هذا القسم يجيب على ذلك فورًا.',
        en: 'Visitors want to know the service is reliable, simple, and supported. This section answers that immediately.',
    },
    'home.trust.securityTitle': {
        fr: 'Paiement sécurisé',
        ar: 'دفع آمن',
        en: 'Secure payments',
    },
    'home.trust.securityDescription': {
        fr: 'Des parcours clairs et des informations transparentes pour éviter toute surprise au moment de réserver.',
        ar: 'خطوات واضحة ومعلومات شفافة لتجنب المفاجآت عند الحجز.',
        en: 'Clear flows and transparent details help remove surprises at the point of booking.',
    },
    'home.trust.curatedTitle': {
        fr: 'Sélections expertes',
        ar: 'اختيارات مدروسة',
        en: 'Expertly curated options',
    },
    'home.trust.curatedDescription': {
        fr: 'Les destinations, offres et contenus sont présentés pour guider rapidement la décision sans surcharge.',
        ar: 'تُعرض الوجهات والعروض والمحتوى بطريقة تساعدك على اتخاذ القرار بسرعة دون ازدحام.',
        en: 'Destinations, offers, and content are presented to guide decisions quickly without overload.',
    },
    'home.trust.supportTitle': {
        fr: 'Support humain',
        ar: 'دعم بشري',
        en: 'Human support',
    },
    'home.trust.supportDescription': {
        fr: 'Un conseiller reste disponible si l\u2019utilisateur a besoin d\u2019aide avant de finaliser son choix.',
        ar: 'يبقى المستشار متاحًا إذا احتاج المستخدم للمساعدة قبل اتخاذ القرار النهائي.',
        en: 'A travel advisor is available when a user needs help before making the final choice.',
    },
    'home.showcase.title': {
        fr: 'Moments de nos voyageurs',
        ar: 'لحظات من مسافرينا',
        en: 'Moments from Our Travelers',
    },
    'home.showcase.subtitle': {
        fr: 'Une galerie vivante de destinations sélectionnées par notre communauté.',
        ar: 'معرض حي للوجهات يختارها مجتمعنا.',
        en: 'A living gallery of destinations curated by our community.',
    },
    'home.showcase.partners': {
        fr: 'Approuvé par des partenaires de classe mondiale',
        ar: 'موثوق من شركاء عالميين',
        en: 'Trusted by World-Class Partners',
    },
    'partners.title': {
        fr: 'Nos Partenaires',
        ar: 'شركاؤنا',
        en: 'Our Partners',
    },
    'partners.subtitle': {
        fr: 'Des marques de classe mondiale avec lesquelles nous collaborons pour concevoir vos voyages.',
        ar: 'علامات تجارية عالمية نتعاون معها لتصميم رحلاتك.',
        en: 'World-class brands we collaborate with to craft your journeys.',
    },
    'partners.searchPlaceholder': {
        fr: 'Rechercher des partenaires...',
        ar: 'البحث عن شركاء...',
        en: 'Search partners...',
    },
    'partners.noResults': {
        fr: 'Aucun partenaire ne correspond à votre recherche.',
        ar: 'لا يوجد شركاء يطابقون بحثك.',
        en: 'No partners match your search.',
    },
    // Home steps
    'home.steps.eyebrow': {
        fr: 'Comment ça marche',
        ar: 'كيف يعمل',
        en: 'How it works',
    },
    'home.steps.title': {
        fr: 'Un parcours simple de l’idée à la réservation',
        ar: 'رحلة بسيطة من الفكرة إلى الحجز',
        en: 'A simple journey from idea to booking',
    },
    'home.steps.subtitle': {
        fr: 'Les visiteurs comprennent tout de suite le processus et voient qu’il n’y a pas de complexité cachée.',
        ar: 'يفهم الزائرون العملية فورًا ويرون أنه لا توجد تعقيدات مخفية.',
        en: 'Visitors instantly understand the process and see that there is no hidden complexity.',
    },
    'home.steps.step1Title': {
        fr: 'Choisir une direction',
        ar: 'اختر الوجهة',
        en: 'Choose a direction',
    },
    'home.steps.step1Description': {
        fr: 'Commencez par une destination, un type de voyage ou un thème pour orienter la recherche.',
        ar: 'ابدأ بوجهة أو نوع رحلة أو موضوع لتوجيه البحث.',
        en: 'Start with a destination, trip type, or theme to focus the search.',
    },
    'home.steps.step2Title': {
        fr: 'Ajuster les détails',
        ar: 'عدّل التفاصيل',
        en: 'Refine the details',
    },
    'home.steps.step2Description': {
        fr: 'Affinez les dates, le nombre de voyageurs et les préférences pour obtenir des options plus pertinentes.',
        ar: 'حدد التواريخ وعدد المسافرين والتفضيلات للحصول على خيارات أكثر ملاءمة.',
        en: 'Refine dates, travelers, and preferences to get more relevant options.',
    },
    'home.steps.step3Title': {
        fr: 'Réserver en confiance',
        ar: 'احجز بثقة',
        en: 'Book with confidence',
    },
    'home.steps.step3Description': {
        fr: 'Passez à une demande plus ciblée ou contactez l’équipe pour finaliser le voyage.',
        ar: 'انتقل إلى طلب أكثر تحديدًا أو تواصل مع الفريق لإكمال الحجز.',
        en: 'Move into a more focused request or contact the team to finalize the trip.',
    },
    'home.steps.cta': {
        fr: 'Commencer la planification',
        ar: 'ابدأ التخطيط',
        en: 'Start planning',
    },

    // Home CTA
    'home.cta.eyebrow': {
        fr: 'Prêt à partir ?',
        ar: 'هل أنت مستعد للانطلاق؟',
        en: 'Ready to go?',
    },
    'home.cta.title': {
        fr: 'Transformez l’inspiration en itinéraire concret',
        ar: 'حوّل الإلهام إلى برنامج سفر واضح',
        en: 'Turn inspiration into a concrete itinerary',
    },
    'home.cta.subtitle': {
        fr: 'La dernière section doit convertir les hésitants. Elle rappelle l’avantage, clarifie l’action et réduit le risque perçu.',
        ar: 'يجب أن تحوّل هذه الواجهة المترددين. إنها تذكّر بالفائدة وتوضح الإجراء وتقلل المخاطرة المتصورة.',
        en: 'The final section should convert hesitant users. It restates the value, clarifies the action, and lowers perceived risk.',
    },
    'home.cta.primary': {
        fr: 'Commencer à planifier',
        ar: 'ابدأ التخطيط',
        en: 'Start planning',
    },
    'home.cta.secondary': {
        fr: 'Parler à un conseiller',
        ar: 'تحدث إلى مستشار',
        en: 'Talk to an advisor',
    },
    'home.cta.assurance1': {
        fr: 'Des offres adaptées au budget et aux envies de chaque voyageur.',
        ar: 'عروض تناسب الميزانية واحتياجات كل مسافر.',
        en: 'Offers tailored to each traveler’s budget and preferences.',
    },
    'home.cta.assurance2': {
        fr: 'Des suggestions claires pour passer rapidement de l’idée à l’action.',
        ar: 'اقتراحات واضحة للانتقال بسرعة من الفكرة إلى التنفيذ.',
        en: 'Clear suggestions help turn an idea into action quickly.',
    },
    'home.cta.assurance3': {
        fr: 'Un accompagnement avant, pendant et après la réservation.',
        ar: 'مرافقة قبل الحجز وأثناءه وبعده.',
        en: 'Support before, during, and after booking.',
    },

    // Deals Section
    'deals.save': {
        fr: 'Économiser Plus',
        ar: 'توفير المزيد',
        en: 'Save More',
    },
    'deals.title': {
        fr: 'Offres Exclusives',
        ar: 'العروض الحصرية',
        en: 'Exclusive Deals',
    },
    'deals.subtitle': {
        fr: 'Profitez de nos offres à durée limitée et réalisez les vacances de vos rêves.',
        ar: 'استفد من عروضنا المحدودة الوقت واجعل إجازتك الحلم حقيقة.',
        en: 'Take advantage of our limited-time offers and make your dream vacation a reality.',
    },
    'deals.searchPlaceholder': {
        fr: 'Rechercher des offres...',
        ar: 'ابحث عن العروض...',
        en: 'Search offers...',
    },
    'deals.viewDeal': { fr: "Voir l'Offre", ar: 'شاهد العرض', en: 'View Deal' },
    'deals.placeholder.title': {
        fr: 'p.ex. Évasion estivale',
        ar: 'مثلاً: رحلة الصيف',
        en: 'E.g., Summer Escape',
    },
    'deals.placeholder.discount': {
        fr: 'p.ex. 20%',
        ar: 'مثلاً: 20%',
        en: 'E.g., 20%',
    },
    'deals.placeholder.expires': {
        fr: 'p.ex. 2026-12-31',
        ar: 'مثلاً: 2026-12-31',
        en: 'E.g., 2026-12-31',
    },
    'deals.promotionDescription': {
        fr: 'Modifier les champs de promotion localisés un par un.',
        ar: 'قم بتحرير حقول العرض المترجمة لغة بلغة.',
        en: 'Edit localized promotion fields one language at a time.',
    },
    'deals.selectCategory': {
        fr: 'Sélectionner une catégorie',
        ar: 'اختر الفئة',
        en: 'Select category',
    },
    'deals.description': { fr: 'Description', ar: 'الوصف', en: 'Description' },
    'deals.descriptionLong': {
        fr: "Description longue affichée sur la page des détails de l'offre.",
        ar: 'وصف طويل معروض على صفحة تفاصيل العرض.',
        en: 'Long-form copy shown on the deal detail page.',
    },
    'deals.titleLabel': { fr: 'Titre', ar: 'العنوان', en: 'Title' },
    'deals.discountLabel': { fr: 'Remise', ar: 'الخصم', en: 'Discount' },
    'deals.expiresLabel': { fr: 'Expiration', ar: 'ينتهي', en: 'Expires' },
    'admin.fieldRequired': {
        fr: 'Ce champ est obligatoire.',
        ar: 'هذا الحقل مطلوب.',
        en: 'This field is required.',
    },
    'deals.promotionDetails': {
        fr: 'Détails de la promotion',
        ar: 'تفاصيل العرض',
        en: 'Promotion details',
    },
    'deals.manageCategories': {
        fr: 'Gérer les catégories',
        ar: 'إدارة الفئات',
        en: 'Manage categories',
    },
    'deals.categoryLabel': { fr: 'Catégorie', ar: 'الفئة', en: 'Category' },
    'admin.priceHint': {
        fr: 'Prix par personne en TND.',
        ar: 'السعر للشخص الواحد بالدينار التونسي.',
        en: 'Price per person in TND.',
    },
    'admin.descriptionPlaceholder': {
        fr: 'Saisissez une description détaillée de l’événement...',
        ar: 'أدخل وصفاً تفصيلياً للفعالية...',
        en: 'Enter a detailed description of the event...',
    },
    'admin.titlePlaceholder': {
        fr: 'p.ex. Festival de musique d’été',
        ar: 'مثلاً: مهرجان الصيف الموسيقي',
        en: 'e.g. Summer Music Festival',
    },
    'admin.locationPlaceholder': {
        fr: 'p.ex. Paris, France',
        ar: 'مثلاً: باريس، فرنسا',
        en: 'e.g. Paris, France',
    },
    'admin.error.required': {
        fr: 'Ce champ est requis.',
        ar: 'هذا الحقل مطلوب.',
        en: 'This field is required.',
    },
    'admin.error.invalidPrice': {
        fr: 'Prix invalide.',
        ar: 'سعر غير صالح.',
        en: 'Invalid price.',
    },
    'admin.description': { fr: 'Description', ar: 'الوصف', en: 'Description' },
    'admin.title': { fr: 'Titre', ar: 'العنوان', en: 'Title' },
    'admin.location': { fr: 'Localisation', ar: 'الموقع', en: 'Location' },

    // Footer
    'footer.tagline': {
        fr: "Créateur d'expériences de voyage extraordinaires depuis 2010.",
        ar: 'نصنع تجارب سفر استثنائية منذ عام 2010.',
        en: 'Creating extraordinary travel experiences since 2010.',
    },
    'footer.badgeSecure': {
        fr: 'Réservation sécurisée',
        ar: 'حجز آمن',
        en: 'Secure booking',
    },
    'footer.badgePersonalized': {
        fr: 'Itinéraires personnalisés',
        ar: 'خطط مخصصة',
        en: 'Personalized trips',
    },
    'footer.badgeSupport': {
        fr: 'Support humain',
        ar: 'دعم بشري',
        en: 'Human support',
    },
    'footer.trustEyebrow': {
        fr: 'Pourquoi nous choisir',
        ar: 'لماذا تختارنا',
        en: 'Why travelers choose us',
    },
    'footer.trustTitle': {
        fr: 'Réservez avec confiance',
        ar: 'احجز بثقة',
        en: 'Book with confidence',
    },
    'footer.trustSubtitle': {
        fr: 'Des conseils clairs, des prix transparents et une assistance disponible quand votre voyage en a besoin.',
        ar: 'نصائح واضحة وأسعار شفافة ومساعدة متاحة عندما تحتاجها رحلتك.',
        en: 'Clear guidance, transparent pricing, and support when your trip needs it most.',
    },
    'footer.trustSecureTitle': {
        fr: 'Paiement et réservation sûrs',
        ar: 'دفع وحجز آمن',
        en: 'Safe payment and booking',
    },
    'footer.trustSecureDescription': {
        fr: 'Réservez en toute tranquillité avec des processus simples et une confirmation rapide.',
        ar: 'احجز براحة مع خطوات بسيطة وتأكيد سريع.',
        en: 'Book confidently with simple steps and quick confirmation.',
    },
    'footer.trustValueTitle': {
        fr: 'Meilleures offres',
        ar: 'أفضل العروض',
        en: 'Best value offers',
    },
    'footer.trustValueDescription': {
        fr: 'Comparez des sélections soignées sans perdre du temps dans des listes interminables.',
        ar: 'قارن بين اختيارات منتقاة دون إضاعة الوقت في قوائم لا تنتهي.',
        en: 'Compare curated selections without wasting time in endless lists.',
    },
    'footer.trustSupportTitle': {
        fr: 'Accompagnement expert',
        ar: 'دعم من خبراء',
        en: 'Expert support',
    },
    'footer.trustSupportDescription': {
        fr: 'Parlez à une vraie personne pour affiner les dates, la destination ou le budget.',
        ar: 'تحدث مع شخص حقيقي لتحسين التواريخ أو الوجهة أو الميزانية.',
        en: 'Talk to a real person to refine dates, destinations, or budget.',
    },
    'footer.ctaEyebrow': {
        fr: 'Besoin d’aide ?',
        ar: 'تحتاج إلى مساعدة؟',
        en: 'Need help?',
    },
    'footer.ctaTitle': {
        fr: 'Parlons de votre prochain voyage',
        ar: 'دعنا نتحدث عن رحلتك القادمة',
        en: 'Let’s talk about your next trip',
    },
    'footer.ctaDescription': {
        fr: 'Que vous recherchiez une escapade rapide, un séjour premium ou un itinéraire sur mesure, notre équipe peut vous guider.',
        ar: 'سواء كنت تبحث عن عطلة سريعة أو إقامة فاخرة أو رحلة مصممة خصيصًا، يمكن لفريقنا إرشادك.',
        en: 'Whether you want a quick getaway, a premium stay, or a tailor-made itinerary, our team can guide you.',
    },
    'footer.ctaPrimary': {
        fr: 'Planifier mon voyage',
        ar: 'صمم رحلتي',
        en: 'Plan my trip',
    },
    'footer.ctaSecondary': {
        fr: 'Contacter un expert',
        ar: 'اتصل بخبير',
        en: 'Contact an expert',
    },
    'footer.quick': {
        fr: 'Liens Rapides',
        ar: 'روابط سريعة',
        en: 'Quick Links',
    },
    'footer.support': { fr: 'Support', ar: 'الدعم', en: 'Support' },
    'footer.contact': {
        fr: 'Contactez-nous',
        ar: 'اتصل بنا',
        en: 'Contact Us',
    },
    'footer.hours': {
        fr: "Heures d'Ouverture",
        ar: 'ساعات العمل',
        en: 'Opening Hours',
    },
    'footer.mon': {
        fr: 'Lundi',
        ar: 'الإثنين',
        en: 'Monday',
    },
    'footer.tue': {
        fr: 'Mardi',
        ar: 'الثلاثاء',
        en: 'Tuesday',
    },
    'footer.wed': {
        fr: 'Mercredi',
        ar: 'الأربعاء',
        en: 'Wednesday',
    },
    'footer.thu': {
        fr: 'Jeudi',
        ar: 'الخميس',
        en: 'Thursday',
    },
    'footer.fri': {
        fr: 'Vendredi',
        ar: 'الجمعة',
        en: 'Friday',
    },
    'footer.monfri': {
        fr: 'Lun – Ven',
        ar: 'الإثنين – الجمعة',
        en: 'Mon – Fri',
    },
    'footer.sat': { fr: 'Samedi', ar: 'السبت', en: 'Saturday' },
    'footer.sun': { fr: 'Dimanche', ar: 'الأحد', en: 'Sunday' },
    'footer.closed': { fr: 'Fermé', ar: 'مغلق', en: 'Closed' },
    'footer.rights': {
        fr: 'Tous droits réservés.',
        ar: 'جميع الحقوق محفوظة.',
        en: 'All rights reserved.',
    },
    'footer.securePayment': {
        fr: 'Paiement sécurisé',
        ar: 'دفع آمن',
        en: 'Secure Payment',
    },
    'footer.securePaymentDesc': {
        fr: 'Transactions protégées et cryptées',
        ar: 'معاملات مشفرة ومحفوظة',
        en: 'Protected and encrypted transactions',
    },
    'footer.virementBancaire': {
        fr: 'Virement Bancaire',
        ar: 'تحويل بنكي',
        en: 'Bank Transfer',
    },

    // Contact Page
    'contact.kicker': {
        fr: 'Restons en contact',
        ar: 'دعنا نبقى على تواصل',
        en: 'Stay in touch',
    },
    'contact.title': { fr: 'Contactez-nous', ar: 'اتصل بنا', en: 'Contact Us' },
    'contact.description': {
        fr: 'Notre équipe est disponible par téléphone, WhatsApp, réseaux sociaux et en personne via notre emplacement sur la carte.',
        ar: 'فريقنا متاح عبر الهاتف وواتساب ووسائل التواصل الاجتماعي وكذلك عبر موقعنا على الخريطة.',
        en: 'Our team is available by phone, WhatsApp, social media, and in person through our mapped location.',
    },
    'contact.calls': { fr: 'Appels', ar: 'المكالمات', en: 'Calls' },
    'contact.whatsapp': { fr: 'WhatsApp', ar: 'واتساب', en: 'WhatsApp' },
    'contact.email': { fr: 'E-mail', ar: 'البريد الإلكتروني', en: 'Email' },
    'contact.locationTitle': {
        fr: 'Notre emplacement',
        ar: 'موقعنا',
        en: 'Our location',
    },
    'contact.locationSubtitle': {
        fr: 'Visitez-nous ou ouvrez la carte pour nous trouver facilement.',
        ar: 'قم بزيارتنا أو افتح الخريطة للعثور علينا بسهولة.',
        en: 'Visit us or open the map to find us easily.',
    },
    'contact.mapTitle': {
        fr: 'Carte du bureau',
        ar: 'خريطة المكتب',
        en: 'Office map',
    },
    'contact.openMap': {
        fr: 'Ouvrir dans Maps',
        ar: 'فتح في الخرائط',
        en: 'Open in Maps',
    },
    'contact.socialTitle': {
        fr: 'Réseaux sociaux',
        ar: 'وسائل التواصل الاجتماعي',
        en: 'Social media',
    },
    'contact.socialDescription': {
        fr: 'Suivez-nous pour les dernières offres, inspirations voyage et mises à jour.',
        ar: 'تابعنا للحصول على أحدث العروض وإلهام السفر والتحديثات.',
        en: 'Follow us for the latest offers, travel inspiration, and updates.',
    },
    'contact.ctaTitle': {
        fr: 'Besoin d’une réponse rapide ?',
        ar: 'هل تحتاج إلى رد سريع؟',
        en: 'Need a quick answer?',
    },
    'contact.ctaDescription': {
        fr: 'Envoyez-nous un message et nous vous répondrons dans les plus brefs délais.',
        ar: 'أرسل لنا رسالة وسنرد عليك في أقرب وقت ممكن.',
        en: 'Send us a message and we will get back to you as soon as possible.',
    },

    // Common
    'common.book': BOOK,
    'common.bookNow': {
        fr: 'Réserver Maintenant',
        ar: 'احجز الآن',
        en: 'Book Now',
    },
    'common.home': { fr: 'Accueil', ar: 'الرئيسية', en: 'Home' },
    'common.viewAll': VIEW_ALL,
    'common.viewDetails': VIEW_DETAILS,
    'common.from': { fr: 'À partir de', ar: 'ابتداءً من', en: 'From' },
    'common.whatsapp': { fr: 'WhatsApp', ar: 'واتساب', en: 'WhatsApp' },
    'common.call': { fr: 'Appeler', ar: 'اتصال', en: 'Call' },
    'common.travelers': { fr: 'voyageurs', ar: 'مسافرون', en: 'travelers' },
    'common.search': { fr: 'Rechercher...', ar: 'بحث...', en: 'Search...' },
    'common.results': { fr: 'résultats', ar: 'نتائج', en: 'results' },
    'common.noResults': {
        fr: 'Aucun résultat trouvé.',
        ar: 'لم يتم العثور على نتائج.',
        en: 'No results found.',
    },
    'common.noItemsYet': {
        fr: 'Rien à afficher pour le moment.',
        ar: 'لا يوجد شيء لعرضه بعد.',
        en: 'Nothing to show yet.',
    },
    'common.noItemsYetDescription': {
        fr: 'Cette liste est vide pour le moment. Vous pouvez tout de même nous envoyer une demande.',
        ar: 'هذه القائمة فارغة حاليًا. يمكنك مع ذلك إرسال طلب إلينا.',
        en: 'This list is empty for now. You can still send us a request.',
    },
    'common.requestThingEyebrow': {
        fr: 'Vous cherchez autre chose ?',
        ar: 'هل تبحث عن شيء آخر؟',
        en: 'Looking for something else?',
    },
    'common.requestThingDescription': {
        fr: 'Vous ne trouvez pas exactement ce que vous cherchez ? Envoyez-nous une demande et nous vous aiderons à le trouver.',
        ar: 'لا تجد بالضبط ما تبحث عنه؟ أرسل لنا طلبًا وسنساعدك في العثور عليه.',
        en: 'Can’t find exactly what you want? Send us a request and we’ll help source it.',
    },
    'common.requestThingCta': {
        fr: 'Faire une demande',
        ar: 'اطلبها',
        en: 'Request it',
    },
    'common.contactViaWhatsApp': {
        fr: 'Contacter via WhatsApp',
        ar: 'التواصل عبر واتساب',
        en: 'Contact via WhatsApp',
    },
    'common.contactViaPhone': {
        fr: 'Appeler',
        ar: 'اتصل',
        en: 'Call',
    },
    'common.clearFilters': {
        fr: 'Effacer les filtres',
        ar: 'مسح الفلاتر',
        en: 'Clear filters',
    },
    'common.all': ALL,
    'common.addedFav': {
        fr: 'Ajouté aux favoris',
        ar: 'تمت الإضافة إلى المفضلة',
        en: 'Added to favorites',
    },
    'common.removedFav': {
        fr: 'Retiré des favoris',
        ar: 'تمت الإزالة من المفضلة',
        en: 'Removed from favorites',
    },

    // Blog Section
    'blog.stories': { fr: 'Histoires', ar: 'قصص', en: 'Stories' },
    'blog.title': {
        fr: 'Blog de Voyage',
        ar: 'مدونة السفر',
        en: 'Travel Blog',
    },
    'blog.subtitle': {
        fr: 'Récits inspirants, conseils d’experts et guides de voyage pour vous aider à planifier votre prochaine aventure.',
        ar: 'قصص ملهمة، نصائح من الخبراء، وأدلة سفر لمساعدتك في التخطيط لمغامرتك القادمة.',
        en: 'Inspiring stories, expert tips, and travel guides to help you plan your next adventure.',
    },
    'blog.readMore': {
        fr: 'Lire la suite',
        ar: 'اقرأ المزيد',
        en: 'Read more',
    },

    // Error Pages
    'error.404': { fr: '404', ar: '404', en: '404' },
    'error.notFound': {
        fr: 'Oups! Page non trouvée',
        ar: 'عذرًا! الصفحة غير موجودة',
        en: 'Oops! Page not found',
    },
    'error.returnHome': {
        fr: "Retour à l'accueil",
        ar: 'العودة إلى الصفحة الرئيسية',
        en: 'Return to Home',
    },
    'error.419Desc': {
        fr: 'Votre session a expiré en raison de l’inactivité. Veuillez rafraîchir la page pour continuer.',
        ar: 'انتهت جلستك بسبب عدم النشاط. يرجى تحديث الصفحة للمتابعة.',
        en: 'Your session has expired due to inactivity. Please refresh the page to continue.',
    },
    'common.refresh': {
        fr: 'Rafraîchir la page',
        ar: 'تحديث الصفحة',
        en: 'Refresh Page',
    },

    // Auth Pages
    'auth.welcomeBack': {
        fr: 'Bienvenue',
        ar: 'أهلا بعودتك',
        en: 'Welcome Back',
    },
    'auth.welcomeAdmin': {
        fr: 'Bienvenue Administrateur',
        ar: 'مرحباً بك أيها المدير',
        en: 'Welcome Administrator',
    },
    'auth.welcomeAssistant': {
        fr: 'Bienvenue Assistant',
        ar: 'مرحباً بك أيها المساعد',
        en: 'Welcome Assistant',
    },
    'auth.sessionExpired': {
        fr: 'Session expirée. Veuillez rafraîchir la page.',
        ar: 'انتهت الجلسة. يرجى تحديث الصفحة.',
        en: 'Session expired. Please refresh the page.',
    },
    'auth.invalidCredentials': {
        fr: 'Identifiants invalides',
        ar: 'بيانات الاعتماد غير صالحة',
        en: 'Invalid credentials',
    },
    'auth.loginFailed': {
        fr: 'Échec de la connexion. Veuillez réessayer.',
        ar: 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.',
        en: 'Login failed. Please try again.',
    },
    'auth.signInDesc': {
        fr: 'Connectez-vous pour accéder à votre tableau de bord de voyage',
        ar: 'قم بتسجيل الدخول للوصول إلى لوحة التحكم الخاصة بك',
        en: 'Sign in to access your travel dashboard',
    },
    'auth.email': { fr: 'E-mail', ar: 'البريد الإلكتروني', en: 'Email' },
    'auth.password': { fr: 'Mot de passe', ar: 'كلمة المرور', en: 'Password' },
    'auth.signIn': { fr: 'Se connecter', ar: 'تسجيل الدخول', en: 'Sign in' },
    'auth.signUp': { fr: "S'inscrire", ar: 'إنشاء حساب', en: 'Sign up' },
    'auth.forgotPassword': {
        fr: 'Mot de passe oublié?',
        ar: 'هل نسيت كلمة المرور؟',
        en: 'Forgot password?',
    },
    'auth.noAccount': {
        fr: 'Pas de compte?',
        ar: 'لا تملك حسابًا؟',
        en: "Don't have an account?",
    },
    'auth.rememberMe': {
        fr: 'Se souvenir de moi',
        ar: 'تذكرني',
        en: 'Remember me',
    },
    'auth.owner': OWNER,
    'auth.superadmin': SUPERADMIN,
    'auth.client': CLIENT,
    'auth.admin': ADMIN,
    'auth.assistant': ASSISTANT,
    'auth.alreadyAccount': {
        fr: 'Vous avez déjà un compte?',
        ar: 'هل لديك حساب بالفعل؟',
        en: 'Already have an account?',
    },
    'auth.loginQuote': {
        fr: 'Le voyage est la seule chose que vous achetez et qui vous rend plus riche.',
        ar: 'السفر هو الشيء الوحيد الذي تشتريه ويجعلك أكثر ثراءً.',
        en: 'Travel is the only thing you buy that makes you richer.',
    },
    'auth.loginQuoteAuthor': { fr: 'Anonyme', ar: 'مجهول', en: 'Anonymous' },
    'auth.registerQuote': {
        fr: "Le monde est un livre, et ceux qui ne voyagent pas n'en lisent qu'une page.",
        ar: 'العالم كتاب، ومن لا يسافر يقرأ صفحة واحدة فقط.',
        en: 'The world is a book and those who do not travel read only one page.',
    },
    'auth.registerQuoteAuthor': {
        fr: 'Saint Augustin',
        ar: 'القديس أوغسطين',
        en: 'Saint Augustine',
    },

    // Register Page
    'register.title': {
        fr: 'Créer un Compte',
        ar: 'إنشاء حساب',
        en: 'Create Account',
    },
    'register.subtitle': {
        fr: 'Rejoignez-nous et commencez votre voyage',
        ar: 'انضم إلينا وابدأ رحلتك',
        en: 'Join us and start your travel journey',
    },
    'register.fullName': {
        fr: 'Nom complet',
        ar: 'الاسم الكامل',
        en: 'Full name',
    },
    'register.agreeTerms': {
        fr: "J'accepte les conditions d'utilisation",
        ar: 'أوافق على شروط الاستخدام',
        en: 'I agree to the Terms of Service',
    },
    'register.success': {
        fr: 'Compte créé avec succès!',
        ar: 'تم إنشاء الحساب بنجاح!',
        en: 'Account created successfully!',
    },
    'register.failed': {
        fr: "Échec de l'inscription. Veuillez vérifier vos informations.",
        ar: 'فشل التسجيل. يرجى التحقق من بياناتك.',
        en: 'Registration failed. Please check your details.',
    },
    'dest.title': {
        fr: 'Destinations de Rêve',
        ar: 'وجهات الأحلام',
        en: 'Dream Destinations',
    },
    'dest.sort.featured': { fr: 'Mis en avant', ar: 'مميز', en: 'Featured' },
    'dest.sortBy': {
        fr: 'Trier par',
        ar: 'ترتيب حسب',
        en: 'Sort by',
    },
    'dest.sort.priceAsc': {
        fr: 'Prix croissant',
        ar: 'السعر: من الأقل للأعلى',
        en: 'Price: Low to High',
    },
    'dest.sort.priceDesc': {
        fr: 'Prix décroissant',
        ar: 'السعر: من الأعلى للأقل',
        en: 'Price: High to Low',
    },
    'dest.sort.rating': { fr: 'Note', ar: 'التقييم', en: 'Rating' },

    'dest.subtitle': {
        fr: 'Trouvez votre destination idéale dans notre collection sélectionnée de destinations de classe mondiale.',
        ar: 'ابحث عن وجهتك المثالية من مجموعتنا المنتقاة من الوجهات العالمية.',
        en: 'Find your perfect getaway from our curated collection of world-class destinations.',
    },
    'dest.searchPlaceholder': {
        fr: 'Rechercher des destinations...',
        ar: 'ابحث عن الوجهات...',
        en: 'Search destinations...',
    },

    // Hotels Page
    'hotels.title': {
        fr: 'Hôtels de Luxe',
        ar: 'الفنادق الفاخرة',
        en: 'Luxury Hotels',
    },
    'hotels.subtitle': {
        fr: "Hébergements sélectionnés offrant un mélange parfait de confort, de luxe et d'expériences inoubliables.",
        ar: 'إقامات مختارة بعناية توفر مزيجًا مثاليًا من الراحة والفخامة والتجارب التي لا تُنسى.',
        en: 'Handpicked accommodations offering the perfect blend of comfort, luxury, and unforgettable experiences.',
    },
    'hotels.perNight': { fr: '/nuit', ar: '/ليلة', en: '/night' },
    'hotels.reviews': { fr: 'avis', ar: 'تقييمات', en: 'reviews' },
    'hotels.book': BOOK,
    'hotels.filterByTags': {
        fr: 'Filtrer par catégorie',
        ar: 'التصفية حسب الفئة',
        en: 'Filter by category',
    },
    'hotels.filterByStars': {
        fr: 'Filtrer par étoiles',
        ar: 'التصفية حسب النجوم',
        en: 'Filter by stars',
    },
    'hotels.stars': { fr: 'étoile(s)', ar: 'نجمة', en: 'star(s)' },
    'hotels.filterByPrice': {
        fr: 'Filtrer par prix',
        ar: 'التصفية حسب السعر',
        en: 'Filter by price',
    },
    'hotels.priceRange': {
        fr: 'Gamme de prix',
        ar: 'نطاق السعر',
        en: 'Price range',
    },
    'hotels.minPrice': {
        fr: 'Prix minimum',
        ar: 'الحد الأدنى للسعر',
        en: 'Min price',
    },
    'hotels.maxPrice': {
        fr: 'Prix maximum',
        ar: 'الحد الأقصى للسعر',
        en: 'Max price',
    },
    'hotels.showing': { fr: 'Affichage', ar: 'عرض', en: 'Showing' },
    'hotels.results': { fr: 'résultats', ar: 'نتائج', en: 'results' },
    'hotels.priceFrom': { fr: 'À partir de', ar: 'ابتداءً من', en: 'From' },
    'hotels.noResults': {
        fr: 'Aucun hôtel ne correspond à vos critères de filtre.',
        ar: 'لا توجد فنادق تطابق معايير الفلتر الخاصة بك.',
        en: 'No hotels match your filter criteria.',
    },
    'hotels.filters': {
        fr: 'Filtres',
        ar: 'الفلاتر',
        en: 'Filters',
    },

    // Hotel Detail Page
    'hotelDetail.startingFrom': {
        fr: 'À partir de',
        ar: 'ابتداءً من',
        en: 'Starting from',
    },
    'hotelDetail.reserveNow': {
        fr: 'Réserver maintenant',
        ar: 'احجز الآن',
        en: 'Reserve now',
    },
    'hotelDetail.call': { fr: 'Appeler', ar: 'اتصال', en: 'Call' },
    'hotelDetail.aboutHotel': {
        fr: 'À propos de l’hôtel',
        ar: 'حول الفندق',
        en: 'About the hotel',
    },
    'hotelDetail.amenities': {
        fr: 'Équipements',
        ar: 'المرافق',
        en: 'Amenities',
    },
    'hotelDetail.availableRooms': {
        fr: 'Chambres disponibles',
        ar: 'الغرف المتاحة',
        en: 'Available rooms',
    },
    'hotelDetail.guests': { fr: 'invités', ar: 'ضيوف', en: 'guests' },
    'hotelDetail.pricePerNight': {
        fr: 'Prix par nuit',
        ar: 'السعر لليلة',
        en: 'Price per night',
    },
    'hotelDetail.selectRoom': {
        fr: 'Sélectionner',
        ar: 'اختر الغرفة',
        en: 'Select room',
    },
    'hotelDetail.pernight': { fr: '/nuit', ar: '/ليلة', en: '/night' },
    'tourDetail.included': { fr: 'Inclus', ar: 'متضمن', en: 'Included' },
    'tourDetail.notIncluded': {
        fr: 'Non inclus',
        ar: 'غير متضمن',
        en: 'Not included',
    },
    'tourDetail.dayByDay': {
        fr: 'Itinéraire jour par jour',
        ar: 'المسار يومياً',
        en: 'Day-by-day itinerary',
    },

    // Destination Detail Page
    'destinationDetail.overview': {
        fr: 'Aperçu',
        ar: 'نظرة عامة',
        en: 'Overview',
    },
    'destinationDetail.bestTime': {
        fr: 'Meilleure période',
        ar: 'أفضل وقت',
        en: 'Best time',
    },
    'destinationDetail.weather': { fr: 'Météo', ar: 'الطقس', en: 'Weather' },
    'destinationDetail.startingFrom': {
        fr: 'À partir de',
        ar: 'ابتداءً من',
        en: 'Starting from',
    },
    'destinationDetail.spring': {
        fr: 'Printemps et début d’été',
        ar: 'الربيع وبداية الصيف',
        en: 'Spring and early summer',
    },
    'destinationDetail.sunny': {
        fr: 'Climat doux et ensoleillé',
        ar: 'طقس معتدل ومشمس',
        en: 'Mild and sunny climate',
    },
    'destinationDetail.notFound': {
        fr: 'Destination introuvable',
        ar: 'الوجهة غير موجودة',
        en: 'Destination not found',
    },
    'destinationDetail.backToDestinations': {
        fr: 'Retour aux destinations',
        ar: 'العودة إلى الوجهات',
        en: 'Back to destinations',
    },
    'destinationDetail.about': { fr: 'À propos de', ar: 'حول', en: 'About' },
    'destinationDetail.highlights': {
        fr: 'Points forts',
        ar: 'أهم المزايا',
        en: 'Highlights',
    },
    'destinationDetail.whereToStay': {
        fr: 'Où séjourner',
        ar: 'أين تقيم',
        en: 'Where to stay',
    },
    'destinationDetail.suggestedTours': {
        fr: 'Circuits suggérés',
        ar: 'جولات مقترحة',
        en: 'Suggested tours',
    },
    'destinationDetail.language': { fr: 'Langue', ar: 'اللغة', en: 'Language' },
    'destinationDetail.currency': {
        fr: 'Monnaie',
        ar: 'العملة',
        en: 'Currency',
    },
    'destinationDetail.planTrip': {
        fr: 'Planifier un voyage',
        ar: 'خطط رحلة',
        en: 'Plan a trip',
    },

    // Tour Detail Page
    'tourDetail.overview': { fr: 'Aperçu', ar: 'نظرة عامة', en: 'Overview' },
    'tourDetail.duration': { fr: 'Durée', ar: 'المدة', en: 'Duration' },
    'tourDetail.group': {
        fr: 'Taille du groupe',
        ar: 'حجم المجموعة',
        en: 'Group size',
    },
    'tourDetail.startingFrom': {
        fr: 'À partir de',
        ar: 'ابتداءً من',
        en: 'Starting from',
    },

    // Tours Page
    'tours.title': {
        fr: 'Circuits Guidés',
        ar: 'الجولات الموجهة',
        en: 'Guided Tours',
    },
    'tours.subtitle': {
        fr: 'Aventures dirigées par des experts conçues pour vous immerger dans la culture locale, la nature et les trésors cachés.',
        ar: 'مغامرات موجهة من قبل خبراء مصممة لغمرك في الثقافة المحلية والطبيعة والكنوز المخفية.',
        en: 'Expert-led adventures designed to immerse you in local culture, nature, and hidden treasures.',
    },
    'tours.filterByLocation': {
        fr: 'Filtrer par destination',
        ar: 'التصفية حسب الوجهة',
        en: 'Filter by location',
    },
    'tours.filterByDuration': {
        fr: 'Filtrer par durée',
        ar: 'التصفية حسب المدة',
        en: 'Filter by duration',
    },
    'tours.max': { fr: 'Max', ar: 'الحد الأقصى', en: 'Max' },
    'tours.person': { fr: 'par personne', ar: 'للشخص', en: 'per person' },
    'tours.bookTour': {
        fr: 'Réserver un Circuit',
        ar: 'احجز جولة',
        en: 'Book Tour',
    },

    // Tour detail extras
    'tourDetail.about': { fr: 'À propos', ar: 'حول', en: 'About' },
    'tourDetail.itinerary': { fr: 'Itinéraire', ar: 'المسار', en: 'Itinerary' },
    'tourDetail.bookingFlow': {
        fr: 'Démarrer la réservation',
        ar: 'ابدأ الحجز',
        en: 'Start booking',
    },

    // Common small labels
    'common.days': { fr: 'jours', ar: 'أيام', en: 'days' },
    'common.nights': { fr: 'nuits', ar: 'ليالٍ', en: 'nights' },

    // Promos Page
    'promos.title': {
        fr: 'Promotions Actuelles',
        ar: 'العروض الحالية',
        en: 'Current Promotions',
    },
    'promos.subtitle': {
        fr: "Codes exclusifs et offres à durée limitée — saisissez-les avant qu'elles disparaissent.",
        ar: 'أكواد حصرية وعروض محدودة الوقت — احصل عليها قبل اختفاؤها.',
        en: "Exclusive codes and limited-time deals — grab them before they're gone.",
    },
    'promos.filterByType': {
        fr: 'Filtrer par type',
        ar: 'التصفية حسب النوع',
        en: 'Filter by type',
    },
    'promos.typePercentage': {
        fr: 'Réduction en pourcentage',
        ar: 'خصم نسبي',
        en: 'Percentage discount',
    },
    'promos.typePerk': {
        fr: 'Avantage / bonus',
        ar: 'ميزة / إضافة',
        en: 'Perk / bonus',
    },
    'promos.applyCode': {
        fr: 'Appliquer le Code',
        ar: 'تطبيق الكود',
        en: 'Apply Code',
    },
    'promoDetail.expires': { fr: 'Expire le', ar: 'تنتهي في', en: 'Expires' },
    'promoDetail.howToUseTitle': {
        fr: 'Comment utiliser',
        ar: 'كيفية الاستخدام',
        en: 'How to use',
    },
    'promoDetail.termsTitle': {
        fr: 'Conditions générales',
        ar: 'الشروط والأحكام',
        en: 'Terms & conditions',
    },
    'promoDetail.startBooking': {
        fr: 'Commencer une réservation',
        ar: 'ابدأ الحجز',
        en: 'Start a booking',
    },
    'promoDetail.eligibility': {
        fr: 'Éligibilité',
        ar: 'الأهلية',
        en: 'Eligibility',
    },
    'promoDetail.details': { fr: 'Détails', ar: 'التفاصيل', en: 'Details' },
    'promoDetail.code': { fr: 'Code promo', ar: 'رمز العرض', en: 'Promo code' },
    'promoDetail.discount': { fr: 'Réduction', ar: 'الخصم', en: 'Discount' },
    'promoDetail.quickInfo': {
        fr: 'Informations rapides',
        ar: 'المعلومات السريعة',
        en: 'Quick info',
    },
    // Deal Detail Page
    'dealDetail.expires': { fr: 'Expire le', ar: 'تنتهي في', en: 'Expires' },
    'dealDetail.type': { fr: 'Type d’offre', ar: 'نوع العرض', en: 'Deal type' },
    'dealDetail.specialOffer': {
        fr: 'Offre spéciale',
        ar: 'عرض خاص',
        en: 'Special offer',
    },
    'dealDetail.highlights': {
        fr: 'Points forts',
        ar: 'أهم المزايا',
        en: 'Highlights',
    },
    'dealDetail.terms': {
        fr: 'Conditions générales',
        ar: 'الشروط والأحكام',
        en: 'Terms & conditions',
    },
    'dealDetail.flow': {
        fr: 'Parcours de réservation',
        ar: 'مسار الحجز',
        en: 'Deal flow',
    },
    'dealDetail.step1': {
        fr: 'Explorer les détails de l’offre',
        ar: 'استكشف تفاصيل العرض',
        en: 'Explore the offer details',
    },
    'dealDetail.step2': {
        fr: 'Choisir la destination ou le forfait',
        ar: 'اختر الوجهة أو الباقة',
        en: 'Pick the destination or package',
    },
    'dealDetail.step3': {
        fr: 'Passer à une réservation sécurisée',
        ar: 'تابع إلى حجز آمن',
        en: 'Proceed to secure booking',
    },
    'dealDetail.stepDesc': {
        fr: 'Étape {n} du processus de réservation.',
        ar: 'الخطوة {n} من عملية الحجز.',
        en: 'Step {n} of the booking process.',
    },
    'dealDetail.offer': { fr: 'Offre', ar: 'العرض', en: 'Offer' },
    'dealDetail.inquiry': {
        fr: 'Demande d’offre',
        ar: 'استفسار عن العرض',
        en: 'Deal inquiry',
    },
    'dealDetail.book': {
        fr: 'Réserver cette offre',
        ar: 'احجز هذا العرض',
        en: 'Book this deal',
    },

    // Gallery Page
    'gallery.title': GALLERY,
    'gallery.subtitle': {
        fr: 'Moments capturés par nos voyageurs et notre équipe à travers le monde.',
        ar: 'لحظات تم التقاطها من قبل المسافرين وفريقنا حول العالم.',
        en: 'Moments captured by our travellers and team across the globe.',
    },

    // Team Page
    'team.title': { fr: 'Notre Équipe', ar: 'فريقنا', en: 'Our Team' },
    'team.subtitle': {
        fr: 'Rencontrez les experts passionnés derrière chaque expérience BelAzurTravel.',
        ar: 'قابل الخبراء المتحمسين وراء كل تجربة في BelAzurTravel.',
        en: 'Meet the passionate experts behind every BelAzurTravel experience.',
    },

    // Flights Page
    'flights.title': {
        fr: 'Réservations de Vols',
        ar: 'حجوزات الرحلات',
        en: 'Flight Bookings',
    },
    'flights.subtitle': {
        fr: "Comparez et réservez des vols vers n'importe où dans le monde avec nos partenaires aériens mondiaux.",
        ar: 'قارن واحجز الرحلات إلى أي مكان في العالم مع شركائنا الجويين العالميين.',
        en: 'Compare and book flights to anywhere in the world with our global airline partners.',
    },
    'flights.filterByAirline': {
        fr: 'Filtrer par compagnie',
        ar: 'التصفية حسب شركة الطيران',
        en: 'Filter by airline',
    },
    'flights.filterByStops': {
        fr: 'Filtrer par escales',
        ar: 'التصفية حسب التوقفات',
        en: 'Filter by stops',
    },
    'flights.filterByCabin': {
        fr: 'Filtrer par cabine',
        ar: 'التصفية حسب الدرجة',
        en: 'Filter by cabin',
    },
    'flights.direct': { fr: 'Direct', ar: 'مباشر', en: 'Direct' },
    'flights.stop': { fr: 'Escale', ar: 'توقف', en: 'Stop' },
    'flights.select': { fr: 'Sélectionner', ar: 'اختر', en: 'Select' },
    'flightDetail.totalPerPassenger': {
        fr: 'Total par passager',
        ar: 'الإجمالي لكل مسافر',
        en: 'Total per passenger',
    },
    'flightDetail.bookFlight': {
        fr: 'Réserver ce vol',
        ar: 'احجز هذه الرحلة',
        en: 'Book this flight',
    },
    'flightDetail.bookingFlow': {
        fr: 'Passer à la réservation du vol',
        ar: 'الانتقال إلى حجز الرحلة',
        en: 'Proceed to flight booking flow',
    },

    // Cars Page
    'cars.title': {
        fr: 'Location de Voitures',
        ar: 'تأجير السيارات',
        en: 'Car Rentals',
    },
    'cars.subtitle': {
        fr: 'Conduisez avec style — véhicules premium disponibles dans le monde entier pour votre voyage.',
        ar: 'قود بأسلوب - المركبات الممتازة المتوفرة في جميع أنحاء العالم لرحلتك.',
        en: 'Drive in style — premium vehicles available worldwide for your journey.',
    },
    'cars.filterByCategory': {
        fr: 'Filtrer par catégorie',
        ar: 'التصفية حسب الفئة',
        en: 'Filter by category',
    },
    'cars.filterByFuel': {
        fr: 'Filtrer par carburant',
        ar: 'التصفية حسب الوقود',
        en: 'Filter by fuel',
    },
    'cars.filterByTransmission': {
        fr: 'Filtrer par transmission',
        ar: 'التصفية حسب ناقل الحركة',
        en: 'Filter by transmission',
    },
    'cars.filterBySeats': {
        fr: 'Filtrer par places',
        ar: 'التصفية حسب المقاعد',
        en: 'Filter by seats',
    },
    'cars.rentNow': {
        fr: 'Louer Maintenant',
        ar: 'استأجر الآن',
        en: 'Rent Now',
    },
    'cars.perDay': { fr: '/jour', ar: '/يوم', en: '/day' },
    'carsDetail.backToCars': {
        fr: 'Toutes les voitures',
        ar: 'كل السيارات',
        en: 'All cars',
    },
    'carsDetail.notFound': {
        fr: 'Voiture introuvable',
        ar: 'السيارة غير موجودة',
        en: 'Car not found',
    },
    'carsDetail.features': {
        fr: 'Caractéristiques',
        ar: 'الميزات',
        en: 'Features',
    },
    'carsDetail.policy': {
        fr: 'Politique de location',
        ar: 'سياسة الإيجار',
        en: 'Rental policy',
    },
    'carsDetail.specs': {
        fr: 'Spécifications',
        ar: 'المواصفات',
        en: 'Specifications',
    },
    'carsDetail.seats': { fr: 'Places', ar: 'المقاعد', en: 'Seats' },
    'carsDetail.fuel': { fr: 'Carburant', ar: 'الوقود', en: 'Fuel' },
    'carsDetail.gearbox': {
        fr: 'Boîte de vitesses',
        ar: 'ناقل الحركة',
        en: 'Gearbox',
    },
    'carsDetail.summary': {
        fr: 'Voiture premium avec réservation flexible et assistance complète.',
        ar: 'سيارة مميزة مع حجز مرن ودعم كامل.',
        en: 'Premium car with flexible booking and full support.',
    },
    'admin.carForm.transmission': {
        fr: 'Transmission',
        ar: 'ناقل الحركة',
        en: 'Transmission',
    },
    'admin.carForm.fuel': { fr: 'Carburant', ar: 'الوقود', en: 'Fuel' },
    'admin.carForm.seats': { fr: 'Places', ar: 'المقاعد', en: 'Seats' },
    'admin.carForm.policyHint': {
        fr: 'Détails sur les conditions de location, les dépôts de garantie, etc.',
        ar: 'تفاصيل حول شروط الإيجار, الرسوم الأمينة, إلخ.',
        en: 'Details on rental terms, deposits, etc.',
    },
    // Events Page
    'events.title': {
        fr: 'Événements de Voyage',
        ar: 'أحداث السفر',
        en: 'Travel Events',
    },
    'events.subtitle': {
        fr: 'Participez à des expériences de groupe soigneusement sélectionnées autour des événements les plus emblématiques du monde.',
        ar: 'شارك في تجارب مجموعة منسقة حول أشهر الأحداث في العالم.',
        en: "Join curated group experiences around the world's most iconic events.",
    },
    'events.filterByLocation': {
        fr: 'Filtrer par lieu',
        ar: 'التصفية حسب المكان',
        en: 'Filter by location',
    },
    'events.reserve': {
        fr: 'Réserver une place',
        ar: 'احجز مكانًا',
        en: 'Reserve a spot',
    },
    'events.detail.backToEvents': {
        fr: 'Tous les événements',
        ar: 'كل الفعاليات',
        en: 'All events',
    },
    'events.detail.aboutTitle': {
        fr: 'À propos de cet événement',
        ar: 'حول هذه الفعالية',
        en: 'About this event',
    },
    'events.detail.scheduleTitle': {
        fr: 'Programme',
        ar: 'البرنامج',
        en: 'Schedule',
    },
    'events.detail.when': { fr: 'Date', ar: 'التاريخ', en: 'Date' },
    'events.detail.where': { fr: 'Lieu', ar: 'المكان', en: 'Location' },
    'events.detail.groupSize': {
        fr: 'Taille du groupe',
        ar: 'حجم المجموعة',
        en: 'Group size',
    },
    'events.detail.packageFrom': {
        fr: 'Forfait à partir de',
        ar: 'الباقة تبدأ من',
        en: 'Package from',
    },
    'events.detail.notFound': {
        fr: 'Événement introuvable',
        ar: 'الفعالية غير موجودة',
        en: 'Event not found',
    },

    // Favorites Page
    'favorites.title': {
        fr: 'Mes Favoris',
        ar: 'المفضلة لدي',
        en: 'My Favorites',
    },
    'favorites.subtitle': {
        fr: "Votre collection personnelle de destinations de rêve, d'hôtels et d'expériences.",
        ar: 'مجموعتك الشخصية من الوجهات والفنادق والتجارب الحلم.',
        en: 'Your personal collection of dream destinations, hotels and experiences.',
    },
    'favorites.empty': {
        fr: "Vous n'avez rien enregistré pour l'instant. Appuyez sur le cœur sur n'importe quel élément pour l'ajouter ici.",
        ar: 'لم تحفظ أي شيء حتى الآن. اضغط على القلب على أي عنصر لإضافته هنا.',
        en: "You haven't saved anything yet. Tap the heart on any item to add it here.",
    },

    // Legal Page
    'legal.title': {
        fr: 'Mentions Légales',
        ar: 'الإشعارات القانونية',
        en: 'Legal Notices',
    },
    'legal.subtitle': {
        fr: 'Informations transparentes sur notre entreprise, vos droits et nos responsabilités.',
        ar: 'معلومات شفافة عن شركتنا وحقوقك ومسؤولياتنا.',
        en: 'Transparent information about our company, your rights and our responsibilities.',
    },

    // Dashboard
    'dashboard.welcome': { fr: 'Bienvenue', ar: 'أهلا بك', en: 'Welcome back' },
    'dashboard.overview': {
        fr: 'Voici votre aperçu de voyage',
        ar: 'إليك ملخص رحلتك',
        en: "Here's your travel overview",
    },
    'dashboard.myBookings': {
        fr: 'Mes Réservations',
        ar: 'حجوزاتي',
        en: 'My Bookings',
    },
    'dashboard.signOut': SIGN_OUT,
    'dashboard.wishlist': WISHLIST,
    'dashboard.itineraries': ITINERARIES,
    'dashboard.payments': PAYMENTS,
    'dashboard.profile': PROFILE,
    'dashboard.settings': SETTINGS,

    // Admin / Assistant
    'admin.panel': {
        fr: 'Panneau Admin',
        ar: 'لوحة الإدارة',
        en: 'Admin Panel',
    },
    'admin.home': {
        fr: 'Accueil',
        ar: 'الرئيسية',
        en: 'Home',
    },
    'admin.overview': { fr: "Vue d'ensemble", ar: 'نظرة عامة', en: 'Overview' },
    'admin.destinations': DESTINATIONS,
    'admin.destinationsSubtitle': {
        fr: 'Ajouter, modifier et gérer les destinations',
        ar: 'إضافة الوجهات وتعديلها وإدارتها',
        en: 'Add, edit and manage destinations',
    },
    'admin.hotelsSubtitle': {
        fr: 'Gérer les hôtels et les complexes hôteliers',
        ar: 'إدارة الفنادق والمنتجعات',
        en: 'Manage hotels and resorts',
    },
    'admin.toursSubtitle': {
        fr: 'Gérer les circuits et les excursions',
        ar: 'إدارة الجولات والرحلات',
        en: 'Manage guided tours',
    },
    'admin.carsSubtitle': {
        fr: 'Gérer la flotte de location de voitures',
        ar: 'إدارة أسطول تأجير السيارات',
        en: 'Manage car rental fleet',
    },
    'admin.eventsSubtitle': {
        fr: 'Gérer les événements de voyage',
        ar: 'إدارة فعاليات السفر',
        en: 'Manage travel events',
    },
    'admin.blogSubtitle': {
        fr: 'Gérer les articles du blog',
        ar: 'إدارة مقالات المدونة',
        en: 'Manage blog posts',
    },
    'admin.dealsSubtitle': {
        fr: 'Gérer les offres promotionnelles',
        ar: 'إدارة العروض الترويجية',
        en: 'Manage promotional deals',
    },
    'admin.promosSubtitle': {
        fr: 'Gérer les codes promo',
        ar: 'إدارة الرموز الترويجية',
        en: 'Manage promo codes',
    },
    'admin.team': { fr: 'Équipe', ar: 'الفريق', en: 'Team' },
    'admin.teamSubtitle': {
        fr: 'Gérer les membres de l\u2019équipe',
        ar: 'إدارة أعضاء الفريق',
        en: 'Manage team members',
    },
    'admin.partners': { fr: 'Partenaires', ar: 'الشركاء', en: 'Partners' },
    'admin.partnerSubtitle': {
        fr: 'Gérer vos partenaires',
        ar: 'إدارة شركائك',
        en: 'Manage your partners',
    },
    'admin.image': { fr: 'Image', ar: 'الصورة', en: 'Image' },
    'admin.galleryForm.general': {
        fr: 'Informations de la galerie',
        ar: 'معلومات المعرض',
        en: 'Gallery information',
    },
    'admin.galleryForm.media': { fr: 'Média', ar: 'الوسائط', en: 'Media' },
    'admin.galleryForm.classification': {
        fr: 'Classification',
        ar: 'التصنيف',
        en: 'Classification',
    },
    'admin.name': { fr: 'Nom', ar: 'الاسم', en: 'Name' },
    'admin.category': { fr: 'Catégorie', ar: 'الفئة', en: 'Category' },
    'admin.pricePerNight': {
        fr: 'Prix/nuit',
        ar: 'السعر/الليلة',
        en: 'Price/night',
    },
    'admin.rating': { fr: 'Note', ar: 'التقييم', en: 'Rating' },
    'admin.city': { fr: 'Ville', ar: 'المدينة', en: 'City' },
    'admin.cityEn': { fr: 'Ville (EN)', ar: 'المدينة (EN)', en: 'City (EN)' },
    'admin.cityFr': { fr: 'Ville (FR)', ar: 'المدينة (FR)', en: 'City (FR)' },
    'admin.cityAr': { fr: 'Ville (AR)', ar: 'المدينة (AR)', en: 'City (AR)' },
    'admin.country': { fr: 'Pays', ar: 'البلد', en: 'Country' },
    'admin.countryEn': {
        fr: 'Pays (EN)',
        ar: 'البلد (EN)',
        en: 'Country (EN)',
    },
    'admin.countryFr': {
        fr: 'Pays (FR)',
        ar: 'البلد (FR)',
        en: 'Country (FR)',
    },
    'admin.countryAr': {
        fr: 'Pays (AR)',
        ar: 'البلد (AR)',
        en: 'Country (AR)',
    },
    'admin.discount': { fr: 'Remise', ar: 'الخصم', en: 'Discount' },
    'admin.expires': { fr: 'Expire', ar: 'ينتهي في', en: 'Expires' },
    'admin.role': { fr: 'Rôle', ar: 'الدور', en: 'Role' },
    'admin.manageCategories': {
        fr: 'Gérer les catégories',
        ar: 'إدارة الفئات',
        en: 'Manage Categories',
    },
    'admin.categoryKey': {
        fr: 'Catégorie',
        ar: 'الفئة',
        en: 'Category',
    },
    'admin.mainImage': {
        fr: 'Image principale',
        ar: 'الصورة الرئيسية',
        en: 'Main image',
    },
    'admin.blogForm.excerpt': { fr: 'Extrait', ar: 'مقتطف', en: 'Excerpt' },
    'admin.blogForm.body': {
        fr: 'Corps de l’article',
        ar: 'محتوى المقال',
        en: 'Body',
    },
    'admin.blogForm.bodyPlaceholder': {
        fr: 'Rédigez le corps de l’article...',
        ar: 'اكتب محتوى المقال...',
        en: 'Write the full article body...',
    },
    'admin.blogForm.sections': {
        fr: 'Sections de contenu',
        ar: 'أقسام المحتوى',
        en: 'Content sections',
    },
    'admin.blogForm.sectionsHint': {
        fr: 'Gérez les en-têtes et les corps des sections.',
        ar: 'إدارة عناوين ومحتوى الأقسام.',
        en: 'Manage section headings and bodies.',
    },
    'admin.blogForm.addSection': {
        fr: 'Ajouter une section',
        ar: 'إضافة قسم',
        en: 'Add section',
    },
    'admin.blogForm.noSections': {
        fr: 'Aucune section pour le moment.',
        ar: 'لا توجد أقسام حتى الآن.',
        en: 'No extra sections yet.',
    },
    'admin.blogForm.section': { fr: 'Section', ar: 'القسم', en: 'Section' },
    'admin.blogForm.sectionHeading': {
        fr: 'En-tête de section',
        ar: 'عنوان القسم',
        en: 'Section heading',
    },
    'admin.blogForm.sectionBody': {
        fr: 'Corps de la section',
        ar: 'محتوى القسم',
        en: 'Section body',
    },
    'admin.blogForm.summaryAndBody': {
        fr: 'Résumé et corps',
        ar: 'الملخص والمحتوى',
        en: 'Summary and body',
    },
    'admin.blogForm.summaryAndBodyHint': {
        fr: 'Modifiez l’extrait et le corps de l’article.',
        ar: 'تعديل المقتطف ومحتوى المقال.',
        en: 'Edit the excerpt and article body.',
    },
    'admin.blogForm.coreInformation': {
        fr: 'Informations principales',
        ar: 'المعلومات الأساسية',
        en: 'Core information',
    },
    'admin.blogForm.coreInformationHint': {
        fr: 'Modifiez le titre, la catégorie et la date.',
        ar: 'تعديل العنوان والفئة والتاريخ.',
        en: 'Edit title, category and date.',
    },
    'admin.blogForm.selectCategory': {
        fr: 'Sélectionner une catégorie',
        ar: 'اختر فئة',
        en: 'Select category',
    },
    'admin.hotelForm.amenityName': {
        fr: 'Nom de l’équipement',
        ar: 'اسم الميزة',
        en: 'Amenity Name',
    },
    'admin.hotelForm.iconType': {
        fr: 'Type d’icône',
        ar: 'نوع الأيقونة',
        en: 'Icon Type',
    },
    'admin.hotelForm.icon': {
        fr: 'Icône',
        ar: 'الأيقونة',
        en: 'Icon',
    },
    'admin.amenity.wifi': { fr: 'Wi-Fi', ar: 'واي فاي', en: 'Wi-Fi' },
    'admin.amenity.parking': {
        fr: 'Parking',
        ar: 'مواقف سيارات',
        en: 'Parking',
    },
    'admin.amenity.breakfast': {
        fr: 'Petit-déjeuner',
        ar: 'إفطار',
        en: 'Breakfast',
    },
    'admin.amenity.gym': { fr: 'Salle de sport', ar: 'نادي رياضي', en: 'Gym' },
    'admin.amenity.restaurant': {
        fr: 'Restaurant',
        ar: 'مطعم',
        en: 'Restaurant',
    },
    'admin.amenity.pool': { fr: 'Piscine', ar: 'مسبح', en: 'Pool' },
    'admin.iconType.predefined': {
        fr: 'Prédéfini',
        ar: 'محدد مسبقاً',
        en: 'Predefined',
    },
    'admin.iconType.custom': {
        fr: 'SVG personnalisé',
        ar: 'SVG مخصص',
        en: 'Custom SVG',
    },
    'admin.select': { fr: 'Sélectionner...', ar: 'اختر...', en: 'Select...' },
    'admin.hotelForm.roomName': {
        fr: 'Nom de la chambre',
        ar: 'اسم الغرفة',
        en: 'Room Name',
    },
    'admin.hotelForm.capacity': { fr: 'Capacité', ar: 'السعة', en: 'Capacity' },
    'admin.hotelForm.size': {
        fr: 'Taille (m²)',
        ar: 'المساحة (م٢)',
        en: 'Size (sqm)',
    },
    'admin.hotelForm.amenity': {
        fr: 'Équipement',
        ar: 'المرفق',
        en: 'Amenity',
    },
    'admin.hotelForm.room': { fr: 'Chambre', ar: 'الغرفة', en: 'Room' },
    'admin.hotelForm.addAmenity': {
        fr: 'Ajouter un équipement',
        ar: 'إضافة مرفق',
        en: 'Add Amenity',
    },
    'admin.hotelForm.addRoom': {
        fr: 'Ajouter une chambre',
        ar: 'إضافة غرفة',
        en: 'Add Room',
    },
    'admin.hotelForm.amenities': {
        fr: 'Équipements de l’hôtel',
        ar: 'مرافق الفندق',
        en: 'Hotel Amenities',
    },
    'admin.hotelForm.rooms': {
        fr: 'Chambres de l’hôtel',
        ar: 'غرف الفندق',
        en: 'Hotel Rooms',
    },
    'admin.hotelForm.pricing': {
        fr: 'Tarification et structure',
        ar: 'التسعير والبنية',
        en: 'Pricing and structure',
    },
    'admin.hotelForm.mediaHint': {
        fr: 'Images et listes d’équipements.',
        ar: 'الصور وقوائم المرافق.',
        en: 'Images and amenity lists.',
    },
    'admin.tourForm.coreDetailsHint': {
        fr: 'Gérez les informations de base du circuit.',
        ar: 'إدارة المعلومات الأساسية للجولة.',
        en: 'Manage core tour information.',
    },
    'admin.tourForm.itineraryHint': {
        fr: 'Gérez le programme quotidien.',
        ar: 'إدارة البرنامج اليومي.',
        en: 'Manage the daily schedule.',
    },
    'admin.tourForm.inclusionsHint': {
        fr: 'Gérez ce qui est inclus ou non.',
        ar: 'إدارة ما هو مشمول وما هو غير مشمول.',
        en: 'Manage what is included and excluded.',
    },
    'admin.tourForm.day': { fr: 'Jour', ar: 'يوم', en: 'Day' },
    'admin.tourForm.item': { fr: 'Élément', ar: 'عنصر', en: 'Item' },
    'admin.tourForm.itemName': {
        fr: 'Nom de l’élément',
        ar: 'اسم العنصر',
        en: 'Item Name',
    },
    'admin.tourForm.addDay': {
        fr: 'Ajouter un jour',
        ar: 'إضافة يوم',
        en: 'Add Day',
    },
    'admin.tourForm.addInclusion': {
        fr: 'Ajouter une inclusion',
        ar: 'إضافة مشمول',
        en: 'Add Inclusion',
    },
    'admin.tourForm.addExclusion': {
        fr: 'Ajouter une exclusion',
        ar: 'إضافة غير مشمول',
        en: 'Add Exclusion',
    },
    'admin.tourForm.durationDays': {
        fr: 'Durée (jours)',
        ar: 'المدة (أيام)',
        en: 'Duration (days)',
    },
    'admin.tourForm.maxGroup': {
        fr: 'Taille max du groupe',
        ar: 'أقصى حجم للمجموعة',
        en: 'Max group size',
    },
    'admin.tourForm.coreDetails': {
        fr: 'Détails du circuit',
        ar: 'تفاصيل الجولة',
        en: 'Tour details',
    },
    'admin.tourForm.media': {
        fr: 'Médias du circuit',
        ar: 'وسائط الجولة',
        en: 'Tour media',
    },
    'admin.tourForm.mediaHint': {
        fr: 'Images principales et galerie.',
        ar: 'الصور الرئيسية والمعرض.',
        en: 'Main image and gallery.',
    },
    'admin.tourForm.itinerary': {
        fr: 'Itinéraire',
        ar: 'المسار',
        en: 'Itinerary',
    },
    'admin.tourForm.inclusions': {
        fr: 'Inclusions et exclusions',
        ar: 'المشمولات والمستثنيات',
        en: 'Inclusions & Exclusions',
    },
    'admin.tourForm.includes': {
        fr: 'Inclusions',
        ar: 'المشمولات',
        en: 'Inclusions',
    },
    'admin.tourForm.excludes': {
        fr: 'Exclusions',
        ar: 'المستثنيات',
        en: 'Exclusions',
    },
    'admin.tourForm.priceUnit': {
        fr: 'Unité de prix',
        ar: 'وحدة السعر',
        en: 'Price unit',
    },
    'admin.tourForm.selectCategory': {
        fr: 'Sélectionner une catégorie',
        ar: 'اختر فئة',
        en: 'Select category',
    },
    'admin.destinationForm.highlightName': {
        fr: 'Nom du point fort',
        ar: 'اسم النقطة البارزة',
        en: 'Highlight Name',
    },
    'admin.tourForm.ratingPlaceholder': {
        fr: 'Saisissez une note',
        ar: 'أدخل تقييماً',
        en: 'Enter a rating',
    },
    'admin.tourForm.durationNights': {
        fr: 'Durée (nuits)',
        ar: 'المدة (ليالٍ)',
        en: 'Duration (nights)',
    },
    'admin.tourForm.durationNightsPlaceholder': {
        fr: 'Saisissez le nombre de nuits',
        ar: 'أدخل عدد الليالي',
        en: 'Enter number of nights',
    },
    'admin.destinationForm.addHighlight': {
        fr: 'Ajouter un point fort',
        ar: 'إضافة نقطة بارزة',
        en: 'Add highlight',
    },
    'admin.destinationForm.highlight': {
        fr: 'Point fort',
        ar: 'نقطة بارزة',
        en: 'Highlight',
    },
    'admin.destinationForm.mediaAndHighlightsHint2': {
        fr: 'Gérez l’image principale, la galerie et les points forts.',
        ar: 'إدارة الصورة الرئيسية والمعرض وأبرز النقاط.',
        en: 'Manage the main image, gallery and highlights.',
    },
    'admin.destinationForm.aboutHelp': {
        fr: 'Aide sur la description',
        ar: 'مساعدة حول الوصف',
        en: 'Help on description',
    },
    'actions.remove': { fr: 'Retirer', ar: 'إزالة', en: 'Remove' },
    'admin.address': { fr: 'Adresse', ar: 'العنوان', en: 'Address' },
    'admin.phone': { fr: 'Téléphone', ar: 'الهاتف', en: 'Phone' },
    'admin.whatsapp': { fr: 'WhatsApp', ar: 'واتساب', en: 'WhatsApp' },
    'admin.hotelForm.coreDetails': {
        fr: 'Détails de l’hôtel',
        ar: 'تفاصيل الفندق',
        en: 'Hotel details',
    },
    'admin.hotelForm.coreDetailsHint': {
        fr: 'Gérez les informations de base de l’hôtel.',
        ar: 'إدارة المعلومات الأساسية للفندق.',
        en: 'Manage core hotel information.',
    },
    'admin.hotelForm.features': {
        fr: 'Caractéristiques',
        ar: 'المميزات',
        en: 'Features',
    },
    'admin.carForm.coreDetails': {
        fr: 'Détails du véhicule',
        ar: 'تفاصيل المركبة',
        en: 'Vehicle details',
    },
    'admin.carForm.features': {
        fr: 'Caractéristiques',
        ar: 'المميزات',
        en: 'Features',
    },
    'admin.carForm.policy': {
        fr: 'Politique de location',
        ar: 'سياسة التأجير',
        en: 'Rental policy',
    },
    'admin.blogForm.titlePlaceholder': {
        fr: 'Saisissez un titre accrocheur',
        ar: 'أدخل عنواناً جذاباً للمقال',
        en: 'Enter a catchy blog title',
    },
    'admin.blogForm.excerptPlaceholder': {
        fr: 'Rédigez un court résumé...',
        ar: 'اكتب ملخصاً قصيراً...',
        en: 'Write a short summary...',
    },
    'admin.blogForm.excerptHint': {
        fr: 'Une brève description pour la liste des articles.',
        ar: 'وصف موجز لقائمة المقالات.',
        en: 'A brief description for the blog listing.',
    },
    'admin.blogForm.bodyHint': {
        fr: 'Le texte principal de votre article.',
        ar: 'النص الرئيسي لمقالك.',
        en: 'The main text of your article.',
    },
    'admin.teamForm.coreDetails': {
        fr: 'Détails du membre',
        ar: 'تفاصيل العضو',
        en: 'Member details',
    },
    'admin.teamForm.coreDetailsHint': {
        fr: 'Gérez les informations du membre de l’équipe.',
        ar: 'إدارة معلومات عضو الفريق.',
        en: 'Manage team member information.',
    },
    'admin.teamTable.image': { fr: 'Image', ar: 'الصورة', en: 'Image' },
    'admin.teamTable.name': { fr: 'Nom', ar: 'الاسم', en: 'Name' },
    'admin.teamTable.role': { fr: 'Rôle', ar: 'الدور', en: 'Role' },
    'admin.teamTable.actions': {
        fr: 'Actions',
        ar: 'الإجراءات',
        en: 'Actions',
    },
    'admin.teamForm.namePlaceholder': {
        fr: 'Ex: Jane Doe',
        ar: 'مثال: محمد أحمد',
        en: 'E.g., Jane Doe',
    },
    'admin.teamForm.nameHint': {
        fr: 'Nom complet du membre.',
        ar: 'الاسم الكامل للعضو.',
        en: 'Full name of the team member.',
    },
    'admin.teamForm.rolePlaceholder': {
        fr: 'Ex: Conseiller',
        ar: 'مثال: مستشار سفر',
        en: 'E.g., Travel Advisor',
    },
    'admin.teamForm.roleHint': {
        fr: 'Poste ou titre actuel.',
        ar: 'المسمى الوظيفي الحالي.',
        en: 'Current position or title.',
    },
    'admin.teamForm.bioPlaceholder': {
        fr: 'Présentez brièvement le membre.',
        ar: 'قدم العضو باختصار.',
        en: 'Briefly introduce the member.',
    },
    'admin.teamForm.bioHint': {
        fr: 'Expertise ou parcours.',
        ar: 'خبرتهم أو مسيرتهم.',
        en: 'Their expertise or background.',
    },
    'admin.teamForm.linkedin': {
        fr: 'URL LinkedIn',
        ar: 'رابط LinkedIn',
        en: 'LinkedIn URL',
    },
    'admin.teamForm.twitter': {
        fr: 'URL X / Twitter',
        ar: 'رابط X / Twitter',
        en: 'X / Twitter URL',
    },
    'admin.teamForm.email': {
        fr: 'Adresse e-mail',
        ar: 'عنوان البريد الإلكتروني',
        en: 'Email address',
    },
    'admin.teamForm.mainImage': {
        fr: 'Image principale',
        ar: 'الصورة الرئيسية',
        en: 'Main image',
    },
    'admin.teamForm.noFileChosen': {
        fr: 'Aucun fichier choisi',
        ar: 'لم يتم اختيار ملف',
        en: 'No file chosen',
    },
    'admin.partnerForm.coreDetails': {
        fr: 'Détails du partenaire',
        ar: 'تفاصيل الشريك',
        en: 'Partner Details',
    },
    'admin.partnerForm.coreDetailsHint': {
        fr: 'Informations de base du partenaire.',
        ar: 'معلومات الشريك الأساسية.',
        en: 'Basic partner information.',
    },
    'admin.partnerForm.name': {
        fr: 'Nom',
        ar: 'الاسم',
        en: 'Name',
    },
    'admin.partnerForm.namePlaceholder': {
        fr: 'Ex: Emirates',
        ar: 'مثال: الاتحاد للطيران',
        en: 'E.g., Emirates',
    },
    'admin.partnerForm.description': {
        fr: 'Description',
        ar: 'الوصف',
        en: 'Description',
    },
    'admin.partnerForm.descriptionPlaceholder': {
        fr: 'Description du partenaire...',
        ar: 'وصف الشريك...',
        en: 'Partner description...',
    },
    'admin.partnerForm.website': {
        fr: 'Site web',
        ar: 'الموقع الإلكتروني',
        en: 'Website',
    },
    'admin.partnerForm.logo': {
        fr: 'Logo',
        ar: 'الشعار',
        en: 'Logo',
    },
    'admin.partnerTable.logo': {
        fr: 'Logo',
        ar: 'الشعار',
        en: 'Logo',
    },
    'admin.partnerTable.name': {
        fr: 'Nom',
        ar: 'الاسم',
        en: 'Name',
    },
    'admin.partnerTable.website': {
        fr: 'Site web',
        ar: 'الموقع',
        en: 'Website',
    },
    'admin.partnerTable.actions': {
        fr: 'Actions',
        ar: 'الإجراءات',
        en: 'Actions',
    },

    'admin.teamEditTitle': {
        fr: 'Modifier le membre',
        ar: 'تعديل عضو',
        en: 'Edit Team Member',
    },
    'admin.teamAddTitle': {
        fr: 'Ajouter un membre',
        ar: 'إضافة عضو',
        en: 'Add Team Member',
    },
    'admin.partnerEditTitle': {
        fr: 'Modifier le partenaire',
        ar: 'تعديل الشريك',
        en: 'Edit Partner',
    },
    'admin.partnerAddTitle': {
        fr: 'Ajouter un partenaire',
        ar: 'إضافة شريك',
        en: 'Add Partner',
    },
    'admin.destinationAddTitle': {
        fr: 'Ajouter une destination',
        ar: 'إضافة وجهة',
        en: 'Add destination',
    },
    'admin.destinationEditTitle': {
        fr: 'Modifier la destination',
        ar: 'تعديل الوجهة',
        en: 'Edit destination',
    },
    'admin.deleteDestinationTitle': {
        fr: 'Supprimer la destination ?',
        ar: 'حذف الوجهة؟',
        en: 'Delete destination?',
    },
    'admin.deleteDestinationPrompt': {
        fr: 'Êtes-vous sûr de vouloir supprimer',
        ar: 'هل أنت متأكد أنك تريد حذف',
        en: 'Are you sure you want to delete',
    },
    'admin.deleteDestinationWarning': {
        fr: 'Cette action est irréversible.',
        ar: 'لا يمكن التراجع عن هذا الإجراء.',
        en: 'This action cannot be undone.',
    },
    'admin.deleteDestinationFallback': {
        fr: 'Êtes-vous sûr de vouloir supprimer cette destination ? Cette action est irréversible.',
        ar: 'هل أنت متأكد أنك تريد حذف هذه الوجهة؟ لا يمكن التراجع عن هذا الإجراء.',
        en: 'Are you sure you want to delete this destination? This action cannot be undone.',
    },
    'admin.deleteItemTitle': {
        fr: 'Supprimer cet élément ?',
        ar: 'حذف هذا العنصر؟',
        en: 'Delete item?',
    },
    'admin.deleteItemPrompt': {
        fr: 'Êtes-vous sûr de vouloir supprimer',
        ar: 'هل أنت متأكد أنك تريد حذف',
        en: 'Are you sure you want to delete',
    },
    'admin.deleteItemWarning': {
        fr: 'Cette action est irréversible.',
        ar: 'لا يمكن التراجع عن هذا الإجراء.',
        en: 'This action cannot be undone.',
    },
    'admin.deleteItemFallback': {
        fr: 'Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.',
        ar: 'هل أنت متأكد أنك تريد حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.',
        en: 'Are you sure you want to delete this item? This action cannot be undone.',
    },
    'admin.destinationSlug': {
        fr: 'Slug de destination',
        ar: 'رابط الوجهة',
        en: 'Destination slug',
    },
    'admin.hotelAdded': {
        fr: 'Hôtel ajouté',
        ar: 'تم إضافة الفندق',
        en: 'Hotel added',
    },
    'admin.hotelUpdated': {
        fr: 'Hôtel mis à jour',
        ar: 'تم تحديث الفندق',
        en: 'Hotel updated',
    },
    'admin.destinationAdded': {
        fr: 'Destination ajoutée',
        ar: 'تم إضافة الوجهة',
        en: 'Destination added',
    },
    'admin.destinationUpdated': {
        fr: 'Destination mise à jour',
        ar: 'تم تحديث الوجهة',
        en: 'Destination updated',
    },
    'admin.tourAdded': {
        fr: 'Circuit ajouté',
        ar: 'تم إضافة الجولة',
        en: 'Tour added',
    },
    'admin.tourUpdated': {
        fr: 'Circuit mis à jour',
        ar: 'تم تحديث الجولة',
        en: 'Tour updated',
    },
    'admin.teamAdded': {
        fr: 'Membre ajouté',
        ar: 'تم إضافة العضو',
        en: 'Member added',
    },
    'admin.teamUpdated': {
        fr: 'Membre mis à jour',
        ar: 'تم تحديث العضو',
        en: 'Member updated',
    },
    'admin.visas': { fr: 'Visa', ar: 'التأشيرات', en: 'Visas' },
    'admin.visasSubtitle': {
        fr: 'Gérer les pays et tarifs de visa',
        ar: 'إدارة بلدان وأسعار التأشيرات',
        en: 'Manage visa countries and pricing',
    },
    'admin.visaTable.flag': { fr: 'Drapeau', ar: 'العلم', en: 'Flag' },
    'admin.visaTable.name': { fr: 'Nom', ar: 'الاسم', en: 'Name' },
    'admin.visaTable.region': { fr: 'Région', ar: 'المنطقة', en: 'Region' },
    'admin.visaTable.processing': { fr: 'Délai', ar: 'مدة المعالجة', en: 'Processing' },
    'admin.visaTable.price': { fr: 'Prix', ar: 'السعر', en: 'Price' },
    'admin.visaTable.active': { fr: 'Actif', ar: 'نشط', en: 'Active' },
    'admin.visaTable.actions': { fr: 'Actions', ar: 'الإجراءات', en: 'Actions' },
    'admin.visaForm.details': { fr: 'Détails du visa', ar: 'تفاصيل التأشيرة', en: 'Visa Details' },
    'admin.visaForm.detailsHint': { fr: 'Informations sur le pays et les tarifs', ar: 'معلومات البلد والأسعار', en: 'Country and pricing information' },
    'admin.visaForm.helper': { fr: 'Remplissez les informations du visa pour chaque langue', ar: 'املأ معلومات التأشيرة لكل لغة', en: 'Fill in visa information for each language' },
    'admin.visaForm.code': { fr: 'Code pays', ar: 'رمز الدولة', en: 'Country Code' },
    'admin.visaForm.name': { fr: 'Nom du pays', ar: 'اسم الدولة', en: 'Country Name' },
    'admin.visaForm.namePlaceholder': { fr: 'France', ar: 'فرنسا', en: 'France' },
    'admin.visaForm.flag': { fr: 'Drapeau (emoji)', ar: 'العلم (إيموجي)', en: 'Flag (emoji)' },
    'admin.visaForm.region': { fr: 'Région', ar: 'المنطقة', en: 'Region' },
    'admin.visaForm.regionPlaceholder': { fr: 'Europe', ar: 'أوروبا', en: 'Europe' },
    'admin.visaForm.processing': { fr: 'Délai de traitement', ar: 'مدة المعالجة', en: 'Processing Time' },
    'admin.visaForm.processingPlaceholder': { fr: '10-15 jours', ar: '10-15 يوم', en: '10-15 days' },
    'admin.visaForm.price': { fr: 'Prix (DT)', ar: 'السعر (د.ت)', en: 'Price (DT)' },
    'admin.visaForm.sortOrder': { fr: 'Ordre', ar: 'الترتيب', en: 'Sort Order' },
    'admin.visaForm.active': { fr: 'Actif', ar: 'نشط', en: 'Active' },
    'admin.visaForm.inactive': { fr: 'Inactif', ar: 'غير نشط', en: 'Inactive' },
    'admin.visaForm.pricingAndSettings': { fr: 'Prix et paramètres', ar: 'السعر والإعدادات', en: 'Pricing & Settings' },
    'admin.visaForm.pricingAndSettingsHint': { fr: 'Définir le prix et l\'état du visa', ar: 'تحديد سعر وحالة التأشيرة', en: 'Set visa price and status' },
    'admin.visaAddTitle': { fr: 'Ajouter un visa', ar: 'إضافة تأشيرة', en: 'Add Visa' },
    'admin.visaEditTitle': { fr: 'Modifier le visa', ar: 'تعديل التأشيرة', en: 'Edit Visa' },
    'admin.visaAdded': { fr: 'Visa ajouté', ar: 'تمت إضافة التأشيرة', en: 'Visa added' },
    'admin.visaUpdated': { fr: 'Visa mis à jour', ar: 'تم تحديث التأشيرة', en: 'Visa updated' },
    'admin.partnerAdded': {
        fr: 'Partenaire ajouté',
        ar: 'تم إضافة الشريك',
        en: 'Partner added',
    },
    'admin.partnerUpdated': {
        fr: 'Partenaire mis à jour',
        ar: 'تم تحديث الشريك',
        en: 'Partner updated',
    },
    'admin.invalidUrl': {
        fr: 'URL invalide',
        ar: 'رابط غير صالح',
        en: 'Invalid URL',
    },
    'admin.invalidEmail': {
        fr: 'E-mail invalide',
        ar: 'بريد إلكتروني غير صالح',
        en: 'Invalid email',
    },
    'admin.invalidRating': {
        fr: 'Note invalide',
        ar: 'تقييم غير صالح',
        en: 'Invalid rating',
    },
    'admin.invalidNights': {
        fr: 'Nombre de nuits invalide',
        ar: 'عدد ليالي غير صالح',
        en: 'Invalid number of nights',
    },
    'admin.promoAdded': {
        fr: 'Promo ajoutée',
        ar: 'تم إضافة العرض',
        en: 'Promo added',
    },
    'admin.promoUpdated': {
        fr: 'Promo mise à jour',
        ar: 'تم تحديث العرض',
        en: 'Promo updated',
    },
    'admin.dealAdded': {
        fr: 'Offre ajoutée',
        ar: 'تم إضافة العرض',
        en: 'Deal added',
    },
    'admin.dealUpdated': {
        fr: 'Offre mise à jour',
        ar: 'تم تحديث العرض',
        en: 'Deal updated',
    },
    'admin.eventAdded': {
        fr: 'Événement ajouté',
        ar: 'تم إضافة الفعالية',
        en: 'Event added',
    },
    'admin.eventUpdated': {
        fr: 'Événement mis à jour',
        ar: 'تم تحديث الفعالية',
        en: 'Event updated',
    },
    'admin.carAdded': {
        fr: 'Véhicule ajouté',
        ar: 'تم إضافة المركبة',
        en: 'Car added',
    },
    'admin.carUpdated': {
        fr: 'Véhicule mis à jour',
        ar: 'تم تحديث المركبة',
        en: 'Car updated',
    },
    'admin.flightAdded': {
        fr: 'Vol ajouté',
        ar: 'تم إضافة الرحلة',
        en: 'Flight added',
    },
    'admin.flightUpdated': {
        fr: 'Vol mis à jour',
        ar: 'تم تحديث الرحلة',
        en: 'Flight updated',
    },
    'admin.carForm.fuelPlaceholder': {
        fr: 'p.ex. Essence, Diesel, Électrique',
        ar: 'مثلاً: بنزين، ديزل، كهرباء',
        en: 'e.g. Petrol, Diesel, Electric',
    },
    'admin.carForm.transmissionPlaceholder': {
        fr: 'p.ex. Automatique, Manuel',
        ar: 'مثلاً: أوتوماتيكي، يدوي',
        en: 'e.g. Automatic, Manual',
    },
    'admin.carForm.pricePlaceholder': { fr: '0.00', ar: '0.00', en: '0.00' },
    'admin.carForm.seatsPlaceholder': {
        fr: 'p.ex. 5',
        ar: 'مثلاً: 5',
        en: 'e.g. 5',
    },
    'admin.carForm.feature': {
        fr: 'Caractéristique',
        ar: 'ميزة',
        en: 'Feature',
    },
    'admin.carForm.rule': { fr: 'Règle', ar: 'قاعدة', en: 'Rule' },
    'admin.carForm.namePlaceholder': {
        fr: 'p.ex. Berline de Luxe',
        ar: 'مثلاً: سيارة سيدان فاخرة',
        en: 'e.g. Luxury Sedan',
    },
    'admin.carForm.nameHint': {
        fr: 'Nom du modèle de voiture.',
        ar: 'اسم طراز السيارة.',
        en: 'Name of the car model.',
    },
    'admin.carForm.fuelHint': {
        fr: 'Type de carburant (ex: Essence, Diesel).',
        ar: 'نوع الوقود (مثلاً: بنزين، ديزل).',
        en: 'Fuel type (e.g. Petrol, Diesel).',
    },
    'admin.carForm.transmissionHint': {
        fr: 'Type de boîte de vitesses (ex: Automatique, Manuel).',
        ar: 'نوع ناقل الحركة (مثلاً: أوتوماتيكي، يدوي).',
        en: 'Transmission type (e.g. Automatic, Manual).',
    },
    'admin.carForm.priceHint': {
        fr: 'Prix de location par jour en TND.',
        ar: 'سعر الإيجار اليومي بالدينار التونسي.',
        en: 'Daily rental price in TND.',
    },
    'admin.carForm.seatsHint': {
        fr: 'Nombre total de sièges passagers.',
        ar: 'إجمالي عدد مقاعد الركاب.',
        en: 'Total number of passenger seats.',
    },
    'admin.carForm.addFeature': {
        fr: 'Ajouter une caractéristique',
        ar: 'إضافة ميزة',
        en: 'Add feature',
    },
    'admin.carForm.addPolicy': {
        fr: 'Ajouter une règle',
        ar: 'إضافة قاعدة',
        en: 'Add rule',
    },
    'admin.carForm.coreDetailsHint': {
        fr: 'Switch language to edit the translated car copy one locale at a time.',
        ar: 'بدّل اللغة لتعديل النص المترجم للسيارة لكل لغة على حدة.',
        en: 'Switch language to edit the translated car copy one locale at a time.',
    },
    'admin.carForm.media': {
        fr: 'Médias du véhicule',
        ar: 'وسائط المركبة',
        en: 'Vehicle Media',
    },
    'admin.carForm.mediaHint': {
        fr: 'Upload main image and gallery images.',
        ar: 'تحميل الصورة الرئيسية وصور المعرض.',
        en: 'Upload main image and gallery images.',
    },
    'admin.carForm.featuresHint': {
        fr: 'Manage localized car features.',
        ar: 'إدارة مميزات السيارة المترجمة.',
        en: 'Manage localized car features.',
    },
    'admin.invalidPrice': {
        fr: 'Prix invalide.',
        ar: 'سعر غير صالح.',
        en: 'Invalid price.',
    },
    'admin.invalidSeats': {
        fr: 'Nombre de sièges invalide.',
        ar: 'عدد مقاعد غير صالح.',
        en: 'Invalid number of seats.',
    },
    'admin.flightForm.technicalInfo': {
        fr: 'Informations techniques',
        ar: 'المعلومات التقنية',
        en: 'Technical info',
    },
    'admin.flightForm.originFixed': {
        fr: 'Origine (Fixe)',
        ar: 'المصدر (ثابت)',
        en: 'Origin (Fixed)',
    },
    'admin.eventForm.activity': {
        fr: 'Activité',
        ar: 'النشاط',
        en: 'Activity',
    },
    'admin.eventForm.addActivity': {
        fr: 'Ajouter une activité',
        ar: 'إضافة نشاط',
        en: 'Add activity',
    },
    'admin.promos.colorToken': {
        fr: 'Jeton de couleur',
        ar: 'رمز اللون',
        en: 'Color token',
    },
    'admin.promos.colorPlaceholder': {
        fr: 'p.ex. #FF5733 ou blue',
        ar: 'مثلاً #FF5733 أو أزرق',
        en: 'e.g. #FF5733 or blue',
    },
    'admin.promos.codePlaceholder': {
        fr: 'p.ex. SUMMER2026',
        ar: 'مثلاً SUMMER2026',
        en: 'e.g. SUMMER2026',
    },
    'admin.promos.titlePlaceholder': {
        fr: "Vente d'été",
        ar: 'تخفيضات الصيف',
        en: 'Summer Sale',
    },
    'admin.promos.discountPlaceholder': {
        fr: '20% de remise',
        ar: 'خصم 20%',
        en: '20% OFF',
    },
    'admin.promos.expiresPlaceholder': {
        fr: '2026-12-31',
        ar: '2026-12-31',
        en: '2026-12-31',
    },
    'admin.promos.applicableToPlaceholder': {
        fr: 'Sélectionner une option...',
        ar: 'اختر خياراً...',
        en: 'Select an option...',
    },
    'admin.promos.applicableTo.all': {
        fr: 'Tous les produits',
        ar: 'جميع المنتجات',
        en: 'All products',
    },
    'admin.promos.applicableTo.flights': {
        fr: 'Vols uniquement',
        ar: 'الرحلات فقط',
        en: 'Flights only',
    },
    'admin.promos.applicableTo.hotels': {
        fr: 'Hôtels uniquement',
        ar: 'الفنادق فقط',
        en: 'Hotels only',
    },
    'admin.promos.applicableTo.tours': {
        fr: 'Tours uniquement',
        ar: 'الجولات فقط',
        en: 'Tours only',
    },
    'admin.promos.applicableTo.deals': {
        fr: 'Offres uniquement',
        ar: 'العروض فقط',
        en: 'Deals only',
    },
    'admin.promos.applicableTo.cars': {
        fr: 'Voitures uniquement',
        ar: 'السيارات فقط',
        en: 'Cars only',
    },
    'admin.promos.applicableTo.events': {
        fr: 'Événements uniquement',
        ar: 'الفعاليات فقط',
        en: 'Events only',
    },
    'admin.promos.applicableTo.new_customers': {
        fr: 'Nouveaux clients uniquement',
        ar: 'العملاء الجدد فقط',
        en: 'New customers only',
    },
    'admin.promos.applicableTo.existing_customers': {
        fr: 'Clients existants uniquement',
        ar: 'العملاء الحاليين فقط',
        en: 'Existing customers only',
    },
    'admin.promos.description': {
        fr: 'Description',
        ar: 'الوصف',
        en: 'Description',
    },
    'admin.promos.usageLimitHelp': {
        fr: "Nombre total d'utilisations autorisées (laissez vide pour illimité).",
        ar: 'إجمالي عدد الاستخدامات المسموح بها (اتركه فارغاً لغير محدود).',
        en: 'Total number of uses allowed (leave empty for unlimited).',
    },
    'admin.promos.perUserLimitHelp': {
        fr: "Nombre d'utilisations par utilisateur (laissez vide pour 1).",
        ar: 'عدد الاستخدامات لكل مستخدم (اتركه فارغاً لـ 1).',
        en: 'Number of uses per user (leave empty for 1).',
    },
    'admin.promos.applicableToHelp': {
        fr: "Sélectionnez les entités pour lesquelles cette promotion s'applique.",
        ar: 'حدد الكيانات التي ينطبق عليها هذا العرض الترويجي.',
        en: 'Select the entities this promotion applies to.',
    },
    'admin.promos.coreInfoTitle': {
        fr: 'Informations principales',
        ar: 'المعلومات الأساسية',
        en: 'Core information',
    },
    'admin.promos.coreInfoDescription': {
        fr: 'Identité et valeurs de la campagne.',
        ar: 'هوية وقيم الحملة الترويجية.',
        en: 'Identity and campaign values.',
    },
    'admin.promos.descriptionRulesTitle': {
        fr: 'Description et règles',
        ar: 'الوصف والقواعد',
        en: 'Description and rules',
    },
    'admin.promos.descriptionRulesDescription': {
        fr: 'Texte affiché dans les détails de la promo.',
        ar: 'النصوص المعروضة في تفاصيل العرض الترويجي.',
        en: 'Text shown in the promo detail cards.',
    },
    'admin.promos.fieldName': { fr: 'Nom', ar: 'الاسم', en: 'Name' },
    'admin.promos.rule': { fr: 'Règle', ar: 'قاعدة', en: 'Rule' },
    'admin.promos.step': { fr: 'Étape', ar: 'خطوة', en: 'Step' },
    'admin.promos.term': { fr: 'Terme', ar: 'شرط', en: 'Term' },
    'admin.promoForm.eligibility': {
        fr: 'Éligibilité',
        ar: 'الأهلية',
        en: 'Eligibility',
    },
    'admin.promoForm.howToUse': {
        fr: 'Comment utiliser',
        ar: 'كيفية الاستخدام',
        en: 'How to Use',
    },
    'admin.promos.eligibilityHint': {
        fr: "Définissez les conditions d'éligibilité pour cette promotion.",
        ar: 'حدد شروط الأهلية لهذا العرض الترويجي.',
        en: 'Define the eligibility criteria for this promotion.',
    },
    'admin.promos.howToUseHint': {
        fr: 'Expliquez comment utiliser le code promotionnel.',
        ar: 'اشرح كيفية استخدام رمز العرض الترويجي.',
        en: 'Explain how to use the promo code.',
    },
    'admin.promos.termsHint': {
        fr: 'Spécifiez les termes et conditions applicables.',
        ar: 'حدد الشروط والأحكام المطبقة.',
        en: 'Specify the applicable terms and conditions.',
    },
    'admin.promoForm.usageLimit': {
        fr: 'Limite d’utilisation',
        ar: 'حد الاستخدام',
        en: 'Usage limit',
    },
    'admin.promoForm.perUserLimit': {
        fr: 'Limite par utilisateur',
        ar: 'الحد لكل مستخدم',
        en: 'Per-user limit',
    },
    'admin.promoForm.applicableTo': {
        fr: 'Applicable à',
        ar: 'ينطبق على',
        en: 'Applicable to',
    },
    'admin.teamForm.role': { fr: 'Rôle', ar: 'الدور', en: 'Role' },
    'admin.teamForm.bio': { fr: 'Biographie', ar: 'السيرة الذاتية', en: 'Bio' },
    'admin.imagesInLibrary': {
        fr: 'images dans votre bibliothèque',
        ar: 'صور في مكتبتك',
        en: 'images in your library',
    },
    'admin.gallery': { fr: 'Galerie', ar: 'المعرض', en: 'Gallery' },
    'admin.all': { fr: 'Tous', ar: 'الكل', en: 'All' },
    'admin.addImage': {
        fr: 'Ajouter une image',
        ar: 'إضافة صورة',
        en: 'Add Image',
    },
    'admin.editImage': {
        fr: 'Modifier l’image',
        ar: 'تعديل الصورة',
        en: 'Edit Image',
    },
    'admin.searchByTitle': {
        fr: 'Rechercher par titre...',
        ar: 'ابحث بالعنوان...',
        en: 'Search by title...',
    },
    'admin.noImagesMatch': {
        fr: 'Aucune image ne correspond à vos filtres. Cliquez sur "Ajouter une image" pour en télécharger une.',
        ar: 'لا توجد صور تطابق عوامل التصفية الخاصة بك. انقر على "إضافة صورة" لتحميل واحدة.',
        en: 'No images match your filters. Click "Add Image" to upload one.',
    },
    'admin.imageUpdated': {
        fr: 'Image mise à jour',
        ar: 'تم تحديث الصورة',
        en: 'Image updated',
    },
    'admin.imageAdded': {
        fr: 'Image ajoutée',
        ar: 'تم إضافة الصورة',
        en: 'Image added',
    },
    'admin.imageDeleted': {
        fr: 'Image supprimée',
        ar: 'تم حذف الصورة',
        en: 'Image deleted',
    },
    'admin.error.pleaseFixErrors': {
        fr: 'Veuillez corriger les erreurs dans le formulaire',
        ar: 'يرجى تصحيح الأخطاء في النموذج',
        en: 'Please fix the errors in the form',
    },
    'admin.aircraft': { fr: 'Avion', ar: 'الطائرة', en: 'Aircraft' },
    'admin.cabin': { fr: 'Cabine', ar: 'المقصورة', en: 'Cabin' },
    'admin.stops': { fr: 'Escales', ar: 'التوقفات', en: 'Stops' },
    'admin.stars': { fr: 'Étoiles', ar: 'النجوم', en: 'Stars' },
    'admin.reviews': { fr: 'Avis', ar: 'المراجعات', en: 'Reviews' },
    'admin.destinationForm.coreInformation': {
        fr: 'Informations principales',
        ar: 'المعلومات الأساسية',
        en: 'Core information',
    },
    'admin.destinationForm.coreInformationHint': {
        fr: 'Modifiez les informations de base de la destination.',
        ar: 'تعديل المعلومات الأساسية للوجهة.',
        en: 'Edit core destination information.',
    },
    'admin.destinationForm.mediaAndHighlights': {
        fr: 'Médias et points forts',
        ar: 'الوسائط وأبرز النقاط',
        en: 'Media and highlights',
    },
    'admin.destinationForm.highlights': {
        fr: 'Points forts',
        ar: 'النقاط البارزة',
        en: 'Highlights',
    },
    'admin.destinationForm.destinationFacts': {
        fr: 'Faits sur la destination',
        ar: 'حقائق عن الوجهة',
        en: 'Destination facts',
    },
    'admin.destinationForm.name': { fr: 'Nom', ar: 'الاسم', en: 'Name' },
    'admin.destinationForm.country': { fr: 'Pays', ar: 'البلد', en: 'Country' },
    'admin.destinationForm.category': {
        fr: 'Catégorie',
        ar: 'الفئة',
        en: 'Category',
    },
    'admin.destinationForm.price': { fr: 'Prix', ar: 'السعر', en: 'Price' },
    'admin.destinationForm.rating': { fr: 'Note', ar: 'التقييم', en: 'Rating' },
    'admin.destinationForm.bestTime': {
        fr: 'Meilleur moment',
        ar: 'أفضل وقت',
        en: 'Best time',
    },
    'admin.destinationForm.language': {
        fr: 'Langue',
        ar: 'اللغة',
        en: 'Language',
    },
    'admin.destinationForm.currency': {
        fr: 'Devise',
        ar: 'العملة',
        en: 'Currency',
    },
    'admin.destinationForm.weather': {
        fr: 'Météo',
        ar: 'الطقس',
        en: 'Weather',
    },
    'admin.destinationForm.image': { fr: 'Image', ar: 'الصورة', en: 'Image' },
    'admin.destinationForm.gallery': {
        fr: 'Galerie',
        ar: 'المعرض',
        en: 'Gallery',
    },
    'admin.destinationForm.helper': {
        fr: 'Informations sur la destination',
        ar: 'معلومات الوجهة',
        en: 'Destination information',
    },
    'admin.destinationTable.image': { fr: 'Image', ar: 'الصورة', en: 'Image' },
    'admin.destinationTable.name': { fr: 'Nom', ar: 'الاسم', en: 'Name' },
    'admin.destinationTable.country': {
        fr: 'Pays',
        ar: 'البلد',
        en: 'Country',
    },
    'admin.destinationTable.category': {
        fr: 'Catégorie',
        ar: 'الفئة',
        en: 'Category',
    },
    'admin.destinationTable.price': { fr: 'Prix', ar: 'السعر', en: 'Price' },
    'admin.destinationTable.rating': {
        fr: 'Note',
        ar: 'التقييم',
        en: 'Rating',
    },
    'admin.destinationTable.actions': {
        fr: 'Actions',
        ar: 'الإجراءات',
        en: 'Actions',
    },

    'admin.destinationForm.localizedContent': {
        fr: 'Contenu localisé',
        ar: 'المحتوى المترجم',
        en: 'Localized content',
    },
    'admin.destinationForm.mediaAndHighlightsHint': {
        fr: 'Ajoutez une image, des points forts et des images de galerie.',
        ar: 'أضف صورة وأبرز النقاط وصور المعرض.',
        en: 'Add the main image, highlights, and gallery images.',
    },
    'admin.destinationForm.destinationFactsHint': {
        fr: 'Ajoutez les repères pratiques et les informations utiles.',
        ar: 'أضف النقاط العملية والمعلومات المفيدة.',
        en: 'Add practical details and useful information.',
    },
    'admin.destinationForm.about': {
        fr: 'À propos',
        ar: 'حول الوجهة',
        en: 'About section',
    },
    'admin.destinationForm.imagePreviewAlt': {
        fr: 'Aperçu de l’image de la destination',
        ar: 'معاينة صورة الوجهة',
        en: 'Destination image preview',
    },
    'admin.destinationForm.imagePlaceholder': {
        fr: 'Collez une URL ou un chemin d’image',
        ar: 'الصق رابطًا أو مسار صورة',
        en: 'Paste an image URL or path',
    },
    'admin.destinationForm.imageHelper': {
        fr: 'Utilisez une URL publique ou un chemin local existant.',
        ar: 'استخدم رابطًا عامًا أو مسارًا محليًا موجودًا.',
        en: 'Use a public URL or an existing local path.',
    },
    'admin.destinationForm.highlightsPlaceholder': {
        fr: 'Un point fort par ligne',
        ar: 'نقطة بارزة في كل سطر',
        en: 'One highlight per line',
    },
    'admin.destinationForm.galleryPlaceholder': {
        fr: 'Une URL ou un chemin par ligne',
        ar: 'رابط أو مسار لكل سطر',
        en: 'One image URL or path per line',
    },
    'admin.destinationForm.galleryUploadHint': {
        fr: 'Ajoutez une ou plusieurs images directement depuis votre appareil.',
        ar: 'أضف صورة واحدة أو أكثر مباشرة من جهازك.',
        en: 'Add one or more images directly from your device.',
    },
    'admin.destinationForm.galleryEmpty': {
        fr: 'Aucune image de galerie pour le moment.',
        ar: 'لا توجد صور في المعرض حتى الآن.',
        en: 'No gallery images yet.',
    },
    'admin.destinationForm.bestTimePlaceholder': {
        fr: 'Par exemple : avril à juin',
        ar: 'مثلاً: من أبريل إلى يونيو',
        en: 'e.g. April to June',
    },
    'admin.destinationForm.languagePlaceholder': {
        fr: 'Par exemple : Français, Anglais',
        ar: 'مثلاً: العربية، الإنجليزية',
        en: 'e.g. French, English',
    },
    'admin.destinationForm.currencyPlaceholder': {
        fr: 'Par exemple : EUR, TND',
        ar: 'مثلاً: EUR, TND',
        en: 'e.g. EUR, TND',
    },
    'admin.destinationForm.weatherPlaceholder': {
        fr: 'Par exemple : Méditerranéen, Ensoleillé',
        ar: 'مثلاً: معتدل، مشمس',
        en: 'e.g. Mediterranean, Sunny',
    },
    'admin.destinationForm.namePlaceholder': {
        fr: 'p.ex. Bali',
        ar: 'مثلاً: بالي',
        en: 'e.g. Bali',
    },
    'admin.destinationForm.countryPlaceholder': {
        fr: 'p.ex. Indonésie',
        ar: 'مثلاً: إندونيسيا',
        en: 'e.g. Indonesia',
    },
    'admin.destinationForm.nameHelp': {
        fr: 'Nom unique de la destination.',
        ar: 'اسم فريد للوجهة.',
        en: 'Unique name of the destination.',
    },
    'admin.destinationForm.countryHelp': {
        fr: 'Pays ou région où se trouve la destination.',
        ar: 'البلد أو المنطقة التي تقع فيها الوجهة.',
        en: 'Country or region where the destination is located.',
    },
    'admin.destinationForm.categoryHelp': {
        fr: 'Choisissez une catégorie pour classer cette destination.',
        ar: 'اختر فئة لتصنيف هذه الوجهة.',
        en: 'Choose a category to classify this destination.',
    },
    'admin.destinationForm.priceHelp': {
        fr: 'Prix moyen estimé par personne.',
        ar: 'متوسط السعر المقدر للشخص الواحد.',
        en: 'Estimated average price per person.',
    },
    'admin.destinationForm.ratingHelp': {
        fr: 'Note de 1 à 5.',
        ar: 'تقييم من 1 إلى 5.',
        en: 'Rating from 1 to 5.',
    },
    'admin.destinationForm.descriptionHelp': {
        fr: 'Description courte et attrayante de la destination.',
        ar: 'وصف قصير وجذاب للوجهة.',
        en: 'Short and engaging description of the destination.',
    },
    'admin.destinationForm.mediaHelp': {
        fr: 'Images principale et galerie pour illustrer la destination.',
        ar: 'الصورة الرئيسية والمعرض لتوضيح الوجهة.',
        en: 'Main image and gallery to illustrate the destination.',
    },
    'admin.destinationForm.highlightsHelp': {
        fr: 'Ajoutez les points forts de la destination.',
        ar: 'أضف أبرز معالم الوجهة.',
        en: 'Add destination highlights.',
    },
    'admin.airlinePlaceholder': {
        fr: 'p.ex. Emirates',
        ar: 'مثلاً: طيران الإمارات',
        en: 'e.g. Emirates',
    },
    'admin.toPlaceholder': {
        fr: 'p.ex. Dubaï, EAU',
        ar: 'مثلاً: دبي، الإمارات',
        en: 'e.g. Dubai, UAE',
    },
    'admin.priceCurrency': {
        fr: 'Prix (TND)',
        ar: 'السعر (بالدينار)',
        en: 'Price (TND)',
    },
    'admin.pricePlaceholder': { fr: '0.00', ar: '0.00', en: '0.00' },
    'admin.datePlaceholder': {
        fr: 'Choisir une date',
        ar: 'اختر تاريخاً',
        en: 'Pick a date',
    },
    'admin.codePlaceholder': {
        fr: 'p.ex. EK-204',
        ar: 'مثلاً: EK-204',
        en: 'e.g. EK-204',
    },
    'admin.fromPlaceholder': {
        fr: 'p.ex. LHR',
        ar: 'مثلاً: LHR',
        en: 'e.g. LHR',
    },
    'admin.destinationForm.images': {
        fr: 'Images de la destination',
        ar: 'صور الوجهة',
        en: 'Destination images',
    },
    'label.aircraftPlaceholder': {
        fr: 'p.ex. Airbus A380',
        ar: 'مثلاً: إيرباص A380',
        en: 'e.g. Airbus A380',
    },
    'label.cabinPlaceholder': {
        fr: 'p.ex. Business',
        ar: 'مثلاً: درجة رجال الأعمال',
        en: 'e.g. Business',
    },
    'admin.destinationForm.descriptionPlaceholder': {
        fr: 'Décrivez la destination en quelques phrases',
        ar: 'صف الوجهة في بضع جمل',
        en: 'Describe the destination in a few sentences',
    },
    'admin.destinationForm.aboutPlaceholder': {
        fr: 'Informations complémentaires, conseils ou contexte',
        ar: 'معلومات إضافية أو نصائح أو سياق',
        en: 'Extra details, tips, or context',
    },

    'admin.hotels': HOTELS,
    'admin.tours': TOURS,
    'admin.bookings': { fr: 'Réservations', ar: 'الحجوزات', en: 'Bookings' },
    'admin.users': { fr: 'Utilisateurs', ar: 'المستخدمون', en: 'Users' },
    'admin.reports': { fr: 'Rapports', ar: 'التقارير', en: 'Reports' },
    'admin.signOut': SIGN_OUT,
    'admin.dashboard': {
        fr: 'Tableau de bord Admin',
        ar: 'لوحة تحكم الإدارة',
        en: 'Admin Dashboard',
    },
    'admin.manage': {
        fr: 'Gérez votre agence de voyage',
        ar: 'أدر وكالة السفر الخاصة بك',
        en: 'Manage your travel agency',
    },
    'admin.revenueOverview': {
        fr: 'Aperçu des Revenus',
        ar: 'نظرة عامة على الإيرادات',
        en: 'Revenue Overview',
    },
    'admin.recentBookings': {
        fr: 'Réservations Récentes',
        ar: 'الحجوزات الأخيرة',
        en: 'Recent Bookings',
    },
    'admin.totalRevenue': {
        fr: 'Revenus Totaux',
        ar: 'إجمالي الإيرادات',
        en: 'Total Revenue',
    },
    'admin.totalBookings': {
        fr: 'Réservations Totales',
        ar: 'إجمالي الحجوزات',
        en: 'Total Bookings',
    },
    'admin.activeUsers': {
        fr: 'Utilisateurs Actifs',
        ar: 'المستخدمون النشطون',
        en: 'Active Users',
    },
    'admin.destinationsStat': DESTINATIONS,
    'admin.id': { fr: 'ID', ar: 'المعرف', en: 'ID' },
    'admin.client': CLIENT,
    'admin.item': { fr: 'Élément', ar: 'العنصر', en: 'Item' },
    'admin.amount': { fr: 'Montant', ar: 'المبلغ', en: 'Amount' },
    'admin.status': { fr: 'Statut', ar: 'الحالة', en: 'Status' },
    'admin.technicalInfoHint': {
        fr: 'Affichez les détails techniques de ce vol dans les cartes de résultats de recherche et les détails du vol.',
        ar: 'اعرض التفاصيل الفنية لهذه الرحلة في بطاقات نتائج البحث وتفاصيل الرحلة.',
        en: 'Show the technical details of this flight in search result cards and flight details.',
    },
    // Client Dashboard
    'client.welcome': {
        fr: 'Bienvenue',
        ar: 'مرحباً',
        en: 'Welcome',
    },
    'client.overview': {
        fr: 'Voici votre aperçu de voyage',
        ar: 'إليك ملخص رحلتك',
        en: "Here's your travel overview",
    },
    'client.upcomingTrips': {
        fr: 'Voyages à venir',
        ar: 'الرحلات القادمة',
        en: 'Upcoming Trips',
    },
    'client.unreadNotifications': {
        fr: 'Messages non lus',
        ar: 'رسائل غير مقروءة',
        en: 'Unread Messages',
    },
    'client.totalBookings': {
        fr: 'Réservations totales',
        ar: 'إجمالي الحجوزات',
        en: 'Total Bookings',
    },
    'client.rewardsPoints': {
        fr: 'Points de récompense',
        ar: 'نقاط المكافآت',
        en: 'Rewards Points',
    },
    'client.yourBookings': {
        fr: 'Vos Réservations',
        ar: 'حجوزاتك',
        en: 'Your Bookings',
    },
    'client.recommended': {
        fr: 'Recommandé pour vous',
        ar: 'موصى به لك',
        en: 'Recommended for You',
    },
    'client.signOut': SIGN_OUT,
    'client.myBookings': {
        fr: 'Mes Réservations',
        ar: 'حجوزاتي',
        en: 'My Bookings',
    },
    'client.wishlist': WISHLIST,
    'client.itineraries': ITINERARIES,
    'client.payments': PAYMENTS,
    'client.profile': PROFILE,
    'client.settings': SETTINGS,
    'client.supportSubject': { fr: 'Sujet', ar: 'الموضوع', en: 'Subject' },
    'client.supportSuccess': {
        fr: 'Message envoyé avec succès.',
        ar: 'تم إرسال الرسالة بنجاح.',
        en: 'Message sent successfully.',
    },
    'client.profileUpdated': {
        fr: 'Profil mis à jour.',
        ar: 'تم تحديث الملف الشخصي.',
        en: 'Profile updated.',
    },
    'client.languageUpdated': {
        fr: 'Langue mise à jour.',
        ar: 'تم تحديث اللغة.',
        en: 'Language updated.',
    },
    'client.emptyWishlist': {
        fr: 'Votre liste de souhaits est vide.',
        ar: 'قائمة الرغبات الخاصة بك فارغة.',
        en: 'Your wishlist is empty.',
    },
    'client.exploreNow': {
        fr: 'Explorer maintenant',
        ar: 'استكشف الآن',
        en: 'Explore now',
    },

    // Complaints & Refunds
    'client.complaints': {
        fr: 'Réclamations',
        ar: 'الشكاوى',
        en: 'Complaints',
    },
    'client.newComplaint': {
        fr: 'Nouvelle Réclamation',
        ar: 'شكوى جديدة',
        en: 'New Complaint',
    },
    'client.complaintSubject': {
        fr: 'Sujet de la réclamation',
        ar: 'موضوع الشكوى',
        en: 'Complaint Subject',
    },
    'client.complaintDescription': {
        fr: 'Description de la réclamation',
        ar: 'وصف الشكوى',
        en: 'Complaint Description',
    },
    'client.complaintSuccess': {
        fr: 'Réclamation soumise avec succès.',
        ar: 'تم تقديم الشكوى بنجاح.',
        en: 'Complaint submitted successfully.',
    },
    'client.complaintsEmpty': {
        fr: 'Aucune réclamation pour le moment.',
        ar: 'لا توجد شكاوى حتى الآن.',
        en: 'No complaints yet.',
    },
    'client.refunds': {
        fr: 'Remboursements',
        ar: 'المبالغ المستردة',
        en: 'Refund Requests',
    },
    'client.requestRefund': {
        fr: 'Demander un Remboursement',
        ar: 'طلب استرداد',
        en: 'Request a Refund',
    },
    'client.selectBooking': {
        fr: 'Sélectionner une réservation',
        ar: 'اختر حجزاً',
        en: 'Select a booking',
    },
    'client.refundReason': {
        fr: 'Raison du remboursement',
        ar: 'سبب الاسترداد',
        en: 'Reason for refund',
    },
    'client.refundSuccess': {
        fr: 'Demande de remboursement soumise avec succès.',
        ar: 'تم تقديم طلب الاسترداد بنجاح.',
        en: 'Refund request submitted successfully.',
    },
    'client.refundsEmpty': {
        fr: 'Aucune demande de remboursement.',
        ar: 'لا توجد طلبات استرداد.',
        en: 'No refund requests yet.',
    },
    'client.refundAmount': {
        fr: 'Montant du remboursement',
        ar: 'مبلغ الاسترداد',
        en: 'Refund Amount',
    },
    'client.adminReply': {
        fr: 'Réponse de l\'administrateur',
        ar: 'رد المدير',
        en: 'Admin Reply',
    },
    'client.adminReplySent': {
        fr: 'Réponse envoyée.',
        ar: 'تم إرسال الرد.',
        en: 'Reply sent.',
    },

    // Complaint statuses
    'complaint.status.pending': {
        fr: 'En attente',
        ar: 'قيد الانتظار',
        en: 'Pending',
    },
    'complaint.status.in_review': {
        fr: 'En cours d\'examen',
        ar: 'قيد المراجعة',
        en: 'In Review',
    },
    'complaint.status.resolved': {
        fr: 'Résolu',
        ar: 'تم الحل',
        en: 'Resolved',
    },
    'complaint.status.rejected': {
        fr: 'Rejeté',
        ar: 'مرفوض',
        en: 'Rejected',
    },
    'complaint.status.refunded': {
        fr: 'Remboursé',
        ar: 'تم الاسترداد',
        en: 'Refunded',
    },

    // Complaint types
    'complaint.type.complaint': {
        fr: 'Réclamation',
        ar: 'شكوى',
        en: 'Complaint',
    },
    'complaint.type.refund_request': {
        fr: 'Demande de remboursement',
        ar: 'طلب استرداد',
        en: 'Refund Request',
    },

    // Complaint priorities
    'complaint.priority.low': {
        fr: 'Faible',
        ar: 'منخفضة',
        en: 'Low',
    },
    'complaint.priority.medium': {
        fr: 'Moyen',
        ar: 'متوسطة',
        en: 'Medium',
    },
    'complaint.priority.high': {
        fr: 'Élevé',
        ar: 'عالية',
        en: 'High',
    },

    // Admin complaint labels
    'admin.complaints': {
        fr: 'Réclamations',
        ar: 'الشكاوى',
        en: 'Complaints',
    },
    'admin.complaintManage': {
        fr: 'Gérer les réclamations et remboursements',
        ar: 'إدارة الشكاوى والمبالغ المستردة',
        en: 'Manage complaints and refund requests',
    },

    // Assistant Dashboard
    'assistant.panel': {
        fr: 'Panneau Assistant',
        ar: 'لوحة المساعد',
        en: 'Assistant Panel',
    },
    'assistant.dashboard': {
        fr: 'Tableau de bord Assistant',
        ar: 'لوحة تحكم المساعد',
        en: 'Assistant Dashboard',
    },
    'assistant.manage': {
        fr: 'Gérez les demandes clients et les réservations',
        ar: 'أدر استفسارات العملاء وطلبات الحجز',
        en: 'Manage client inquiries and booking requests',
    },
    'assistant.inquiries': {
        fr: 'Demandes',
        ar: 'الاستفسارات',
        en: 'Inquiries',
    },
    'assistant.bookingRequests': {
        fr: 'Demandes de réservation',
        ar: 'طلبات الحجز',
        en: 'Booking Requests',
    },
    'assistant.clients': { fr: 'Clients', ar: 'العملاء', en: 'Clients' },
    'assistant.settings': SETTINGS,
    'assistant.signOut': SIGN_OUT,
    'assistant.searchInquiries': {
        fr: 'Rechercher des demandes...',
        ar: 'ابحث في الاستفسارات...',
        en: 'Search inquiries...',
    },
    'assistant.send': { fr: 'Envoyer', ar: 'إرسال', en: 'Send' },
    'assistant.pendingRequests': {
        fr: 'Demandes de réservation en attente',
        ar: 'طلبات الحجز المعلقة',
        en: 'Pending Booking Requests',
    },
    'assistant.approve': { fr: 'Approuver', ar: 'موافقة', en: 'Approve' },
    'assistant.reject': { fr: 'Rejeter', ar: 'رفض', en: 'Reject' },
    'assistant.clientManagement': {
        fr: 'Gestion des Clients',
        ar: 'إدارة العملاء',
        en: 'Client Management',
    },
    'assistant.settingsTitle': {
        fr: 'Paramètres Assistant',
        ar: 'إعدادات المساعد',
        en: 'Assistant Settings',
    },

    // Card & Data Labels
    'label.price': { fr: 'Prix', ar: 'السعر', en: 'Price' },
    'label.rating': { fr: 'Note', ar: 'التقييم', en: 'Rating' },
    'label.reviews': { fr: 'avis', ar: 'تقييمات', en: 'reviews' },
    'label.date': { fr: 'Date', ar: 'التاريخ', en: 'Date' },
    'label.location': { fr: 'Localisation', ar: 'الموقع', en: 'Location' },
    'label.duration': { fr: 'Durée', ar: 'المدة', en: 'Duration' },
    'label.baggage': { fr: 'Bagages', ar: 'الأمتعة', en: 'Baggage' },
    'label.maxGroup': {
        fr: 'Max par groupe',
        ar: 'الحد الأقصى بالمجموعة',
        en: 'Max group',
    },
    'label.departing': { fr: 'Départ', ar: 'المغادرة', en: 'Departing' },
    'label.arriving': { fr: 'Arrivée', ar: 'الوصول', en: 'Arriving' },
    'label.wifi': { fr: 'WiFi', ar: 'واي فاي', en: 'WiFi' },
    'label.parking': { fr: 'Parking', ar: 'موقف السيارات', en: 'Parking' },
    'label.breakfast': { fr: 'Petit-déjeuner', ar: 'الإفطار', en: 'Breakfast' },
    'label.trending': { fr: 'Tendance', ar: 'متوجه', en: 'Trending' },
    'label.popular': { fr: 'Populaire', ar: 'شهير', en: 'Popular' },
    'label.romantic': { fr: 'Romantique', ar: 'رومانسي', en: 'Romantic' },
    'label.fullName': {
        fr: 'Nom complet',
        ar: 'الاسم الكامل',
        en: 'Full Name',
    },
    'label.email': { fr: 'E-mail', ar: 'البريد الإلكتروني', en: 'Email' },
    'label.phone': { fr: 'Téléphone', ar: 'الهاتف', en: 'Phone' },
    'label.startDate': {
        fr: 'Date de début',
        ar: 'تاريخ البدء',
        en: 'Start Date',
    },
    'label.endDate': {
        fr: 'Date de fin',
        ar: 'تاريخ الانتهاء',
        en: 'End Date',
    },
    'label.notes': { fr: 'Notes', ar: 'ملاحظات', en: 'Notes' },
    'booking.success': {
        fr: 'Demande de réservation soumise avec succès !',
        ar: 'تم تقديم طلب الحجز بنجاح!',
        en: 'Booking request submitted successfully!',
    },
    'booking.error': {
        fr: 'Échec de la soumission de la demande de réservation.',
        ar: 'فشل في تقديم طلب الحجز.',
        en: 'Failed to submit booking request.',
    },
    'auth.requiredToBook': {
        fr: 'Veuillez vous connecter pour effectuer une réservation.',
        ar: 'يرجى تسجيل الدخول لإجراء حجز.',
        en: 'Please log in to make a booking.',
    },
    'booking.title': { fr: 'Réserver', ar: 'حجز', en: 'Book' },
    'booking.description': {
        fr: 'Remplissez les détails ci-dessous pour demander une réservation.',
        ar: 'املأ التفاصيل أدناه لطلب حجز.',
        en: 'Fill in the details below to request a booking.',
    },
    'booking.notesPlaceholder': {
        fr: 'Des demandes spéciales ?',
        ar: 'أي طلبات خاصة؟',
        en: 'Any special requests?',
    },
    'booking.submit': {
        fr: 'Demander la réservation',
        ar: 'طلب الحجز',
        en: 'Request Booking',
    },
    'common.processing': {
        fr: 'Traitement...',
        ar: 'جاري المعالجة...',
        en: 'Processing...',
    },
    'common.language': { fr: 'Langue', ar: 'اللغة', en: 'Language' },
};

// Payment translations
translations['payment.payNow'] = {
    fr: 'Réserver et Payer',
    ar: 'احجز وادفع',
    en: 'Book & Pay',
};
translations['payment.processing'] = {
    fr: 'Traitement du paiement...',
    ar: 'جاري معالجة الدفع...',
    en: 'Processing payment...',
};
translations['payment.redirecting'] = {
    fr: 'Redirection vers la page de paiement...',
    ar: 'جاري التحويل إلى صفحة الدفع...',
    en: 'Redirecting to payment page...',
};
translations['payment.successTitle'] = {
    fr: 'Paiement Réussi!',
    ar: 'تم الدفع بنجاح!',
    en: 'Payment Successful!',
};
translations['payment.successMessage'] = {
    fr: 'Votre paiement a été traité avec succès. Votre réservation est confirmée.',
    ar: 'تم معالجة دفعك بنجاح. تم تأكيد حجزك.',
    en: 'Your payment has been processed successfully. Your booking is confirmed.',
};
translations['payment.failedTitle'] = {
    fr: 'Paiement Échoué',
    ar: 'فشل الدفع',
    en: 'Payment Failed',
};
translations['payment.failedMessage'] = {
    fr: 'Le paiement n\'a pas pu être traité. Veuillez réessayer depuis votre tableau de bord.',
    ar: 'تعذر معالجة الدفع. يرجى المحاولة مرة أخرى من لوحة التحكم.',
    en: 'Payment could not be processed. Please try again from your dashboard.',
};
translations['payment.errorTitle'] = {
    fr: 'Erreur de Paiement',
    ar: 'خطأ في الدفع',
    en: 'Payment Error',
};
translations['payment.errorMessage'] = {
    fr: 'Une erreur est survenue lors du traitement du paiement.',
    ar: 'حدث خطأ أثناء معالجة الدفع.',
    en: 'An error occurred while processing the payment.',
};
translations['payment.initError'] = {
    fr: 'Échec de l\'initialisation du paiement. Veuillez payer depuis votre tableau de bord.',
    ar: 'فشل تهيئة الدفع. يرجى الدفع من لوحة التحكم.',
    en: 'Payment initiation failed. Please pay from your dashboard.',
};
translations['payment.retryNow'] = {
    fr: 'Réessayer le paiement',
    ar: 'إعادة محاولة الدفع',
    en: 'Retry Payment',
};
translations['client.conversation'] = {
    fr: 'Conversation',
    ar: 'المحادثة',
    en: 'Conversation',
};
translations['client.writeReply'] = {
    fr: 'Écrire une réponse...',
    ar: 'اكتب رد...',
    en: 'Write a reply...',
};
translations['client.replySent'] = {
    fr: 'Réponse envoyée.',
    ar: 'تم إرسال الرد.',
    en: 'Reply sent.',
};
translations['client.you'] = {
    fr: 'Vous',
    ar: 'أنت',
    en: 'You',
};

// app-specific action/notification keys
translations['actions.deleted'] = {
    fr: 'Supprimé',
    ar: 'تم الحذف',
    en: 'Deleted',
};
translations['actions.saved'] = {
    fr: 'Enregistré',
    ar: 'تم الحفظ',
    en: 'Saved',
};
translations['actions.added'] = {
    fr: 'Ajouté',
    ar: 'تمت الإضافة',
    en: 'Added',
};
translations['actions.add'] = {
    fr: 'Ajouter',
    ar: 'إضافة',
    en: 'Add',
};
translations['actions.edit'] = {
    fr: 'Modifier',
    ar: 'تعديل',
    en: 'Edit',
};
translations['actions.delete'] = {
    fr: 'Supprimer',
    ar: 'حذف',
    en: 'Delete',
};
translations['actions.cancel'] = {
    fr: 'Annuler',
    ar: 'إلغاء',
    en: 'Cancel',
};
translations['actions.save'] = {
    fr: 'Enregistrer',
    ar: 'حفظ',
    en: 'Save',
};
translations['actions.select'] = {
    fr: 'Sélectionner',
    ar: 'تحديد',
    en: 'Select',
};
translations['actions.submit'] = {
    fr: 'Soumettre',
    ar: 'إرسال',
    en: 'Submit',
};
translations['actions.resolved'] = {
    fr: 'Résolu',
    ar: 'تم الحل',
    en: 'Resolved',
};
translations['actions.updated'] = {
    fr: 'Mis à jour',
    ar: 'تم التحديث',
    en: 'Updated',
};
translations['admin.actions'] = {
    fr: 'Actions',
    ar: 'الإجراءات',
    en: 'Actions',
};
translations['admin.cars'] = { fr: 'Voitures', ar: 'السيارات', en: 'Cars' };
translations['admin.flights'] = { fr: 'Vols', ar: 'الرحلات', en: 'Flights' };
translations['admin.events'] = {
    fr: 'Événements',
    ar: 'الفعاليات',
    en: 'Events',
};
translations['admin.deals'] = { fr: 'Offres', ar: 'العروض', en: 'Deals' };
translations['admin.promos'] = {
    fr: 'Promos',
    ar: 'العروض الترويجية',
    en: 'Promos',
};
translations['admin.blog'] = { fr: 'Blog', ar: 'المدونة', en: 'Blog' };
translations['admin.siteSettings'] = {
    fr: 'Paramètres du site',
    ar: 'إعدادات الموقع',
    en: 'Site Settings',
};
translations['admin.settings.companyContact'] = {
    fr: 'Entreprise & Contact',
    ar: 'الشركة والتواصل',
    en: 'Company & Contact',
};
translations['admin.settings.headerLinks'] = {
    fr: 'Liens de navigation',
    ar: 'روابط التنقل',
    en: 'Navigation',
};
translations['admin.settings.footerColumns'] = {
    fr: 'Colonnes de pied de page',
    ar: 'أعمدة تذييل الصفحة',
    en: 'Footer',
};
translations['admin.settings.landingVideo'] = {
    fr: "Vidéo d'accueil",
    ar: 'فيديو الصفحة الرئيسية',
    en: 'Landing Video',
};
translations['admin.settings.landingHero'] = {
    fr: "Héros d'accueil",
    ar: 'بطل الصفحة الرئيسية',
    en: 'Landing Hero',
};
translations['admin.heroImages'] = {
    fr: 'Images Héros de Page',
    ar: 'صور البطل للصفحة',
    en: 'Page Hero Images',
};
translations['admin.heroImagesCount'] = {
    fr: '{count} image(s) héros',
    ar: '{count} صورة(صور) بطل',
    en: '{count} hero image(s)',
};
translations['admin.noHeroImages'] = {
    fr: 'Aucune image héros configurée',
    ar: 'لم يتم تكوين صور البطل',
    en: 'No hero images configured',
};
translations['admin.heroInterval'] = {
    fr: 'Intervalle (ms)',
    ar: 'الفاصل (مللي ثانية)',
    en: 'Interval (ms)',
};
translations['admin.heroTitle'] = {
    fr: 'Titre ({lang})',
    ar: 'العنوان ({lang})',
    en: 'Title ({lang})',
};
translations['admin.heroSubtitle'] = {
    fr: 'Sous-titre ({lang})',
    ar: 'العنوان الفرعي ({lang})',
    en: 'Subtitle ({lang})',
};
translations['admin.heroUpload'] = {
    fr: 'Télécharger',
    ar: 'تحميل',
    en: 'Upload',
};
translations['admin.heroAddImage'] = {
    fr: "Ajouter une image héros",
    ar: 'إضافة صورة بطل',
    en: 'Add Hero Image',
};
translations['admin.heroUploadFailed'] = {
    fr: "Échec du téléchargement de l'image",
    ar: 'فشل تحميل الصورة',
    en: 'Failed to upload image',
};
translations['admin.activated'] = { fr: 'activé', ar: 'مفعل', en: 'activated' };
translations['admin.deactivated'] = {
    fr: 'désactivé',
    ar: 'معطل',
    en: 'deactivated',
};
translations['admin.tourUpdated'] = {
    fr: 'Circuit mis à jour',
    ar: 'تم تحديث الجولة',
    en: 'Tour updated',
};
translations['admin.tourAdded'] = {
    fr: 'Circuit ajouté',
    ar: 'تمت إضافة الجولة',
    en: 'Tour added',
};
translations['admin.hotelUpdated'] = {
    fr: 'Hôtel mis à jour',
    ar: 'تم تحديث الفندق',
    en: 'Hotel updated',
};
translations['admin.hotelAdded'] = {
    fr: 'Hôtel ajouté',
    ar: 'تمت إضافة الفندق',
    en: 'Hotel added',
};
translations['admin.destinationUpdated'] = {
    fr: 'Destination mise à jour',
    ar: 'تم تحديث الوجهة',
    en: 'Destination updated',
};
translations['admin.destinationAdded'] = {
    fr: 'Destination ajoutée',
    ar: 'تمت إضافة الوجهة',
    en: 'Destination added',
};
translations['admin.booking'] = {
    fr: 'Réservation',
    ar: 'الحجز',
    en: 'Booking',
};
translations['admin.email'] = {
    fr: 'Email',
    ar: 'البريد الإلكتروني',
    en: 'Email',
};
translations['admin.active'] = { fr: 'Actif', ar: 'نشط', en: 'Active' };
translations['admin.inactive'] = {
    fr: 'Inactif',
    ar: 'غير نشط',
    en: 'Inactive',
};
translations['label.guests'] = {
    fr: 'Voyageurs',
    ar: 'المسافرون',
    en: 'Guests',
};
translations['common.guest'] = { fr: 'Invité', ar: 'ضيف', en: 'Guest' };
translations['favorites.add'] = {
    fr: 'Ajouter aux favoris',
    ar: 'إضافة إلى المفضلة',
    en: 'Add to favorites',
};
translations['favorites.remove'] = {
    fr: 'Retirer des favoris',
    ar: 'إزالة من المفضلة',
    en: 'Remove from favorites',
};
translations['assistant.replySent'] = {
    fr: 'Réponse envoyée',
    ar: 'تم إرسال الرد',
    en: 'Reply sent',
};
translations['assistant.typeReply'] = {
    fr: 'Écrivez votre réponse...',
    ar: 'اكتب ردك...',
    en: 'Type your reply...',
};
translations['assistant.resolve'] = {
    fr: 'Marquer résolu',
    ar: 'تحديد كمحلول',
    en: 'Mark resolved',
};
translations['assistant.availability'] = {
    fr: 'Disponibilité',
    ar: 'التوفر',
    en: 'Availability',
};
translations['assistant.available'] = {
    fr: 'Disponible',
    ar: 'متاح',
    en: 'Available',
};
translations['assistant.unavailable'] = {
    fr: 'Indisponible',
    ar: 'غير متاح',
    en: 'Unavailable',
};
translations['auth.welcomeAdmin'] = {
    fr: 'Bienvenue, Admin!',
    ar: 'مرحبًا، المسؤول!',
    en: 'Welcome back, Admin!',
};
translations['auth.welcomeAssistant'] = {
    fr: 'Bienvenue, Assistant!',
    ar: 'مرحبًا، المساعد!',
    en: 'Welcome back, Assistant!',
};
translations['auth.unauthorizedTitle'] = {
    fr: 'Acces refuse',
    ar: 'غير مصرح',
    en: 'Unauthorized',
};
translations['auth.unauthorizedDesc'] = {
    fr: "Vous n'avez pas les droits necessaires pour ouvrir cette page.",
    ar: 'ليست لديك الصلاحية لفتح هذه الصفحة.',
    en: 'You do not have permission to open this page.',
};
translations['notifications.title'] = {
    fr: 'Notifications',
    ar: 'الإشعارات',
    en: 'Notifications',
};
translations['notifications.adminPanel'] = {
    fr: 'Notifications Admin',
    ar: 'إشعارات المسؤول',
    en: 'Admin notifications',
};
translations['notifications.assistantPanel'] = {
    fr: 'Notifications Assistant',
    ar: 'إشعارات المساعد',
    en: 'Assistant notifications',
};
translations['notifications.yourNotifications'] = {
    fr: 'Vos notifications',
    ar: 'إشعاراتك',
    en: 'Your notifications',
};
translations['notifications.unread'] = {
    fr: 'non lue(s)',
    ar: 'غير مقروءة',
    en: 'unread',
};
translations['notifications.allCaughtUp'] = {
    fr: 'tout est à jour',
    ar: 'كل شيء محدث',
    en: 'all caught up',
};
translations['notifications.markAllRead'] = {
    fr: 'Tout marquer comme lu',
    ar: 'تحديد الكل كمقروء',
    en: 'Mark all read',
};
translations['notifications.clear'] = {
    fr: 'Effacer',
    ar: 'مسح',
    en: 'Clear',
};
translations['notifications.empty'] = {
    fr: 'Aucune notification à afficher',
    ar: 'لا توجد إشعارات لعرضها',
    en: 'No notifications to show',
};
translations['notifications.markAsRead'] = {
    fr: 'Marquer comme lu',
    ar: 'تحديد كمقروء',
    en: 'Mark as read',
};
translations['notifications.viewAll'] = {
    fr: 'Voir tout',
    ar: 'عرض الكل',
    en: 'View all',
};
translations['notifications.filter.all'] = {
    fr: 'Tout',
    ar: 'الكل',
    en: 'All',
};
translations['notifications.filter.unread'] = {
    fr: 'Non lues',
    ar: 'غير المقروءة',
    en: 'Unread',
};
translations['notifications.type.booking'] = {
    fr: 'Réservation',
    ar: 'حجز',
    en: 'Booking',
};
translations['notifications.type.payment'] = {
    fr: 'Paiement',
    ar: 'دفع',
    en: 'Payment',
};
translations['notifications.type.deal'] = {
    fr: 'Offre',
    ar: 'عرض',
    en: 'Deal',
};
translations['notifications.type.alert'] = {
    fr: 'Alerte',
    ar: 'تنبيه',
    en: 'Alert',
};
translations['notifications.type.flight'] = {
    fr: 'Vol',
    ar: 'رحلة',
    en: 'Flight',
};
translations['notifications.type.hotel'] = {
    fr: 'Hôtel',
    ar: 'فندق',
    en: 'Hotel',
};
translations['notifications.type.user'] = {
    fr: 'Utilisateur',
    ar: 'مستخدم',
    en: 'User',
};
translations['notifications.type.system'] = {
    fr: 'Système',
    ar: 'نظام',
    en: 'System',
};
translations['notifications.type.inquiry'] = {
    fr: 'Demande',
    ar: 'استفسار',
    en: 'Inquiry',
};
translations['notifications.type.revenue'] = {
    fr: 'Revenu',
    ar: 'دخل',
    en: 'Revenue',
};
translations['notifications.type.review'] = {
    fr: 'Avis',
    ar: 'تقييم',
    en: 'Review',
};
translations['actions.back'] = {
    fr: 'Retour',
    ar: 'رجوع',
    en: 'Back',
};
translations['client.noBookings'] = {
    fr: 'Aucune reservation pour le moment.',
    ar: 'لا توجد حجوزات حاليا.',
    en: 'No bookings yet.',
};
translations['client.noPayments'] = {
    fr: 'Aucun paiement pour le moment.',
    ar: 'لا توجد مدفوعات حاليا.',
    en: 'No payments yet.',
};
translations['client.support'] = {
    fr: 'Support',
    ar: 'الدعم',
    en: 'Support',
};
translations['admin.settings.reset'] = {
    fr: 'Réinitialiser',
    ar: 'إعادة تعيين',
    en: 'Reset',
};
translations['admin.settings.save'] = {
    fr: 'Enregistrer',
    ar: 'حفظ',
    en: 'Save',
};
translations['admin.settings.companyContact'] = {
    fr: 'Entreprise & contact',
    ar: 'الشركة والتواصل',
    en: 'Company & contact',
};
translations['admin.settings.brandIdentity'] = {
    fr: 'Gardez votre identité de marque...',
    ar: 'حافظ على هوية علامتك التجارية...',
    en: 'Keep your brand identity...',
};
translations['admin.settings.companyInfo'] = {
    fr: 'Infos entreprise',
    ar: 'معلومات الشركة',
    en: 'Company info',
};
translations['admin.settings.companyName'] = {
    fr: 'Nom entreprise',
    ar: 'اسم الشركة',
    en: 'Company name',
};
translations['admin.settings.address'] = {
    fr: 'Adresse',
    ar: 'العنوان',
    en: 'Address',
};
translations['admin.settings.plusCode'] = {
    fr: 'Plus Code (map)',
    ar: 'رمز الخريطة',
    en: 'Plus Code for map',
};
translations['admin.settings.year'] = { fr: 'Année', ar: 'السنة', en: 'Year' };
translations['admin.settings.contactDetails'] = {
    fr: 'Détails de contact',
    ar: 'تفاصيل الاتصال',
    en: 'Contact details',
};
translations['admin.settings.email'] = {
    fr: 'E-mail',
    ar: 'البريد الإلكتروني',
    en: 'Email',
};
translations['admin.settings.phone'] = {
    fr: 'Téléphone',
    ar: 'الهاتف',
    en: 'Phone',
};
translations['admin.settings.phone2'] = {
    fr: 'Téléphone 2',
    ar: 'الهاتف 2',
    en: 'Phone 2',
};
translations['admin.settings.whatsapp'] = {
    fr: 'WhatsApp',
    ar: 'واتساب',
    en: 'WhatsApp',
};
translations['admin.settings.socialMedia'] = {
    fr: 'Réseaux sociaux',
    ar: 'وسائل التواصل',
    en: 'Social media',
};
translations['admin.settings.addLink'] = {
    fr: 'Ajouter un lien',
    ar: 'إضافة رابط',
    en: 'Add link',
};
translations['admin.tourForm.namePlaceholder'] = {
    fr: 'p. ex. Tour au coucher du soleil à Bali',
    ar: 'مثلاً: جولة غروب الشمس في بالي',
    en: 'e.g. Bali Sunset Tour',
};
translations['admin.tourForm.locationPlaceholder'] = {
    fr: 'p. ex. Bali, Indonésie',
    ar: 'مثلاً: بالي، إندونيسيا',
    en: 'e.g. Bali, Indonesia',
};
translations['admin.tourForm.durationPlaceholder'] = {
    fr: 'p. ex. 5 jours / 4 nuits',
    ar: 'مثلاً: 5 أيام / 4 ليالٍ',
    en: 'e.g. 5 days / 4 nights',
};
translations['admin.tourForm.descriptionPlaceholder'] = {
    fr: 'Décrivez les points forts, le rythme et les expériences uniques du circuit...',
    ar: 'صف أبرز معالم الجولة وإيقاعها والتجارب الفريدة...',
    en: 'Describe the tour highlights, pace, and unique experiences...',
};
translations['admin.tourForm.pricePlaceholder'] = {
    fr: 'p. ex. 500',
    ar: 'مثلاً: 500',
    en: 'e.g. 500',
};
translations['admin.tourForm.durationDaysPlaceholder'] = {
    fr: 'p. ex. 5',
    ar: 'مثلاً: 5',
    en: 'e.g. 5',
};
translations['admin.tourForm.maxGroupPlaceholder'] = {
    fr: 'p. ex. 12',
    ar: 'مثلاً: 12',
    en: 'e.g. 12',
};
translations['admin.invalidPrice'] = {
    fr: 'Prix invalide',
    ar: 'سعر غير صالح',
    en: 'Invalid price',
};
translations['admin.invalidDays'] = {
    fr: 'Nombre de jours invalide',
    ar: 'عدد أيام غير صالح',
    en: 'Invalid number of days',
};
translations['admin.invalidGroup'] = {
    fr: 'Taille de groupe invalide',
    ar: 'حجم مجموعة غير صالح',
    en: 'Invalid group size',
};
translations['admin.settings.businessHours'] = {
    fr: 'Horaires d’ouverture',
    ar: 'ساعات العمل',
    en: 'Business hours',
};
translations['admin.settings.addRow'] = {
    fr: 'Ajouter une ligne',
    ar: 'إضافة صف',
    en: 'Add row',
};
translations['admin.settings.day'] = { fr: 'Jour', ar: 'اليوم', en: 'Day' };
translations['admin.settings.hours'] = {
    fr: 'Heures',
    ar: 'الساعات',
    en: 'Hours',
};
translations['admin.settings.addTimeRange'] = {
    fr: 'Ajouter un créneau',
    ar: 'إضافة فترة زمنية',
    en: 'Add time range',
};
translations['admin.settings.closed'] = {
    fr: 'Fermé',
    ar: 'مغلق',
    en: 'Closed',
};
translations['admin.settings.openingHoursHelp'] = {
    fr: 'Choisissez un jour et ajoutez un ou plusieurs créneaux horaires.',
    ar: 'اختر يوماً وأضف فترة زمنية واحدة أو أكثر.',
    en: 'Choose a day and add one or more time ranges.',
};
translations['admin.settings.noHours'] = {
    fr: 'Aucun horaire pour le moment.',
    ar: 'لا توجد ساعات عمل بعد.',
    en: 'No opening hours yet.',
};
translations['admin.settings.headerLinks'] = {
    fr: 'Liens d’en-tête',
    ar: 'روابط الترويسة',
    en: 'Header links',
};
translations['admin.settings.reorder'] = {
    fr: 'Glissez les lignes pour réordonner',
    ar: 'اسحب الصفوف لإعادة الترتيب',
    en: 'Drag rows to reorder...',
};
translations['admin.settings.placement'] = {
    fr: 'Emplacement',
    ar: 'الموقع',
    en: 'Placement',
};
translations['admin.settings.dropdown'] = {
    fr: 'Menu déroulant',
    ar: 'قائمة منسدلة',
    en: 'Dropdown',
};
translations['admin.settings.enabled'] = {
    fr: 'Activé',
    ar: 'مفعّل',
    en: 'Enabled',
};
translations['admin_settings_triggerLinks'] = {
    fr: 'Déclencher des liens vers la page',
    ar: 'تفعيل الروابط للصفحة',
    en: 'Trigger links to page',
};
translations['admin_settings_mode'] = {
    fr: 'Mode',
    ar: 'الوضع',
    en: 'Mode',
};
translations['admin_settings_select_category'] = {
    fr: 'Sélectionner une catégorie',
    ar: 'اختر فئة',
    en: 'Select category',
};
translations['admin_settings_label'] = {
    fr: 'Libellé',
    ar: 'العنوان',
    en: 'Label',
};
translations['admin.settings.addItem'] = {
    fr: 'Ajouter un élément',
    ar: 'إضافة عنصر',
    en: 'Add item',
};
translations['admin.settings.footerColumns'] = {
    fr: 'Colonnes de pied de page',
    ar: 'أعمدة التذييل',
    en: 'Footer columns',
};
translations['admin.settings.columnTitle'] = {
    fr: 'Titre de colonne',
    ar: 'عنوان العمود',
    en: 'Column title',
};
translations['admin.settings.topBar'] = {
    fr: 'Barre du haut',
    ar: 'الشريط العلوي',
    en: 'Top bar',
};
translations['admin.settings.filter'] = {
    fr: 'Filtre',
    ar: 'فلتر',
    en: 'Filter',
};
translations['admin.settings.dynamicCategories'] = {
    fr: 'Catégories dynamiques',
    ar: 'فئات ديناميكية',
    en: 'Dynamic Categories',
};
translations['admin.settings.searchKeyword'] = {
    fr: 'Mot-clé de recherche',
    ar: 'كلمة بحث',
    en: 'Search keyword',
};
translations['admin.settings.categoryType'] = {
    fr: 'Type de catégorie',
    ar: 'نوع الفئة',
    en: 'Category Type',
};
translations['admin.settings.selectCategoryType'] = {
    fr: 'Sélectionner un type de catégorie',
    ar: 'اختر نوع الفئة',
    en: 'Select a category type',
};
translations['admin.settings.category'] = {
    fr: 'Catégorie',
    ar: 'فئة',
    en: 'Category',
};
translations['admin.settings.addSubItem'] = {
    fr: 'Ajouter un sous-élément',
    ar: 'إضافة عنصر فرعي',
    en: 'Add sub-item',
};
translations['admin.settings.provideTranslations'] = {
    fr: 'Fournir les traductions',
    ar: 'أدخل الترجمات',
    en: 'Provide translations',
};
translations['admin.settings.addPage'] = {
    fr: 'Ajouter une page',
    ar: 'إضافة صفحة',
    en: 'Add a page',
};
translations['admin.settings.selectPageToAdd'] = {
    fr: 'Sélectionner une page à ajouter...',
    ar: 'اختر صفحة للإضافة...',
    en: 'Select a page to add...',
};
translations['admin.settings.noPagesAdded'] = {
    fr: "Aucune page ajoutée. Utilisez le menu ci-dessus pour ajouter des pages.",
    ar: 'لم تتم إضافة أي صفحة. استخدم القائمة أعلاه لإضافة الصفحات.',
    en: 'No pages added yet. Use the dropdown above to add pages.',
};
translations['admin.settings.topbarPlacement'] = {
    fr: 'Barre supérieure',
    ar: 'الشريط العلوي',
    en: 'Top bar (upper)',
};
translations['admin.settings.mainNav'] = {
    fr: 'Navigation principale',
    ar: 'التنقل الرئيسي',
    en: 'Main nav',
};
translations['admin.settings.plusMore'] = {
    fr: '+ Plus',
    ar: '+ المزيد',
    en: '+ More',
};
translations['admin.settings.removePage'] = {
    fr: 'Supprimer la page',
    ar: 'إزالة الصفحة',
    en: 'Remove page',
};
translations['admin.settings.dropdownItems'] = {
    fr: 'Éléments du menu déroulant',
    ar: 'عناصر القائمة المنسدلة',
    en: 'Dropdown items',
};
translations['admin.settings.noItemsYet'] = {
    fr: 'Aucun élément pour le moment',
    ar: 'لا توجد عناصر بعد',
    en: 'No items yet',
};
translations['admin.settings.placeholder.companyName'] = {
    fr: 'BelAzur Travel',
    ar: 'بل أزور للسفر',
    en: 'BelAzur Travel',
};
translations['admin.settings.placeholder.address'] = {
    fr: 'Ville, pays',
    ar: 'المدينة، الدولة',
    en: 'City, country',
};
translations['admin.settings.placeholder.plusCode'] = {
    fr: '8FVC9G8F+5V',
    ar: '8FVC9G8F+5V',
    en: '8FVC9G8F+5V',
};
translations['admin.settings.placeholder.email'] = {
    fr: 'contact@belazurtravel.com',
    ar: 'contact@belazurtravel.com',
    en: 'contact@belazurtravel.com',
};
translations['admin.settings.placeholder.phone'] = {
    fr: '+216 23 777 771',
    ar: '+216 23 777 771',
    en: '+216 23 777 771',
};
translations['admin.settings.placeholder.phone2'] = {
    fr: '+216 71 123 456',
    ar: '+216 71 123 456',
    en: '+216 71 123 456',
};
translations['admin.settings.placeholder.whatsapp'] = {
    fr: '21623777771',
    ar: '21623777771',
    en: '21623777771',
};
translations['admin.settings.placeholder.titleEN'] = {
    fr: 'Titre (EN)',
    ar: 'العنوان (EN)',
    en: 'Title (EN)',
};
translations['admin.settings.placeholder.titleFR'] = {
    fr: 'Titre (FR)',
    ar: 'العنوان (FR)',
    en: 'Title (FR)',
};
translations['admin.settings.add_section'] = {
    fr: 'Ajouter une section',
    ar: 'إضافة قسم',
    en: 'Add Section',
};
translations['admin.settings.no_legal_sections'] = {
    fr: "Aucune section légale pour l'instant. Ajoutez une politique de confidentialité ou des conditions d'utilisation.",
    ar: 'لا توجد أقسام قانونية حتى الآن. أضف سياسة الخصوصية أو شروط الاستخدام.',
    en: 'No legal sections yet. Add Privacy Policy or Terms of Use.',
};
translations['admin.settings.body_format'] = {
    fr: 'Format du corps',
    ar: 'تنسيق الجسم',
    en: 'Body format',
};
translations['admin.settings.body'] = { fr: 'Corps', ar: 'الجسم', en: 'Body' };
translations['admin.settings.title_en'] = {
    fr: 'Titre (EN)',
    ar: 'العنوان (EN)',
    en: 'Title (EN)',
};
translations['admin.settings.title_fr'] = {
    fr: 'Titre (FR)',
    ar: 'العنوان (FR)',
    en: 'Title (FR)',
};
translations['admin.settings.title_ar'] = {
    fr: 'Titre (AR)',
    ar: 'العنوان (AR)',
    en: 'Title (AR)',
};
translations['admin.settings.markdown'] = {
    fr: 'Markdown',
    ar: 'Markdown',
    en: 'Markdown',
};
translations['admin.settings.richtext'] = {
    fr: 'Texte riche',
    ar: 'نص منسق',
    en: 'Rich text',
};
translations['admin.settings.preview'] = {
    fr: 'Aperçu',
    ar: 'معاينة',
    en: 'Preview',
};
translations['admin.settings.edit'] = {
    fr: 'Modifier',
    ar: 'تحرير',
    en: 'Edit',
};
translations['client.supportMessage'] = {
    fr: 'Votre message',
    ar: 'رسالتك',
    en: 'Your message',
};

translations['admin.noItemsYet'] = {
    fr: 'Aucun élément ajouté pour le moment.',
    ar: 'لم تتم إضافة أي عناصر بعد.',
    en: 'No items added yet.',
};
translations['admin.noGalleryImages'] = {
    fr: 'Aucune image dans la galerie pour le moment.',
    ar: 'لا توجد صور في المعرض بعد.',
    en: 'No gallery images yet.',
};
translations['admin.addImagesHint'] = {
    fr: 'Ajoutez une ou plusieurs images depuis votre appareil.',
    ar: 'أضف صورة واحدة أو أكثر من جهازك.',
    en: 'Add one or more images from your device.',
};
translations['admin.fieldRequired'] = {
    fr: 'Ce champ est requis.',
    ar: 'هذا الحقل مطلوب.',
    en: 'This field is required.',
};
translations['admin.pleaseFixErrors'] = {
    fr: 'Veuillez corriger les erreurs avant de continuer.',
    ar: 'يرجى تصحيح الأخطاء قبل المتابعة.',
    en: 'Please fix the errors before continuing.',
};
translations['admin.selectedImages'] = {
    fr: 'Images sélectionnées',
    ar: 'الصور المحددة',
    en: 'Selected images',
};

export function t(key: string, lang: Lang): string {
    const entry = translations[key];
    if (!entry) return key;
    return entry[lang] || key;
}

translations['admin.hotelForm.namePlaceholder'] = {
    fr: 'Ex. : Burj Al Arab',
    ar: 'مثال: برج العرب',
    en: 'e.g. Burj Al Arab',
};
translations['admin.hotelForm.nameHelp'] = {
    fr: 'Nom commercial complet de l’hôtel.',
    ar: 'الاسم التجاري الكامل للفندق.',
    en: 'Full commercial name of the hotel.',
};
translations['admin.hotelForm.locationPlaceholder'] = {
    fr: 'Ex. : Dubaï, EAU',
    ar: 'مثال: دبي، الإمارات العربية المتحدة',
    en: 'e.g. Dubai, UAE',
};
translations['admin.hotelForm.locationHelp'] = {
    fr: 'Région géographique ou quartier.',
    ar: 'المنطقة الجغرافية أو الحي.',
    en: 'Geographic region or neighborhood.',
};
translations['admin.hotelForm.categoryHelp'] = {
    fr: 'Sélectionnez la catégorie.',
    ar: 'اختر فئة المنشأة.',
    en: 'Select the property class.',
};
translations['admin.hotelForm.cityPlaceholder'] = {
    fr: 'Ex. : Dubaï',
    ar: 'مثال: دبي',
    en: 'e.g. Dubai',
};
translations['admin.hotelForm.countryPlaceholder'] = {
    fr: 'Ex. : Émirats arabes unis',
    ar: 'مثال: الإمارات العربية المتحدة',
    en: 'e.g. United Arab Emirates',
};
translations['admin.hotelForm.pricePlaceholder'] = {
    fr: 'Ex. : 250',
    ar: 'مثال: 250',
    en: 'e.g. 250',
};
translations['admin.hotelForm.priceHelp'] = {
    fr: 'Prix de base par nuit en TND.',
    ar: 'السعر الأساسي لكل ليلة بالدينار التونسي.',
    en: 'Base price per night in TND.',
};
translations['admin.hotelForm.ratingPlaceholder'] = {
    fr: 'Ex. : 4.8',
    ar: 'مثال: 4.8',
    en: 'e.g. 4.8',
};
translations['admin.hotelForm.ratingHelp'] = {
    fr: 'Note utilisateur (1-5).',
    ar: 'تقييم المستخدم (1-5).',
    en: 'User rating (1-5).',
};
translations['admin.hotelForm.slugPlaceholder'] = {
    fr: 'Ex. : dubai',
    ar: 'مثال: dubai',
    en: 'e.g. dubai',
};
translations['admin.hotelForm.slugHelp'] = {
    fr: 'Slug URL de la destination.',
    ar: 'مُعرّف الرابط للوجهة التي ينتمي إليها هذا الفندق.',
    en: 'The URL slug for the destination this hotel belongs to.',
};
translations['admin.hotelForm.starsPlaceholder'] = {
    fr: 'Ex. : 5',
    ar: 'مثال: 5',
    en: 'e.g. 5',
};
translations['admin.hotelForm.starsHelp'] = {
    fr: 'Nombre d’étoiles.',
    ar: 'تصنيف الفندق بالنجوم.',
    en: 'Hotel star rating.',
};
translations['admin.hotelForm.reviewsPlaceholder'] = {
    fr: 'Ex. : 150',
    ar: 'مثال: 150',
    en: 'e.g. 150',
};
translations['admin.hotelForm.reviewsHelp'] = {
    fr: 'Nombre total d’avis.',
    ar: 'إجمالي عدد المراجعات.',
    en: 'Total number of reviews.',
};
translations['admin.hotelForm.coreDetails'] = {
    fr: 'Détails de l’hôtel',
    ar: 'تفاصيل الفندق',
    en: 'Hotel details',
};
translations['admin.hotelForm.coreDetailsHint'] = {
    fr: 'Gérez les informations de base de l’hôtel.',
    ar: 'إدارة المعلومات الأساسية للفندق.',
    en: 'Manage core hotel information.',
};
translations['admin.hotelForm.pricing'] = {
    fr: 'Tarification et structure',
    ar: 'التسعير والبنية',
    en: 'Pricing and structure',
};
translations['admin.hotelForm.media'] = {
    fr: 'Médias',
    ar: 'الوسائط',
    en: 'Media',
};
translations['admin.hotelForm.mediaHint'] = {
    fr: 'Images et listes d\'équipements.',
    ar: 'الصور وقوائم المرافق.',
    en: 'Images and amenity lists.',
};

// Category Type Manager translations
translations['admin.categoryTypeManager.title'] = {
    fr: 'Gérer les types de catégories',
    ar: 'إدارة أنواع الفئات',
    en: 'Manage Category Types',
};
translations['admin.categoryTypeManager.valuesTitle'] = {
    fr: 'Gérer les valeurs de',
    ar: 'إدارة قيم',
    en: 'Manage',
};
translations['admin.categoryTypeManager.valuesTitleSuffix'] = {
    fr: 'valeurs',
    ar: 'قيم',
    en: 'Values',
};
translations['admin.categoryTypeManager.addType'] = {
    fr: 'Ajouter un type de catégorie',
    ar: 'إضافة نوع فئة',
    en: 'Add Category Type',
};
translations['admin.categoryTypeManager.createType'] = {
    fr: 'Créer le type',
    ar: 'إنشاء النوع',
    en: 'Create Type',
};
translations['admin.categoryTypeManager.addValue'] = {
    fr: 'Ajouter une valeur',
    ar: 'إضافة قيمة',
    en: 'Add Value',
};
translations['admin.categoryTypeManager.addValueBtn'] = {
    fr: 'Ajouter une valeur',
    ar: 'إضافة قيمة',
    en: 'Add Value',
};
translations['admin.categoryTypeManager.backToTypes'] = {
    fr: 'Retour aux types',
    ar: 'العودة للأنواع',
    en: 'Back to Types',
};
translations['admin.categoryTypeManager.done'] = {
    fr: 'Terminé',
    ar: 'تم',
    en: 'Done',
};
translations['admin.categoryTypeManager.deleteTitle'] = {
    fr: 'Supprimer ?',
    ar: 'حذف؟',
    en: 'Delete?',
};
translations['admin.categoryTypeManager.deleteAnyway'] = {
    fr: 'Supprimer quand même',
    ar: 'حذف على أي حال',
    en: 'Delete Anyway',
};
translations['admin.categoryTypeManager.affectedItems'] = {
    fr: 'Éléments affectés :',
    ar: 'العناصر المتأثرة:',
    en: 'Affected items:',
};
translations['admin.categoryTypeManager.manageValues'] = {
    fr: 'Gérer les valeurs',
    ar: 'إدارة القيم',
    en: 'Manage values',
};
translations['admin.categoryTypeManager.valueCount'] = {
    fr: 'valeur(s)',
    ar: 'قيمة(قيم)',
    en: 'value(s)',
};
translations['admin.categoryTypeManager.langEnglish'] = {
    fr: 'Anglais',
    ar: 'الإنجليزية',
    en: 'English',
};
translations['admin.categoryTypeManager.langFrench'] = {
    fr: 'Français',
    ar: 'الفرنسية',
    en: 'French',
};
translations['admin.categoryTypeManager.langArabic'] = {
    fr: 'Arabe',
    ar: 'العربية',
    en: 'Arabic',
};
translations['admin.categoryTypeManager.errorLoad'] = {
    fr: 'Échec du chargement des types de catégories',
    ar: 'فشل تحميل أنواع الفئات',
    en: 'Failed to load category types',
};
translations['admin.categoryTypeManager.errorCreate'] = {
    fr: 'Échec de la création du type de catégorie',
    ar: 'فشل إنشاء نوع الفئة',
    en: 'Failed to create category type',
};
translations['admin.categoryTypeManager.errorUpdate'] = {
    fr: 'Échec de la mise à jour du type de catégorie',
    ar: 'فشل تحديث نوع الفئة',
    en: 'Failed to update category type',
};
translations['admin.categoryTypeManager.errorDelete'] = {
    fr: 'Échec de la suppression du type de catégorie',
    ar: 'فشل حذف نوع الفئة',
    en: 'Failed to delete category type',
};
translations['admin.categoryTypeManager.errorAddValue'] = {
    fr: 'Échec de l\'ajout de la valeur',
    ar: 'فشل إضافة القيمة',
    en: 'Failed to add value',
};
translations['admin.categoryTypeManager.errorUpdateValue'] = {
    fr: 'Échec de la mise à jour de la valeur',
    ar: 'فشل تحديث القيمة',
    en: 'Failed to update value',
};
translations['admin.categoryTypeManager.errorDeleteValue'] = {
    fr: 'Échec de la suppression de la valeur',
    ar: 'فشل حذف القيمة',
    en: 'Failed to delete value',
};
translations['admin.categoryTypeManager.successTypeCreated'] = {
    fr: 'Type de catégorie créé',
    ar: 'تم إنشاء نوع الفئة',
    en: 'Category type created',
};
translations['admin.categoryTypeManager.successTypeUpdated'] = {
    fr: 'Type de catégorie mis à jour',
    ar: 'تم تحديث نوع الفئة',
    en: 'Category type updated',
};
translations['admin.categoryTypeManager.successTypeDeleted'] = {
    fr: 'Type de catégorie supprimé',
    ar: 'تم حذف نوع الفئة',
    en: 'Category type deleted',
};
translations['admin.categoryTypeManager.successValueAdded'] = {
    fr: 'Valeur ajoutée',
    ar: 'تمت إضافة القيمة',
    en: 'Value added',
};
translations['admin.categoryTypeManager.successValueUpdated'] = {
    fr: 'Valeur mise à jour',
    ar: 'تم تحديث القيمة',
    en: 'Value updated',
};
translations['admin.categoryTypeManager.successValueDeleted'] = {
    fr: 'Valeur supprimée',
    ar: 'تم حذف القيمة',
    en: 'Value deleted',
};
translations['admin.categoryTypeManager.validationAllLangs'] = {
    fr: 'Veuillez fournir des traductions dans toutes les langues',
    ar: 'يرجى تقديم الترجمات بجميع اللغات',
    en: 'Please provide translations in all languages',
};

// Filter component translations
translations['filters.clear'] = {
    fr: 'Effacer',
    ar: 'مسح',
    en: 'Clear',
};
translations['filters.selected'] = {
    fr: 'sélectionné(s)',
    ar: 'محدد',
    en: 'selected',
};
translations['filters.all'] = {
    fr: 'Tout',
    ar: 'الكل',
    en: 'All',
};
translations['filters.selectPlaceholder'] = {
    fr: 'Sélectionner',
    ar: 'تحديد',
    en: 'Select',
};

// Filter style names
translations['filters.style.pills'] = {
    fr: 'Boutons pilules',
    ar: 'أزرار حبوب',
    en: 'Pill Buttons',
};
translations['filters.style.checkbox'] = {
    fr: 'Liste à cocher',
    ar: 'قائمة اختيار',
    en: 'Checkbox List',
};
translations['filters.style.dropdown'] = {
    fr: 'Sélection déroulante',
    ar: 'قائمة منسدلة',
    en: 'Dropdown Select',
};
translations['filters.style.slider'] = {
    fr: 'Curseur',
    ar: 'شريط التمرير',
    en: 'Slider',
};
translations['filters.style.radio'] = {
    fr: 'Groupe radio',
    ar: 'مجموعة أزرار الراديو',
    en: 'Radio Group',
};
translations['filters.style.colors'] = {
    fr: 'Échantillons de couleurs',
    ar: 'عينات الألوان',
    en: 'Color Swatches',
};

// Admin filter config
translations['admin.settings.filterStyle'] = {
    fr: 'Style de filtre',
    ar: 'نمط الفلتر',
    en: 'Filter Style',
};
translations['admin.settings.preview'] = {
    fr: 'Aperçu',
    ar: 'معاينة',
    en: 'Preview',
};
translations['admin.settings.color'] = {
    fr: 'Couleur',
    ar: 'لون',
    en: 'Color',
};
