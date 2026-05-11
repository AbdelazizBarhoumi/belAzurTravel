import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import type { Lang } from '@/i18n/translations';
import { t as translate } from '@/i18n/translations';

interface LanguageContextValue {
    lang: Lang;
    setLang: (l: Lang) => void;
    t: (key: string) => string;
    dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextValue | undefined>(
    undefined,
);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [lang, setLangState] = useState<Lang>(() => {
        const saved = (typeof window !== 'undefined' &&
            localStorage.getItem('lang')) as Lang | null;
        return saved === 'ar' || saved === 'fr' || saved === 'en'
            ? saved
            : 'fr';
    });

    const dir: 'ltr' | 'rtl' = lang === 'ar' ? 'rtl' : 'ltr';

    useEffect(() => {
        document.documentElement.lang = lang;
        document.documentElement.dir = dir;
        localStorage.setItem('lang', lang);
    }, [lang, dir]);

    const setLang = (l: Lang) => setLangState(l);
    const t = (key: string) => translate(key, lang);

    return (
        <LanguageContext.Provider value={{ lang, setLang, t, dir }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const ctx = useContext(LanguageContext);
    if (!ctx)
        throw new Error('useLanguage must be used within LanguageProvider');
    return ctx;
}
