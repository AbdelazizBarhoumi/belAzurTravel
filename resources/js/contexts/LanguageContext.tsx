import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo } from 'react';
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
    const LANG: Lang = 'fr';
    const t = useCallback((key: string) => translate(key, LANG), []);
    const dir: 'ltr' | 'rtl' = 'ltr';

    const value = useMemo(
        () => ({ lang: LANG, setLang: () => {}, t, dir }),
        [t, dir],
    );

    return (
        <LanguageContext.Provider value={value}>
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
