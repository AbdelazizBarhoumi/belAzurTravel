import { useQuery } from '@tanstack/react-query';
import { fetchCategoryTypes, type CategoryType } from '@/api/categoryTypes.api';

export type { CategoryType };

export function useCategoryTypes(entityType: string) {
    return useQuery<CategoryType[]>({
        queryKey: ['admin', 'category-types', entityType],
        queryFn: () => fetchCategoryTypes(entityType),
        staleTime: 0,
        refetchOnMount: true,
    });
}
