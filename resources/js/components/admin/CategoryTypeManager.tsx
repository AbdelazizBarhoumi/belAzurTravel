import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    fetchCategoryTypes,
    createCategoryType,
    updateCategoryType,
    deleteCategoryType,
    createCategoryValue,
    updateCategoryValue,
    deleteCategoryValue,
    type CategoryType,
    type CategoryTypeValue,
} from '@/api/categoryTypes.api';
import { queryClient } from '@/lib/queryClient';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    Plus,
    Trash2,
    Edit2,
    Check,
    X,
    Loader2,
    ChevronLeft,
    Settings,
} from 'lucide-react';
import { toast } from 'sonner';

interface CategoryTypeManagerProps {
    entityType: string;
    isOpen: boolean;
    onClose: () => void;
}

type View = 'types' | 'values';

export function CategoryTypeManager({
    entityType,
    isOpen,
    onClose,
}: CategoryTypeManagerProps) {
    const { t } = useLanguage();
    const [types, setTypes] = useState<CategoryType[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<View>('types');
    const [selectedType, setSelectedType] = useState<CategoryType | null>(null);

    // Type editing state
    const [editingTypeId, setEditingTypeId] = useState<number | null>(null);
    const [newTypeLabel, setNewTypeLabel] = useState({
        en: '',
        fr: '',
        ar: '',
    });
    const [isCreatingType, setIsCreatingType] = useState(false);

    // Value editing state
    const [editingValueId, setEditingValueId] = useState<number | null>(null);
    const [newValueName, setNewValueName] = useState({ en: '', fr: '', ar: '' });
    const [isCreatingValue, setIsCreatingValue] = useState(false);

    // Delete confirmation
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        message: string;
        affectedItems: { name: string; slug: string }[];
        onConfirm: () => void;
    }>({ open: false, message: '', affectedItems: [], onConfirm: () => {} });

    const loadTypes = async () => {
        setLoading(true);
        try {
            const data = await fetchCategoryTypes(entityType);
            setTypes(data);
        } catch {
            toast.error(t('admin.categoryTypeManager.errorLoad'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadTypes();
            setView('types');
            setSelectedType(null);
        } else {
            resetState();
        }
    }, [isOpen, entityType]);

    const resetState = () => {
        setEditingTypeId(null);
        setNewTypeLabel({ en: '', fr: '', ar: '' });
        setIsCreatingType(false);
        setEditingValueId(null);
        setNewValueName({ en: '', fr: '', ar: '' });
        setIsCreatingValue(false);
        setView('types');
        setSelectedType(null);
    };

    // --- Type CRUD ---

    const handleCreateType = async () => {
        if (!newTypeLabel.en || !newTypeLabel.fr || !newTypeLabel.ar) {
            toast.error(t('admin.categoryTypeManager.validationAllLangs'));
            return;
        }
        try {
            await createCategoryType({
                entity_type: entityType,
                label: newTypeLabel,
            });
            queryClient.invalidateQueries({ queryKey: ['admin', 'category-types'] });
            toast.success(t('admin.categoryTypeManager.successTypeCreated'));
            setNewTypeLabel({ en: '', fr: '', ar: '' });
            setIsCreatingType(false);
            loadTypes();
        } catch {
            toast.error(t('admin.categoryTypeManager.errorCreate'));
        }
    };

    const handleUpdateType = async (id: number) => {
        if (!newTypeLabel.en || !newTypeLabel.fr || !newTypeLabel.ar) {
            toast.error(t('admin.categoryTypeManager.validationAllLangs'));
            return;
        }
        try {
            await updateCategoryType(id, { label: newTypeLabel });
            queryClient.invalidateQueries({ queryKey: ['admin', 'category-types'] });
            toast.success(t('admin.categoryTypeManager.successTypeUpdated'));
            setEditingTypeId(null);
            setNewTypeLabel({ en: '', fr: '', ar: '' });
            loadTypes();
        } catch {
            toast.error(t('admin.categoryTypeManager.errorUpdate'));
        }
    };

    const handleDeleteType = async (id: number, force = false) => {
        try {
            await deleteCategoryType(id, force);
            queryClient.invalidateQueries({ queryKey: ['admin', 'category-types'] });
            toast.success(t('admin.categoryTypeManager.successTypeDeleted'));
            loadTypes();
        } catch (err: any) {
            if (err?.status === 409 && err?.data?.requires_confirmation) {
                setConfirmDialog({
                    open: true,
                    message: err.data.message,
                    affectedItems: err.data.affected_items || [],
                    onConfirm: () => handleDeleteType(id, true),
                });
                return;
            }
            toast.error(t('admin.categoryTypeManager.errorDelete'));
        }
    };

    // --- Value CRUD ---

    const handleCreateValue = async () => {
        if (!newValueName.en || !newValueName.fr || !newValueName.ar) {
            toast.error(t('admin.categoryTypeManager.validationAllLangs'));
            return;
        }
        if (!selectedType) return;
        try {
            await createCategoryValue(selectedType.id, newValueName);
            queryClient.invalidateQueries({ queryKey: ['admin', 'category-types'] });
            toast.success(t('admin.categoryTypeManager.successValueAdded'));
            setNewValueName({ en: '', fr: '', ar: '' });
            setIsCreatingValue(false);
            loadTypes();
        } catch {
            toast.error(t('admin.categoryTypeManager.errorAddValue'));
        }
    };

    const handleUpdateValue = async (valueId: number) => {
        if (!newValueName.en || !newValueName.fr || !newValueName.ar) {
            toast.error(t('admin.categoryTypeManager.validationAllLangs'));
            return;
        }
        if (!selectedType) return;
        try {
            await updateCategoryValue(selectedType.id, valueId, newValueName);
            queryClient.invalidateQueries({ queryKey: ['admin', 'category-types'] });
            toast.success(t('admin.categoryTypeManager.successValueUpdated'));
            setEditingValueId(null);
            setNewValueName({ en: '', fr: '', ar: '' });
            loadTypes();
        } catch {
            toast.error(t('admin.categoryTypeManager.errorUpdateValue'));
        }
    };

    const handleDeleteValue = async (valueId: number, force = false) => {
        if (!selectedType) return;
        try {
            await deleteCategoryValue(selectedType.id, valueId, force);
            queryClient.invalidateQueries({ queryKey: ['admin', 'category-types'] });
            toast.success(t('admin.categoryTypeManager.successValueDeleted'));
            loadTypes();
        } catch (err: any) {
            if (err?.status === 409 && err?.data?.requires_confirmation) {
                setConfirmDialog({
                    open: true,
                    message: err.data.message,
                    affectedItems: err.data.affected_items || [],
                    onConfirm: () => handleDeleteValue(valueId, true),
                });
                return;
            }
            toast.error(t('admin.categoryTypeManager.errorDeleteValue'));
        }
    };

    // Refresh selectedType when types reload
    useEffect(() => {
        if (selectedType) {
            const updated = types.find((ty) => ty.id === selectedType.id);
            if (updated) setSelectedType(updated);
        }
    }, [types]);

    const renderLanguageInputs = (
        value: { en: string; fr: string; ar: string },
        onChange: (val: { en: string; fr: string; ar: string }) => void,
        placeholders?: { en?: string; fr?: string; ar?: string },
    ) => (
        <div className="grid grid-cols-3 gap-2">
            <div>
                <Label className="text-xs">
                    {t('admin.categoryTypeManager.langEnglish')}
                </Label>
                <Input
                    value={value.en}
                    onChange={(e) => onChange({ ...value, en: e.target.value })}
                    placeholder={placeholders?.en}
                    size={1}
                />
            </div>
            <div>
                <Label className="text-xs">
                    {t('admin.categoryTypeManager.langFrench')}
                </Label>
                <Input
                    value={value.fr}
                    onChange={(e) => onChange({ ...value, fr: e.target.value })}
                    placeholder={placeholders?.fr}
                    size={1}
                />
            </div>
            <div>
                <Label className="text-xs">
                    {t('admin.categoryTypeManager.langArabic')}
                </Label>
                <Input
                    value={value.ar}
                    onChange={(e) => onChange({ ...value, ar: e.target.value })}
                    dir="rtl"
                    placeholder={placeholders?.ar}
                    size={1}
                />
            </div>
        </div>
    );

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {view === 'types'
                                ? t('admin.categoryTypeManager.title')
                                : `${t('admin.categoryTypeManager.valuesTitle')} "${selectedType?.label.en ?? ''}" ${t('admin.categoryTypeManager.valuesTitleSuffix')}`}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {loading ? (
                            <div className="flex h-32 items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : view === 'types' ? (
                            // --- Level 1: Category Types ---
                            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-2">
                                {types.map((type) => (
                                    <div
                                        key={type.id}
                                        className="flex flex-col gap-2 rounded-lg border p-3"
                                    >
                                        {editingTypeId === type.id ? (
                                            <div className="space-y-3">
                                                {renderLanguageInputs(
                                                    newTypeLabel,
                                                    setNewTypeLabel,
                                                    { en: 'Category', fr: 'Catégorie', ar: 'فئة' },
                                                )}
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setEditingTypeId(null)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleUpdateType(type.id)}
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">
                                                        {type.label.en}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {type.label.fr} | {type.label.ar}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {type.values.length} {t('admin.categoryTypeManager.valueCount')}
                                                    </span>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setSelectedType(type);
                                                            setView('values');
                                                        }}
                                                        title={t('admin.categoryTypeManager.manageValues')}
                                                    >
                                                        <Settings className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setEditingTypeId(type.id);
                                                            setNewTypeLabel(type.label);
                                                            setIsCreatingType(false);
                                                        }}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => handleDeleteType(type.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {isCreatingType ? (
                                    <div className="space-y-3 rounded-lg border-2 border-dashed border-primary/50 p-3">
                                        {renderLanguageInputs(
                                            newTypeLabel,
                                            setNewTypeLabel,
                                            { en: 'Star Rating', fr: 'Classement', ar: 'تصنيف' },
                                        )}
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setIsCreatingType(false)}
                                            >
                                                {t('actions.cancel')}
                                            </Button>
                                            <Button size="sm" onClick={handleCreateType}>
                                                {t('admin.categoryTypeManager.createType')}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        variant="outline"
                                        className="w-full border-dashed"
                                        onClick={() => {
                                            setIsCreatingType(true);
                                            setNewTypeLabel({ en: '', fr: '', ar: '' });
                                            setEditingTypeId(null);
                                        }}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        {t('admin.categoryTypeManager.addType')}
                                    </Button>
                                )}
                            </div>
                        ) : (
                            // --- Level 2: Values for a type ---
                            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setView('types');
                                        setSelectedType(null);
                                    }}
                                >
                                    <ChevronLeft className="mr-1 h-4 w-4" />
                                    {t('admin.categoryTypeManager.backToTypes')}
                                </Button>

                                {selectedType?.values.map((val) => (
                                    <div
                                        key={val.id}
                                        className="flex flex-col gap-2 rounded-lg border p-3"
                                    >
                                        {editingValueId === val.id ? (
                                            <div className="space-y-3">
                                                {renderLanguageInputs(
                                                    newValueName,
                                                    setNewValueName,
                                                    { en: 'Luxury', fr: 'Luxe', ar: 'فاخر' },
                                                )}
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setEditingValueId(null)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleUpdateValue(val.id)}
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">
                                                        {val.name.en}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {val.name.fr} | {val.name.ar}
                                                    </span>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setEditingValueId(val.id);
                                                            setNewValueName(val.name);
                                                            setIsCreatingValue(false);
                                                        }}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => handleDeleteValue(val.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {isCreatingValue ? (
                                    <div className="space-y-3 rounded-lg border-2 border-dashed border-primary/50 p-3">
                                        {renderLanguageInputs(
                                            newValueName,
                                            setNewValueName,
                                            { en: 'Luxury', fr: 'Luxe', ar: 'فاخر' },
                                        )}
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setIsCreatingValue(false)}
                                            >
                                                {t('actions.cancel')}
                                            </Button>
                                            <Button size="sm" onClick={handleCreateValue}>
                                                {t('admin.categoryTypeManager.addValueBtn')}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        variant="outline"
                                        className="w-full border-dashed"
                                        onClick={() => {
                                            setIsCreatingValue(true);
                                            setNewValueName({ en: '', fr: '', ar: '' });
                                            setEditingValueId(null);
                                        }}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        {t('admin.categoryTypeManager.addValue')}
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button onClick={onClose}>
                            {t('admin.categoryTypeManager.done')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={confirmDialog.open}
                onOpenChange={(open) =>
                    setConfirmDialog((prev) => ({ ...prev, open }))
                }
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t('admin.categoryTypeManager.deleteTitle')}
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div>
                                <p>{confirmDialog.message}</p>
                                {confirmDialog.affectedItems.length > 0 && (
                                    <div className="mt-3 max-h-48 overflow-y-auto rounded border p-2 text-sm">
                                        <p className="mb-1 font-medium">
                                            {t('admin.categoryTypeManager.affectedItems')}
                                        </p>
                                        <ul className="list-disc space-y-1 pl-4">
                                            {confirmDialog.affectedItems.map(
                                                (item) => (
                                                    <li key={item.slug}>
                                                        {item.name}{' '}
                                                        <span className="text-muted-foreground">
                                                            ({item.slug})
                                                        </span>
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            {t('actions.cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                confirmDialog.onConfirm();
                                setConfirmDialog((prev) => ({
                                    ...prev,
                                    open: false,
                                }));
                            }}
                        >
                            {t('admin.categoryTypeManager.deleteAnyway')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
