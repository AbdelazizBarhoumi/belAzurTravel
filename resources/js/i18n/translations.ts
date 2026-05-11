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
const ALL = tr('Tout', 'الكل', 'All');
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
    'nav.contact': { fr: 'Contact', ar: 'اتصل بنا', en: 'Contact Us' },
    'nav.legal': {
        fr: 'Mentions Légales',
        ar: 'الإشعارات القانونية',
        en: 'Legal',
    },
    'nav.home': { fr: 'Accueil', ar: 'الرئيسية', en: 'Home' },
    'nav.signin': { fr: 'Connexion', ar: 'تسجيل الدخول', en: 'Sign in' },
    'nav.start': { fr: 'Commencer', ar: 'ابدأ', en: 'Get Started' },
    'nav.favorites': { fr: 'Favoris', ar: 'المفضلة', en: 'Favorites' },

    // Categories
    'cat.beach': { fr: 'Plage', ar: 'شاطئ', en: 'Beach' },
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
    'hero.guests': { fr: 'Voyageurs', ar: 'المسافرون', en: 'Guests' },
    'hero.search': { fr: 'Rechercher', ar: 'بحث', en: 'Search' },
    'hero.description': {
        fr: 'Des voyages artisanaux vers les destinations les plus extraordinaires du monde. Laissez-nous transformer vos rêves de voyage en souvenirs inoubliables.',
        ar: 'رحلات حرفية إلى أكثر الوجهات روعة في العالم. دعنا نحول أحلام رحلتك إلى ذكريات لا تُنسى.',
        en: "Handcrafted journeys to the world's most extraordinary destinations. Let us turn your travel dreams into unforgettable memories.",
    },

    // Search Widget
    'search.tabs.hotels': { fr: 'Hôtels', ar: 'فنادق', en: 'Hotels' },
    'search.tabs.tours': { fr: 'Circuits', ar: 'جولات', en: 'Tours' },
    'search.tabs.flights': { fr: 'Vols', ar: 'رحلات', en: 'Flights' },

    'search.fields.destination': { fr: 'Destination', ar: 'الوجهة', en: 'Destination' },
    'search.fields.dates': { fr: 'Dates', ar: 'التواريخ', en: 'Dates' },
    'search.fields.guests': { fr: 'Voyageurs', ar: 'المسافرون', en: 'Guests' },
    'search.fields.travelers': { fr: 'Voyageurs', ar: 'المسافرون', en: 'Travelers' },
    'search.fields.passengers': { fr: 'Passagers', ar: 'الركاب', en: 'Passengers' },
    'search.fields.roomType': { fr: 'Type de chambre', ar: 'نوع الغرفة', en: 'Room type' },
    'search.fields.propertyClass': { fr: 'Catégorie', ar: 'تصنيف العقار', en: 'Property class' },
    'search.fields.tourStyle': { fr: 'Style du circuit', ar: 'نوع الجولة', en: 'Tour style' },
    'search.fields.duration': { fr: 'Durée', ar: 'المدة', en: 'Duration' },
    'search.fields.tripType': { fr: 'Type de trajet', ar: 'نوع الرحلة', en: 'Trip type' },
    'search.fields.cabinClass': { fr: 'Classe cabine', ar: 'درجة المقعد', en: 'Cabin class' },

    'search.placeholders.destination': {
        fr: 'Ville, hôtel ou lieu',
        ar: 'مدينة أو فندق أو موقع',
        en: 'City, hotel, or place',
    },
    'search.placeholders.checkIn': { fr: 'Arrivée', ar: 'تسجيل الوصول', en: 'Check in' },
    'search.placeholders.checkOut': { fr: 'Départ', ar: 'تسجيل المغادرة', en: 'Check out' },
    'search.placeholders.dates': { fr: 'Choisir des dates', ar: 'اختر التواريخ', en: 'Choose dates' },
    'search.placeholders.flexibleDates': { fr: 'Dates flexibles', ar: 'تواريخ مرنة', en: 'Flexible dates' },
    'search.placeholders.guest': { fr: 'voyageur', ar: 'مسافر', en: 'guest' },
    'search.placeholders.guests': { fr: 'voyageurs', ar: 'مسافرون', en: 'guests' },
    'search.placeholders.guestsHelp': {
        fr: 'Sélectionnez le nombre de voyageurs.',
        ar: 'اختر عدد المسافرين.',
        en: 'Select how many people are traveling.',
    },

    'search.actions.hotels': { fr: 'Rechercher des hôtels', ar: 'ابحث عن فنادق', en: 'Search Hotels' },
    'search.actions.tours': { fr: 'Rechercher des circuits', ar: 'ابحث عن جولات', en: 'Search Tours' },
    'search.actions.flights': { fr: 'Rechercher des vols', ar: 'ابحث عن رحلات', en: 'Search Flights' },
    'search.actions.decreaseGuests': { fr: 'Réduire le nombre de voyageurs', ar: 'تقليل عدد المسافرين', en: 'Decrease guests' },
    'search.actions.increaseGuests': { fr: 'Augmenter le nombre de voyageurs', ar: 'زيادة عدد المسافرين', en: 'Increase guests' },

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
    'search.options.halfDay': { fr: 'Demi-journée', ar: 'نصف يوم', en: 'Half day' },
    'search.options.fullDay': { fr: 'Journée complète', ar: 'يوم كامل', en: 'Full day' },
    'search.options.multiDay': { fr: 'Plusieurs jours', ar: 'عدة أيام', en: 'Multi day' },
    'search.options.roundTrip': { fr: 'Aller-retour', ar: 'ذهاب وعودة', en: 'Round trip' },
    'search.options.oneWay': { fr: 'Aller simple', ar: 'ذهاب فقط', en: 'One way' },
    'search.options.multiCity': { fr: 'Multi-ville', ar: 'عدة مدن', en: 'Multi city' },
    'search.options.economy': { fr: 'Économie', ar: 'اقتصادي', en: 'Economy' },
    'search.options.premiumEconomy': { fr: 'Économie premium', ar: 'اقتصادي مميز', en: 'Premium economy' },
    'search.options.business': { fr: 'Affaires', ar: 'رجال الأعمال', en: 'Business' },
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
    'deals.viewDeal': { fr: "Voir l'Offre", ar: 'شاهد العرض', en: 'View Deal' },

    // Footer
    'footer.tagline': {
        fr: "Créateur d'expériences de voyage extraordinaires depuis 2010.",
        ar: 'نصنع تجارب سفر استثنائية منذ عام 2010.',
        en: 'Creating extraordinary travel experiences since 2010.',
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

    // Contact Page
    'contact.kicker': { fr: 'Restons en contact', ar: 'دعنا نبقى على تواصل', en: 'Stay in touch' },
    'contact.title': { fr: 'Contactez-nous', ar: 'اتصل بنا', en: 'Contact Us' },
    'contact.description': {
        fr: 'Notre équipe est disponible par téléphone, WhatsApp, réseaux sociaux et en personne via notre emplacement sur la carte.',
        ar: 'فريقنا متاح عبر الهاتف وواتساب ووسائل التواصل الاجتماعي وكذلك عبر موقعنا على الخريطة.',
        en: 'Our team is available by phone, WhatsApp, social media, and in person through our mapped location.',
    },
    'contact.calls': { fr: 'Appels', ar: 'المكالمات', en: 'Calls' },
    'contact.whatsapp': { fr: 'WhatsApp', ar: 'واتساب', en: 'WhatsApp' },
    'contact.email': { fr: 'E-mail', ar: 'البريد الإلكتروني', en: 'Email' },
    'contact.locationTitle': { fr: 'Notre emplacement', ar: 'موقعنا', en: 'Our location' },
    'contact.locationSubtitle': {
        fr: 'Visitez-nous ou ouvrez la carte pour nous trouver facilement.',
        ar: 'قم بزيارتنا أو افتح الخريطة للعثور علينا بسهولة.',
        en: 'Visit us or open the map to find us easily.',
    },
    'contact.mapTitle': { fr: 'Carte du bureau', ar: 'خريطة المكتب', en: 'Office map' },
    'contact.openMap': { fr: 'Ouvrir dans Maps', ar: 'فتح في الخرائط', en: 'Open in Maps' },
    'contact.socialTitle': { fr: 'Réseaux sociaux', ar: 'وسائل التواصل الاجتماعي', en: 'Social media' },
    'contact.socialDescription': {
        fr: 'Suivez-nous pour les dernières offres, inspirations voyage et mises à jour.',
        ar: 'تابعنا للحصول على أحدث العروض وإلهام السفر والتحديثات.',
        en: 'Follow us for the latest offers, travel inspiration, and updates.',
    },
    'contact.ctaTitle': { fr: 'Besoin d’une réponse rapide ?', ar: 'هل تحتاج إلى رد سريع؟', en: 'Need a quick answer?' },
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
    'common.from': { fr: 'À partir de', ar: 'ابتداءً من', en: 'From' },
    'common.search': { fr: 'Rechercher...', ar: 'بحث...', en: 'Search...' },
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

    // Auth Pages
    'auth.welcomeBack': {
        fr: 'Bienvenue',
        ar: 'أهلا بعودتك',
        en: 'Welcome Back',
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

    // Destinations Page
    'dest.title': {
        fr: 'Explorez les Destinations',
        ar: 'استكشف الوجهات',
        en: 'Explore Destinations',
    },
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
    'hotels.filterByTags': { fr: 'Filtrer par catégorie', ar: 'التصفية حسب الفئة', en: 'Filter by category' },
    'hotels.showing': { fr: 'Affichage', ar: 'عرض', en: 'Showing' },
    'hotels.results': { fr: 'résultats', ar: 'نتائج', en: 'results' },
    'hotels.priceFrom': { fr: 'À partir de', ar: 'ابتداءً من', en: 'From' },
    'hotels.noResults': { fr: 'Aucun hôtel ne correspond à vos critères de filtre.', ar: 'لا توجد فنادق تطابق معايير الفلتر الخاصة بك.', en: 'No hotels match your filter criteria.' },

    // Hotel Detail Page
    'hotelDetail.startingFrom': { fr: 'À partir de', ar: 'ابتداءً من', en: 'Starting from' },
    'hotelDetail.reserveNow': { fr: 'Réserver maintenant', ar: 'احجز الآن', en: 'Reserve now' },
    'hotelDetail.call': { fr: 'Appeler', ar: 'اتصال', en: 'Call' },
    'hotelDetail.bookingNote': { fr: 'Réservez rapidement avant que les meilleures chambres ne soient épuisées.', ar: 'احجز بسرعة قبل نفاد أفضل الغرف.', en: 'Book quickly before the best rooms sell out.' },
    'hotelDetail.aboutHotel': { fr: 'À propos de l’hôtel', ar: 'حول الفندق', en: 'About the hotel' },
    'hotelDetail.amenities': { fr: 'Équipements', ar: 'المرافق', en: 'Amenities' },
    'hotelDetail.availableRooms': { fr: 'Chambres disponibles', ar: 'الغرف المتاحة', en: 'Available rooms' },
    'hotelDetail.guests': { fr: 'invités', ar: 'ضيوف', en: 'guests' },
    'hotelDetail.pricePerNight': { fr: 'Prix par nuit', ar: 'السعر لليلة', en: 'Price per night' },
    'hotelDetail.selectRoom': { fr: 'Sélectionner', ar: 'اختر الغرفة', en: 'Select room' },

    // Destination Detail Page
    'destinationDetail.overview': { fr: 'Aperçu', ar: 'نظرة عامة', en: 'Overview' },
    'destinationDetail.bestTime': { fr: 'Meilleure période', ar: 'أفضل وقت', en: 'Best time' },
    'destinationDetail.weather': { fr: 'Météo', ar: 'الطقس', en: 'Weather' },
    'destinationDetail.startingFrom': { fr: 'À partir de', ar: 'ابتداءً من', en: 'Starting from' },
    'destinationDetail.spring': { fr: 'Printemps et début d’été', ar: 'الربيع وبداية الصيف', en: 'Spring and early summer' },
    'destinationDetail.sunny': { fr: 'Climat doux et ensoleillé', ar: 'طقس معتدل ومشمس', en: 'Mild and sunny climate' },

    // Tour Detail Page
    'tourDetail.overview': { fr: 'Aperçu', ar: 'نظرة عامة', en: 'Overview' },
    'tourDetail.duration': { fr: 'Durée', ar: 'المدة', en: 'Duration' },
    'tourDetail.group': { fr: 'Taille du groupe', ar: 'حجم المجموعة', en: 'Group size' },
    'tourDetail.startingFrom': { fr: 'À partir de', ar: 'ابتداءً من', en: 'Starting from' },

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
    'tourDetail.bookingFlow': { fr: 'Démarrer la réservation', ar: 'ابدأ الحجز', en: 'Start booking' },

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
    'promos.applyCode': {
        fr: 'Appliquer le Code',
        ar: 'تطبيق الكود',
        en: 'Apply Code',
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
        fr: 'Rencontrez les experts passionnés derrière chaque expérience Voyageur.',
        ar: 'قابل الخبراء المتحمسين وراء كل تجربة في Voyageur.',
        en: 'Meet the passionate experts behind every Voyageur experience.',
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
    'flights.direct': { fr: 'Direct', ar: 'مباشر', en: 'Direct' },
    'flights.stop': { fr: 'Escale', ar: 'توقف', en: 'Stop' },
    'flights.select': { fr: 'Sélectionner', ar: 'اختر', en: 'Select' },

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
    'cars.rentNow': {
        fr: 'Louer Maintenant',
        ar: 'استأجر الآن',
        en: 'Rent Now',
    },
    'cars.perDay': { fr: '/jour', ar: '/يوم', en: '/day' },

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
    'events.travelling': { fr: 'voyageant', ar: 'يسافرون', en: 'travelling' },
    'events.reserve': {
        fr: 'Réserver une Place',
        ar: 'احجز مكانًا',
        en: 'Reserve a Spot',
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
    'admin.date': { fr: 'Date', ar: 'التاريخ', en: 'Date' },
    'admin.amount': { fr: 'Montant', ar: 'المبلغ', en: 'Amount' },
    'admin.status': { fr: 'Statut', ar: 'الحالة', en: 'Status' },

    // Client Dashboard
    'client.welcome': {
        fr: 'Bienvenue de retour, Voyageur!',
        ar: 'مرحبًا بعودتك، أيها المسافر!',
        en: 'Welcome back, Traveler!',
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
    'client.countriesVisited': {
        fr: 'Pays visités',
        ar: 'البلدان التي تمت زيارتها',
        en: 'Countries Visited',
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
    'label.category': { fr: 'Catégorie', ar: 'الفئة', en: 'Category' },
    'label.date': { fr: 'Date', ar: 'التاريخ', en: 'Date' },
    'label.location': { fr: 'Localisation', ar: 'الموقع', en: 'Location' },
    'label.duration': { fr: 'Durée', ar: 'المدة', en: 'Duration' },
    'label.maxGroup': { fr: 'Max par groupe', ar: 'الحد الأقصى بالمجموعة', en: 'Max group' },
    'label.departing': { fr: 'Départ', ar: 'المغادرة', en: 'Departing' },
    'label.arriving': { fr: 'Arrivée', ar: 'الوصول', en: 'Arriving' },
    'label.stops': { fr: 'Escales', ar: 'التوقفات', en: 'Stops' },
    'label.wifi': { fr: 'WiFi', ar: 'واي فاي', en: 'WiFi' },
    'label.parking': { fr: 'Parking', ar: 'موقف السيارات', en: 'Parking' },
    'label.breakfast': { fr: 'Petit-déjeuner', ar: 'الإفطار', en: 'Breakfast' },
    'label.trending': { fr: 'Tendance', ar: 'متوجه', en: 'Trending' },
    'label.popular': { fr: 'Populaire', ar: 'شهير', en: 'Popular' },
    'label.romantic': { fr: 'Romantique', ar: 'رومانسي', en: 'Romantic' },
};

// app-specific action/notification keys
translations['actions.deleted'] = { fr: 'Supprimé', ar: 'تم الحذف', en: 'Deleted' };
translations['admin.activated'] = { fr: 'activé', ar: 'مفعل', en: 'activated' };
translations['admin.deactivated'] = { fr: 'désactivé', ar: 'معطل', en: 'deactivated' };
translations['admin.tourUpdated'] = { fr: 'Circuit mis à jour', ar: 'تم تحديث الجولة', en: 'Tour updated' };
translations['admin.tourAdded'] = { fr: 'Circuit ajouté', ar: 'تمت إضافة الجولة', en: 'Tour added' };
translations['admin.hotelUpdated'] = { fr: 'Hôtel mis à jour', ar: 'تم تحديث الفندق', en: 'Hotel updated' };
translations['admin.hotelAdded'] = { fr: 'Hôtel ajouté', ar: 'تمت إضافة الفندق', en: 'Hotel added' };
translations['admin.destinationUpdated'] = { fr: 'Destination mise à jour', ar: 'تم تحديث الوجهة', en: 'Destination updated' };
translations['admin.destinationAdded'] = { fr: 'Destination ajoutée', ar: 'تمت إضافة الوجهة', en: 'Destination added' };
translations['admin.booking'] = { fr: 'Réservation', ar: 'الحجز', en: 'Booking' };
translations['auth.welcomeAdmin'] = { fr: 'Bienvenue, Admin!', ar: 'مرحبًا، المسؤول!', en: 'Welcome back, Admin!' };
translations['auth.welcomeAssistant'] = { fr: 'Bienvenue, Assistant!', ar: 'مرحبًا، المساعد!', en: 'Welcome back, Assistant!' };

export function t(key: string, lang: Lang): string {
    const entry = translations[key];
    if (!entry) return key;
    return entry[lang] || key;
}
