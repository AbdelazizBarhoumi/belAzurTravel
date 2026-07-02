import type React from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/api/http';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import {
    HOUR_DAY_KEYS,
    normalizeHours,
    type SiteHourEntry,
} from '@/lib/site-hours';
import {
    FacebookIcon,
    InstagramIcon,
    TwitterIcon,
    LinkedinIcon,
    YoutubeIcon,
    TiktokIcon,
} from '@/components/ui/SocialIcons';

const SOCIAL_PLATFORMS: Array<{ label: string; placeholder: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }> = [
    { label: 'Facebook', placeholder: 'https://facebook.com/...', icon: FacebookIcon },
    { label: 'Instagram', placeholder: 'https://instagram.com/...', icon: InstagramIcon },
    { label: 'Twitter', placeholder: 'https://x.com/...', icon: TwitterIcon },
    { label: 'LinkedIn', placeholder: 'https://linkedin.com/...', icon: LinkedinIcon },
    { label: 'YouTube', placeholder: 'https://youtube.com/...', icon: YoutubeIcon },
    { label: 'TikTok', placeholder: 'https://tiktok.com/...', icon: TiktokIcon },
];

interface SocialLink {
    label: string;
    href: string;
}

interface HourRow extends SiteHourEntry {}

function createHourRow(dayKey = HOUR_DAY_KEYS[0]): HourRow {
    return { dayKey, ranges: [{ value: '' }], closed: false };
}

function normalizeHourRows(hours: SiteHourEntry[]): HourRow[] {
    return hours.map((entry) => ({
        dayKey: entry.dayKey,
        ranges: entry.ranges.length > 0 ? entry.ranges.map((r) => ({ value: r.value })) : [{ value: '' }],
        closed: Boolean(entry.closed),
    }));
}

function serializeHourRows(hours: HourRow[]): Array<{ dayKey: string; closed: boolean; ranges: string[] }> {
    return hours
        .map((entry) => ({
            dayKey: entry.dayKey.trim(),
            closed: Boolean(entry.closed),
            ranges: entry.closed ? [] : entry.ranges.map((r) => r.value.trim()).filter((v) => v.length > 0),
        }))
        .filter((entry) => entry.dayKey.length > 0);
}

export default function AdminSiteSettingsSocial() {
    const { settings, loading } = useSiteSettings();
    const { t } = useLanguage();
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
    const [hours, setHours] = useState<HourRow[]>([]);

    const usedLabels = socialLinks.map((s) => s.label.toLowerCase());
    const allPlatformsUsed = SOCIAL_PLATFORMS.every((p) =>
        usedLabels.includes(p.label.toLowerCase()),
    );

    useEffect(() => {
        setSocialLinks(settings.socialLinks || []);
        setHours(normalizeHourRows(normalizeHours(settings.hours || [])));
    }, [settings]);

    if (loading) {
        return (
            <AdminLayout title={t('admin.settings.socialMedia')} subtitle={t('nav.settings')}>
                <div className="space-y-6">
                    <Card className="p-4"><div className="h-48 animate-pulse rounded bg-muted/70" /></Card>
                </div>
            </AdminLayout>
        );
    }

    const save = async () => {
        try {
            await apiFetch('/api/site-settings', {
                method: 'PUT',
                body: JSON.stringify({
                    socialLinks: socialLinks.filter((e) => e.label.trim().length > 0 && e.href.trim().length > 0),
                    hours: serializeHourRows(hours).filter((e) => e.dayKey.trim().length > 0 && (e.closed || e.ranges.length > 0)),
                }),
            });
            toast.success(t('admin.settings.saveSuccess'));
        } catch {
            toast.error(t('admin.settings.saveError'));
        }
    };

    const addSocial = () => setSocialLinks((p) => [...p, { label: '', href: '' }]);
    const removeSocial = (i: number) => setSocialLinks((p) => p.filter((_, idx) => idx !== i));
    const updateSocial = (i: number, patch: Partial<SocialLink>) =>
        setSocialLinks((p) => p.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
    const addHour = () => setHours((p) => [...p, createHourRow()]);
    const removeHour = (i: number) => setHours((p) => p.filter((_, idx) => idx !== i));
    const updateHourRange = (hI: number, rI: number, value: string) =>
        setHours((p) => p.map((h, i) => (i === hI ? { ...h, ranges: h.ranges.map((r, ri) => (ri === rI ? { value } : r)) } : h)));
    const addHourRange = (hI: number) =>
        setHours((p) => p.map((h, i) => (i === hI ? { ...h, ranges: [...h.ranges, { value: '' }] } : h)));
    const removeHourRange = (hI: number, rI: number) =>
        setHours((p) => p.map((h, i) => (i === hI ? { ...h, ranges: h.ranges.filter((_, ri) => ri !== rI) } : h)));

    return (
        <AdminLayout
            title={t('admin.settings.socialMedia')}
            subtitle={t('admin.settings.businessHours')}
            actions={
                <Button size="sm" onClick={save}>
                    <Save className="mr-1 h-4 w-4" /> {t('admin.settings.save')}
                </Button>
            }
        >
            <div className="grid gap-4 lg:grid-cols-2">
                <Card className="space-y-3 p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium">{t('admin.settings.socialMedia')}</h3>
                        <Button size="sm" variant="outline" onClick={addSocial} disabled={allPlatformsUsed}>
                            <Plus className="mr-1 h-3.5 w-3.5" /> {t('admin.settings.addLink')}
                        </Button>
                    </div>
                    {allPlatformsUsed && (
                        <p className="text-xs text-muted-foreground">{t('admin.settings.allPlatformsUsed') ?? 'All platforms added.'}</p>
                    )}
                    {socialLinks.length === 0 && (
                        <p className="text-xs text-muted-foreground">{t('admin.settings.noSocialLinks')}</p>
                    )}
                    {socialLinks.map((entry, idx) => {
                        const platform = SOCIAL_PLATFORMS.find((p) => p.label.toLowerCase() === entry.label.toLowerCase());
                        const Icon = platform?.icon;
                        const usedLabels = socialLinks
                            .filter((_, i) => i !== idx)
                            .map((s) => s.label.toLowerCase());
                        return (
                            <div key={idx} className="flex items-end gap-2 rounded-md bg-muted/40 p-2">

                                <div className="flex-1">
                                    <Label className="text-xs">Platform</Label>
                                    <Select
                                        value={entry.label}
                                        onValueChange={(v) => updateSocial(idx, { label: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select platform" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SOCIAL_PLATFORMS.map((p) => (
                                                <SelectItem
                                                    key={p.label}
                                                    value={p.label}
                                                    disabled={usedLabels.includes(p.label.toLowerCase())}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <p.icon className="h-4 w-4" />
                                                        {p.label}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex-1">
                                    <Label className="text-xs">URL</Label>
                                    <Input
                                        value={entry.href}
                                        onChange={(e) => updateSocial(idx, { href: e.target.value })}
                                        placeholder={platform?.placeholder ?? 'https://...'}
                                    />
                                </div>
                                <Button size="icon" variant="ghost" onClick={() => removeSocial(idx)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        );
                    })}
                </Card>

                <Card className="space-y-3 p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium">{t('admin.settings.businessHours')}</h3>
                        <Button size="sm" variant="outline" onClick={addHour}>
                            <Plus className="mr-1 h-3.5 w-3.5" /> {t('admin.settings.addRow')}
                        </Button>
                    </div>
                    {hours.length === 0 && (
                        <p className="text-center text-xs text-muted-foreground">{t('admin.settings.noHours')}</p>
                    )}
                    <div className="space-y-3">
                        {hours.map((hour, idx) => (
                            <Card key={idx} className="space-y-3 p-3">
                                <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-12">
                                    <div className="md:col-span-4">
                                        <Label className="text-xs">{t('admin.settings.day')}</Label>
                                        <Select value={hour.dayKey} onValueChange={(v) => setHours((p) => p.map((h, i) => (i === idx ? { ...h, dayKey: v } : h)))}>
                                            <SelectTrigger className="mt-1"><SelectValue placeholder={t('admin.settings.day')} /></SelectTrigger>
                                            <SelectContent>
                                                {HOUR_DAY_KEYS.map((k) => (<SelectItem key={k} value={k}>{t(k)}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="md:col-span-6">
                                        <div className="mb-2 flex items-center justify-between gap-3">
                                            <Label className="text-xs">{t('admin.settings.hours')}</Label>
                                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Switch checked={hour.closed} onCheckedChange={(c) => setHours((p) => p.map((h, i) => (i === idx ? { ...h, closed: c } : h)))} />
                                                {t('admin.settings.closed')}
                                            </label>
                                        </div>
                                        {!hour.closed && (
                                            <div className="space-y-2">
                                                {hour.ranges.map((range, ri) => (
                                                    <div key={ri} className="flex items-center gap-2">
                                                        <Input value={range.value} onChange={(e) => updateHourRange(idx, ri, e.target.value)} placeholder="09:00 - 12:00" className="flex-1" />
                                                        <Button size="icon" variant="ghost" onClick={() => removeHourRange(idx, ri)} disabled={hour.ranges.length === 1}>
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                ))}
                                                <Button size="sm" variant="outline" onClick={() => addHourRange(idx)}>
                                                    <Plus className="mr-1 h-3.5 w-3.5" /> {t('admin.settings.addTimeRange')}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-end justify-end md:col-span-2">
                                        <Button size="icon" variant="ghost" onClick={() => removeHour(idx)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </Card>
            </div>
        </AdminLayout>
    );
}
