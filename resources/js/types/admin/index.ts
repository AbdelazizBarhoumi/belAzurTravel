export * from './common';
export * from './destination.types';
export * from './hotel.types';
export * from './tour.types';
export * from './booking.types';
export * from './user.types';

import type { AdminBooking } from './booking.types';
import type { AdminDestination } from './destination.types';
import type { AdminHotel } from './hotel.types';
import type { AdminTour } from './tour.types';
import type { AdminUser } from './user.types';

export interface AdminGalleryItem {
    id: string;
    title: { fr: string; ar: string; en: string };
    category: string;
    image: string;
}

export interface AdminState {
    destinations: AdminDestination[];
    hotels: AdminHotel[];
    tours: AdminTour[];
    bookings: AdminBooking[];
    users: AdminUser[];
    gallery: AdminGalleryItem[];
}
