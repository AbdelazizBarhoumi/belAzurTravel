import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Trash2, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { IconPicker } from '@/components/ui/IconPicker';
import { ImagePicker } from '@/components/ui/ImagePicker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Lang } from '@/i18n/translations';

type JsonItem = Record<string, unknown>;

export interface JsonFieldDef {
    key: string;
    label?: string;
    labelKey?: string;
    type?: 'text' | 'number' | 'textarea' | 'file' | 'select' | 'icon-picker';
    options?: { label: string; value: string }[];
    translatable?: boolean;
    placeholder?: string;
}

interface JsonListEditorProps {
    items: JsonItem[];
    onItemsChange: (items: JsonItem[]) => void;
    schema: JsonFieldDef[];
    activeLang: Lang;
    title?: string;
    addButtonLabel?: string;
    itemLabel?: (item: JsonItem, index: number) => string;
    idField?: string;
}

interface SortableItemProps {
    id: string;
    index: number;
    item: JsonItem;
    schema: JsonFieldDef[];
    activeLang: Lang;
    itemLabel?: (item: JsonItem, index: number) => string;
    onUpdateField: (
        index: number,
        key: string,
        value: unknown,
        translatable?: boolean,
    ) => void;
    onRemove: (index: number) => void;
    onMove: (from: number, to: number) => void;
    isFirst: boolean;
    isLast: boolean;
}

const SortableItem: React.FC<SortableItemProps> = ({
    id,
    index,
    item,
    schema,
    activeLang,
    itemLabel,
    onUpdateField,
    onRemove,
    onMove,
    isFirst,
    isLast,
}) => {
    const { t } = useLanguage();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative' as const,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`space-y-4 rounded-2xl border border-border bg-background/50 p-4 shadow-sm transition-shadow ${
                isDragging
                    ? 'bg-background shadow-xl ring-2 ring-primary/20'
                    : ''
            }`}
        >
            <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
                        {...attributes}
                        {...listeners}
                    >
                        <GripVertical className="h-4 w-4" />
                    </button>
                    <h4 className="text-xs font-bold uppercase text-muted-foreground">
                        {itemLabel
                            ? itemLabel(item, index)
                            : `Item ${index + 1}`}
                    </h4>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onMove(index, index - 1)}
                        disabled={isFirst}
                    >
                        <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onMove(index, index + 1)}
                        disabled={isLast}
                    >
                        <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => onRemove(index)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {schema.map((field) => {
                    const value = field.translatable
                        ? ((item[field.key] as Record<string, string>)?.[
                              activeLang
                          ] ?? '')
                        : ((item[field.key] as string | number | undefined) ??
                          '');

                    const fieldLabel =
                        field.label ??
                        (field.labelKey ? t(field.labelKey) : '');

                    // Custom logic for icon field — always use IconPicker
                    if (field.key === 'icon') {
                        return (
                            <div
                                key={field.key}
                                className="space-y-2 md:col-span-2"
                            >
                                <Label className="text-xs font-semibold text-muted-foreground">
                                    {fieldLabel}
                                </Label>
                                <IconPicker
                                    value={String(value)}
                                    onChange={(val) =>
                                        onUpdateField(index, field.key, val)
                                    }
                                />
                            </div>
                        );
                    }

                    return (
                        <div
                            key={field.key}
                            className={`space-y-2 ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}
                        >
                            <Label className="text-xs font-semibold text-muted-foreground">
                                {fieldLabel}
                            </Label>
                            {field.type === 'textarea' ? (
                                <Textarea
                                    value={String(value)}
                                    onChange={(e) =>
                                        onUpdateField(
                                            index,
                                            field.key,
                                            e.target.value,
                                            field.translatable,
                                        )
                                    }
                                    placeholder={field.placeholder}
                                    className="min-h-20"
                                />
                            ) : field.type === 'file' ? (
                                <ImagePicker
                                    multiple
                                    onChange={(files) =>
                                        onUpdateField(
                                            index,
                                            field.key,
                                            files,
                                            field.translatable,
                                        )
                                    }
                                />
                            ) : field.type === 'select' ? (
                                <Select
                                    value={String(value)}
                                    onValueChange={(val) =>
                                        onUpdateField(
                                            index,
                                            field.key,
                                            val,
                                            field.translatable,
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue
                                            placeholder={t('admin.select')}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {field.options?.map((opt) => (
                                            <SelectItem
                                                key={opt.value}
                                                value={opt.value}
                                            >
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : field.type === 'icon-picker' ? (
                                <IconPicker
                                    value={String(value)}
                                    onChange={(val) =>
                                        onUpdateField(
                                            index,
                                            field.key,
                                            val,
                                            field.translatable,
                                        )
                                    }
                                />
                            ) : (
                                <Input
                                    type={
                                        field.type === 'number'
                                            ? 'number'
                                            : 'text'
                                    }
                                    value={String(value)}
                                    onChange={(e) =>
                                        onUpdateField(
                                            index,
                                            field.key,
                                            field.type === 'number'
                                                ? Number(e.target.value)
                                                : e.target.value,
                                            field.translatable,
                                        )
                                    }
                                    placeholder={
                                        field.placeholder ??
                                        (field.type === 'number'
                                            ? '0'
                                            : fieldLabel)
                                    }
                                />
                            )}
                        </div>
                    );
                })}{' '}
            </div>
        </div>
    );
};

export const JsonListEditor: React.FC<JsonListEditorProps> = ({
    items = [],
    onItemsChange,
    schema,
    activeLang,
    title,
    addButtonLabel = 'Add Item',
    itemLabel,
    idField = 'id',
}) => {
    const { t } = useLanguage();
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const addItem = () => {
        const newItem: JsonItem = {
            [idField]: `item-${Math.random().toString(36).slice(2, 9)}`,
        };
        onItemsChange([...items, newItem]);
    };

    const removeItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        onItemsChange(newItems);
    };

    const moveItem = (from: number, to: number) => {
        if (to < 0 || to >= items.length) return;
        const newItems = arrayMove(items, from, to);
        onItemsChange(newItems);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex(
                (item) => item[idField] === active.id,
            );
            const newIndex = items.findIndex(
                (item) => item[idField] === over.id,
            );

            onItemsChange(arrayMove(items, oldIndex, newIndex));
        }
    };

    const updateField = (
        index: number,
        key: string,
        value: unknown,
        translatable?: boolean,
    ) => {
        const newItems = items.map((item, i) => {
            if (i === index) {
                if (translatable) {
                    const currentMap = (item[key] as Record<
                        string,
                        string
                    >) || { en: '', fr: '', ar: '' };
                    return {
                        ...item,
                        [key]: {
                            ...currentMap,
                            [activeLang]: value,
                        },
                    };
                }
                return { ...item, [key]: value };
            }
            return item;
        });
        onItemsChange(newItems);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                {title && (
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                        {title}
                    </h3>
                )}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                    className="gap-2"
                >
                    <Plus className="h-4 w-4" /> {addButtonLabel}
                </Button>
            </div>

            {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        {t('admin.noItemsYet')}
                    </p>
                </div>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={items.map(
                            (item) => (item[idField] as string) || '',
                        )}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-4">
                            {items.map((item, index) => (
                                <SortableItem
                                    key={(item[idField] as string) || index}
                                    id={
                                        (item[idField] as string) ||
                                        String(index)
                                    }
                                    index={index}
                                    item={item}
                                    schema={schema}
                                    activeLang={activeLang}
                                    itemLabel={itemLabel}
                                    onUpdateField={updateField}
                                    onRemove={removeItem}
                                    onMove={moveItem}
                                    isFirst={index === 0}
                                    isLast={index === items.length - 1}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}
        </div>
    );
};
