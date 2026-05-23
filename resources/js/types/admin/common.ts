import type { Lang } from '@/i18n/translations';
import type { LocalizedText } from '../common';

/**
 * Base admin entity with standard fields
 */
export interface AdminEntity {
    id: string;
}

/**
 * Localized admin entity (before deserialization)
 * Used for loading/saving data with LocalizedText fields
 */
export type LocalizedAdminEntity = Record<string, unknown>;

/**
 * Helper to extract localized value for a specific language
 */
export function pickLocalized(value: LocalizedText, lang: Lang = 'en'): string {
    return value[lang];
}

/**
 * Booking status types
 */
export type BookingStatus = 'Pending' | 'Confirmed' | 'Cancelled';

/**
 * User roles
 */
export type UserRole =
    | 'owner'
    | 'superadmin'
    | 'admin'
    | 'assistant'
    | 'client';
