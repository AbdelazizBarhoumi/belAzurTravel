/**
 * Master type index - re-exports all types for centralized imports
 */

export * from './common';
export * from './admin/index';
export * from './public/index';
export * from './forms/index';

/**
 * Example usage:
 *
 * // Import specific types
 * import type { AdminDestination, AdminHotel } from '@/types/admin';
 * import type { DestinationItem, BlogPostItem } from '@/types/public';
 * import type { LocalizedText } from '@/types';
 *
 * // Or from master export
 * import type { AdminDestination, DestinationItem, LocalizedText } from '@/types';
 */
