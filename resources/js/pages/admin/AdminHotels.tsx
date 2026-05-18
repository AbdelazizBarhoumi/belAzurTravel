import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { deleteAdminEntity, listAdminEntities, saveAdminEntity, type AdminRow } from '@/api/admin.api';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { EntityFormDialog, type SectionDef } from '@/components/forms/EntityFormDialog';
import { EntityMediaInputs } from '@/components/forms/EntityMediaInputs';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import type { Lang } from '@/i18n/translations';
import { categoryLabels, countryLabels, hotelLabels, localizeKnown } from '@/lib/adminI18n';

const copy = (en: string, fr: string, ar: string) => ({ en, fr, ar });

type HotelFormValues = AdminRow & {
    amenities?: string;
    gallery?: string;
    rooms?: string;
    imagePath?: string;
    imageFile?: File | null;
    galleryFiles?: File[];
    galleryPaths?: string[];
};

function asText(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

function localizedFields(base: string, label: ReturnType<typeof copy>, type?: 'text' | 'number' | 'textarea') {
    return [
        { key: `${base}_en`, label: `${label.en} (EN)`, type, required: true },
        { key: `${base}_fr`, label: `${label.fr} (FR)`, type, required: true },
        { key: `${base}_ar`, label: `${label.ar} (AR)`, type, required: true },
    ];
}

function serializeAmenities(amenities: unknown): string {
    if (!Array.isArray(amenities)) return '';

    return amenities
        .map((amenity) => {
            if (!amenity || typeof amenity !== 'object') return '';
            const record = amenity as Record<string, unknown>;
            const name = record.name;

            if (typeof name === 'string') return name;
            if (!name || typeof name !== 'object') return '';

            const localized = name as Record<string, unknown>;
            return (
                (typeof localized.en === 'string' && localized.en) ||
                (typeof localized.fr === 'string' && localized.fr) ||
                (typeof localized.ar === 'string' && localized.ar) ||
                ''
            );
        })
        .filter(Boolean)
        .join('\n');
}

function parseAmenities(value: unknown) {
    if (typeof value !== 'string') return [];

    return value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, index) => ({
            id: `amenity-${index + 1}`,
            name: { en: line, fr: line, ar: line },
        }));
}

function serializeRooms(rooms: unknown): string {
    if (!Array.isArray(rooms)) return '';

    return JSON.stringify(rooms, null, 2);
}

function parseRooms(value: unknown) {
    if (typeof value !== 'string') return [];

    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

const AdminHotels = () => {
    useAdminGuard();

    const queryClient = useQueryClient();
    const { data: hotels = [] } = useQuery({
        queryKey: ['admin', 'hotels'],
        queryFn: () => listAdminEntities<AdminRow>('hotels'),
    });

    const saveMutation = useMutation({
        mutationFn: (item: HotelFormValues) => saveAdminEntity('hotels', item as unknown as AdminRow),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAdminEntity('hotels', id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin'] });
            toast.success(t('actions.deleted'));
        },
    });

    const { lang, t } = useLanguage();
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<AdminRow | null>(null);
    const [activeLang, setActiveLang] = useState<Lang>('en');
    const [pendingDelete, setPendingDelete] = useState<AdminRow | null>(null);

    const dialogInitial: HotelFormValues | null = editing
        ? ({
              ...editing,
              imagePath: asText(editing.image),
              imageFile: null,
              gallery: asText(editing.gallery),
              galleryFiles: [] as File[],
              galleryPaths: [] as string[],
              amenities: serializeAmenities(editing.amenities),
                            rooms: serializeRooms(editing.rooms),
          } as HotelFormValues)
        : null;

    const hotelSections: SectionDef[] = [
        {
            title: 'Core hotel details',
            description: 'Edit the translated core fields for the hotel.',
            render: ({ values, setField }) => (
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {(['en', 'fr', 'ar'] as Lang[]).map((code) => (
                            <Button
                                key={code}
                                type="button"
                                variant={activeLang === code ? 'default' : 'outline'}
                                className="min-w-14"
                                onClick={() => setActiveLang(code)}
                            >
                                {code.toUpperCase()}
                            </Button>
                        ))}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {[
                            { key: 'name', label: 'Name' },
                            { key: 'location', label: 'Location' },
                            { key: 'category', label: 'Category' },
                            { key: 'city', label: 'City' },
                            { key: 'country', label: 'Country' },
                        ].map((field) => {
                            const localizedKey = `${field.key}_${activeLang}`;
                            const value = asText(values[localizedKey]);

                            return (
                                <div key={localizedKey} className="space-y-2">
                                    <label htmlFor={localizedKey} className="text-xs font-semibold text-muted-foreground">
                                        {field.label} ({activeLang.toUpperCase()})
                                    </label>
                                    <input
                                        id={localizedKey}
                                        value={value}
                                        onChange={(event) => setField(localizedKey, event.target.value)}
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                        required={field.key !== 'city' && field.key !== 'country'}
                                    />
                                </div>
                            );
                        })}

                        <div className="space-y-2 md:col-span-2">
                            <label htmlFor={`description_${activeLang}`} className="text-xs font-semibold text-muted-foreground">
                                Description ({activeLang.toUpperCase()})
                            </label>
                            <textarea
                                id={`description_${activeLang}`}
                                value={asText(values[`description_${activeLang}`])}
                                onChange={(event) => setField(`description_${activeLang}`, event.target.value)}
                                rows={5}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Pricing and structure',
            columns: 2,
            fields: [
                { key: 'price', label: 'Price / night (USD)', type: 'number' },
                { key: 'rating', label: 'Rating', type: 'number' },
                { key: 'destination_slug', label: 'Destination slug' },
                { key: 'stars', label: 'Stars', type: 'number' },
                { key: 'reviews', label: 'Reviews', type: 'number' },
            ],
        },
        {
            title: 'Contact and profile',
            description: 'Location-specific profile data stored in the hotel details JSON.',
            columns: 2,
            fields: [
                ...localizedFields('city', copy('City', 'Ville', 'المدينة')),
                ...localizedFields('country', copy('Country', 'Pays', 'البلد')),
                { key: 'address', label: 'Address' },
                { key: 'phone', label: 'Phone' },
                { key: 'whatsapp', label: 'WhatsApp' },
            ],
        },
        {
            title: 'Media and amenities',
            description: 'Hotel image, gallery URLs and amenity list.',
            render: ({ values, setField }) => (
                <div className="space-y-6">
                    <EntityMediaInputs
                        values={values}
                        setField={setField}
                        imageLabel="Hotel image"
                        galleryLabel="Gallery images"
                        showImage
                        showGallery
                    />

                    <div className="space-y-2">
                        <label htmlFor="hotel-gallery-text" className="text-xs font-semibold text-muted-foreground">
                            Gallery URLs (one per line)
                        </label>
                        <textarea
                            id="hotel-gallery-text"
                            value={asText(values.gallery)}
                            onChange={(event) => setField('gallery', event.target.value)}
                            rows={4}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                            placeholder="/storage/uploads/hotel-1.jpg\n/storage/uploads/hotel-2.jpg"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="hotel-amenities" className="text-xs font-semibold text-muted-foreground">
                            Amenities (one per line)
                        </label>
                        <textarea
                            id="hotel-amenities"
                            value={asText(values.amenities)}
                            onChange={(event) => setField('amenities', event.target.value)}
                            rows={5}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                            placeholder="Free Wi-Fi\nSpa access\nOcean view"
                        />
                        <p className="text-xs text-muted-foreground">
                            Each line becomes an amenity and is mirrored across all languages for now.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="hotel-rooms" className="text-xs font-semibold text-muted-foreground">
                            Rooms (JSON)
                        </label>
                        <textarea
                            id="hotel-rooms"
                            value={asText(values.rooms)}
                            onChange={(event) => setField('rooms', event.target.value)}
                            rows={12}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                            placeholder='[{"id":"deluxe-1","name":{"en":"Deluxe Ocean View","fr":"...","ar":"..."},"description":{"en":"...","fr":"...","ar":"..."},"pricePerNight":320,"capacity":2,"size":45,"features":[{"en":"Wi-Fi","fr":"Wi-Fi","ar":"واي فاي"}],"images":["/storage/..."]}]'
                        />
                        <p className="text-xs text-muted-foreground">
                            Paste a JSON array of room objects so admins can manage the room list from the dashboard.
                        </p>
                    </div>
                </div>
            ),
        },
    ];

    const handleSave = (values: HotelFormValues) => {
        const { imageFile, imagePath, galleryFiles, gallery, amenities, rooms, ...rest } = values;

        const payload = {
            ...rest,
            id: editing?.id || '',
            image: imageFile ?? imagePath?.trim() ?? asText(editing?.image),
            amenities: parseAmenities(amenities),
            rooms: parseRooms(rooms),
            gallery: asText(gallery),
            ...(galleryFiles && galleryFiles.length > 0 ? { gallery_files: galleryFiles } : {}),
        } as unknown as HotelFormValues;

        saveMutation.mutate(payload);
        toast.success(editing ? t('admin.hotelUpdated') : t('admin.hotelAdded'));
        setEditing(null);
        setOpen(false);
    };

    return (
        <AdminLayout
            title="Hotels"
            subtitle="Manage hotels"
            actions={
                <Button
                    onClick={() => {
                        setEditing(null);
                        setOpen(true);
                    }}
                    className="gap-2 bg-primary text-primary-foreground"
                >
                    <Plus className="h-4 w-4" /> Add
                </Button>
            }
        >
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                {['Image', 'Name', 'Location', 'Category', 'Price/night', 'Rating', 'Actions'].map((h) => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {hotels.map((d) => (
                                <tr key={String(d.id ?? '')} className="border-b border-border last:border-0 hover:bg-muted/20">
                                    <td className="px-4 py-3">
                                        <img
                                            src={asText(d.image) || '/images/hero-travel.jpg'}
                                            alt={localizeKnown(asText(d.name), hotelLabels, lang)}
                                            className="h-12 w-12 rounded-lg object-cover"
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold">
                                        {localizeKnown(asText(d.name), hotelLabels, lang)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                        {localizeKnown(asText(d.location), countryLabels, lang)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="rounded-full bg-muted px-2 py-1 text-xs">
                                            {localizeKnown(asText(d.category), categoryLabels, lang)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold">${String(d.price ?? 0)}</td>
                                    <td className="px-4 py-3 text-sm">{String(d.rating ?? '')}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditing(d);
                                                    setOpen(true);
                                                }}
                                                className="rounded-lg p-1.5 hover:bg-muted"
                                            >
                                                <Edit className="h-4 w-4 text-muted-foreground" />
                                            </button>
                                            <button
                                                onClick={() => setPendingDelete(d)}
                                                className="rounded-lg p-1.5 hover:bg-destructive/10"
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmDialog
                open={!!pendingDelete}
                onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        setPendingDelete(null);
                    }
                }}
                title={t('admin.deleteItemTitle')}
                description={
                    pendingDelete
                        ? `${t('admin.deleteItemPrompt')} “${String(pendingDelete.name ?? '')}”? ${t('admin.deleteItemWarning')}`
                        : t('admin.deleteItemFallback')
                }
                confirmText={t('actions.delete')}
                cancelText={t('actions.cancel')}
                onConfirm={() => {
                    if (!pendingDelete) return;
                    deleteMutation.mutate(String(pendingDelete.id ?? ''));
                    setPendingDelete(null);
                }}
            />

            <EntityFormDialog<HotelFormValues>
                open={open}
                onOpenChange={setOpen}
                title={editing ? 'Edit Hotel' : 'Add Hotel'}
                sections={hotelSections}
                initial={dialogInitial}
                onSubmit={handleSave}
                languages={['en', 'fr', 'ar']}
                layout="grid-2"
            />
        </AdminLayout>
    );
};

export default AdminHotels;
