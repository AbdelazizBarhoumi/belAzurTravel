import type React from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import {
    FacebookIcon,
    InstagramIcon,
    TwitterIcon,
    LinkedinIcon,
    YoutubeIcon,
    TiktokIcon,
} from '@/components/ui/SocialIcons';

const brandIcons: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
    facebook: FacebookIcon,
    instagram: InstagramIcon,
    twitter: TwitterIcon,
    linkedin: LinkedinIcon,
    youtube: YoutubeIcon,
    tiktok: TiktokIcon,
};

export function SocialSidebar() {
    const { settings } = useSiteSettings();

    if (!settings.socialLinks.length) return null;

    return (
        <div className="fixed right-0 top-1/2 z-50 hidden -translate-y-1/2 flex-col items-center gap-4 bg-white/80 backdrop-blur-sm px-3 py-5 rounded-l-lg md:flex">

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