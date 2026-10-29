import type { ComponentProps } from 'react';
import { notifyInteraction } from '@/api/interactions.api';
import { Button } from '@/components/ui/button';
import { WhatsAppIcon } from '@/components/ui/SocialIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { cn } from '@/lib/utils';
import { buildWhatsAppUrl } from '@/lib/whatsapp';

interface WhatsAppButtonProps {
    /** Pre-filled chat message describing the item. */
    message: string;
    label?: string;
    variant?: ComponentProps<typeof Button>['variant'];
    size?: ComponentProps<typeof Button>['size'];
    className?: string;
}

/** Opens a WhatsApp chat with the agency, message ready to send. */
export function WhatsAppButton({
    message,
    label,
    variant = 'outline',
    size = 'lg',
    className,
}: WhatsAppButtonProps) {
    const { t } = useLanguage();
    const { settings } = useSiteSettings();
    const phone = settings.whatsapp || settings.phone;

    if (!phone) return null;

    return (
        <Button
            asChild
            variant={variant}
            size={size}
            className={cn('gap-2', className)}
        >
            <a
                href={buildWhatsAppUrl(phone, message)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => notifyInteraction('whatsapp')}
            >
                <WhatsAppIcon className="h-4 w-4" />
                {label ?? t('common.contactViaWhatsApp')}
            </a>
        </Button>
    );
}
