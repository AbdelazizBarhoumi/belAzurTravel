<?php

namespace Database\Seeders;

use App\Models\Amenity;
use Illuminate\Database\Seeder;
use App\Models\Hotel;
use App\Models\HotelRoom;
use App\Models\HotelRoomFeature;
use App\Models\HotelRoomImage;
use App\Models\SiteSetting;
use App\Models\Tour;
use Illuminate\Support\Facades\Cache;

class SeedJsDataSeeder extends Seeder
{
    private function loc(string $en, ?string $fr = null, ?string $ar = null): array
    {
        return [
            'en' => $en,
            'fr' => $fr ?? $en,
            'ar' => $ar ?? $en,
        ];
    }

    private function syncAmenities(Hotel $hotel, array $amenities): void
    {
        $amenityIds = [];

        foreach ($amenities as $amenityName) {
            $amenityIcon = null;

            if (is_array($amenityName)) {
                $amenityIcon = $amenityName['icon'] ?? null;
                $amenityName = $amenityName['name'] ?? null;
            }

            if (is_string($amenityName)) {
                $amenityName = $this->loc($amenityName);
            }

            if (! is_array($amenityName)) {
                continue;
            }

            $amenity = Amenity::query()->updateOrCreate([
                'name' => $amenityName,
            ], [
                'icon' => $amenityIcon,
            ]);

            $amenityIds[] = $amenity->id;
        }

        $hotel->amenities()->sync($amenityIds);
    }

    private function syncRoomMedia(HotelRoom $room, array $features = [], array $images = []): void
    {
        $room->featureItems()->delete();
        $room->imageItems()->delete();

        foreach (array_values($features) as $index => $feature) {
            $room->featureItems()->create([
                'label' => $feature,
                'sort_order' => $index,
            ]);
        }

        foreach (array_values($images) as $index => $image) {
            $room->imageItems()->create([
                'path' => $image,
                'sort_order' => $index,
            ]);
        }
    }

    private function seedSiteSettings(): void
    {
        $siteSettings = [
            'company_name' => 'Bel Azur Travel',
            'email' => 'belazurtravel@gmail.com',
            'phone' => '+216 23 777 771',
            'whatsapp' => '21623777771',
            'address' => '3e étage, imm. Ghannouchi, Trocadero, Senghor, Sousse',
            'plus_code' => null,
            'year' => 2026,
            'social_links' => [
                ['label' => 'Facebook', 'href' => 'https://www.facebook.com/people/BEL-AZUR-Travel/61584269153378/#'],
                ['label' => 'Instagram', 'href' => 'https://www.instagram.com/bel.azur_travel/'],
                ['label' => 'YouTube', 'href' => 'https://www.youtube.com/@BELAZURTRAVEL-TN'],
                ['label' => 'TikTok', 'href' => 'https://www.tiktok.com/@bel.azur.travel'],
            ],
            'legal_sections' => [
                [
                    'title' => [
                        'en' => 'Company Information',
                        'fr' => 'Informations de l\'Entreprise',
                        'ar' => 'معلومات الشركة',
                    ],
                    'body' => [
                        'format' => 'markdown',
                        'content' => [
                            'en' => "## Company Details\n\n| Field | Details |\n|-------|---------|\n| **Company Name** | Bel Azur Travel |\n| **Legal Form** | SARL (Société à Responsabilité Limitée) |\n| **Tax Number (MF)** | 1819275/N |\n| **Registration Number** | N/144472021 |\n| **Share Capital** | 5,000 TND |\n| **Activity Code** | 7911 — Travel agency activities |\n| **Date of Creation** | 2022 |\n\n## Registered Office\n\n**Bel Azur Travel**\n3e étage, imm. Ghannouchi, Trocadero\nSenghor, Sousse 4000\nTunisia\n\n## Contact Information\n\n| Channel | Details |\n|---------|---------|\n| **General Email** | belazurtravel@gmail.com |\n| **Phone** | +216 23 777 771 |\n| **WhatsApp** | +216 23 777 771 |\n| **Working Hours** | Monday–Saturday, 08:00–19:00 (Tunisia time) |\n| **Closed** | Sundays and public holidays |\n\n## Social Media\n\n- **Facebook**: [BEL AZUR Travel](https://www.facebook.com/people/BEL-AZUR-Travel/61584269153378/#)\n- **Instagram**: [@bel.azur_travel](https://www.instagram.com/bel.azur_travel/)\n- **YouTube**: [@BELAZURTRAVEL-TN](https://www.youtube.com/@BELAZURTRAVEL-TN)\n- **TikTok**: [@bel.azur.travel](https://www.tiktok.com/@bel.azur.travel)\n\n## Director of Publication\n\nThe publication director of this website is the legal representative of Bel Azur Travel SARL.\n\n## Activities\n\nBel Azur Travel is a licensed travel agency operating in Tunisia, offering:\n- Hotel reservations and accommodation bookings\n- Organized tours and guided excursions\n- Flight reservations with partner airlines\n- Car rental services\n- Event and activity bookings\n- Custom travel planning and consultation\n\nAll services are provided in accordance with Tunisian tourism regulations and applicable international standards.",
                            'fr' => "## Informations de l'Entreprise\n\n| Champ | Détails |\n|-------|---------|\n| **Nom de la Société** | Bel Azur Travel |\n| **Forme Juridique** | SARL (Société à Responsabilité Limitée) |\n| **Numéro Fiscal (MF)** | 1819275/N |\n| **Numéro d'Immatriculation** | N/144472021 |\n| **Capital Social** | 5 000 TND |\n| **Code d'Activité** | 7911 — Activités des agences de voyages |\n| **Date de Création** | 2022 |\n\n## Siège Social\n\n**Bel Azur Travel**\n3e étage, imm. Ghannouchi, Trocadero\nSenghor, Sousse 4000\nTunisie\n\n## Coordonnées\n\n| Canal | Détails |\n|-------|---------|\n| **Email Général** | belazurtravel@gmail.com |\n| **Téléphone** | +216 23 777 771 |\n| **WhatsApp** | +216 23 777 771 |\n| **Heures d'Ouverture** | Lundi–Samedi, 08h00–19h00 (heure de Tunisie) |\n| **Fermé** | Dimanches et jours fériés |\n\n## Réseaux Sociaux\n\n- **Facebook** : [BEL AZUR Travel](https://www.facebook.com/people/BEL-AZUR-Travel/61584269153378/#)\n- **Instagram** : [@bel.azur_travel](https://www.instagram.com/bel.azur_travel/)\n- **YouTube** : [@BELAZURTRAVEL-TN](https://www.youtube.com/@BELAZURTRAVEL-TN)\n- **TikTok** : [@bel.azur.travel](https://www.tiktok.com/@bel.azur.travel)\n\n## Directeur de la Publication\n\nLe directeur de la publication de ce site web est le représentant légal de Bel Azur Travel SARL.\n\n## Activités\n\nBel Azur Travel est une agence de voyage agréée opérant en Tunisie, offrant :\n- Réservations hôtelières et réservations d'hébergement\n- Circuits organisés et excursions guidées\n- Réservations de vols avec des compagnies aériennes partenaires\n- Services de location de voitures\n- Réservations d'événements et d'activités\n- Planification de voyages sur mesure et consultation\n\nTous les services sont fournis conformément à la réglementation touristique tunisienne et aux normes internationales applicables.",
                            'ar' => "## معلومات الشركة\n\n| الحقل | التفاصيل |\n|-------|----------|\n| **اسم الشركة** | بيل أزور للسفر |\n| **الشكل القانوني** | شركة ذات مسؤولية محدودة (ش.م.م) |\n| **الرقم الجبائي (MF)** | 1819275/N |\n| **رقم التسجيل** | N/144472021 |\n| **رأس المال** | 5,000 دينار تونسي |\n| **رمز النشاط** | 7911 — أنشطة وكالات السفر |\n| **تاريخ التأسيس** | 2022 |\n\n## المقر المسجل\n\n**بيل أزور للسفر**\nالطابق الثالث، مبنى الغنوشي، تروكادورو\nسينغور، سوسة 4000\nتونس\n\n## معلومات الاتصال\n\n| القناة | التفاصيل |\n|--------|----------|\n| **البريد الإلكتروني العام** | belazurtravel@gmail.com |\n| **الهاتف** | +216 23 777 771 |\n| **واتساب** | +216 23 777 771 |\n| **ساعات العمل** | الاثنين–السبت، 08:00–19:00 (توقيت تونس) |\n| **إغلاق** | الأحد والعطل الرسمية |\n\n## وسائل التواصل الاجتماعي\n\n- **فيسبوك**: [بيل أزور للسفر](https://www.facebook.com/people/BEL-AZUR-Travel/61584269153378/#)\n- **إنستغرام**: [@bel.azur_travel](https://www.instagram.com/bel.azur_travel/)\n- **يوتيوب**: [@BELAZURTRAVEL-TN](https://www.youtube.com/@BELAZURTRAVEL-TN)\n- **تيك توك**: [@bel.azur.travel](https://www.tiktok.com/@bel.azur.travel)\n\n## مدير النشر\n\nمدير نشر هذا الموقع الإلكتروني هو الممثل القانوني لشركة بيل أزور للسفر ش.م.م.\n\n## الأنشطة\n\nبيل أزور للسفر هي وكالة سفر مرخصة تعمل في تونس، وتقدم:\n- حجوزات فندقية وحجوزات إقامة\n- جولات منظمة ورحلات إرشادية\n- حجوزات رحلات طيران مع شركات طيران شريكة\n- خدمات تأجير السيارات\n- حجوزات الأحداث والأنشطة\n- التخطيط السفر المخصص والاستشارات\n\nتُقدم جميع الخدمات وفقاً للائحة السياحية التونسية والمعايير الدولية المعمول بها.",
                        ],
                    ],
                ],
                [
                    'title' => [
                        'en' => 'Website Information',
                        'fr' => 'Informations du Site Web',
                        'ar' => 'معلومات الموقع الإلكتروني',
                    ],
                    'body' => [
                        'format' => 'markdown',
                        'content' => [
                            'en' => "## Website Ownership\n\n| Field | Details |\n|-------|---------|\n| **Website Owner** | Bel Azur Travel SARL |\n| **Domain** | belazurtravel.com |\n| **Website URL** | https://belazurtravel.com |\n| **Technical Contact** | belazurtravel@gmail.com |\n\n## Hosting Provider\n\n| Field | Details |\n|-------|---------|\n| **Provider** | DigitalOcean / Laravel Cloud |\n| **Server Location** | Frankfurt, Germany (EU) |\n| **CDN** | Built-in Laravel Cloud CDN |\n| **SSL Certificate** | Let's Encrypt (auto-renewed) |\n| **Uptime SLA** | 99.9% |\n\n## Technology Stack\n\n| Component | Technology |\n|-----------|------------|\n| **Backend Framework** | Laravel 11 (PHP 8.2+) |\n| **Frontend Framework** | React 18 + TypeScript |\n| **CSS Framework** | Tailwind CSS + shadcn/ui |\n| **Database** | MySQL 8.0 |\n| **Cache** | Redis |\n| **File Storage** | Local / DigitalOcean Spaces |\n| **Build Tool** | Vite |\n\n## Data Processing\n\n### Server Logs\nOur servers automatically log standard data when you visit the website:\n- IP address (anonymized after 90 days)\n- Browser type and version\n- Pages visited and time spent\n- Referring URL\n- Date and time of visit\n\nThese logs are retained for 90 days for security and performance monitoring purposes.\n\n### Cookies Used\n| Cookie | Purpose | Duration |\n|--------|---------|----------|\n| `cookie_consent` | Stores your cookie consent preference | 1 year |\n| `session` | Maintains your authenticated session | Session |\n| `XSRF-TOKEN` | Cross-site request forgery protection | Session |\n| `sidebar_state` | Remembers sidebar open/closed state | 30 days |\n\n### Data Processing Location\nAll personal data is processed and stored on servers located in the European Union (Frankfurt, Germany). We do not transfer personal data outside the EU without appropriate safeguards.\n\n## Third-Party Services\n\n| Service | Purpose | Data Shared |\n|---------|---------|-------------|\n| Google Maps | Display office location on contact page | None (public embed) |\n| WhatsApp | Customer communication link | None (deep link only) |\n| Email (SMTP) | Transactional emails | Email address |\n\n## Content Management\n\nAll content on this website (descriptions, images, prices, availability) is managed through our internal admin panel. Content is provided in three languages: French, English, and Arabic.\n\n## Intellectual Property\n\nAll content on this website, including but not limited to text, graphics, logos, images, and software, is the property of Bel Azur Travel SARL and is protected by Tunisian and international copyright laws.\n\nUnauthorized reproduction, distribution, or modification of any content is strictly prohibited without prior written consent.\n\n## Accessibility\n\nWe strive to make our website accessible to all users, including those with disabilities. Our website is available in three languages (French, English, Arabic) and supports both left-to-right and right-to-left text direction.\n\n## Changes to This Page\n\nThis website information page may be updated from time to time to reflect changes in our infrastructure or services. Last updated: June 2026.",
                            'fr' => "## Propriété du Site Web\n\n| Champ | Détails |\n|-------|---------|\n| **Propriétaire du Site** | Bel Azur Travel SARL |\n| **Nom de Domaine** | belazurtravel.com |\n| **URL du Site** | https://belazurtravel.com |\n| **Contact Technique** | belazurtravel@gmail.com |\n\n## Hébergeur\n\n| Champ | Détails |\n|-------|---------|\n| **Fournisseur** | DigitalOcean / Laravel Cloud |\n| **Emplacement du Serveur** | Francfort, Allemagne (UE) |\n| **CDN** | CDN intégré Laravel Cloud |\n| **Certificat SSL** | Let's Encrypt (auto-renouvelé) |\n| **SLA de Disponibilité** | 99,9% |\n\n## Stack Technologique\n\n| Composant | Technologie |\n|-----------|-------------|\n| **Backend** | Laravel 11 (PHP 8.2+) |\n| **Frontend** | React 18 + TypeScript |\n| **CSS** | Tailwind CSS + shadcn/ui |\n| **Base de données** | MySQL 8.0 |\n| **Cache** | Redis |\n| **Stockage Fichiers** | Local / DigitalOcean Spaces |\n| **Build** | Vite |\n\n## Traitement des Données\n\n### Journaux Serveur\nNos serveurs enregistrent automatiquement les données standard lors de votre visite :\n- Adresse IP (anonymisée après 90 jours)\n- Type et version du navigateur\n- Pages visitées et temps passé\n- URL de provenance\n- Date et heure de la visite\n\nCes journaux sont conservés pendant 90 jours à des fins de sécurité et de surveillance des performances.\n\n### Cookies Utilisés\n| Cookie | Objectif | Durée |\n|--------|----------|-------|\n| `cookie_consent` | Consentement cookies | 1 an |\n| `session` | Session authentifiée | Session |\n| `XSRF-TOKEN` | Protection CSRF | Session |\n| `sidebar_state` | État de la barre latérale | 30 jours |\n\n### Emplacement du Traitement\nToutes les données personnelles sont traitées et stockées sur des serveurs situés dans l'Union européenne (Francfort, Allemagne). Nous ne transférons pas de données personnelles en dehors de l'UE sans garanties appropriées.\n\n## Services Tiers\n\n| Service | Objectif | Données Partagées |\n|---------|----------|-------------------|\n| Google Maps | Afficher la localisation du bureau | Aucune (intégration publique) |\n| WhatsApp | Lien de communication client | Aucune (lien profond uniquement) |\n| Email (SMTP) | E-mails transactionnels | Adresse email |\n\n## Gestion du Contenu\n\nTout le contenu de ce site web est géré via notre panneau d'administration interne. Le contenu est fourni en trois langues : français, anglais et arabe.\n\n## Propriété Intellectuelle\n\nTout le contenu de ce site web est la propriété de Bel Azur Travel SARL et est protégé par les lois tunisiennes et internationales sur le droit d'auteur.\n\nToute reproduction, distribution ou modification non autorisée de tout contenu est strictement interdite sans consentement écrit préalable.\n\n## Accessibilité\n\nNous nous efforçons de rendre notre site web accessible à tous les utilisateurs. Notre site est disponible en trois langues et supporte les deux directions de texte (gauche à droite et droite à gauche).\n\n## Mises à Jour\n\nCette page d'informations sur le site web peut être mise à jour de temps en autre. Dernière mise à jour : Juin 2026.",
                            'ar' => "## ملكية الموقع الإلكتروني\n\n| الحقل | التفاصيل |\n|-------|----------|\n| **مالك الموقع** | بيل أزور للسفر ش.م.م |\n| **اسم النطاق** | belazurtravel.com |\n| **رابط الموقع** | https://belazurtravel.com |\n| **التواصل التقني** | belazurtravel@gmail.com |\n\n## مزود الاستضافة\n\n| الحقل | التفاصيل |\n|-------|----------|\n| **المزود** | DigitalOcean / Laravel Cloud |\n| **موقع الخادم** | فرانكفورت، ألمانيا (الاتحاد الأوروبي) |\n| **شبكة CDN** | شبكة CDN المدمجة في Laravel Cloud |\n| **شهادة SSL** | Let's Encrypt (تجديث تلقائي) |\n| **اتفاقية مستوى الخدمة** | 99.9% |\n\n## التقنيات المستخدمة\n\n| المكون | التقنية |\n|--------|--------|\n| **الخادم** | Laravel 11 (PHP 8.2+) |\n| **الواجهة الأمامية** | React 18 + TypeScript |\n| **إطار CSS** | Tailwind CSS + shadcn/ui |\n| **قاعدة البيانات** | MySQL 8.0 |\n| **الذاكرة المؤقتة** | Redis |\n| **تخزين الملفات** | محلي / DigitalOcean Spaces |\n| **أداة البناء** | Vite |\n\n## معالجة البيانات\n\n### سجلات الخادم\nتسجّل خوادمنا تلقائياً البيانات القياسية عند زيارتك للموقع:\n- عنوان IP (يتم إخفاء الهوية بعد 90 يوماً)\n- نوع وإصدار المتصفح\n- الصفحات التي تمت زيارتها والوقت المضي فيه\n- عنوان URL المحول\n- التاريخ والوقت\n\nتُحفظ هذه السجلات لمدة 90 يوماً لأغراض أمان ومراقبة الأداء.\n\n### تعريفات الارتباط المستخدمة\n| التعريف | الغرض | المدة |\n|---------|-------|-------|\n| `cookie_consent` | موافقة تعريفات الارتباط | سنة |\n| `session` | الجلسة المصادق عليها | الجلسة |\n| `XSRF-TOKEN` | حماية CSRF | الجلسة |\n| `sidebar_state` | حالة الشريط الجانبي | 30 يوماً |\n\n### موقع المعالجة\nتتم معالجة وتخزين جميع البيانات الشخصية على خوادم تقع في الاتحاد الأوروبي (فرانكفورت، ألمانيا). نحن لا ننقل البيانات الشخصية خارج الاتحاد الأوروبي دون ضمانات مناسبة.\n\n## خدمات أطراف ثالثة\n\n| الخدمة | الغرض | البيانات المشتركة |\n|--------|-------|-------------------|\n| خرائط جوجل | عرض موقع المكتب | لا شيء (دمج عام) |\n| واتساب | رابط التواصل مع العميل | لا شيء (رابط عميق فقط) |\n| البريد (SMTP) | رسائل البريد المعاملاتية | عنوان البريد الإلكتروني |\n\n## إدارة المحتوى\n\nيتم إدارة جميع المحتويات عبر لوحة التحكم الداخلية. المحتوى متوفر بثلاث لغات: الفرنسية والإنجليزية والعربية.\n\n## حقوق الملكية الفكرية\n\nجميع المحتويات محمية بموجب قوانينحقوق النشر التونسية والدولية.\n\nيُحظر أي نسخ أو توزيع أو تعديل غير مصرح به لأي محتوى دون موافقة خطية مسبقة.\n\n## إمكانية الوصول\n\nنسعى لجعل موقعنا متاحاً لجميع المستخدمين. الموقع متوفر بثلاث لغات ويدعم اتجاهين للنص (يسار لليمين ويمين لليسار).\n\n## التحديثات\n\nقد يتم تحديث هذه الصفحة من وقت لآخر. آخر تحديث: يونيو 2026.",
                        ],
                    ],
                ],
            ],
            'footer_links' => [
                ['labelKey' => 'nav.hotels', 'href' => '/hotels', 'group' => 'quick'],
                ['labelKey' => 'nav.tours', 'href' => '/tours', 'group' => 'quick'],
                ['labelKey' => 'nav.destinations', 'href' => '/destinations', 'group' => 'quick'],
                ['labelKey' => 'nav.cars', 'href' => '/cars', 'group' => 'quick'],
                ['labelKey' => 'nav.contact', 'href' => '/contact', 'group' => 'support'],
                ['labelKey' => 'nav.legal', 'href' => '/legal', 'group' => 'support'],
                ['labelKey' => 'nav.promos', 'href' => '/promos', 'group' => 'support'],
                ['labelKey' => 'nav.team', 'href' => '/team', 'group' => 'support'],
            ],
            'hours' => [
                ['dayKey' => 'footer.mon', 'ranges' => [['value' => '08:00 - 19:00']], 'closed' => false],
                ['dayKey' => 'footer.tue', 'ranges' => [['value' => '08:00 - 19:00']], 'closed' => false],
                ['dayKey' => 'footer.wed', 'ranges' => [['value' => '08:00 - 19:00']], 'closed' => false],
                ['dayKey' => 'footer.thu', 'ranges' => [['value' => '08:00 - 19:00']], 'closed' => false],
                ['dayKey' => 'footer.fri', 'ranges' => [['value' => '08:00 - 19:00']], 'closed' => false],
                ['dayKey' => 'footer.sat', 'ranges' => [['value' => '08:00 - 19:00']], 'closed' => false],
                ['dayKey' => 'footer.sun', 'ranges' => [], 'closed' => true],
            ],
            'content' => [
                'footer' => [
                    'tagline' => [
                        'en' => 'Your trusted travel agency in Tunisia. Unforgettable experiences at the best price.',
                        'fr' => 'Votre agence de voyage de confiance en Tunisie. Des expériences inoubliables au meilleur prix.',
                        'ar' => 'وكالة السفر الموثوقة في تونس. تجارب لا تُنسى بأفضل الأسعار.',
                    ],
                ],
                'contact' => [
                    'kicker' => [
                        'en' => 'Contact us',
                        'fr' => 'Contactez-nous',
                        'ar' => 'اتصل بنا',
                    ],
                    'title' => [
                        'en' => 'Plan your next trip with Bel Azur Travel',
                        'fr' => 'Planifiez votre prochain voyage avec Bel Azur Travel',
                        'ar' => 'خطط لرحلتك القادمة مع بيل أزور ترافل',
                    ],
                    'description' => [
                        'en' => 'Reach our team by phone, email, WhatsApp or by visiting our office in Sousse.',
                        'fr' => 'Contactez notre équipe par téléphone, e-mail, WhatsApp ou en visitant notre bureau à Sousse.',
                        'ar' => 'تواصل مع فريقنا عبر الهاتف أو البريد الإلكتروني أو واتساب أو بزيارة مكتبنا في سوسة.',
                    ],
                    'locationTitle' => [
                        'en' => 'Our office',
                        'fr' => 'Notre agence',
                        'ar' => 'مكتبنا',
                    ],
                    'locationSubtitle' => [
                        'en' => 'Find us on the map and send us a message anytime.',
                        'fr' => 'Retrouvez-nous sur la carte et envoyez-nous un message à tout moment.',
                        'ar' => 'اعثر علينا على الخريطة وأرسل لنا رسالة في أي وقت.',
                    ],
                    'socialTitle' => [
                        'en' => 'Follow us',
                        'fr' => 'Suivez-nous',
                        'ar' => 'تابعنا',
                    ],
                    'socialDescription' => [
                        'en' => 'Stay updated with our latest offers and travel inspiration.',
                        'fr' => 'Restez informé de nos meilleures offres et inspirations voyage.',
                        'ar' => 'ابقَ على اطلاع بآخر العروض وإلهام السفر.',
                    ],
                    'ctaTitle' => [
                        'en' => 'Need a custom trip or a quick quote?',
                        'fr' => 'Besoin d’un voyage sur mesure ou d’un devis rapide ?',
                        'ar' => 'هل تحتاج إلى رحلة مخصصة أو عرض سريع؟',
                    ],
                    'ctaDescription' => [
                        'en' => 'Send us a message and we will help you plan it.',
                        'fr' => 'Envoyez-nous un message et nous vous aiderons à le planifier.',
                        'ar' => 'أرسل لنا رسالة وسنساعدك في التخطيط لها.',
                    ],
                ],
                'privacy_policy' => [
                    'title' => [
                        'en' => 'Privacy Policy',
                        'fr' => 'Politique de Confidentialité',
                        'ar' => 'سياسة الخصوصية',
                    ],
                    'body' => [
                        'format' => 'markdown',
                        'content' => [
                            'en' => "## 1. Introduction\n\nBel Azur Travel (\"we\", \"us\", \"our\") is a travel agency registered and operating in Sousse, Tunisia. We are committed to protecting your privacy and personal data. This Privacy Policy explains how we collect, use, store, and protect your information when you use our website, mobile application, and related services.\n\nBy accessing or using our Platform, you acknowledge that you have read and understood this Privacy Policy.\n\n## 2. Data Controller\n\n**Bel Azur Travel**\n3e étage, imm. Ghannouchi, Trocadero, Senghor, Sousse, Tunisia\nEmail: belazurtravel@gmail.com\nPhone: +216 23 777 771\n\n## 3. Information We Collect\n\n### 3.1. Information You Provide Directly\n- **Account information**: Full name, email address, password (encrypted), preferred language\n- **Booking information**: Full name, email address, phone number, travel dates, number of travelers, special requests\n- **Payment information**: Booking amounts and payment references\n- **Support inquiries**: Subject, message content, and correspondence\n- **Promotional codes**: Any promo codes you apply during booking\n\n### 3.2. Information Collected Automatically\n- **Log data**: IP address, browser type, operating system, pages visited, time and date of visit\n- **Device data**: Device type, screen resolution, language settings, time zone\n- **Interaction data**: Clicks on phone numbers, WhatsApp links, or other contact methods\n\n## 4. How We Use Your Information\n\n- Process and manage your travel bookings\n- Communicate with you about your reservations\n- Send booking confirmations and travel documents\n- Process payments and maintain financial records\n- Create and maintain your user account\n- Respond to your inquiries and support tickets\n- Analyze usage patterns to improve our platform\n- Comply with Tunisian tax and commercial regulations\n\n## 5. Legal Basis for Processing\n\n| Purpose | Legal Basis |\n|---------|-------------|\n| Processing bookings | Performance of a contract |\n| Account management | Performance of a contract |\n| Customer support | Legitimate interest |\n| Marketing communications | Consent (opt-in only) |\n| Platform analytics | Legitimate interest |\n| Legal compliance | Legal obligation |\n\n## 6. Data Sharing\n\nWe share your booking information with third-party service providers necessary to fulfill your travel arrangements:\n- Hotels and accommodation providers\n- Airlines and flight operators\n- Car rental companies\n- Tour operators\n\nWe do **not** sell your personal data to third parties.\n\n## 7. Data Retention\n\n| Data Type | Retention Period |\n|-----------|-----------------|\n| Account information | Until account deletion + 3 years |\n| Booking records | 7 years |\n| Payment records | 7 years |\n| Support inquiries | 3 years after resolution |\n| Server logs | 90 days |\n\n## 8. Data Security\n\n- All data transmitted via TLS (HTTPS) encryption\n- Passwords hashed using bcrypt\n- Role-based access control\n- Session-based authentication with CSRF protection\n- Two-factor authentication available\n\n## 9. Cookies\n\n| Cookie | Purpose | Duration |\n|--------|---------|----------|\n| `cookie_consent` | Stores your consent preference | 1 year |\n| `session` | Maintains your authenticated session | Session |\n| `XSRF-TOKEN` | CSRF protection | Session |\n\n## 10. Your Rights\n\n- Access your personal data\n- Correct inaccurate data\n- Delete your personal data\n- Withdraw consent for marketing\n- Request data portability\n\nContact us at belazurtravel@gmail.com to exercise these rights.\n\n## 11. Contact Us\n\n**Bel Azur Travel**\n- Address: 3e étage, imm. Ghannouchi, Trocadero, Senghor, Sousse, Tunisia\n- Email: belazurtravel@gmail.com\n- Phone: +216 23 777 771\n- WhatsApp: +216 23 777 771\n- Working hours: Monday–Saturday, 08:00–19:00\n\n---\n\n*Last updated: June 2026*",
                            'fr' => "## 1. Introduction\n\nBel Azur Travel (\"nous\") est une agence de voyage enregistrée et opérant à Sousse, Tunisie. Nous nous engageons à protéger votre vie privée et vos données personnelles.\n\nEn accédant à ou en utilisant notre Plateforme, vous reconnaissez avoir lu et compris cette Politique de Confidentialité.\n\n## 2. Responsable du Traitement\n\n**Bel Azur Travel**\n3e étage, imm. Ghannouchi, Trocadero, Senghor, Sousse, Tunisie\nEmail : belazurtravel@gmail.com\nTéléphone : +216 23 777 771\n\n## 3. Informations que Nous Collectons\n\n### 3.1. Informations que Vous Fournissez\n- **Informations de compte** : Nom complet, adresse email, mot de passe (chiffré), langue préférée\n- **Informations de réservation** : Nom, email, téléphone, dates de voyage, nombre de voyageurs\n- **Informations de paiement** : Montants des réservations et références de paiement\n- **Demandes de support** : Sujet, contenu du message\n- **Codes promotionnels** : Tout code promo appliqué\n\n### 3.2. Informations Collectées Automatiquement\n- **Données de connexion** : Adresse IP, type de navigateur, pages visitées\n- **Données de l'appareil** : Type d'appareil, résolution, langue, fuseau horaire\n- **Données d'interaction** : Clics sur numéros de téléphone ou liens WhatsApp\n\n## 4. Comment Nous Utilisons Vos Informations\n\n- Traiter et gérer vos réservations de voyages\n- Communiquer avec vous au sujet de vos réservations\n- Envoyer des confirmations et documents de voyage\n- Traiter les paiements\n- Créer et maintenir votre compte\n- Répondre à vos demandes de support\n- Améliorer notre Plateforme\n- Se conformer aux exigences fiscales tunisiennes\n\n## 5. Base Légale du Traitement\n\n| Finalité | Base Légale |\n|----------|-------------|\n| Traitement des réservations | Exécution d'un contrat |\n| Gestion de compte | Exécution d'un contrat |\n| Support client | Intérêt légitime |\n| Communications marketing | Consentement |\n| Analyses Plateforme | Intérêt légitime |\n| Conformité légale | Obligation légale |\n\n## 6. Partage des Données\n\nNous partageons vos informations avec les fournisseurs de services nécessaires :\n- Hébergements et hôtels\n- Compagnies aériennes\n- Sociétés de location de voitures\n- Opérateurs touristiques\n\nNous ne **vendons** pas vos données personnelles.\n\n## 7. Conservation des Données\n\n| Type | Durée |\n|------|-------|\n| Compte | Jusqu'à suppression + 3 ans |\n| Réservations | 7 ans |\n| Paiements | 7 ans |\n| Support | 3 ans après résolution |\n| Journaux serveur | 90 jours |\n\n## 8. Sécurité des Données\n\n- Chiffrement TLS (HTTPS)\n- Mots de passe hashés en bcrypt\n- Contrôle d'accès par rôle\n- Authentification par session avec CSRF\n- Authentification à deux facteurs disponible\n\n## 9. Cookies\n\n| Cookie | Objectif | Durée |\n|--------|----------|-------|\n| `cookie_consent` | Consentement | 1 an |\n| `session` | Session authentifiée | Session |\n| `XSRF-TOKEN` | Protection CSRF | Session |\n\n## 10. Vos Droits\n\n- Accéder à vos données\n- Corriger les données inexactes\n- Supprimer vos données\n- Retirer le consentement marketing\n- Demander la portabilité des données\n\nContactez-nous à belazurtravel@gmail.com.\n\n## 11. Nous Contacter\n\n**Bel Azur Travel**\n- Adresse : 3e étage, imm. Ghannouchi, Trocadero, Senghor, Sousse, Tunisie\n- Email : belazurtravel@gmail.com\n- Téléphone : +216 23 777 771\n- WhatsApp : +216 23 777 771\n- Heures : Lundi–Samedi, 08h00–19h00\n\n---\n\n*Dernière mise à jour : Juin 2026*",
                            'ar' => "## 1. المقدمة\n\nبيل أزور للسفر (\"نحن\") هي وكالة سفر مسجلة وتعمل في سوسة، تونس. نحن ملتزمون بحماية خصوصيتك وبياناتك الشخصية.\n\nباستخدام منصتنا، تقر بأنك قرأت وفهمت سياسة الخصوصية هذه.\n\n## 2. مسؤول البيانات\n\n**بيل أزور للسفر**\nالطابق الثالث، مبنى الغنوشي، تروكادورو، سينغور، سوسة، تونس\nالبريد الإلكتروني: belazurtravel@gmail.com\nالهاتف: +216 23 777 771\n\n## 3. المعلومات التي نجمعها\n\n### 3.1. المعلومات التي تزودنا بها\n- **معلومات الحساب**: الاسم الكامل، البريد الإلكتروني، كلمة المرور المشفرة، اللغة المفضلة\n- **معلومات الحجز**: الاسم، البريد، الهاتف، تواريخ السفر، عدد المسافرين\n- **معلومات الدفع**: مبالغ الحجوزات ومراجع الدفع\n- **طلبات الدعم**: الموضوع ورسالة\n- **الأكواد الترويجية**: أي كود ترويج مطبق\n\n### 3.2. المعلومات المجمعة تلقائياً\n- **بيانات الاتصال**: عنوان IP، نوع المتصفح، الصفحات التي تمت زيارتها\n- **بيانات الجهاز**: نوع الجهاز، دقة الشاشة، اللغة، المنطقة الزمنية\n- **بيانات التفاعل**: النقرات على أرقام الهواتف أو روابط واتساب\n\n## 4. كيف نستخدم معلوماتك\n\n- معالجة حجوزات السفر\n- التواصل بشأن الحجوزات\n- إرسال تأكيدات الحجز\n- معالجة المدفوعات\n- إنشاء وإدارة الحساب\n- الرد على طلبات الدعم\n- تحسين المنصة\n- الامتثال للقوانين التونسية\n\n## 5. الأساس القانوني للمعالجة\n\n| الغرض | الأساس القانوني |\n|--------|-----------------|\n| معالجة الحجوزات | تنفيذ عقد |\n| إدارة الحساب | تنفيذ عقد |\n| دعم العملاء | مصلحة مشروعة |\n| التسويق | موافقة |\n| تحسين المنصة | مصلحة مشروعة |\n| الامتثال القانوني | التزام قانوني |\n\n## 6. مشاركة البيانات\n\nنشارك معلوماتك مع مزودي الخدمات الضرورية:\n- الفنادق وأماكن الإقامة\n- شركات الطيران\n- شركات تأجير السيارات\n- مشغلي الجولات\n\nنحن لا **نبيع** بياناتك لأطراف ثالثة.\n\n## 7. الاحتفاظ بالبيانات\n\n| النوع | المدة |\n|-------|-------|\n| الحساب | حتى الحذف + 3 سنوات |\n| الحجوزات | 7 سنوات |\n| المدفوعات | 7 سنوات |\n| الدعم | 3 سنوات بعد الحل |\n| سجلات الخادم | 90 يوماً |\n\n## 8. أمان البيانات\n\n- تشفير TLS (HTTPS)\n- كلمات مرور مشفرة بـ bcrypt\n- تحكم في الوصول بالأدوار\n- مصادقة بالجلسة مع CSRF\n- مصادقة ثنائية متاحة\n\n## 9. تعريفات الارتباط\n\n| التعريف | الغرض | المدة |\n|---------|-------|-------|\n| `cookie_consent` | الموافقة | سنة |\n| `session` | الجلسة | الجلسة |\n| `XSRF-TOKEN` | حماية CSRF | الجلسة |\n\n## 10. حقوقك\n\n- الوصول إلى بياناتك\n- تصحيح البيانات\n- حذف بياناتك\n- سحب موافقة التسويق\n- طلب نقل البيانات\n\nتواصل معنا على belazurtravel@gmail.com.\n\n## 11. اتصل بنا\n\n**بيل أزور للسفر**\n- العنوان: الطابق الثالث، مبنى الغنوشي، تروكادورو، سينغور، سوسة، تونس\n- البريد: belazurtravel@gmail.com\n- الهاتف: +216 23 777 771\n- واتساب: +216 23 777 771\n- ساعات العمل: الاثنين–السبت، 08:00–19:00\n\n---\n\n*آخر تحديث: يونيو 2026*",
                        ],
                    ],
                ],
                'purchase_policy' => [
                    'title' => [
                        'en' => 'Purchase Policy',
                        'fr' => "Politique d'Achat",
                        'ar' => 'سياسة الشراء',
                    ],
                    'body' => [
                        'format' => 'markdown',
                        'content' => [
                            'en' => "## 1. Introduction\n\nThis Purchase Policy governs all bookings and transactions made through Bel Azur Travel. By making a booking, you agree to be bound by this policy.\n\n## 2. Services Offered\n\nBel Azur Travel provides: Destination packages, Hotel reservations, Tours, Flights, Car rentals, Events, Deals & Promotions. All services are subject to availability.\n\n## 3. Booking Process\n\n1. Browse and select your desired service\n2. Review details, pricing, and availability\n3. Click \"Book Now\" and provide required information\n4. Review your booking summary\n5. Submit your booking request\n\nAll bookings start as **Pending** and are confirmed by our team. You will receive a notification when confirmed.\n\n## 4. Pricing and Payment\n\n- All prices are in **Tunisian Dinar (TND)**\n- Prices include applicable taxes unless stated otherwise\n- Payment is required to confirm your booking\n- A payment receipt with unique reference will be provided\n\n## 5. Cancellation Policy\n\n| Timing | Refund |\n|--------|--------|\n| More than 30 days before | 90% refund |\n| 15–30 days before | 50% refund |\n| 7–14 days before | 25% refund |\n| Less than 7 days before | No refund |\n| No-show | No refund |\n\nCancellations must be submitted in writing via the Platform or email.\n\n## 6. Changes and Modifications\n\n- Changes subject to availability\n- 10% modification fee may apply\n- Requests must be made at least 72 hours before start date\n- Service providers may change facilities or schedules; we will notify you of significant changes\n\n## 7. Travel Documents\n\nYou are responsible for valid travel documents:\n- Passport (valid 6+ months beyond travel dates)\n- Visas where required\n- Travel insurance (strongly recommended)\n- Driver's license for car rentals\n\n## 8. Travel Insurance\n\nWe **strongly recommend** comprehensive travel insurance covering: Trip cancellation, Medical expenses, Baggage loss, Personal liability, Flight disruptions.\n\n## 9. Liability\n\n- Bel Azur Travel acts as an intermediary between you and service providers\n- Our total liability shall not exceed the total booking amount\n- We are not liable for force majeure events\n\n### Force Majeure includes:\n- Natural disasters, pandemics, war, terrorism\n- Government actions, travel bans\n- Strikes, severe weather, infrastructure failures\n\n## 10. Customer Responsibilities\n\n- Provide accurate booking information\n- Comply with service provider terms\n- Respect local laws and customs\n- Report issues promptly to our support team\n\n## 11. Promotional Codes\n\n- Valid only for the specified period\n- Cannot be combined unless stated\n- Subject to usage limits and product restrictions\n- No cash value\n\n## 12. Complaints\n\n- Report issues during travel immediately via WhatsApp or phone\n- Submit formal complaints within 14 days of service completion\n- We will acknowledge within 48 hours and respond within 14 business days\n\n## 13. Governing Law\n\nGoverned by Tunisian law. Courts of Sousse have jurisdiction.\n\n## 14. Contact Us\n\n**Bel Azur Travel**\n- Address: 3e étage, imm. Ghannouchi, Trocadero, Senghor, Sousse, Tunisia\n- Email: belazurtravel@gmail.com\n- Phone: +216 23 777 771\n- WhatsApp: +216 23 777 771\n- Working hours: Monday–Saturday, 08:00–19:00\n\n---\n\n*Last updated: June 2026*",
                            'fr' => "## 1. Introduction\n\nLa présente Politique d'Achat régit toutes les réservations effectuées via Bel Azur Travel.\n\n## 2. Services Proposés\n\nDestinations, Hôtels, Circuits, Vols, Location de voitures, Événements, Offres. Tous les services sont soumis à disponibilité.\n\n## 3. Processus de Réservation\n\n1. Parcourez et sélectionnez le service souhaité\n2. Vérifiez les détails et le tarif\n3. Cliquez « Réserver » et fournissez les informations requises\n4. Vérifiez le résumé de votre réservation\n5. Soumettez votre demande\n\nToutes les réservations commencent en statut **En attente** et sont confirmées par notre équipe.\n\n## 4. Tarification et Paiement\n\n- Prix en **Dinar Tunisien (TND)**\n- Prix incluant la TVA applicable\n- Paiement requis pour confirmer la réservation\n- Reçu de paiement fourni\n\n## 5. Politique d'Annulation\n\n| Calendrier | Remboursement |\n|------------|---------------|\n| Plus de 30 jours avant | 90% |\n| 15–30 jours avant | 50% |\n| 7–14 jours avant | 25% |\n| Moins de 7 jours | Aucun |\n| Non-présentation | Aucun |\n\nLes annulations doivent être soumises par écrit.\n\n## 6. Changements\n\n- Soumis à disponibilité\n- Frais de modification de 10%\n- Demandes au moins 72h avant la date de départ\n- Les fournisseurs peuvent modifier les services ; nous vous informerons\n\n## 7. Documents de Voyage\n\nVous êtes responsable de vos documents :\n- Passeport valide 6 mois après le voyage\n- Visas requis\n- Assurance voyage (fortement recommandée)\n- Permis de conduire pour location\n\n## 8. Assurance Voyage\n\nFortement recommandée : Annulation, Frais médicaux, Bagages, Responsabilité civile, Retards de vol.\n\n## 9. Responsabilité\n\n- Bel Azur Travel agit en tant qu'intermédiaire\n- Notre responsabilité est limitée au montant de la réservation\n- Force majeure exclue\n\n## 10. Responsabilités du Client\n\n- Informations exactes\n- Respect des conditions des fournisseurs\n- Respect des lois locales\n- Signalement rapide des problèmes\n\n## 11. Codes Promotionnels\n\n- Validité limitée\n- Non cumulables sauf indication\n- Limites d'utilisation\n- Sans valeur en espèces\n\n## 12. Réclamations\n\n- Problèmes en voyage : contactez-nous immédiatement\n- Réclamations écrites sous 14 jours\n- Réponse sous 14 jours ouvrables\n\n## 13. Droit Applicable\n\nLoi tunisienne. Tribunaux de Sousse compétents.\n\n## 14. Contact\n\n**Bel Azur Travel**\n- Adresse : 3e étage, imm. Ghannouchi, Trocadero, Senghor, Sousse, Tunisie\n- Email : belazurtravel@gmail.com\n- Téléphone : +216 23 777 771\n- WhatsApp : +216 23 777 771\n- Heures : Lundi–Samedi, 08h00–19h00\n\n---\n\n*Dernière mise à jour : Juin 2026*",
                            'ar' => "## 1. المقدمة\n\nتحكم سياسة الشراء هذه جميع الحجوزات والمعاملات عبر بيل أزور للسفر.\n\n## 2. الخدمات المقدمة\n\nالوجهات، الفنادق، الجولات، رحلات الطيران، تأجير السيارات، الأحداث، العروض. جميع الخدمات عرضة للتوفر.\n\n## 3. عملية الحجز\n\n1. تصفح واختر الخدمة المطلوبة\n2. راجع التفاصيل والأسعار\n3. اضغط \"احجز الآن\" وقدم المعلومات المطلوبة\n4. راجع ملخص الحجز\n5. أرسل طلب الحrez\n\nتبدأ جميع الحجوزات بحالة **قيد الانتظار** وتؤكّد من قبل فريقنا.\n\n## 4. التسعير والمدفوعات\n\n- الأسعار بال**دينار التونسي (TND)**\n- تشمل الضرائب القابلة للتطبيق\n- الدفع مطلوب لتأكيد الحجز\n- يُقدم إيصال دفع برقم مرجعي\n\n## 5. سياسة الإلغاء\n\n| التوقيت | الاسترداد |\n|---------|----------|\n| أكثر من 30 يوماً | 90% |\n| 15–30 يوماً | 50% |\n| 7–14 يوماً | 25% |\n| أقل من 7 أيام | لا يوجد |\n| عدم الحضور | لا يوجد |\n\nيجب تقديم الإلغاء كتابياً.\n\n## 6. التغييرات\n\n- عرضة للتوفر\n- رسوم تعديل 10%\n- طلبات قبل 72 ساعة على الأقل\n- قد يغيّر المزودون خدماتهم ؛ سنوافيك\n\n## 7. وثائق السفر\n\nأنت مسؤول عن وثائقك:\n- جواز سفر صالح 6 أشهر بعد السفر\n- تأشيرات مطلوبة\n- تأمين سفر (يُوصى بشدة)\n- رخصة قيادة للتأجير\n\n## 8. تأمين السفر\n\nيُوصى بشدة: الإلغاء، النفقات الطبية، الأمتعة، المسؤولية القانونية، تأخر الرحلات.\n\n## 9. المسؤولية\n\n- بيل أزور للسفر كوسيط\n- مسؤوليتنا محدودة بمبلغ الحجز\n- القوة القاهرة مستثناة\n\n## 10. مسؤوليات العميل\n\n- معلومات دقيقة\n- احترام شروط المزودين\n- احترام القوانين المحلية\n- الإبلاغ الفوري عن المشاكل\n\n## 11. أكواد الترويج\n\n- صلاحية محدودة\n- غير قابلة للدمج ما لم يُذكر\n- حدود استخدام\n- بدون قيمة نقدية\n\n## 12. الشكاوى\n\n- مشاكل أثناء السفر: اتصل بنا فوراً\n- شكاوى كتابية خلال 14 يوماً\n- رد خلال 14 يوم عمل\n\n## 13. القانون الحاكم\n\nقانون تونسي. محاكم سوسة مختصة.\n\n## 14. اتصل بنا\n\n**بيل أزور للسفر**\n- العنوان: الطابق الثالث، مبنى الغنوشي، تروكادورو، سينغور، سوسة، تونس\n- البريد: belazurtravel@gmail.com\n- الهاتف: +216 23 777 771\n- واتساب: +216 23 777 771\n- ساعات العمل: الاثنين–السبت، 08:00–19:00\n\n---\n\n*آخر تحديث: يونيو 2026*",
                        ],
                    ],
                ],
            ],
        ];

        SiteSetting::query()->updateOrCreate(['id' => 1], $siteSettings);
    }

    public function run(): void
    {
        $hotelImageBasePath = '/storage/uploads/hotels';

        // La Badira
        $badiraDescFr = "Situé dans un quartier calme de Hammamet, La Badira est un établissement Adult Only 5 étoiles de luxe bénéficiant d'un emplacement stratégique : à 3,4 km de la médina, à 10,6 km de Yasmine Hammamet et à 73 km de l'aéroport de Tunis-Carthage.\n\nL'hôtel propose 120 chambres open-space avec vue sur la mer et 10 suites dont 6 avec piscine privée. Toutes équipées de douche italienne, literie brodée et oreillers de haute qualité.\n\nGastronomie sous la direction du chef exécutif Slim Bettaieb : restaurant de gastronomie tunisienne, restaurant de cuisine internationale, restaurant-grill en bord de plage et salon pour le petit-déjeuner. Deux cafés et deux bars complètent l'offre.\n\nBien-être : piscine intérieure chauffée, spa avec hammams et salle de yoga, salon de coiffure et nail bar, salle de fitness, centre équestre, club de plongée PADI, 3 parcours de golf 18 trous à proximité.";
        $badiraDescEn = "Located in a quiet area of Hammamet, La Badira is an adult-only 5-star luxury hotel, 3.4 km from the medina, 10.6 km from Yasmine Hammamet and 73 km from Tunis-Carthage Airport. It offers 120 open-space rooms with sea views and 10 suites, 6 of them with private pools. The property includes an indoor heated pool, spa with hammams, yoga room, fitness room, equestrian center, PADI dive club and nearby golf courses.";
        $badiraDescAr = "يقع لا باديرا في منطقة هادئة بهامامات، وهو فندق فاخر من فئة 5 نجوم ومخصص للبالغين فقط، على بعد 3.4 كم من المدينة العتيقة، و10.6 كم من ياسمين الحمامات، و73 كم من مطار تونس قرطاج. يضم 120 غرفة مفتوحة على البحر و10 أجنحة، منها 6 بأحواض سباحة خاصة، إضافة إلى مسبح داخلي مدفأ، وسبا مع حمامات تقليدية، وغرفة يوغا، وقاعة لياقة بدنية، ومركز للفروسية، ونادٍ للغوص، وحقول غولف قريبة.";

        $badira = Hotel::updateOrCreate(['slug' => 'hotel-badira'], [
            'code' => 'hotel-badira-001',
            'destination_slug' => 'hammamet',
            'name' => $this->loc('La Badira Adult Only', 'La Badira Adult Only', 'لا باديرا للبالغين فقط'),
            'location' => $this->loc('Route de Nabeul, Hammamet Nord', 'Route de Nabeul, Hammamet Nord', 'طريق نابل، الحمامات الشمالية'),
            'category_key' => 'luxury',
            'category' => $this->loc('Luxury', 'Luxe', 'فاخر'),
            'price' => 280,
            'rating' => 5,
            'stars' => 5,
            'reviews' => 286,
            'image' => $hotelImageBasePath.'/badira1.webp',
            'tags' => ['luxury', 'spa', 'beach'],
            'details' => [
                'gallery' => [
                    $hotelImageBasePath.'/badira1.webp',
                    $hotelImageBasePath.'/badira2.webp',
                    $hotelImageBasePath.'/badira3.webp',
                    $hotelImageBasePath.'/badira5.webp',
                ],
                'city' => $this->loc('Hammamet', 'Hammamet', 'الحمامات'),
                'country' => $this->loc('Tunisia', 'Tunisie', 'تونس'),
                'description' => $this->loc($badiraDescEn, $badiraDescFr, $badiraDescAr),
            ],
        ]);

        $this->syncAmenities($badira, [
            ['name' => $this->loc('Indoor heated pool', 'Piscine intérieure chauffée', 'مسبح داخلي مدفأ'), 'icon' => 'pool'],
            ['name' => $this->loc('Spa', 'Spa', 'سبا'), 'icon' => 'pool'],
            ['name' => $this->loc('Yoga room', 'Salle de yoga', 'غرفة يوغا'), 'icon' => 'gym'],
            ['name' => $this->loc('Fitness room', 'Salle de fitness', 'قاعة لياقة بدنية'), 'icon' => 'gym'],
            ['name' => $this->loc('Equestrian center', 'Centre équestre', 'مركز للفروسية'), 'icon' => 'gym'],
            ['name' => $this->loc('PADI dive club', 'Club de plongée PADI', 'نادي الغوص PADI'), 'icon' => 'pool'],
            ['name' => $this->loc('Golf nearby', 'Golf à proximité', 'حقول غولف قريبة'), 'icon' => 'gym'],
        ]);

        HotelRoom::updateOrCreate([
            'hotel_id' => $badira->id,
            'name_en' => 'Chambre Supérieure Vue Mer',
        ], [
            'name_fr' => 'Chambre Supérieure Vue Mer',
            'name_ar' => 'غرفة سوبيريور بإطلالة على البحر',
            'description_en' => 'Open-space room with panoramic sea view, Italian shower, and premium bedding.',
            'description_fr' => 'Chambre open-space avec vue panoramique sur la mer, douche italienne, literie haut de gamme.',
            'description_ar' => 'غرفة مفتوحة المساحة مع إطلالة بانورامية على البحر، ودش إيطالي، ومفروشات فاخرة.',
            'price_per_night' => 280,
            'capacity' => 2,
        ]);

        $this->syncRoomMedia($badira->rooms()->where('name_en', 'Chambre Supérieure Vue Mer')->firstOrFail(), [
            'Panoramic sea view',
            'Italian shower',
            'Premium bedding',
        ], [
            $hotelImageBasePath.'/badira2.webp',
            $hotelImageBasePath.'/badira3.webp',
        ]);

        HotelRoom::updateOrCreate([
            'hotel_id' => $badira->id,
            'name_en' => 'Suite avec Piscine Privée',
        ], [
            'name_fr' => 'Suite avec Piscine Privée',
            'name_ar' => 'جناح مع مسبح خاص',
            'description_en' => 'Exclusive suite with private pool, terrace, luxury bathroom and personalised service.',
            'description_fr' => 'Suite exclusive avec piscine privée, terrasse, salle de bain luxueuse et service personnalisé.',
            'description_ar' => 'جناح حصري مع مسبح خاص وتراس وحمام فاخر وخدمة مخصصة.',
            'price_per_night' => 650,
            'capacity' => 2,
        ]);

        $this->syncRoomMedia($badira->rooms()->where('name_en', 'Suite avec Piscine Privée')->firstOrFail(), [
            'Private pool',
            'Terrace',
            'Luxury bathroom',
            'Personalised service',
        ], [
            $hotelImageBasePath.'/badira3.webp',
            $hotelImageBasePath.'/badira5.webp',
        ]);

        // Iberostar
        $iberostarDescFr = "Situé à Yasmine Hammamet, à proximité de la Médina et de Carthage Land, l'Iberostar Waves Averroes dispose de 256 chambres (suites, simples et doubles) avec décor élégant et vues sur jardin ou mer.\n\nÉquipements en chambre : climatisation individuelle, salle de bain avec baignoire et bidet, TV satellite, téléphone, sèche-cheveux. Service en chambre 24h/24.\n\nRestauration : Le Laurier (cuisine internationale), L'Olivier Italian Restaurant, snack-bar et épicerie fine.\n\nLoisirs : 2 grandes piscines dont une couverte et une enfants, espace spa avec sauna, hammam et cabines de massage, salle de fitness, terrain de volley, sports nautiques (ski nautique, planche à voile). À proximité : Yasmine Golf et Yasmine Marina. Wi-Fi et parking gratuits.";
        $iberostarDescEn = "Located in Yasmine Hammamet, near the medina and Carthage Land, Iberostar Waves Averroes has 256 rooms, suites, singles and doubles with elegant décor and garden or sea views. Rooms include individual air conditioning, a bathroom with bathtub and bidet, satellite TV, telephone and hairdryer, with 24-hour room service. Dining includes Le Laurier, L'Olivier Italian Restaurant, a snack bar and fine grocery shop. Leisure facilities include two large pools, a spa with sauna, hammam and massage cabins, fitness room, volleyball court and water sports.";
        $iberostarDescAr = "يقع فندق إيبيروستار ويڤز أفيروز في ياسمين الحمامات، بالقرب من المدينة العتيقة وكارطاج لاند. يضم 256 غرفة وجناحًا وغرفًا فردية ومزدوجة بديكور أنيق وإطلالات على الحديقة أو البحر. تشمل المرافق تكييفًا فرديًا وحمامًا مع حوض استحمام وبيديه وتلفازًا فضائيًا وهاتفًا ومجفف شعر، مع خدمة الغرف على مدار الساعة. وتضم المطاعم لو لوريي، ولوفيلييه الإيطالي، وبارًا خفيفًا ومتجرًا فاخرًا. كما تتوفر مسابح ومنتجع صحي وساونا وحمام تقليدي وغرف مساج وقاعة لياقة رياضية ورياضات مائية.";

        $iberostar = Hotel::updateOrCreate(['slug' => 'hotel-iberostar'], [
            'code' => 'hotel-iberostar-001',
            'destination_slug' => 'yasmine-hammamet',
            'name' => $this->loc('Iberostar Waves Averroes', 'Iberostar Waves Averroes', 'إيبيروستار ويڤز أفيروز'),
            'location' => $this->loc('Zone Touristique Yasmine Hammamet', 'Zone Touristique Yasmine Hammamet', 'المنطقة السياحية ياسمين الحمامات'),
            'category_key' => 'resort',
            'category' => $this->loc('Resort', 'Resort', 'منتجع'),
            'price' => 195,
            'rating' => 5,
            'stars' => 5,
            'reviews' => 412,
            'image' => $hotelImageBasePath.'/iberostar1.webp',
            'tags' => ['family', 'spa', 'all-inclusive'],
            'details' => [
                'gallery' => [
                    $hotelImageBasePath.'/iberostar1.webp',
                    $hotelImageBasePath.'/iberostar2.webp',
                    $hotelImageBasePath.'/iberostar3.webp',
                ],
                'city' => $this->loc('Yasmine Hammamet', 'Yasmine Hammamet', 'ياسمين الحمامات'),
                'country' => $this->loc('Tunisia', 'Tunisie', 'تونس'),
                'description' => $this->loc($iberostarDescEn, $iberostarDescFr, $iberostarDescAr),
            ],
        ]);

        $this->syncAmenities($iberostar, [
            ['name' => $this->loc('Two large pools', 'Deux grandes piscines', 'مسابح كبيرة'), 'icon' => 'pool'],
            ['name' => $this->loc('Spa', 'Spa', 'سبا'), 'icon' => 'pool'],
            ['name' => $this->loc('Sauna', 'Sauna', 'ساونا'), 'icon' => 'gym'],
            ['name' => $this->loc('Hammam', 'Hammam', 'حمام تقليدي'), 'icon' => 'pool'],
            ['name' => $this->loc('Massage cabins', 'Cabines de massage', 'غرف مساج'), 'icon' => 'gym'],
            ['name' => $this->loc('Fitness room', 'Salle de fitness', 'قاعة لياقة بدنية'), 'icon' => 'gym'],
            ['name' => $this->loc('Water sports', 'Sports nautiques', 'رياضات مائية'), 'icon' => 'pool'],
        ]);

        HotelRoom::updateOrCreate([
            'hotel_id' => $iberostar->id,
            'name_en' => 'Chambre Double Vue Jardin',
        ], [
            'name_fr' => 'Chambre Double Vue Jardin',
            'name_ar' => 'غرفة مزدوجة بإطلالة على الحديقة',
            'description_en' => 'Double room with garden view, air conditioning, satellite TV and 24-hour service.',
            'description_fr' => 'Chambre double avec vue jardin, climatisation, TV satellite, service 24h/24.',
            'description_ar' => 'غرفة مزدوجة مع إطلالة على الحديقة وتكييف وتلفاز فضائي وخدمة على مدار الساعة.',
            'price_per_night' => 195,
            'capacity' => 2,
        ]);

        $this->syncRoomMedia($iberostar->rooms()->where('name_en', 'Chambre Double Vue Jardin')->firstOrFail(), [
            'Garden view',
            'Air conditioning',
            'Satellite TV',
            '24-hour room service',
        ], [
            $hotelImageBasePath.'/iberostar2.webp',
            $hotelImageBasePath.'/iberostar3.webp',
        ]);

        HotelRoom::updateOrCreate([
            'hotel_id' => $iberostar->id,
            'name_en' => 'Suite Vue Mer',
        ], [
            'name_fr' => 'Suite Vue Mer',
            'name_ar' => 'جناح مطل على البحر',
            'description_en' => 'Spacious suite with sea view, separate lounge and hydromassage bathtub.',
            'description_fr' => 'Suite spacieuse avec vue sur la mer, salon séparé, baignoire hydromassante.',
            'description_ar' => 'جناح واسع بإطلالة على البحر وصالة منفصلة وحوض استحمام دوّامي.',
            'price_per_night' => 390,
            'capacity' => 3,
        ]);

        $this->syncRoomMedia($iberostar->rooms()->where('name_en', 'Suite Vue Mer')->firstOrFail(), [
            'Sea view',
            'Separate lounge',
            'Hydromassage bathtub',
        ], [
            $hotelImageBasePath.'/iberostar1.webp',
            $hotelImageBasePath.'/iberostar3.webp',
        ]);

        // Concorde
        $concordeDescFr = "Le Barcelo Concorde Green Park Palace est idéalement situé à 5 minutes à pied du Port El Kantaoui et à 10 minutes en voiture de la Médina de Sousse. L'aéroport de Monastir se trouve à 20 km.\n\n452 chambres luxueuses avec balcon ou terrasse (vue mer ou montagne), salle de bain privée avec baignoire/douche, TV écran plat, réfrigérateur, coffre-fort. Suites prestiges avec baignoire hydromassage.\n\n5 restaurants : buffet principal, La Torreta (italien), restaurant piscine, El Jem (arabo-oriental), Le Pêcheur (méditerranéen). Bars avec cocktails locaux et internationaux.\n\nLoisirs : grande piscine extérieure, piscine enfants, piscine couverte chauffée, court de tennis, terrain polyvalent, centre de fitness, mini-club enfants. Wi-Fi et parking gratuits.";
        $concordeDescEn = "Barcelo Concorde Green Park Palace is ideally located 5 minutes on foot from Port El Kantaoui and 10 minutes by car from the Medina of Sousse, with Monastir Airport 20 km away. It offers 452 luxurious rooms with balcony or terrace, sea or mountain views, private bathrooms, flat-screen TVs, refrigerators and safes. There are five restaurants, several bars, outdoor and indoor pools, tennis courts, a fitness center and a kids' club.";
        $concordeDescAr = "يقع بارسيلو كونكورد غرين بارك بالاس في موقع مثالي على بعد 5 دقائق سيرًا من ميناء القنطاوي و10 دقائق بالسيارة من مدينة سوسة العتيقة، بينما يبعد مطار المنستير 20 كم. يضم 452 غرفة فاخرة بشرفات أو تراسات وإطلالات على البحر أو الجبل، وحمامات خاصة وتلفازًا مسطحًا وثلاجة وخزنة. كما يحتوي على خمسة مطاعم وعدة بارات ومسابح داخلية وخارجية وملاعب تنس ومركز لياقة ونادٍ للأطفال.";

        $concorde = Hotel::updateOrCreate(['slug' => 'hotel-concorde'], [
            'code' => 'hotel-concorde-001',
            'destination_slug' => 'sousse',
            'name' => $this->loc('Barcelo Concorde Green Park Palace', 'Barcelo Concorde Green Park Palace', 'بارسيلو كونكورد غرين بارك بالاس'),
            'location' => $this->loc('Port El Kantaoui', 'Port El Kantaoui', 'ميناء القنطاوي'),
            'category_key' => 'beach',
            'category' => $this->loc('Beach Resort', 'Hôtel de plage', 'منتجع شاطئي'),
            'price' => 220,
            'rating' => 5,
            'stars' => 5,
            'reviews' => 351,
            'image' => $hotelImageBasePath.'/concorde1.webp',
            'tags' => ['beach', 'family', 'pool'],
            'details' => [
                'gallery' => [
                    $hotelImageBasePath.'/concorde1.webp',
                    $hotelImageBasePath.'/concorde2.webp',
                    $hotelImageBasePath.'/concorde3.webp',
                ],
                'city' => $this->loc('Sousse', 'Sousse', 'سوسة'),
                'country' => $this->loc('Tunisia', 'Tunisie', 'تونس'),
                'description' => $this->loc($concordeDescEn, $concordeDescFr, $concordeDescAr),
            ],
        ]);

        $this->syncAmenities($concorde, [
            ['name' => $this->loc('Outdoor pool', 'Piscine extérieure', 'مسبح خارجي'), 'icon' => 'pool'],
            ['name' => $this->loc('Indoor heated pool', 'Piscine intérieure chauffée', 'مسبح داخلي مدفأ'), 'icon' => 'pool'],
            ['name' => $this->loc('Tennis court', 'Court de tennis', 'ملعب تنس'), 'icon' => 'gym'],
            ['name' => $this->loc('Fitness center', 'Centre de fitness', 'مركز لياقة بدنية'), 'icon' => 'gym'],
            ['name' => $this->loc('Kids club', 'Club enfants', 'نادي للأطفال'), 'icon' => 'group'],
            ['name' => $this->loc('Restaurants and bars', 'Restaurants et bars', 'مطاعم وبارات'), 'icon' => 'restaurant'],
        ]);

        HotelRoom::updateOrCreate([
            'hotel_id' => $concorde->id,
            'name_en' => 'Chambre Standard Vue Mer',
        ], [
            'name_fr' => 'Chambre Standard Vue Mer',
            'name_ar' => 'غرفة قياسية بإطلالة على البحر',
            'description_en' => 'Luxury room with sea-view balcony, flat-screen TV, refrigerator and safe.',
            'description_fr' => 'Chambre luxueuse avec balcon vue mer, TV écran plat, réfrigérateur, coffre-fort.',
            'description_ar' => 'غرفة فاخرة مع شرفة مطلة على البحر وتلفاز مسطح وثلاجة وخزنة.',
            'price_per_night' => 220,
            'capacity' => 2,
        ]);

        $this->syncRoomMedia($concorde->rooms()->where('name_en', 'Chambre Standard Vue Mer')->firstOrFail(), [
            'Sea-view balcony',
            'Flat-screen TV',
            'Refrigerator',
            'Safe',
        ], [
            $hotelImageBasePath.'/concorde2.webp',
            $hotelImageBasePath.'/concorde3.webp',
        ]);

        HotelRoom::updateOrCreate([
            'hotel_id' => $concorde->id,
            'name_en' => 'Suite Familiale',
        ], [
            'name_fr' => 'Suite Familiale',
            'name_ar' => 'جناح عائلي',
            'description_en' => 'Family suite with a seating area, sofa bed, dressing room and hydromassage bathtub.',
            'description_fr' => 'Suite familiale avec coin salon canapé-lit, dressing room et baignoire hydromassage.',
            'description_ar' => 'جناح عائلي مع ركن جلوس وأريكة قابلة للتحويل وغرفة ملابس وحوض استحمام دوّامي.',
            'price_per_night' => 420,
            'capacity' => 4,
        ]);

        $this->syncRoomMedia($concorde->rooms()->where('name_en', 'Suite Familiale')->firstOrFail(), [
            'Seating area',
            'Sofa bed',
            'Dressing room',
            'Hydromassage bathtub',
        ], [
            $hotelImageBasePath.'/concorde1.webp',
            $hotelImageBasePath.'/concorde3.webp',
        ]);

        // Occidental
        $occDescFr = "L'Occidental Sousse Marhaba est idéalement situé au cœur de la zone touristique de Sousse, à 20 km de l'aéroport de Monastir et à 40 km de l'aéroport d'Enfidha.\n\n240 chambres spacieuses rénovées en 2018, réparties autour de magnifiques jardins tropicaux, alliant luxe et confort.\n\nRestauration : restaurant buffet cuisine internationale, barbecue au bord de l'eau, bar animé piscine et club de plage.\n\nLoisirs : 2 piscines extérieures (dont une avec toboggans), piscine intérieure, centre de bien-être 300 m² avec sauna et massage, tennis, discothèque, club enfants. Navettes aéroport gratuites, Wi-Fi, accessible en fauteuil roulant.";
        $occDescEn = "Occidental Sousse Marhaba is ideally located in the heart of Sousse's tourist area, 20 km from Monastir Airport and 40 km from Enfidha Airport. It offers 240 spacious rooms renovated in 2018, surrounded by tropical gardens. Dining includes an international buffet, water-side barbecue, pool bar and beach club. Leisure facilities include two outdoor pools, an indoor pool, a wellness center, tennis, a disco and a kids' club.";
        $occDescAr = "يقع أوكسيدنتال سوسة مرحبا في قلب المنطقة السياحية بسوسة، على بعد 20 كم من مطار المنستير و40 كم من مطار النفيضة. يضم 240 غرفة فسيحة تم تجديدها سنة 2018، وتحيط بها حدائق استوائية جميلة. تتوفر مطاعم بنظام البوفيه ومطعم شواء على الماء وبار مسبح ونادٍ شاطئي، إضافة إلى مسابح خارجية وداخلية ومركز عافية ونادٍ للأطفال وخدمة نقل مجانية من وإلى المطار.";

        $occ = Hotel::updateOrCreate(['slug' => 'hotel-occidental'], [
            'code' => 'hotel-occidental-001',
            'destination_slug' => 'sousse',
            'name' => $this->loc('Occidental Sousse Marhaba', 'Occidental Sousse Marhaba', 'أوكسيدنتال سوسة مرحبا'),
            'location' => $this->loc('Zone Touristique, Sousse', 'Zone Touristique, Sousse', 'المنطقة السياحية، سوسة'),
            'category_key' => 'family',
            'category' => $this->loc('Family Resort', 'Hôtel familial', 'منتجع عائلي'),
            'price' => 140,
            'rating' => 4,
            'stars' => 4,
            'reviews' => 248,
            'image' => $hotelImageBasePath.'/occidental1.webp',
            'tags' => ['family', 'wellness', 'waterpark'],
            'details' => [
                'gallery' => [
                    $hotelImageBasePath.'/occidental1.webp',
                    $hotelImageBasePath.'/occidental2.webp',
                    $hotelImageBasePath.'/occidental3.webp',
                    $hotelImageBasePath.'/occidental4.webp',
                ],
                'city' => $this->loc('Sousse', 'Sousse', 'سوسة'),
                'country' => $this->loc('Tunisia', 'Tunisie', 'تونس'),
                'description' => $this->loc($occDescEn, $occDescFr, $occDescAr),
            ],
        ]);

        $this->syncAmenities($occ, [
            ['name' => $this->loc('Outdoor pools', 'Piscines extérieures', 'مسابح خارجية'), 'icon' => 'pool'],
            ['name' => $this->loc('Indoor pool', 'Piscine intérieure', 'مسبح داخلي'), 'icon' => 'pool'],
            ['name' => $this->loc('Wellness center', 'Centre de bien-être', 'مركز عافية'), 'icon' => 'gym'],
            ['name' => $this->loc('Sauna', 'Sauna', 'ساونا'), 'icon' => 'gym'],
            ['name' => $this->loc('Massage', 'Massage', 'مساج'), 'icon' => 'gym'],
            ['name' => $this->loc('Kids club', 'Club enfants', 'نادي للأطفال'), 'icon' => 'group'],
            ['name' => $this->loc('Free airport shuttle', 'Navette aéroport gratuite', 'خدمة نقل مجانية من وإلى المطار'), 'icon' => 'car'],
        ]);

        HotelRoom::updateOrCreate([
            'hotel_id' => $occ->id,
            'name_en' => 'Chambre Standard',
        ], [
            'name_fr' => 'Chambre Standard',
            'name_ar' => 'غرفة قياسية',
            'description_en' => 'Spacious room renovated in 2018, tropical garden, fully modern equipment.',
            'description_fr' => 'Chambre spacieuse rénovée 2018, jardin tropical, tout équipement moderne.',
            'description_ar' => 'غرفة فسيحة تم تجديدها سنة 2018، مطلة على حديقة استوائية ومجهزة بكل المرافق الحديثة.',
            'price_per_night' => 140,
            'capacity' => 2,
        ]);

        $this->syncRoomMedia($occ->rooms()->where('name_en', 'Chambre Standard')->firstOrFail(), [
            'Renovated in 2018',
            'Tropical garden',
            'Modern equipment',
        ], [
            $hotelImageBasePath.'/occidental2.webp',
            $hotelImageBasePath.'/occidental3.webp',
        ]);

        HotelRoom::updateOrCreate([
            'hotel_id' => $occ->id,
            'name_en' => 'Chambre Familiale',
        ], [
            'name_fr' => 'Chambre Familiale',
            'name_ar' => 'غرفة عائلية',
            'description_en' => 'Large family room with extra beds and easy pool access.',
            'description_fr' => 'Grande chambre pour familles avec lits supplémentaires et accès piscine facilité.',
            'description_ar' => 'غرفة عائلية واسعة مع أسرّة إضافية وسهولة الوصول إلى المسبح.',
            'price_per_night' => 210,
            'capacity' => 4,
        ]);

        $this->syncRoomMedia($occ->rooms()->where('name_en', 'Chambre Familiale')->firstOrFail(), [
            'Extra beds',
            'Pool access',
        ], [
            $hotelImageBasePath.'/occidental3.webp',
            $hotelImageBasePath.'/occidental4.webp',
        ]);

        // Tours
        $omraIncludes = [
            'Visa Omra',
            'Billet d\'avion aller-retour',
            'Hébergement La Mecque (proche Haram)',
            'Hébergement Médine (proche Mosquée du Prophète)',
            'Transports bus climatisés',
            'Visites des sites de Médine',
            'Cours religieux quotidiens',
            'Accompagnateurs professionnels',
        ];

        Tour::updateOrCreate(['slug' => 'tour-omra-2026'], [
            'name' => $this->loc('Omra Shawwal 2026', 'Omra Shawwal 2026', 'عمرة شوال 2026'),
            'description' => $this->loc('Special Omra Shawwal 2026 offer — starting from 4,150 TND per person.', 'Offre spéciale Omra Shawwal 2026 – à partir de 4 150 TND par personne.', 'عرض خاص لعمرة شوال 2026 ابتداءً من 4150 دينارًا للشخص الواحد.'),
            'location' => $this->loc('La Mecque & Médine, Saudi Arabia', 'La Mecque & Médine, Arabie Saoudite', 'مكة المكرمة والمدينة المنورة، المملكة العربية السعودية'),
            'category_key' => 'religious',
            'category' => $this->loc('Religious Tour', 'Voyage religieux', 'رحلة دينية'),
            'duration' => $this->loc('15 days / 14 nights', '15 jours / 14 nuits', '15 يوم / 14 ليلة'),
            'duration_days' => 15,
            'duration_nights' => 14,
            'max_group' => 45,
            'price' => 4150,
            'rating' => 4.9,
            'image' => 'https://images.unsplash.com/photo-1591825729269-caeb344f6df2?w=800&q=80',
            'includes' => $omraIncludes,
            'images' => ['https://images.unsplash.com/photo-1591825729269-caeb344f6df2?w=800&q=80'],
            'details' => [
                'tags' => ['departure-2026-03-29', 'return-2026-04-12', 'limited-seats'],
            ],
        ]);

        Tour::updateOrCreate(['slug' => 'tour-sud-tunisie'], [
            'name' => $this->loc('Southern Circuit — Douz & Tozeur', 'Circuit Sud — Douz & Tozeur', 'جولة الجنوب — دوز وتوزر'),
            'description' => $this->loc('A magical journey into the Tunisian desert: Douz dunes, Tozeur oasis, Chott el-Jérid and Berber villages.', 'Découverte magique du désert tunisien : dunes de Douz, oasis de Tozeur, Chott el-Jérid et villages berbères.', 'رحلة ساحرة إلى الصحراء التونسية: كثبان دوز، واحة توزر، شط الجريد، والقرى الأمازيغية.'),
            'location' => $this->loc('Douz, Tozeur, Sahara – Tunisia', 'Douz, Tozeur, Sahara – Tunisie', 'دوز، توزر، الصحراء – تونس'),
            'category_key' => 'adventure',
            'category' => $this->loc('Adventure Tour', 'Circuit aventure', 'رحلة مغامرة'),
            'duration' => $this->loc('4 days / 3 nights', '4 jours / 3 nuits', '4 أيام / 3 ليالٍ'),
            'duration_days' => 4,
            'duration_nights' => 3,
            'max_group' => 30,
            'price' => 589,
            'rating' => 4.7,
            'image' => 'https://images.unsplash.com/photo-1509600110300-21b9d5fedeb7?w=800&q=80',
            'includes' => ['Transport aller-retour depuis Sousse', 'Hébergement 3 nuits en hôtel', 'Petits-déjeuners et dîners', 'Guide professionnel', 'Balade à dos de chameau', 'Entrées sites touristiques'],
            'images' => ['https://images.unsplash.com/photo-1509600110300-21b9d5fedeb7?w=800&q=80'],
            'details' => [
                'tags' => ['douz', 'tozeur', 'chott-el-jérid'],
            ],
        ]);

        Tour::updateOrCreate(['slug' => 'tour-istanbul-2026'], [
            'name' => $this->loc('Istanbul 2026', 'Istanbul 2026', 'إسطنبول 2026'),
            'description' => $this->loc('Discover Istanbul, the city across two continents: Hagia Sophia, the Blue Mosque, the Grand Bazaar, the Golden Horn and the Bosphorus.', 'Découvrez Istanbul, ville aux deux continents : Sainte-Sophie, la Mosquée Bleue, le Grand Bazar, la Corne d\'Or et le Bosphore.', 'اكتشف إسطنبول، مدينة القارتين: آيا صوفيا، الجامع الأزرق، البازار الكبير، القرن الذهبي، ومضيق البوسفور.'),
            'location' => $this->loc('Istanbul, Turkey', 'Istanbul, Turquie', 'إسطنبول، تركيا'),
            'category_key' => 'city',
            'category' => $this->loc('City Tour', 'Voyage urbain', 'جولة مدينة'),
            'duration' => $this->loc('7 days / 6 nights', '7 jours / 6 nuits', '7 أيام / 6 ليالٍ'),
            'duration_days' => 7,
            'duration_nights' => 6,
            'max_group' => 25,
            'price' => 1690,
            'rating' => 4.8,
            'image' => 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80',
            'includes' => ['Billet d\'avion aller-retour', 'Hébergement 6 nuits en hôtel 4*', 'Petits-déjeuners inclus', 'Transferts aéroport', 'Visites guidées', 'Guide francophone'],
            'images' => ['https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80'],
            'details' => [
                'tags' => ['hagia-sophia', 'blue-mosque', 'bosphorus', 'grand-bazaar'],
            ],
        ]);

        $this->seedSiteSettings();

        Cache::forget('hotels.index');
        Cache::forget('hotels.hotel-badira');
        Cache::forget('hotels.hotel-iberostar');
        Cache::forget('hotels.hotel-concorde');
        Cache::forget('hotels.hotel-occidental');
        Cache::forget('tours.index');
        Cache::forget('tours.tour-omra-2026');
        Cache::forget('tours.tour-sud-tunisie');
        Cache::forget('tours.tour-istanbul-2026');
        Cache::forget('site-settings:en');
        Cache::forget('site-settings:fr');
        Cache::forget('site-settings:ar');
        Cache::forget('site_settings_nav');
    }
}
