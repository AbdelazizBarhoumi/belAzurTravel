import type { ComponentType } from 'react';

export interface NavItem {
    href: string;
    title: string;
    // Icon component accepts className and other optional props
    icon?: ComponentType<Record<string, unknown>> | null;
    items?: NavItem[];
    isActive?: boolean;
}

export type {};
