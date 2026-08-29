import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
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

const LANG: Lang = 'fr';

export function LanguageProvider({ children }: { children: ReactNode }) {
    const t = (key: string) => translate(key, LANG);

    return (
        <LanguageContext.Provider
            value={{ lang: LANG, setLang: () => {}, t, dir: 'ltr' }}
        >
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
