import { PolicyPageEditor } from '@/components/admin/PolicyPageEditor';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminSiteSettingsPrivacyPolicy() {
    const { t } = useLanguage();

    return (
        <PolicyPageEditor
            contentKey="privacy_policy"
            defaultTitle={{ en: 'Privacy Policy', fr: 'Politique de confidentialité', ar: 'سياسة الخصوصية' }}
            pageTitle={t('nav.privacy-policy')}
            subtitle={t('admin.settings.privacyPolicyDescription')}
        />
    );
}
