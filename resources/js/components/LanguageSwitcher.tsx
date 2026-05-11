import { Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export function LanguageSwitcher() {
    const { lang, setLang } = useLanguage();
    return (
        <div className="flex items-center gap-1 rounded-full border border-border bg-card px-2 py-1 text-xs">
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            <button
                onClick={() => setLang('fr')}
                className={`rounded-full px-2 py-0.5 font-semibold transition-colors ${
                    lang === 'fr'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                }`}
            >
                FR
            </button>
            <button
                onClick={() => setLang('en')}
                className={`rounded-full px-2 py-0.5 font-semibold transition-colors ${
                    lang === 'en'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                }`}
            >
                EN
            </button>
            <button
                onClick={() => setLang('ar')}
                className={`rounded-full px-2 py-0.5 font-semibold transition-colors ${
                    lang === 'ar'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                }`}
            >
                ع
            </button>
        </div>
    );
}
