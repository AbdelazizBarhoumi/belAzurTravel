const PROMO_GRADIENT_CLASS_PATTERN =
    /^(from|via|to)-(primary|secondary)(\/\d{1,3})?$/;

const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export function normalizePromoColor(color?: string): string {
    return color?.trim().replace(/\s+/g, ' ') ?? '';
}

export function isHexColor(color?: string): boolean {
    return HEX_COLOR_PATTERN.test(normalizePromoColor(color));
}

export function getPromoBackground(color?: string): {
    className: string;
    style?: React.CSSProperties;
} {
    const normalizedColor = normalizePromoColor(color);

    if (!normalizedColor) {
        return { className: 'from-primary to-secondary' };
    }

    if (isHexColor(normalizedColor)) {
        return {
            className: '',
            style: { backgroundColor: normalizedColor },
        };
    }

    const gradientClasses = normalizedColor.split(' ');
    const hasValidLength =
        gradientClasses.length >= 2 && gradientClasses.length <= 3;
    const hasOnlyAllowedClasses = gradientClasses.every((gradientClass) =>
        PROMO_GRADIENT_CLASS_PATTERN.test(gradientClass),
    );

    if (!hasValidLength || !hasOnlyAllowedClasses) {
        return { className: 'from-primary to-secondary' };
    }

    return { className: normalizedColor };
}
