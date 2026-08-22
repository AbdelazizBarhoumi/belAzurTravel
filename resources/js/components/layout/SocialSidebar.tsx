import type React from 'react';
import {
    FacebookIcon,
    InstagramIcon,
    TwitterIcon,
    LinkedinIcon,
    YoutubeIcon,
    TiktokIcon,
    WhatsAppIcon,
} from '@/components/ui/SocialIcons';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const brandIcons: Record<
    string,
    React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
    facebook: FacebookIcon,
    instagram: InstagramIcon,
    twitter: TwitterIcon,
    linkedin: LinkedinIcon,
    youtube: YoutubeIcon,
    tiktok: TiktokIcon,
    whatsapp: WhatsAppIcon,
};

export function SocialSidebar() {
    const { settings } = useSiteSettings();

    if (!settings.socialLinks.length) return null;

    return (
        <div className="fixed right-0 top-1/2 z-50 hidden -translate-y-1/2 flex-col items-center gap-4 rounded-l-lg bg-white/80 px-3 py-5 backdrop-blur-sm md:flex">
            {settings.socialLinks.map((social, i) => {
                const Icon = brandIcons[social.label.toLowerCase()];
                if (!Icon) return null;
                return (
                    <a
                        key={i}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-10 w-10 items-center justify-center rounded-full transition-all hover:scale-110"
                        title={social.label}
                    >
                        <Icon className="h-8 w-8" />
                    </a>
                );
            })}
        </div>
    );
}
