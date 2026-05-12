import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, Cloud, DollarSign, Globe, MapPin, Star, Check } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import destBali from '@/assets/dest-bali.jpg';
import destDubai from '@/assets/dest-dubai.jpg';
import destParis from '@/assets/dest-paris.jpg';
import destSantorini from '@/assets/dest-santorini.jpg';
import { FavoriteButton } from '@/components/FavoriteButton';
import { Footer } from '@/components/Footer';
import { Gallery } from '@/components/Gallery';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Lang } from '@/i18n/translations';

type LocalizedText = Record<Lang, string>;

function localize(value: LocalizedText, lang: Lang): string {
	return value[lang];
}

interface DestinationItem {
	slug: string;
	name: LocalizedText;
	country: LocalizedText;
	image: string;
	gallery: string[];
	rating: number;
	price: number;
	category: string;
	description: LocalizedText;
	about: LocalizedText;
	highlights: string[];
	bestTime: LocalizedText;
	language: LocalizedText;
	currency: LocalizedText;
	weather: LocalizedText;
}

interface HotelItem {
	slug: string;
	name: string;
	image: string;
	price: number;
	destinationSlug: string;
}

interface TourItem {
	slug: string;
	name: LocalizedText;
	location: LocalizedText;
	duration: LocalizedText;
	price: number;
	image: string;
}

const DESTINATIONS: DestinationItem[] = [
	{
		slug: 'santorini',
		name: { fr: 'Santorin', ar: 'سانتوريني', en: 'Santorini' },
		country: { fr: 'Grèce', ar: 'اليونان', en: 'Greece' },
		image: destSantorini,
		gallery: [
			destSantorini,
			'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&h=900&fit=crop',
			'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1600&h=900&fit=crop',
		],
		rating: 4.9,
		price: 1299,
		category: 'Beach',
		description: {
			fr: 'Bâtiments blanchis à la chaux emblématiques surplombant la mer Égée.',
			ar: 'مبانٍ بيضاء أيقونية تطل على بحر إيجه.',
			en: 'Iconic whitewashed buildings overlooking the Aegean Sea.',
		},
		about: {
			fr: 'Santorin offre des couchers de soleil de carte postale, des villages à flanc de falaise et une atmosphère romantique idéale pour une escapade inoubliable.',
			ar: 'تقدم سانتوريني غروب شمس خلاب وقرى على المنحدرات وأجواء رومانسية مثالية لرحلة لا تُنسى.',
			en: 'Santorini delivers postcard sunsets, cliffside villages, and a romantic atmosphere ideal for an unforgettable escape.',
		},
		highlights: ['Sunset caldera views', 'Whitewashed cliff villages', 'Wine tasting experiences'],
		bestTime: { fr: 'Printemps et début d’été', ar: 'الربيع وبداية الصيف', en: 'Spring and early summer' },
		language: { fr: 'Grec', ar: 'اليونانية', en: 'Greek' },
		currency: { fr: 'Euro', ar: 'اليورو', en: 'Euro' },
		weather: { fr: 'Climat doux et ensoleillé', ar: 'طقس معتدل ومشمس', en: 'Mild and sunny climate' },
	},
	{
		slug: 'bali',
		name: { fr: 'Bali', ar: 'بالي', en: 'Bali' },
		country: { fr: 'Indonésie', ar: 'إندونيسيا', en: 'Indonesia' },
		image: destBali,
		gallery: [
			destBali,
			'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=1600&h=900&fit=crop',
			'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=1600&h=900&fit=crop',
		],
		rating: 4.8,
		price: 899,
		category: 'Nature',
		description: {
			fr: 'Rizières luxuriantes, temples et paradis tropical.',
			ar: 'مدرجات أرز خضراء ومعابد وجنة استوائية.',
			en: 'Lush rice terraces, temples, and tropical paradise.',
		},
		about: {
			fr: 'Bali combine bien-être, aventure et culture dans un décor tropical chaleureux qui convient aussi bien aux couples qu’aux familles.',
			ar: 'تجمع بالي بين العافية والمغامرة والثقافة في أجواء استوائية دافئة تناسب الأزواج والعائلات.',
			en: 'Bali blends wellness, adventure, and culture in a warm tropical setting that suits couples and families alike.',
		},
		highlights: ['Rice terrace walks', 'Balinese temple rituals', 'Spa and wellness retreats'],
		bestTime: { fr: 'Mai à octobre', ar: 'من مايو إلى أكتوبر', en: 'May to October' },
		language: { fr: 'Indonésien', ar: 'الإندونيسية', en: 'Indonesian' },
		currency: { fr: 'Roupie indonésienne', ar: 'الروبية الإندونيسية', en: 'Indonesian rupiah' },
		weather: { fr: 'Chaud et tropical', ar: 'حار واستوائي', en: 'Warm and tropical' },
	},
	{
		slug: 'paris',
		name: { fr: 'Paris', ar: 'باريس', en: 'Paris' },
		country: { fr: 'France', ar: 'فرنسا', en: 'France' },
		image: destParis,
		gallery: [
			destParis,
			'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&h=900&fit=crop',
			'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1600&h=900&fit=crop',
		],
		rating: 4.9,
		price: 1499,
		category: 'City',
		description: {
			fr: 'La Ville Lumière avec de l’art, de la gastronomie et de la culture de classe mondiale.',
			ar: 'مدينة النور مع فن وطعام وثقافة عالمية المستوى.',
			en: 'The City of Light with world-class art, food, and culture.',
		},
		about: {
			fr: 'Paris séduit par ses musées, ses cafés, ses promenades le long de la Seine et son élégance intemporelle.',
			ar: 'تأسر باريس الزوار بمتاحفها ومقاهيها ونزهاتها على ضفاف السين وأناقتها الخالدة.',
			en: 'Paris charms with museums, cafés, Seine-side strolls, and timeless elegance.',
		},
		highlights: ['Louvre and Seine walks', 'Gourmet dining scene', 'Iconic landmark views'],
		bestTime: { fr: 'Avril à juin', ar: 'من أبريل إلى يونيو', en: 'April to June' },
		language: { fr: 'Français', ar: 'الفرنسية', en: 'French' },
		currency: { fr: 'Euro', ar: 'اليورو', en: 'Euro' },
		weather: { fr: 'Doux au printemps', ar: 'معتدل في الربيع', en: 'Mild in spring' },
	},
	{
		slug: 'dubai',
		name: { fr: 'Dubaï', ar: 'دبي', en: 'Dubai' },
		country: { fr: 'Émirats Arabes Unis', ar: 'الإمارات العربية المتحدة', en: 'UAE' },
		image: destDubai,
		gallery: [
			destDubai,
			'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600&h=900&fit=crop',
			'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1600&h=900&fit=crop',
		],
		rating: 4.7,
		price: 1199,
		category: 'Luxury',
		description: {
			fr: 'Une silhouette futuriste rencontre des aventures dans le désert.',
			ar: 'أفق مستقبلي يلتقي بمغامرات الصحراء.',
			en: 'Futuristic skyline meets desert adventures.',
		},
		about: {
			fr: 'Dubaï allie shopping, plages, vues vertigineuses et escapades désertiques dans une destination ultra-moderne.',
			ar: 'تجمع دبي بين التسوق والشواطئ والإطلالات المدهشة ورحلات الصحراء في وجهة حديثة للغاية.',
			en: 'Dubai combines shopping, beaches, skyline views, and desert escapes in a highly modern destination.',
		},
		highlights: ['Desert safaris', 'Skyline viewing decks', 'Luxury beachfront resorts'],
		bestTime: { fr: 'Novembre à mars', ar: 'من نوفمبر إلى مارس', en: 'November to March' },
		language: { fr: 'Arabe et anglais', ar: 'العربية والإنجليزية', en: 'Arabic and English' },
		currency: { fr: 'Dirham des EAU', ar: 'الدرهم الإماراتي', en: 'UAE dirham' },
		weather: { fr: 'Chaud et sec', ar: 'حار وجاف', en: 'Hot and dry' },
	},
];

const HOTELS: HotelItem[] = [
	{ slug: 'sunset-paradise-resort', name: 'Sunset Paradise Resort', image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=500&fit=crop', price: 320, destinationSlug: 'santorini' },
	{ slug: 'cliffside-boutique-santorini', name: 'Cliffside Boutique Santorini', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&h=500&fit=crop', price: 410, destinationSlug: 'santorini' },
	{ slug: 'paris-grand-hotel', name: 'Le Grand Parisien', image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=500&fit=crop', price: 450, destinationSlug: 'paris' },
	{ slug: 'dubai-skyline-stay', name: 'Marina Bay Suites', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=500&fit=crop', price: 280, destinationSlug: 'dubai' },
	{ slug: 'bali-garden-villas', name: 'Ubud Garden Villas', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=500&fit=crop', price: 220, destinationSlug: 'bali' },
];

const TOURS: TourItem[] = [
	{ slug: 'greek-island-hopping', name: { fr: 'Îles Grecques en Liberté', ar: 'جولة الجزر اليونانية', en: 'Greek Island Hopping' }, location: { fr: 'Grèce', ar: 'اليونان', en: 'Greece' }, duration: { fr: '7 Jours', ar: '7 أيام', en: '7 Days' }, price: 2499, image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800&h=500&fit=crop' },
	{ slug: 'bali-cultural-immersion', name: { fr: 'Immersion Culturelle à Bali', ar: 'انغمس في ثقافة بالي', en: 'Bali Cultural Immersion' }, location: { fr: 'Indonésie', ar: 'إندونيسيا', en: 'Indonesia' }, duration: { fr: '10 Jours', ar: '10 أيام', en: '10 Days' }, price: 1899, image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=500&fit=crop' },
	{ slug: 'paris-art-gastronomy', name: { fr: 'Paris: Art et Gastronomie', ar: 'باريس: الفن والطعام', en: 'Parisian Art & Gastronomy' }, location: { fr: 'France', ar: 'فرنسا', en: 'France' }, duration: { fr: '5 Jours', ar: '5 أيام', en: '5 Days' }, price: 3200, image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=500&fit=crop' },
];

export default function DestinationDetail() {
	const { slug } = useParams<{ slug: string }>();
	const { t, lang } = useLanguage();

	const destination = DESTINATIONS.find((item) => item.slug === slug);

	if (!destination) {
		return (
			<div className="min-h-screen bg-background">
				<Navbar />
				<main className="pb-16 pt-32">
					<div className="container mx-auto px-4 text-center">
						<h1 className="mb-4 font-serif text-3xl font-bold text-foreground">
							{t('destinationDetail.notFound')}
						</h1>
						<Button asChild>
							<Link to="/destinations">{t('destinationDetail.backToDestinations')}</Link>
						</Button>
					</div>
				</main>
				<Footer />
			</div>
		);
	}

	const relatedHotels = HOTELS.filter((hotel) => hotel.destinationSlug === destination.slug);
	const relatedTours = TOURS.filter((tour) => localize(tour.location, lang).toLowerCase().includes(localize(destination.country, lang).toLowerCase()) || localize(tour.location, 'en').toLowerCase().includes(localize(destination.country, 'en').toLowerCase()));

	return (
		<div className="min-h-screen bg-background">
			<Navbar />

			<main className="pb-16 pt-24">
				<div className="container mx-auto px-4">
					<Link
						to="/destinations"
						className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
					>
						<ChevronLeft className="h-4 w-4" /> {t('destinationDetail.backToDestinations')}
					</Link>

					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 grid gap-8 lg:grid-cols-3">
						<div className="lg:col-span-2">
							<Gallery images={destination.gallery} hotelName={localize(destination.name, lang)} />
						</div>

						<aside className="bg-card h-fit rounded-3xl p-6 card-elevated border border-border">
							<div className="mb-3 flex items-start justify-between gap-4">
								<div>
									<p className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
										<MapPin className="h-3 w-3" /> {localize(destination.country, lang)}
									</p>
									<h1 className="font-serif text-3xl font-bold text-foreground">{localize(destination.name, lang)}</h1>
								</div>
								<FavoriteButton
									item={{
										id: `dest-${destination.slug}`,
										type: 'destination',
										name: localize(destination.name, lang),
										image: destination.image,
										price: destination.price,
										location: localize(destination.country, lang),
									}}
								/>
							</div>

							<div className="mb-4 flex items-center gap-1 text-secondary">
								<Star className="h-4 w-4 fill-current" />
								<span className="font-bold">{destination.rating}</span>
								<span className="text-sm text-muted-foreground">· {destination.category}</span>
							</div>

							<p className="mb-6 text-sm text-muted-foreground">{localize(destination.description, lang)}</p>

							<div className="space-y-3 border-t border-border pt-4 text-sm">
								<div className="flex justify-between gap-4">
									<span className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /> {t('destinationDetail.bestTime')}</span>
									<span className="font-medium text-foreground text-right">{localize(destination.bestTime, lang)}</span>
								</div>
								<div className="flex justify-between gap-4">
									<span className="flex items-center gap-2 text-muted-foreground"><Globe className="h-4 w-4" /> {t('destinationDetail.language')}</span>
									<span className="font-medium text-foreground text-right">{localize(destination.language, lang)}</span>
								</div>
								<div className="flex justify-between gap-4">
									<span className="flex items-center gap-2 text-muted-foreground"><DollarSign className="h-4 w-4" /> {t('destinationDetail.currency')}</span>
									<span className="font-medium text-foreground text-right">{localize(destination.currency, lang)}</span>
								</div>
								<div className="flex justify-between gap-4">
									<span className="flex items-center gap-2 text-muted-foreground"><Cloud className="h-4 w-4" /> {t('destinationDetail.weather')}</span>
									<span className="font-medium text-foreground text-right">{localize(destination.weather, lang)}</span>
								</div>
							</div>

							<div className="mt-6 border-t border-border pt-4">
								<p className="mb-1 text-xs text-muted-foreground">{t('destinationDetail.startingFrom')}</p>
								<p className="mb-4 text-3xl font-bold text-primary">${destination.price.toLocaleString()}</p>
								<Button asChild className="w-full bg-primary text-primary-foreground">
									<Link to={`/design-trip?destination=${destination.slug}`}>{t('destinationDetail.planTrip')}</Link>
								</Button>
							</div>
						</aside>
					</motion.div>

					<section className="mb-12 max-w-3xl">
						<h2 className="mb-4 font-serif text-2xl font-bold text-foreground">
							{t('destinationDetail.about')} {localize(destination.name, lang)}
						</h2>
						<p className="leading-relaxed text-muted-foreground">{localize(destination.about, lang)}</p>
					</section>

					<section className="mb-12">
						<h2 className="mb-4 font-serif text-2xl font-bold text-foreground">{t('destinationDetail.highlights')}</h2>
						<div className="grid max-w-3xl gap-3 sm:grid-cols-2">
							{destination.highlights.map((highlight) => (
								<div key={highlight} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
									<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
										<Check className="h-4 w-4 text-primary" />
									</div>
									<span className="text-sm text-foreground">{highlight}</span>
								</div>
							))}
						</div>
					</section>

					{relatedHotels.length > 0 && (
						<section className="mb-12">
							<h2 className="mb-4 font-serif text-2xl font-bold text-foreground">{t('destinationDetail.whereToStay')}</h2>
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{relatedHotels.map((hotel) => (
									<Link key={hotel.slug} to={`/hotels/${hotel.slug}`} className="group overflow-hidden rounded-2xl bg-card card-elevated">
										<div className="h-40 overflow-hidden">
											<img src={hotel.image} alt={hotel.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
										</div>
										<div className="p-4">
											<h3 className="font-serif font-bold text-foreground">{hotel.name}</h3>
											<p className="mt-1 text-xs text-muted-foreground">{t('destinationDetail.startingFrom')} ${hotel.price}/night</p>
										</div>
									</Link>
								))}
							</div>
						</section>
					)}

					{relatedTours.length > 0 && (
						<section>
							<h2 className="mb-4 font-serif text-2xl font-bold text-foreground">{t('destinationDetail.suggestedTours')}</h2>
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{relatedTours.map((tour) => (
									<Link key={tour.slug} to={`/tours/${tour.slug}`} className="group overflow-hidden rounded-2xl bg-card card-elevated">
										<div className="h-40 overflow-hidden">
											<img src={tour.image} alt={localize(tour.name, lang)} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
										</div>
										<div className="p-4">
											<h3 className="font-serif font-bold text-foreground">{localize(tour.name, lang)}</h3>
											<p className="mt-1 text-xs text-muted-foreground">{localize(tour.duration, lang)} · {t('destinationDetail.startingFrom')} ${tour.price.toLocaleString()}</p>
										</div>
									</Link>
								))}
							</div>
						</section>
					)}
				</div>
			</main>

			<Footer />
		</div>
	);
}
