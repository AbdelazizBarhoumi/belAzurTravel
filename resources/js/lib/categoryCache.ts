import type { PublicCategory } from '@/hooks/usePublicData';

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
