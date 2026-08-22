import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { FilterRenderer } from '@/components/filters/FilterRenderer';
import { ListFilterBar } from '@/components/lists/ListFilterBar';
import { RequestThingEmptyState } from '@/components/lists/RequestThingEmptyState';
import CardMedia from '@/components/ui/CardMedia';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    useBlogPosts,
    useCategories,
    useCategoryTypesPublic,
} from '@/hooks/usePublicData';
import type { Lang } from '@/i18n/translations';
import { matchesSearchText } from '@/lib/listFilters';

type LocalizedText = Record<Lang, string>;

function localize(value: LocalizedText, lang: Lang): string {
    return value[lang];
}

function formatBlogDate(date: string, lang: Lang): string {
    const locale = lang === 'ar' ? 'ar-EG' : lang === 'fr' ? 'fr-FR' : 'en-US';

    try {
        return new Intl.DateTimeFormat(locale, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(new Date(date));
    } catch {
        return date;
    }
}

interface BlogListingProps {
    pageSize?: number;
}

export function BlogListing({ pageSize = 6 }: BlogListingProps) {
    const { t, lang } = useLanguage();
    const [params] = useSearchParams();
    const initialSearch = params.get('q') || '';
    const initialCategory = params.get('cat')?.toLowerCase() || 'all';

    const { data: posts = [] } = useBlogPosts();
    const { data: dynamicCategories = [] } = useCategories('blog');
    const { data: categoryTypes = [] } = useCategoryTypesPublic('blog');
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [currentPage, setCurrentPage] = useState(1);

    // Category type filters from URL params
    const initialCategoryTypeFilters = useMemo(() => {
        const filters: Record<string, string[]> = {};
        for (const [key, val] of params.entries()) {
            if (key.startsWith('category_')) {
                const typeKey = key.slice('category_'.length);
                filters[typeKey] = val.split(',').filter(Boolean);
            }
        }
        return filters;
    }, [params]);
    const [categoryTypeFilters, setCategoryTypeFilters] = useState<
        Record<string, string[]>
    >(initialCategoryTypeFilters);

    const categories = useMemo(
        () => [
            { value: 'all', label: t('common.all') },
            ...dynamicCategories.map((c) => ({
                value: c.key,
                label: c.name[lang] || c.name.en,
            })),
        ],
        [dynamicCategories, lang, t],
    );

    const filteredPosts = useMemo(
        () =>
            (Array.isArray(posts) ? posts : []).filter((post) => {
                const matchesSearch = matchesSearchText(searchQuery, [
                    localize(post.title, lang),
                    localize(post.excerpt, lang),
                    localize(post.category, lang),
                ]);
                const matchesCategory =
                    selectedCategory === 'all' ||
                    post.category_key === selectedCategory;

                // Category type filters
                const assignments = (post as unknown as Record<string, unknown>)
                    .category_assignments as Record<string, string> | undefined;
                const activeTypeFilters = Object.entries(
                    categoryTypeFilters,
                ).filter(([, v]) => v.length > 0);
                const matchesCategoryTypes =
                    activeTypeFilters.length === 0 ||
                    activeTypeFilters.some(
                        ([typeKey, values]) =>
                            assignments &&
                            values.includes(assignments[typeKey]),
                    );

                return matchesSearch && matchesCategory && matchesCategoryTypes;
            }),
        [posts, lang, searchQuery, selectedCategory, categoryTypeFilters],
    );

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setCurrentPage(1);
    };

    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category);
        setCurrentPage(1);
    };

    const hasActiveFilters =
        searchQuery.trim().length > 0 ||
        selectedCategory !== 'all' ||
        Object.values(categoryTypeFilters).some((v) => v.length > 0);
    const pageCount = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
    const paginatedPosts = filteredPosts.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
    );

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategory('all');
        setCategoryTypeFilters({});
    };

    return (
        <section key={params.toString()} className="bg-background py-12">
            <div className="container mx-auto px-4">
                <ListFilterBar
                    searchValue={searchQuery}
                    onSearchChange={handleSearchChange}
                    resultCount={filteredPosts.length}
                    hasActiveFilters={hasActiveFilters}
                    onClearFilters={clearFilters}
                    searchPlaceholder={t('common.search')}
                    className="mb-10"
                >
                    <div className="flex flex-wrap gap-2">
                        {categories.map((category) => (
                            <button
                                key={category.value}
                                type="button"
                                onClick={() =>
                                    handleCategoryChange(category.value)
                                }
                                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${selectedCategory === category.value ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-muted-foreground hover:text-foreground'}`}
                            >
                                {category.label}
                            </button>
                        ))}
                    </div>
                    {categoryTypes.length > 0 && (
                        <div className="mt-3 space-y-3">
                            {categoryTypes.map((catType) => (
                                <FilterRenderer
                                    key={catType.key}
                                    categoryType={catType as never}
                                    selectedValues={
                                        categoryTypeFilters[catType.key] ?? []
                                    }
                                    onChange={(values) =>
                                        setCategoryTypeFilters((prev) => ({
                                            ...prev,
                                            [catType.key]: values,
                                        }))
                                    }
                                    lang={lang}
                                />
                            ))}
                        </div>
                    )}
                </ListFilterBar>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    {paginatedPosts.length === 0 ? (
                        <RequestThingEmptyState
                            variant={
                                posts.length === 0 ? 'empty' : 'no-results'
                            }
                            className="md:col-span-3"
                        />
                    ) : (
                        paginatedPosts.map((post, i) => (
                            <Link
                                key={post.slug}
                                to={`/blog/${post.slug}`}
                                className="group block"
                            >
                                <motion.article
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="group cursor-pointer"
                                >
                                    <div className="card-elevated mb-5 overflow-hidden rounded-2xl">
                                        <CardMedia
                                            src={post.image}
                                            alt={localize(post.title, lang)}
                                            wrapperClass="h-56"
                                            imgClass="transition-transform duration-500 group-hover:scale-105"
                                        />
                                    </div>
                                    <div className="mb-3 flex items-center gap-3">
                                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                            {localize(post.category, lang)}
                                        </span>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            {formatBlogDate(post.date, lang)}
                                        </div>
                                    </div>
                                    <h3 className="mb-2 font-serif text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                                        {localize(post.title, lang)}
                                    </h3>
                                    <p className="text-sm leading-relaxed text-muted-foreground">
                                        {localize(post.excerpt, lang)}
                                    </p>
                                </motion.article>
                            </Link>
                        ))
                    )}
                </div>

                {pageCount > 1 && (
                    <Pagination className="mt-12">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    onClick={(event) => {
                                        event.preventDefault();
                                        setCurrentPage((current) =>
                                            Math.max(1, current - 1),
                                        );
                                    }}
                                    aria-disabled={currentPage === 1}
                                />
                            </PaginationItem>
                            {Array.from(
                                { length: pageCount },
                                (_, index) => index + 1,
                            ).map((page) => (
                                <PaginationItem key={page}>
                                    <PaginationLink
                                        href="#"
                                        isActive={page === currentPage}
                                        onClick={(event) => {
                                            event.preventDefault();
                                            setCurrentPage(page);
                                        }}
                                    >
                                        {page}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    onClick={(event) => {
                                        event.preventDefault();
                                        setCurrentPage((current) =>
                                            Math.min(pageCount, current + 1),
                                        );
                                    }}
                                    aria-disabled={currentPage === pageCount}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                )}
            </div>
        </section>
    );
}
