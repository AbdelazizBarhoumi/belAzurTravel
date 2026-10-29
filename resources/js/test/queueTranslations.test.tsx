import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { translations } from '@/i18n/translations';

const queuePagePath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../pages/admin/AdminQueue.tsx',
);

const queueSource = fs.readFileSync(queuePagePath, 'utf8');

const isComplete = (key: string) => {
    const entry = translations[key];
    return Boolean(entry?.fr && entry?.ar && entry?.en);
};

/** Values the queue page interpolates into a translation key. */
const DYNAMIC_KEY_VALUES: Record<string, string[]> = {
    // Complaint + support-inquiry statuses (see AdminQueueController and
    // AdminSupportInquiryController validation rules).
    'complaint.status': [
        'pending',
        'in_review',
        'resolved',
        'rejected',
        'refunded',
        'new',
        'in-progress',
        'closed',
    ],
    'complaint.type': ['complaint', 'refund_request'],
    'complaint.priority': ['low', 'medium', 'high'],
    // BookingAction enum values.
    'admin.queue.audit': [
        'created',
        'submitted',
        'approved',
        'rejected',
        'confirmed',
        'cancelled',
        'expired',
        'completed',
        'updated',
    ],
    'admin.queue.tab': ['bookings', 'complaints', 'refunds', 'support'],
};

describe('Admin queue translations', () => {
    it('defines every literal t() key used by the queue page', () => {
        const keys = new Set<string>();
        const keyPattern = /\bt\(\s*'([^']+)'/g;
        let match: RegExpExecArray | null;

        while ((match = keyPattern.exec(queueSource))) {
            keys.add(match[1]);
        }

        expect(keys.size).toBeGreaterThan(30);

        const missing = [...keys].filter((key) => !isComplete(key)).sort();

        expect(missing).toEqual([]);
    });

    it('defines every value interpolated into a dynamic queue translation key', () => {
        const missing = Object.entries(DYNAMIC_KEY_VALUES)
            .flatMap(([prefix, values]) =>
                values.map((value) => `${prefix}.${value}`),
            )
            .filter((key) => !isComplete(key))
            .sort();

        expect(missing).toEqual([]);
    });

    it('does not fall back to raw keys for support inquiry statuses', () => {
        for (const status of ['new', 'in-progress', 'resolved']) {
            const key = `complaint.status.${status}`;
            expect(translations[key]?.en, key).toBeTruthy();
        }
    });
});
