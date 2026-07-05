import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface FilterSidebarProps {
    title: string;
    hasActiveFilters: boolean;
    onClearAll: () => void;
    clearLabel: string;
    dir?: string;
    children: ReactNode;
}

export function FilterSidebar({
    title,
    hasActiveFilters,
    onClearAll,
    clearLabel,
    dir,
    children,
}: FilterSidebarProps) {
    return (
        <motion.aside
            initial={{ opacity: 0, x: dir === 'rtl' ? 100 : -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="hidden flex-shrink-0 md:block md:w-72"
        >
            <div className="sticky top-24 rounded-3xl border border-border bg-card p-6">
                <div className="mb-6 flex items-center justify-between gap-4">
                    <h2 className="font-serif text-lg font-bold text-foreground">
                        {title}
                    </h2>
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={onClearAll}
                            className="text-xs font-medium text-primary hover:underline"
                        >
                            {clearLabel}
                        </button>
                    )}
                </div>
                <div className="space-y-6">
                    {children}
                </div>
            </div>
        </motion.aside>
    );
}
