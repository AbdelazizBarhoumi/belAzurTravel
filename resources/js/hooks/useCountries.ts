import { Country, State, City } from 'country-state-city';
import countries from 'i18n-iso-countries';
import ar from 'i18n-iso-countries/langs/ar.json';
import en from 'i18n-iso-countries/langs/en.json';
import fr from 'i18n-iso-countries/langs/fr.json';
import { useMemo } from 'react';

countries.registerLocale(en);
countries.registerLocale(fr);
countries.registerLocale(ar);

export interface LocalizedName {
    en: string;
    fr: string;
    ar: string;
}

export interface CountryItem {
    code: string;
    name: LocalizedName;
}

export interface StateItem {
    code: string;
    countryCode: string;
    name: LocalizedName;
}

export interface CityItem {
    name: LocalizedName;
    stateCode: string;
    countryCode: string;
}

export function useCountries() {
    return useMemo(() => {
        return Country.getAllCountries().map((c) => ({
            code: c.isoCode,
            name: {
                en: countries.getName(c.isoCode, 'en') || c.name,
                fr: countries.getName(c.isoCode, 'fr') || c.name,
                ar: countries.getName(c.isoCode, 'ar') || c.name,
            },
        }));
    }, []);
}

export function useStates(countryCode: string | null) {
    return useMemo(() => {
        if (!countryCode) return [];
        return State.getStatesOfCountry(countryCode).map((s) => ({
            code: s.isoCode,
            countryCode: s.countryCode,
            name: {
                en: s.name,
                fr: s.name,
                ar: s.name,
            },
        }));
    }, [countryCode]);
}

export function useCities(countryCode: string | null, stateCode?: string) {
    return useMemo(() => {
        if (!countryCode) return [];
        const cities = stateCode
            ? City.getCitiesOfState(countryCode, stateCode)
            : City.getCitiesOfCountry(countryCode);
        return (cities || []).map((c) => ({
            name: {
                en: c.name,
                fr: c.name,
                ar: c.name,
            },
            stateCode: c.stateCode,
            countryCode: c.countryCode,
        }));
    }, [countryCode, stateCode]);
}

export function useCountryByCode(code: string | null) {
    return useMemo(() => {
        if (!code) return null;
        const country = Country.getCountryByCode(code);
        if (!country) return null;
        return {
            code: country.isoCode,
            name: {
                en: countries.getName(country.isoCode, 'en') || country.name,
                fr: countries.getName(country.isoCode, 'fr') || country.name,
                ar: countries.getName(country.isoCode, 'ar') || country.name,
            },
        };
    }, [code]);
}
