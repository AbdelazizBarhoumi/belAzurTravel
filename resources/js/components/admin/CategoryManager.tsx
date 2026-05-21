import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    type Category,
} from '@/api/categories.api';
import { clearCachedCategories } from '@/lib/categoryCache';
import { queryClient } from '@/lib/queryClient';
import { Plus, Trash2, Edit2, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CategoryManagerProps {
    type: string;
    isOpen: boolean;
    onClose: () => void;
}

export function CategoryManager({
    type,
    isOpen,
    onClose,
}: CategoryManagerProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [newName, setNewName] = useState({ en: '', fr: '', ar: '' });
    const [isCreating, setIsCreating] = useState(false);

    const loadCategories = async () => {
        setLoading(true);
        try {
            const data = await fetchCategories(type);
            setCategories(data);
        } catch (err) {
            toast.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadCategories();
        } else {
            setEditingId(null);
            setNewName({ en: '', fr: '', ar: '' });
            setIsCreating(false);
        }
    }, [isOpen, type]);

    const handleCreate = async () => {
        if (!newName.en || !newName.fr || !newName.ar) {
            toast.error('Please provide translations in all languages');
            return;
        }

        try {
            await createCategory({ entity_type: type, name: newName });
            clearCachedCategories();
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('Category created');
            setNewName({ en: '', fr: '', ar: '' });
            setIsCreating(false);
            loadCategories();
        } catch (err) {
            toast.error('Failed to create category');
        }
    };

    const handleUpdate = async (id: number) => {
        if (!newName.en || !newName.fr || !newName.ar) {
            toast.error('Please provide translations in all languages');
            return;
        }

        try {
            await updateCategory(id, newName);
            clearCachedCategories();
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('Category updated');
            setEditingId(null);
            setNewName({ en: '', fr: '', ar: '' });
            loadCategories();
        } catch (err) {
            toast.error('Failed to update category');
        }
    };

    const handleDelete = async (id: number, force = false) => {
        try {
            const res = await deleteCategory(id, force);
            if (res.requires_confirmation) {
                if (confirm(`${res.message} Are you sure?`)) {
                    handleDelete(id, true);
                }
                return;
            }
            clearCachedCategories();
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('Category deleted');
            loadCategories();
        } catch (err) {
            toast.error('Failed to delete category');
        }
    };

    const startEditing = (cat: Category) => {
        setEditingId(cat.id);
        setNewName(cat.name);
        setIsCreating(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="capitalize">
                        Manage {type} Categories
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {loading ? (
                        <div className="flex h-32 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-2">
                            {categories.map((cat) => (
                                <div
                                    key={cat.id}
                                    className="flex flex-col gap-2 rounded-lg border p-3"
                                >
                                    {editingId === cat.id ? (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-3 gap-2">
                                                <div>
                                                    <Label className="text-xs">
                                                        English
                                                    </Label>
                                                    <Input
                                                        value={newName.en}
                                                        onChange={(e) =>
                                                            setNewName({
                                                                ...newName,
                                                                en: e.target
                                                                    .value,
                                                            })
                                                        }
                                                        size={1}
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">
                                                        French
                                                    </Label>
                                                    <Input
                                                        value={newName.fr}
                                                        onChange={(e) =>
                                                            setNewName({
                                                                ...newName,
                                                                fr: e.target
                                                                    .value,
                                                            })
                                                        }
                                                        size={1}
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">
                                                        Arabic
                                                    </Label>
                                                    <Input
                                                        value={newName.ar}
                                                        onChange={(e) =>
                                                            setNewName({
                                                                ...newName,
                                                                ar: e.target
                                                                    .value,
                                                            })
                                                        }
                                                        dir="rtl"
                                                        size={1}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        setEditingId(null)
                                                    }
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        handleUpdate(cat.id)
                                                    }
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {cat.name.en}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {cat.name.fr} |{' '}
                                                    {cat.name.ar}
                                                </span>
                                                <code className="mt-1 text-[10px] text-muted-foreground">
                                                    Key: {cat.key}
                                                </code>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        startEditing(cat)
                                                    }
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        handleDelete(cat.id)
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isCreating ? (
                                <div className="space-y-3 rounded-lg border-2 border-dashed border-primary/50 p-3">
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <Label className="text-xs">
                                                English
                                            </Label>
                                            <Input
                                                value={newName.en}
                                                onChange={(e) =>
                                                    setNewName({
                                                        ...newName,
                                                        en: e.target.value,
                                                    })
                                                }
                                                placeholder="Beach"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">
                                                French
                                            </Label>
                                            <Input
                                                value={newName.fr}
                                                onChange={(e) =>
                                                    setNewName({
                                                        ...newName,
                                                        fr: e.target.value,
                                                    })
                                                }
                                                placeholder="Plage"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">
                                                Arabic
                                            </Label>
                                            <Input
                                                value={newName.ar}
                                                onChange={(e) =>
                                                    setNewName({
                                                        ...newName,
                                                        ar: e.target.value,
                                                    })
                                                }
                                                dir="rtl"
                                                placeholder="شاطئ"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setIsCreating(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleCreate}
                                        >
                                            Create Category
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="w-full border-dashed"
                                    onClick={() => {
                                        setIsCreating(true);
                                        setNewName({ en: '', fr: '', ar: '' });
                                        setEditingId(null);
                                    }}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add New Category
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={onClose}>Done</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
