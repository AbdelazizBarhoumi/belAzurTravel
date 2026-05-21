import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from '@/api/http';
import { useCategories } from '@/hooks/usePublicData';

vi.mock('@/api/http', () => ({
    apiFetch: vi.fn(),
}));

type CategorySnapshot = {
    data: Array<{ key: string; entity_type: string }> | undefined;
    isPending: boolean;
    isFetching: boolean;
    isError: boolean;
};

interface HookProbeProps {
    type?: string;
    onResult: (snapshot: CategorySnapshot) => void;
}

function HookProbe({ type, onResult }: HookProbeProps): JSX.Element | null {
    const result = useCategories(type);

    useEffect(() => {
        onResult(result);
    }, [onResult, result]);

    return null;
}

function renderWithQueryClient(
    type: string | undefined,
    onResult: (snapshot: CategorySnapshot) => void,
) {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

    return render(
        <QueryClientProvider client={queryClient}>
            <HookProbe type={type} onResult={onResult} />
        </QueryClientProvider>,
    );
}

describe('useCategories', () => {
    beforeEach(() => {
        vi.mocked(apiFetch).mockReset();
    });

    it('fetches the shared categories payload once and filters client-side', async () => {
        vi.mocked(apiFetch).mockResolvedValueOnce({
            data: [
                { key: 'beach', entity_type: 'destinations' },
                { key: 'city', entity_type: 'destinations' },
                { key: 'hotel', entity_type: 'hotels' },
            ],
        } as never);

        let latest: CategorySnapshot | undefined;

        renderWithQueryClient('destinations', (snapshot) => {
            latest = snapshot;
        });

        await waitFor(() => expect(latest?.isPending).toBe(false));

        expect(vi.mocked(apiFetch)).toHaveBeenCalledTimes(1);
        expect(vi.mocked(apiFetch)).toHaveBeenCalledWith('/api/categories');
        expect(latest?.data?.map((category) => category.key)).toEqual([
            'beach',
            'city',
        ]);
    });

    it('dedupes concurrent navbar-style category requests', async () => {
        vi.mocked(apiFetch).mockResolvedValueOnce({
            data: [
                { key: 'beach', entity_type: 'destinations' },
                { key: 'city', entity_type: 'destinations' },
                { key: 'hotel', entity_type: 'hotels' },
            ],
        } as never);

        let destinations: CategorySnapshot | undefined;
        let hotels: CategorySnapshot | undefined;

        function DualProbe(): JSX.Element | null {
            const destinationResult = useCategories('destinations');
            const hotelResult = useCategories('hotels');

            useEffect(() => {
                destinations = destinationResult;
                hotels = hotelResult;
            }, [destinationResult, hotelResult]);

            return null;
        }

        const queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });

        render(
            <QueryClientProvider client={queryClient}>
                <DualProbe />
            </QueryClientProvider>,
        );

        await waitFor(() => expect(destinations?.isPending).toBe(false));
        await waitFor(() => expect(hotels?.isPending).toBe(false));

        expect(vi.mocked(apiFetch)).toHaveBeenCalledTimes(1);
        expect(destinations?.data?.map((category) => category.key)).toEqual([
            'beach',
            'city',
        ]);
        expect(hotels?.data?.map((category) => category.key)).toEqual([
            'hotel',
        ]);
    });
});