import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { csrfToken } from '@/api/http';
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
        // Add a class to allow stronger CSS targeting for Arabic mode
        if (dir === 'rtl') {
            document.documentElement.classList.add('lang-ar');
        } else {
            document.documentElement.classList.remove('lang-ar');
        }
        localStorage.setItem('lang', lang);
    }, [lang, dir]);

    const setLang = (l: Lang) => {
        setLangState(l);
        void fetch('/api/user/language', {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken(),
            },
            body: JSON.stringify({ language: l }),
        }).catch(() => undefined);
    };
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
