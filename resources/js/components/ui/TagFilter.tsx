import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface Tag {
    id: string;
    name: Record<'fr' | 'ar' | 'en', string>;
    color?: string;
}

interface TagFilterProps {
    tags: Tag[];
    selectedTags: string[];
    onTagToggle: (tagId: string) => void;
    onClearAll?: () => void;
    className?: string;
    locale?: 'fr' | 'ar' | 'en';
}

const tagColorMap: Record<string, string> = {
    luxury: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    budget: 'bg-green-100 text-green-800 border-green-300',
    family: 'bg-blue-100 text-blue-800 border-blue-300',
    beach: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    city: 'bg-gray-100 text-gray-800 border-gray-300',
    adventure: 'bg-orange-100 text-orange-800 border-orange-300',
    boutique: 'bg-purple-100 text-purple-800 border-purple-300',
    resort: 'bg-pink-100 text-pink-800 border-pink-300',
    nature: 'bg-emerald-100 text-emerald-800 border-emerald-300',
};

function TagFilter({
    tags,
    selectedTags,
    onTagToggle,
    onClearAll,
    className,
    locale = 'en',
}: TagFilterProps) {
    const getTagColor = (tagId: string) => {
        return (
            tagColorMap[tagId] || 'bg-muted text-muted-foreground border-border'
        );
    };

    return (
        <div className={cn('space-y-4', className)}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3">
                {tags.map((tag) => {
                    const isSelected = selectedTags.includes(tag.id);

                    return (
                        <button
                            key={tag.id}
                            onClick={() => onTagToggle(tag.id)}
                            className={cn(
                                'flex items-center justify-center rounded-lg border px-3 py-2 text-xs font-medium transition-all',
                                isSelected
                                    ? getTagColor(tag.id)
                                    : 'border-border bg-background text-foreground hover:bg-muted',
                            )}
                        >
                            <span className="text-center">
                                {tag.name[locale] || tag.name.en || tag.id}
                            </span>
                        </button>
                    );
                })}
            </div>
            {selectedTags.length > 0 && onClearAll && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearAll}
                    className="gap-2"
                >
                    <X className="h-4 w-4" />
                    Clear all filters
                </Button>
            )}
        </div>
    );
}

export { TagFilter };
export default TagFilter;
