import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Eye, Loader2, Lock, Paperclip } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/api/http';
import { buildRequestHeaders } from '@/api/requestHeaders';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Flag } from '@/components/ui/Flag';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { cn } from '@/lib/utils';

const STATUSES = ['pending', 'processing', 'approved', 'rejected'] as const;
type Status = (typeof STATUSES)[number];

interface VisaApplicationRow {
    id: number;
    status: Status;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    passport_number: string;
    birth_date: string | null;
    travel_date: string | null;
    visa_type: string;
    previous_visa: boolean;
    notes: string | null;
    has_passport_copy: boolean;
    passport_copy_mime: string | null;
    country: { code: string; name: Record<string, string> } | null;
    created_at: string | null;
}

interface ListResponse {
    data: VisaApplicationRow[];
    meta: {
        current_page: number;
        last_page: number;
        total: number;
        counts: Partial<Record<Status, number>>;
    };
}

const STATUS_STYLES: Record<Status, string> = {
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    processing: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
    approved:
        'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    rejected: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
};

function formatDate(value: string | null): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('fr-FR');
}

/** Fetch the decrypted scan with the admin session; nothing is cached. */
async function fetchPassport(id: number): Promise<Blob> {
    const res = await fetch(`/api/admin/visa-applications/${id}/passport`, {
        credentials: 'include',
        headers: buildRequestHeaders(),
        cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.blob();
}

export default function AdminVisaApplications() {
    useAdminGuard();
    const { t, lang } = useLanguage();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [debounced, setDebounced] = useState('');
    const [status, setStatus] = useState<Status | 'all'>('all');
    const [page, setPage] = useState(1);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebounced(search.trim());
            setPage(1);
        }, 300);
        return () => window.clearTimeout(timer);
    }, [search]);

    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'visa-applications', debounced, status, page],
        queryFn: () => {
            const params = new URLSearchParams({ page: String(page) });
            if (debounced) params.set('q', debounced);
            if (status !== 'all') params.set('status', status);
            return apiFetch<ListResponse>(
                `/api/admin/visa-applications?${params.toString()}`,
            );
        },
    });

    const rows = data?.data ?? [];
    const meta = data?.meta;
    const totalAll = Object.values(meta?.counts ?? {}).reduce(
        (sum, n) => sum + (n ?? 0),
        0,
    );

    return (
        <AdminLayout
            title={t('admin.visaApplications.title')}
            subtitle={t('admin.visaApplications.subtitle')}
        >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('admin.visaApplications.search')}
                    className="sm:max-w-xs"
                />
                <div className="inline-flex flex-wrap rounded-md border bg-muted/40 p-0.5">
                    {(['all', ...STATUSES] as const).map((value) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => {
                                setStatus(value);
                                setPage(1);
                            }}
                            className={cn(
                                'rounded px-3 py-1 text-xs font-medium transition-colors',
                                status === value
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {value === 'all'
                                ? t('admin.visaFilter.all')
                                : t(`admin.visaApplications.status.${value}`)}{' '}
                            (
                            {value === 'all'
                                ? totalAll
                                : (meta?.counts[value] ?? 0)}
                            )
                        </button>
                    ))}
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/30 text-start text-xs font-semibold uppercase text-muted-foreground">
                                <th className="px-4 py-3 text-start">
                                    {t('admin.visaApplications.applicant')}
                                </th>
                                <th className="px-4 py-3 text-start">
                                    {t('admin.visaApplications.country')}
                                </th>
                                <th className="px-4 py-3 text-start">
                                    {t('admin.visaApplications.passport')}
                                </th>
                                <th className="px-4 py-3 text-start">
                                    {t('admin.visaApplications.travelDate')}
                                </th>
                                <th className="px-4 py-3 text-start">
                                    {t('admin.visaApplications.statusLabel')}
                                </th>
                                <th className="px-4 py-3 text-start">
                                    {t('admin.visaApplications.received')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-10 text-center text-muted-foreground"
                                    >
                                        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                                    </td>
                                </tr>
                            )}
                            {!isLoading && rows.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-10 text-center text-muted-foreground"
                                    >
                                        {t('admin.visaApplications.empty')}
                                    </td>
                                </tr>
                            )}
                            {rows.map((row) => (
                                <tr
                                    key={row.id}
                                    onClick={() => setSelectedId(row.id)}
                                    className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/20"
                                >
                                    <td className="px-4 py-3">
                                        <div className="font-semibold">
                                            {row.first_name} {row.last_name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {row.email}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="flex items-center gap-2">
                                            <Flag code={row.country?.code} />
                                            {row.country?.name?.[lang] ??
                                                row.country?.name?.fr ??
                                                '—'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs">
                                        <span className="flex items-center gap-1.5">
                                            <Lock className="h-3 w-3 text-muted-foreground" />
                                            {row.passport_number}
                                            {row.has_passport_copy && (
                                                <Paperclip className="h-3 w-3 text-muted-foreground" />
                                            )}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {formatDate(row.travel_date)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={cn(
                                                'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                                                STATUS_STYLES[row.status] ??
                                                    STATUS_STYLES.pending,
                                            )}
                                        >
                                            {t(
                                                `admin.visaApplications.status.${row.status}`,
                                            )}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {formatDate(row.created_at)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {meta && meta.last_page > 1 && (
                <div className="mt-4 flex items-center justify-end gap-2 text-sm">
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                    >
                        ‹
                    </Button>
                    <span className="text-muted-foreground">
                        {meta.current_page} / {meta.last_page}
                    </span>
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={page >= meta.last_page}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        ›
                    </Button>
                </div>
            )}

            <ApplicationDialog
                id={selectedId}
                onClose={() => setSelectedId(null)}
                onUpdated={() =>
                    queryClient.invalidateQueries({
                        queryKey: ['admin', 'visa-applications'],
                    })
                }
            />
        </AdminLayout>
    );
}

function ApplicationDialog({
    id,
    onClose,
    onUpdated,
}: {
    id: number | null;
    onClose: () => void;
    onUpdated: () => void;
}) {
    const { t, lang } = useLanguage();
    const [preview, setPreview] = useState<{ url: string; mime: string } | null>(
        null,
    );
    const [loadingScan, setLoadingScan] = useState(false);

    const { data: application } = useQuery({
        queryKey: ['admin', 'visa-application', id],
        queryFn: () =>
            apiFetch<{ data: VisaApplicationRow }>(
                `/api/admin/visa-applications/${id}`,
            ).then((r) => r.data),
        enabled: id !== null,
        // Decrypted data: don't keep it around once the dialog closes.
        gcTime: 0,
        staleTime: 0,
    });

    // Revoke the in-memory scan when the dialog closes or changes.
    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview.url);
        };
    }, [preview]);
    useEffect(() => {
        setPreview(null);
    }, [id]);

    const statusMutation = useMutation({
        mutationFn: (status: Status) =>
            apiFetch(`/api/admin/visa-applications/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ status }),
            }),
        onSuccess: () => {
            toast.success(t('admin.settings.saveSuccess'));
            onUpdated();
        },
        onError: () => toast.error(t('admin.settings.saveError')),
    });

    const openScan = async (download: boolean) => {
        if (!application) return;
        setLoadingScan(true);
        try {
            const blob = await fetchPassport(application.id);
            const url = URL.createObjectURL(blob);
            if (download) {
                const link = document.createElement('a');
                link.href = url;
                const extension =
                    blob.type === 'application/pdf'
                        ? 'pdf'
                        : blob.type === 'image/png'
                          ? 'png'
                          : 'jpg';
                link.download = `passport-${application.first_name}-${application.last_name}.${extension}`
                    .toLowerCase()
                    .replace(/\s+/g, '-');
                link.click();
                window.setTimeout(() => URL.revokeObjectURL(url), 1000);
            } else {
                setPreview({ url, mime: blob.type });
            }
        } catch {
            toast.error(t('admin.visaApplications.scanError'));
        } finally {
            setLoadingScan(false);
        }
    };

    const fields: Array<[string, string | null | undefined]> = application
        ? [
              [
                  t('admin.visaApplications.country'),
                  application.country?.name?.[lang] ??
                      application.country?.name?.fr,
              ],
              [t('admin.visaApplications.visaType'), application.visa_type],
              [
                  t('admin.visaApplications.travelDate'),
                  formatDate(application.travel_date),
              ],
              [t('admin.visaApplications.passport'), application.passport_number],
              [
                  t('admin.visaApplications.birthDate'),
                  formatDate(application.birth_date),
              ],
              [t('admin.visaApplications.email'), application.email],
              [t('admin.visaApplications.phone'), application.phone],
              [
                  t('admin.visaApplications.previousVisa'),
                  application.previous_visa
                      ? t('admin.visaApplications.yes')
                      : t('admin.visaApplications.no'),
              ],
              [t('admin.visaApplications.notes'), application.notes],
          ]
        : [];

    return (
        <Dialog open={id !== null} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {application && (
                            <Flag code={application.country?.code} />
                        )}
                        {application
                            ? `${application.first_name} ${application.last_name}`
                            : '…'}
                    </DialogTitle>
                </DialogHeader>

                {!application ? (
                    <Loader2 className="mx-auto my-8 h-5 w-5 animate-spin" />
                ) : (
                    <div className="space-y-5">
                        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                            {fields
                                .filter(([, value]) => value)
                                .map(([label, value]) => (
                                    <div key={label}>
                                        <dt className="text-xs text-muted-foreground">
                                            {label}
                                        </dt>
                                        <dd className="break-words font-medium">
                                            {value}
                                        </dd>
                                    </div>
                                ))}
                        </dl>

                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-xs text-muted-foreground">
                                {t('admin.visaApplications.statusLabel')}
                            </span>
                            <Select
                                value={application.status}
                                onValueChange={(v) =>
                                    statusMutation.mutate(v as Status)
                                }
                            >
                                <SelectTrigger className="h-9 w-44">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUSES.map((s) => (
                                        <SelectItem key={s} value={s}>
                                            {t(
                                                `admin.visaApplications.status.${s}`,
                                            )}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="rounded-xl border border-border p-4">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                <span className="flex items-center gap-2 text-sm font-semibold">
                                    <Lock className="h-4 w-4 text-primary" />
                                    {t('admin.visaApplications.scanTitle')}
                                </span>
                                {application.has_passport_copy && (
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={loadingScan}
                                            onClick={() => openScan(false)}
                                        >
                                            {loadingScan ? (
                                                <Loader2 className="me-1 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Eye className="me-1 h-4 w-4" />
                                            )}
                                            {t('admin.visaApplications.view')}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={loadingScan}
                                            onClick={() => openScan(true)}
                                        >
                                            <Download className="me-1 h-4 w-4" />
                                            {t('admin.visaApplications.download')}
                                        </Button>
                                    </div>
                                )}
                            </div>
                            {!application.has_passport_copy && (
                                <p className="text-sm text-muted-foreground">
                                    {t('admin.visaApplications.noScan')}
                                </p>
                            )}
                            {preview &&
                                (preview.mime === 'application/pdf' ? (
                                    <iframe
                                        src={preview.url}
                                        title="passport"
                                        className="h-[60vh] w-full rounded-lg border"
                                    />
                                ) : (
                                    <img
                                        src={preview.url}
                                        alt="passport"
                                        className="max-h-[60vh] w-full rounded-lg border object-contain"
                                    />
                                ))}
                            <p className="mt-3 text-xs text-muted-foreground">
                                {t('admin.visaApplications.encryptedHint')}
                            </p>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
