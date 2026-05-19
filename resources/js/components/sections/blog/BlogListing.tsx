import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { ListFilterBar } from '@/components/lists/ListFilterBar';
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
import { useBlogPosts, useCategories } from '@/hooks/usePublicData';
import type { Lang } from '@/i18n/translations';
import { matchesSearchText } from '@/lib/listFilters';

type LocalizedText = Record<Lang, string>;

function localize(value: LocalizedText, lang: Lang): string {
    return value[lang];
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
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [currentPage, setCurrentPage] = useState(1);

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
            posts.filter((post) => {
                const matchesSearch = matchesSearchText(searchQuery, [
                    localize(post.title, lang),
                    localize(post.excerpt, lang),
                    localize(post.category, lang),
                ]);
                const matchesCategory =
                    selectedCategory === 'all' ||
                    post.category_key === selectedCategory;

                return matchesSearch && matchesCategory;
            }),
        [posts, lang, searchQuery, selectedCategory],
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
        searchQuery.trim().length > 0 || selectedCategory !== 'all';
    const pageCount = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
    const paginatedPosts = filteredPosts.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
    );

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategory('all');
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
                </ListFilterBar>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    {paginatedPosts.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground md:col-span-3">
                            {t('common.noResults')}
                        </div>
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
                                            {post.date}
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
