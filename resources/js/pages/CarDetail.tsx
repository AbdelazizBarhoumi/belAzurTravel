import { motion } from 'framer-motion';
import { Check, ChevronLeft, Fuel, Settings2, Users } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Footer } from '@/components/Footer';
import { Gallery } from '@/components/Gallery';
import { Navbar } from '@/components/Navbar';
import { StickyBookingCard } from '@/components/StickyBookingCard';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Lang } from '@/i18n/translations';
import { carsData, type CarItem, type LocalizedText } from '../data/cars.data';

function localize(value: LocalizedText, lang: Lang): string {
	return value[lang];
}

export default function CarDetail() {
	const { slug } = useParams<{ slug: string }>();
	const { t, lang } = useLanguage();

	const car = carsData.find((item: CarItem) => item.slug === slug);

	if (!car) {
		return (
			<div className="min-h-screen bg-background">
				<Navbar />
				<main className="pb-16 pt-32">
					<div className="container mx-auto px-4 text-center">
						<h1 className="mb-4 font-serif text-3xl font-bold text-foreground">
							{t('carsDetail.notFound')}
						</h1>
						<Button asChild>
							<Link to="/cars">{t('carsDetail.backToCars')}</Link>
						</Button>
					</div>
				</main>
				<Footer />
			</div>
		);
	}

	const gallery = car.gallery?.length ? car.gallery : [car.image];

	return (
		<div className="min-h-screen bg-background">
			<Navbar />

			<main className="pb-16 pt-24">
				<div className="container mx-auto px-4">
					<div className="mb-8">
						<Breadcrumb
							items={[
								{ label: t('common.home'), href: '/' },
								{ label: t('nav.cars'), href: '/cars' },
								{ label: localize(car.name, lang), active: true },
							]}
						/>
					</div>

					<Link
						to="/cars"
						className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
					>
						<ChevronLeft className="h-4 w-4" /> {t('carsDetail.backToCars')}
					</Link>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="grid gap-10 lg:grid-cols-[2fr_1fr]"
					>
						<div className="flex flex-col">
							<Gallery images={gallery} hotelName={localize(car.name, lang)} />

							<section className="mt-8 grid gap-4 md:grid-cols-3">
								<div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
									<div className="text-sm text-muted-foreground">{t('carsDetail.seats')}</div>
									<div className="mt-2 flex items-center gap-2 text-foreground">
										<Users className="h-4 w-4 text-primary" />
										{car.seats}
									</div>
								</div>
								<div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
									<div className="text-sm text-muted-foreground">{t('carsDetail.fuel')}</div>
									<div className="mt-2 flex items-center gap-2 text-foreground">
										<Fuel className="h-4 w-4 text-primary" />
										{localize(car.fuel, lang)}
									</div>
								</div>
								<div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
									<div className="text-sm text-muted-foreground">{t('carsDetail.gearbox')}</div>
									<div className="mt-2 flex items-center gap-2 text-foreground">
										<Settings2 className="h-4 w-4 text-primary" />
										{localize(car.transmission, lang)}
									</div>
								</div>
							</section>

							<section className="mt-8 max-w-3xl">
								<h2 className="mb-4 font-serif text-2xl font-bold text-foreground">
									{t('carsDetail.features')}
								</h2>
								<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
									{car.features.map((feature) => (
										<div key={feature} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
											<Check className="h-4 w-4 shrink-0 text-primary" />
											<span className="text-sm text-foreground">{feature}</span>
										</div>
									))}
								</div>
							</section>

							<section className="mt-8 max-w-3xl">
								<h2 className="mb-4 font-serif text-2xl font-bold text-foreground">
									{t('carsDetail.policy')}
								</h2>
								<ul className="space-y-3">
									{car.policy.map((rule) => (
										<li key={rule} className="flex items-start gap-2 text-sm text-muted-foreground">
											<span className="mt-1 h-2 w-2 rounded-full bg-primary" />
											<span>{rule}</span>
										</li>
									))}
								</ul>
							</section>
						</div>

						<aside>
							<StickyBookingCard
								price={car.price}
								currency="$"
								title={localize(car.name, lang)}
								location={localize(car.category, lang)}
								description={t('carsDetail.summary')}
								type={localize(car.category, lang)}
								onBook={() => window.open('/contact', '_self')}
								onWhatsApp={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${localize(car.name, lang)} - ${localize(car.category, lang)}`)}`, '_blank')}
							/>
						</aside>
					</motion.div>
				</div>
			</main>

			<Footer />
		</div>
	);
}
