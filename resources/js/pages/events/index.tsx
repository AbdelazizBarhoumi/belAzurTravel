import { motion } from 'framer-motion';
import { Calendar, MapPin, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { ListFilterBar } from '@/components/lists/ListFilterBar';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import { useEvents } from '@/hooks/usePublicData';
import { matchesSearchText } from '@/lib/listFilters';

const ALL = 'all';

const Events = () => {
    const { t, lang } = useLanguage();
    const { data: events = [] } = useEvents();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLocation, setSelectedLocation] = useState(ALL);

    const locationOptions = useMemo(() => Array.from(new Set(events.map((event) => localizeText(event.location, lang)))), [events, lang]);

    const filteredEvents = useMemo(() => events.filter((event) => {
        const matchesSearch = matchesSearchText(searchQuery, [localizeText(event.title, lang), localizeText(event.location, lang), localizeText(event.date, lang), localizeText(event.attendees, lang), localizeText(event.description, lang), localizeText(event.about, lang)]);
        const matchesLocation = selectedLocation === ALL || localizeText(event.location, lang) === selectedLocation;
        return matchesSearch && matchesLocation;
    }), [events, lang, searchQuery, selectedLocation]);

    const hasActiveFilters = searchQuery.trim().length > 0 || selectedLocation !== ALL;

    const clearFilters = () => { setSearchQuery(''); setSelectedLocation(ALL); };

    return (
        <PageShell titleKey="events.title" subtitleKey="events.subtitle" breadcrumbs={[{ label: t('common.home'), href: '/' }, { label: t('nav.events'), active: true }]}>
            <ListFilterBar searchValue={searchQuery} onSearchChange={setSearchQuery} resultCount={filteredEvents.length} hasActiveFilters={hasActiveFilters} onClearFilters={clearFilters} searchPlaceholder={t('common.search')}>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2">
                    <label className="grid gap-2 text-sm">
                        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">{t('events.filterByLocation')}</span>
                        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                            <SelectTrigger aria-label={t('events.filterByLocation')} className="h-12 rounded-2xl border-border/70 bg-background/90 shadow-sm">
                                <SelectValue placeholder={t('common.all')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL}>{t('common.all')}</SelectItem>
                                {locationOptions.map((option) => (<SelectItem key={option} value={option}>{option}</SelectItem>))}
                            </SelectContent>
                        </Select>
                    </label>
                </div>
            </ListFilterBar>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {filteredEvents.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground md:col-span-2">{t('common.noResults')}</div>
                ) : (
                    filteredEvents.map((e, i) => (
                        <motion.div key={e.slug} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card-elevated group overflow-hidden rounded-2xl bg-card">
                            <div className="h-56 overflow-hidden"><img src={e.image} alt={localizeText(e.title, lang)} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy"/></div>
                            <div className="p-6">
                                <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {localizeText(e.date, lang)}</span>
                                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {localizeText(e.location, lang)}</span>
                                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {localizeText(e.attendees, lang)}</span>
                                </div>
                                <h3 className="mb-2 font-serif text-xl font-bold text-foreground">{localizeText(e.title, lang)}</h3>
                                <p className="mb-5 text-sm text-muted-foreground">{localizeText(e.description, lang)}</p>
                                <Button asChild className="bg-primary text-primary-foreground"><Link to={`/events/${e.slug}`}>{t('common.viewDetails')}</Link></Button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </PageShell>
    );
};

export default Events;
