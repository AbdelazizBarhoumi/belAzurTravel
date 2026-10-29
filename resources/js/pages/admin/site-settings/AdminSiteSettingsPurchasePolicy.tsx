import { PolicyPageEditor } from '@/components/admin/PolicyPageEditor';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminSiteSettingsPurchasePolicy() {
    const { t } = useLanguage();

    return (
        <PolicyPageEditor
            contentKey="purchase_policy"
            defaultTitle={{
                en: 'Purchase Policy',
                fr: "Politique d'achat",
                ar: 'سياسة الشراء',
            }}
            pageTitle={t('nav.purchase-policy')}
            subtitle={t('admin.settings.purchasePolicyDescription')}
        />
    );
}
