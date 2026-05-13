import React, { useEffect, useState } from 'react';
import { PageShell } from '@/components/PageShell';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export default function AdminSiteSettings() {
    const { settings, loading } = useSiteSettings();
    const { t } = useLanguage();

    const [form, setForm] = useState({
        companyName: '',
        email: '',
        phone: '',
        whatsapp: '',
        address: '',
        year: new Date().getFullYear(),
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && settings) {
            setForm({
                companyName: settings.companyName || '',
                email: settings.email || '',
                phone: settings.phone || '',
                whatsapp: settings.whatsapp || '',
                address: settings.address || '',
                year: settings.year || new Date().getFullYear(),
            });
        }
    }, [loading, settings]);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/site-settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error('Failed');
            setMessage('Saved');
        } catch {
            setMessage('Failed to save');
        } finally {
            setSaving(false);
        }
    }

    return (
        <PageShell
            titleKey="admin.siteSettings"
            subtitleKey="admin.siteSettingsDesc"
            breadcrumbs={[
                { label: t('admin.home'), href: '/admin' },
                { label: t('admin.siteSettings'), active: true },
            ]}
        >
            <div className="mx-auto max-w-3xl">
                <form onSubmit={submit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground">
                            {t('site.companyName')}
                        </label>
                        <input
                            className="mt-1 w-full rounded-md border p-2"
                            value={form.companyName}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    companyName: e.target.value,
                                })
                            }
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground">
                            {t('site.email')}
                        </label>
                        <input
                            className="mt-1 w-full rounded-md border p-2"
                            value={form.email}
                            onChange={(e) =>
                                setForm({ ...form, email: e.target.value })
                            }
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground">
                            {t('site.phone')}
                        </label>
                        <input
                            className="mt-1 w-full rounded-md border p-2"
                            value={form.phone}
                            onChange={(e) =>
                                setForm({ ...form, phone: e.target.value })
                            }
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground">
                            {t('site.whatsapp')}
                        </label>
                        <input
                            className="mt-1 w-full rounded-md border p-2"
                            value={form.whatsapp}
                            onChange={(e) =>
                                setForm({ ...form, whatsapp: e.target.value })
                            }
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground">
                            {t('site.address')}
                        </label>
                        <textarea
                            className="mt-1 w-full rounded-md border p-2"
                            value={form.address}
                            onChange={(e) =>
                                setForm({ ...form, address: e.target.value })
                            }
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground">
                            {t('site.year')}
                        </label>
                        <input
                            type="number"
                            className="mt-1 w-full rounded-md border p-2"
                            value={form.year}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    year: Number(e.target.value),
                                })
                            }
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-md bg-primary px-4 py-2 text-white"
                        >
                            {saving ? t('common.saving') : t('common.save')}
                        </button>
                        {message && (
                            <div className="text-sm text-muted-foreground">
                                {message}
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </PageShell>
    );
}
