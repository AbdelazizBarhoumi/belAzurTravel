import { PageShell } from '@/components/PageShell';
import { useLanguage } from '@/contexts/LanguageContext';

import type { Lang } from '@/i18n/translations';

type LocalizedText = Record<Lang, string>;

type LegalSection = {
    title: LocalizedText;
    body: LocalizedText;
};

const sections: LegalSection[] = [
    {
        title: {
            fr: "Informations sur l'entreprise",
            ar: 'معلومات الشركة',
            en: 'Company Information',
        },
        body: {
            fr: 'BelAzurTravel Travel Agency SARL — immatriculée au 123 Travel Street, New York 10001. Licence de voyage #TA-2010-4587. TVA: US-887654321.',
            ar: 'وكالة BelAzurTravel للسفر — مسجلة في 123 Travel Street، نيويورك 10001. رخصة سفر #TA-2010-4587. ضريبة القيمة المضافة: US-887654321.',
            en: 'BelAzurTravel Travel Agency SARL — registered at 123 Travel Street, New York 10001. Travel license #TA-2010-4587. VAT: US-887654321.',
        },
    },
    {
        title: {
            fr: "Conditions d’utilisation",
            ar: 'شروط الخدمة',
            en: 'Terms of Service',
        },
        body: {
            fr: 'En utilisant notre site et nos services, vous acceptez nos conditions de réservation standard. Tous les forfaits sont soumis à disponibilité. Les annulations sont régies par notre politique publiée.',
            ar: 'باستخدام موقعنا وخدماتنا، فإنك توافق على شروط الحجز القياسية لدينا. جميع الباقات خاضعة للتوافر. تخضع حالات الإلغاء لسياستنا المنشورة.',
            en: 'By using our website and services, you agree to our standard booking conditions. All packages are subject to availability. Cancellations are governed by our published policy.',
        },
    },
    {
        title: {
            fr: 'Politique de confidentialité',
            ar: 'سياسة الخصوصية',
            en: 'Privacy Policy',
        },
        body: {
            fr: 'Nous collectons uniquement les données personnelles nécessaires pour fournir et améliorer nos services. Vos données ne sont jamais vendues à des tiers. Vous pouvez demander leur suppression à tout moment en contactant notre support.',
            ar: 'نقوم بجمع البيانات الشخصية اللازمة فقط لتقديم خدماتنا وتحسينها. لا تُباع بياناتك لأطراف ثالثة أبدًا. يمكنك طلب حذفها في أي وقت عبر التواصل مع فريق الدعم.',
            en: 'We collect only the personal data required to deliver and improve our services. Your data is never sold to third parties. You may request deletion at any time by contacting our support team.',
        },
    },
    {
        title: {
            fr: 'Politique d’annulation',
            ar: 'سياسة الإلغاء',
            en: 'Cancellation Policy',
        },
        body: {
            fr: 'Annulation gratuite jusqu’à 30 jours avant le départ. Remboursement de 50% entre 30 et 14 jours. Aucun remboursement dans les 14 jours précédant le départ sauf si couvert par une assurance voyage.',
            ar: 'إلغاء مجاني حتى 30 يومًا قبل المغادرة. استرداد 50٪ بين 30 و14 يومًا. لا يوجد استرداد خلال 14 يومًا من المغادرة إلا إذا كان مغطى بتأمين سفر.',
            en: 'Free cancellation up to 30 days before departure. 50% refund between 30 and 14 days. No refund within 14 days of departure unless covered by travel insurance.',
        },
    },
    {
        title: {
            fr: 'Propriété intellectuelle',
            ar: 'الملكية الفكرية',
            en: 'Intellectual Property',
        },
        body: {
            fr: 'Tout le contenu — textes, images, logos et itinéraires — est la propriété de BelAzurTravel et protégé par les lois internationales sur le droit d’auteur. Toute reproduction nécessite une autorisation écrite.',
            ar: 'جميع المحتويات — النصوص والصور والشعارات والمسارات — ملك لشركة BelAzurTravel ومحمي بموجب قوانين حقوق النشر الدولية. أي إعادة إنتاج تتطلب إذنًا كتابيًا.',
            en: 'All content — text, images, logos, and itineraries — is the property of BelAzurTravel and protected by international copyright laws. Any reproduction requires written authorization.',
        },
    },
    {
        title: {
            fr: 'Responsabilité',
            ar: 'المسؤولية',
            en: 'Liability',
        },
        body: {
            fr: "BelAzurTravel agit en tant qu'intermédiaire entre les voyageurs et les prestataires de services. Notre responsabilité est limitée à la valeur des services réservés telle que détaillée dans votre contrat.",
            ar: 'تعمل BelAzurTravel كوسيط بين المسافرين ومزودي الخدمات. تقتصر مسؤوليتنا على قيمة الخدمات المحجوزة كما هو موضح في عقدك.',
            en: 'BelAzurTravel acts as an intermediary between travellers and service providers. Our liability is limited to the value of the booked services as detailed in your contract.',
        },
    },
    {
        title: {
            fr: 'Cookies',
            ar: 'ملفات تعريف الارتباط',
            en: 'Cookies',
        },
        body: {
            fr: 'Notre site utilise des cookies pour mémoriser vos préférences et analyser le trafic. Vous pouvez gérer vos préférences depuis les paramètres de votre navigateur à tout moment.',
            ar: 'يستخدم موقعنا ملفات تعريف الارتباط لتذكر تفضيلاتك وتحليل حركة المرور. يمكنك إدارة تفضيلاتك من إعدادات المتصفح في أي وقت.',
            en: 'Our site uses cookies to remember your preferences and analyse traffic. You can manage your preferences from your browser settings at any time.',
        },
    },
];

const Legal = () => {
    const { lang, t } = useLanguage();

    return (
        <PageShell
            titleKey="legal.title"
            subtitleKey="legal.subtitle"
            breadcrumbs={[
                {
                    label: t('common.home'),
                    href: '/',
                },
                {
                    label: t('nav.legal'),
                    active: true,
                },
            ]}
        >
            <div className="mx-auto max-w-4xl space-y-6">
                {sections.map((section) => (
                    <div
                        key={section.title[lang]}
                        className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur-sm transition-all hover:shadow-md"
                    >
                        <h2 className="mb-3 font-serif text-xl font-bold text-foreground md:text-2xl">
                            {section.title[lang]}
                        </h2>

                        <p className="text-sm leading-7 text-muted-foreground md:text-base">
                            {section.body[lang]}
                        </p>
                    </div>
                ))}
            </div>
        </PageShell>
    );
};

export default Legal;