import defaultBrandLogo from '@/assets/brand-logo.png';

interface BrandLogoProps {
    className?: string;
    imageClassName?: string;
    textClassName?: string;
    subtitleClassName?: string;
    label?: string;
    subtitle?: string;
    showText?: boolean;
    textTag?: 'span' | 'div';
    /** Optional custom image source for the logo (falls back to default dark logo) */
    src?: string;
}

export function BrandLogo({
    className = 'flex items-center gap-2',
    imageClassName = 'h-12 w-auto',
    textClassName = 'font-serif text-xl font-bold text-foreground',
    subtitleClassName = 'text-xs text-muted-foreground',
    label = 'BelAzurTravel',
    subtitle,
    showText = true,
    textTag = 'span',
    src,
}: BrandLogoProps) {
    const TextTag = textTag;

    return (
        <div className={className}>
            <img
                src={src ?? defaultBrandLogo}
                alt="BelAzurTravel logo"
                className={imageClassName}
                loading="eager"
            />
            {showText && (
                <div className="flex flex-col leading-tight">
                    <TextTag className={textClassName}>{label}</TextTag>
                    {subtitle && <span className={subtitleClassName}>{subtitle}</span>}
                </div>
            )}
        </div>
    );
}