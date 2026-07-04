export * from './common';
export * from './destination.types';
export * from './hotel.types';
export * from './tour.types';
export * from './travel.types';
export * from './booking.types';
export * from './user.types';

import type { AdminBooking } from './booking.types';
import type { AdminDestination } from './destination.types';
import type { AdminHotel } from './hotel.types';
import type { AdminTour } from './tour.types';
import type { AdminTravel } from './travel.types';
import type { AdminUser } from './user.types';

export interface AdminGalleryItem {
    id: string;
    title: { fr: string; ar: string; en: string };
    category: string;
    image: string;
}

export interface AdminPartner {
    id: string;
    name: string;
    name_en: string;
    name_fr: string;
    name_ar: string;
    description: string;
    description_en: string;
    description_fr: string;
    description_ar: string;
    website: string | null;
    category: string;
    image: string;
}

export interface AdminState {
    destinations: AdminDestination[];
    hotels: AdminHotel[];
    tours: AdminTour[];
    travels: AdminTravel[];
    bookings: AdminBooking[];
    users: AdminUser[];
    gallery: AdminGalleryItem[];
}
