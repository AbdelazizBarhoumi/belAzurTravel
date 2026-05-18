import type { LocalizedText } from '../common';
import type { AdminEntity, BookingStatus } from './common';

/**
 * Admin booking - displayed in admin panel
 */
export interface AdminBooking extends AdminEntity {
    id: string;
    client: string;
    type: string;
    item: string;
    date: string;
    amount: number;
    status: BookingStatus;
}

/**
 * Admin booking with localized fields (storage format)
 */
export interface LocalizedAdminBooking extends Omit<AdminBooking, 'client' | 'type' | 'item' | 'status'> {
    client: LocalizedText;
    type: LocalizedText;
    item: LocalizedText;
    status: LocalizedText;
}
