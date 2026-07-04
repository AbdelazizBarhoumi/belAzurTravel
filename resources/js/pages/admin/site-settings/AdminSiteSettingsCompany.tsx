import { Loader2, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/api/http';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export default function AdminSiteSettingsCompany() {
    const { settings, loading } = useSiteSettings();
    const { t } = useLanguage();
    const [companyName, setCompanyName] = useState('');
    const [address, setAddress] = useState('');
    const [plusCode, setPlusCode] = useState('');
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [phone2, setPhone2] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setCompanyName(settings.companyName || '');
        setAddress(settings.address || '');
        setPlusCode(settings.plusCode || '');
        setYear(settings.year || new Date().getFullYear());
        setEmail(settings.email || '');
        setPhone(settings.phone || '');
        setPhone2(settings.phone2 || '');
        setWhatsapp(settings.whatsapp || '');
    }, [settings]);

    if (loading) {
        return (
            <AdminLayout title={t('admin.settings.companyContact')} subtitle={t('nav.settings')}>
                <div className="space-y-6">
                    <Card className="p-4">
                        <div className="space-y-3">
                            <div className="h-6 w-44 animate-pulse rounded bg-muted" />
                            <div className="h-16 animate-pulse rounded bg-muted/70" />
                            <div className="h-16 animate-pulse rounded bg-muted/70" />
                        </div>
                    </Card>
                </div>
            </AdminLayout>
        );
    }

    const save = async () => {
        setIsSaving(true);
        try {
            await apiFetch('/api/site-settings', {
                method: 'PUT',
                body: JSON.stringify({
                    companyName: companyName.trim(),
                    email: email.trim(),
                    phone: phone.trim(),
                    phone2: phone2.trim(),
                    whatsapp: whatsapp.trim(),
                    address: address.trim(),
                    plusCode: plusCode.trim(),
                    year,
                }),
            });
            toast.success(t('admin.settings.saveSuccess'));
        } catch {
            toast.error(t('admin.settings.saveError'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AdminLayout
            title={t('admin.settings.companyContact')}
            subtitle={t('admin.settings.brandIdentity')}
            actions={
                <Button size="sm" onClick={save} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />} {t('admin.settings.save')}
                </Button>
            }
        >
            <div className="grid gap-4 lg:grid-cols-2">
                <Card className="space-y-3 p-4">
                    <h3 className="font-medium">{t('admin.settings.companyInfo')}</h3>
                    <div className="space-y-2">
                        <Label>{t('admin.settings.companyName')}</Label>
                        <Input
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder={t('admin.settings.placeholder.companyName')}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>{t('admin.settings.address')}</Label>
                        <Input
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder={t('admin.settings.placeholder.address')}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>{t('admin.settings.plusCode')}</Label>
                        <Input
                            value={plusCode}
                            onChange={(e) => setPlusCode(e.target.value)}
                            placeholder={t('admin.settings.placeholder.plusCode')}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>{t('admin.settings.year')}</Label>
                        <Input
                            type="number"
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value) || year)}
                            min={2000}
                            max={2100}
                        />
                    </div>
                </Card>

                <Card className="space-y-3 p-4">
                    <h3 className="font-medium">{t('admin.settings.contactDetails')}</h3>
                    <div className="space-y-2">
                        <Label>{t('admin.settings.email')}</Label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t('admin.settings.placeholder.email')}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>{t('admin.settings.phone')}</Label>
                        <Input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder={t('admin.settings.placeholder.phone')}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>{t('admin.settings.phone2')}</Label>
                        <Input
                            value={phone2}
                            onChange={(e) => setPhone2(e.target.value)}
                            placeholder={t('admin.settings.placeholder.phone2')}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>{t('admin.settings.whatsapp')}</Label>
                        <Input
                            value={whatsapp}
                            onChange={(e) => setWhatsapp(e.target.value)}
                            placeholder={t('admin.settings.placeholder.whatsapp')}
                        />
                    </div>
                </Card>
            </div>
        </AdminLayout>
    );
}
