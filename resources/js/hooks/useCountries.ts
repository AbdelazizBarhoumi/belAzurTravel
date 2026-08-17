import { useMemo } from 'react';
import {
    COUNTRIES,
    findCountryByCodeOrEnglishName,
    getCitiesByCountry,
    type CityItem,
    type CountryItem,
    type LocalizedName,
} from '@/data/locations';

export type { CityItem, CountryItem, LocalizedName };

export interface StateItem {
    code: string;
    countryCode: string;
    name: LocalizedName;
}

export function useCountries(): CountryItem[] {
    return useMemo(() => COUNTRIES, []);
}

const NO_STATES: StateItem[] = [];

export function useStates(_countryCode: string | null): StateItem[] {
    return NO_STATES;
}

export function useCities(countryCode: string | null): CityItem[] {
    return useMemo(() => getCitiesByCountry(countryCode), [countryCode]);
}

export function useCountryByCode(code: string | null): CountryItem | null {
    return useMemo(() => {
        if (!code) return null;
        return findCountryByCodeOrEnglishName(code) ?? null;
    }, [code]);
}