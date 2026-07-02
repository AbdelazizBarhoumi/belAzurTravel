import type { PublicCategory, PublicCategoryType } from '@/hooks/usePublicData';

let inFlightRequest: Promise<PublicCategory[]> | null = null;

export function clearCachedCategories(): void {
    inFlightRequest = null;
}

export async function fetchAllCategories(
    fetcher: () => Promise<PublicCategory[]>,
): Promise<PublicCategory[]> {
    if (!inFlightRequest) {
        inFlightRequest = fetcher()
            .then((data) => data)
            .finally(() => {
                inFlightRequest = null;
            });
    }

    return inFlightRequest;
}

let inFlightCategoryTypes: Promise<PublicCategoryType[]> | null = null;

export function clearCachedCategoryTypes(): void {
    inFlightCategoryTypes = null;
}

export async function fetchAllCategoryTypes(
    fetcher: () => Promise<PublicCategoryType[]>,
): Promise<PublicCategoryType[]> {
    if (!inFlightCategoryTypes) {
        inFlightCategoryTypes = fetcher()
            .then((data) => data)
            .finally(() => {
                inFlightCategoryTypes = null;
            });
    }

    return inFlightCategoryTypes;
}
