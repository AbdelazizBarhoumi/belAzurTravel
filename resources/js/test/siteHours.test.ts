import { describe, expect, it } from 'vitest';
import { groupConsecutiveHours, normalizeHours } from '@/lib/site-hours';

describe('site-hours helpers', () => {
    it('normalizes legacy hours payloads', () => {
        const hours = normalizeHours([
            { dayKey: 'footer.mon', value: '09:00 - 18:00' },
            { dayKey: 'footer.tue', ranges: ['09:00 - 18:00'] },
        ]);

        expect(hours).toHaveLength(2);
        expect(hours[0].ranges[0].value).toBe('09:00 - 18:00');
        expect(hours[1].ranges[0].value).toBe('09:00 - 18:00');
    });

    it('groups consecutive days with the same schedule', () => {
        const groups = groupConsecutiveHours([
            {
                dayKey: 'footer.mon',
                ranges: [{ value: '09:00 - 18:00' }],
                closed: false,
            },
            {
                dayKey: 'footer.tue',
                ranges: [{ value: '09:00 - 18:00' }],
                closed: false,
            },
            {
                dayKey: 'footer.wed',
                ranges: [{ value: '10:00 - 16:00' }],
                closed: false,
            },
            {
                dayKey: 'footer.thu',
                ranges: [{ value: '10:00 - 16:00' }],
                closed: false,
            },
            {
                dayKey: 'footer.fri',
                ranges: [],
                closed: true,
            },
        ]);

        expect(groups).toHaveLength(3);
        expect(groups[0].dayKeys).toEqual(['footer.mon', 'footer.tue']);
        expect(groups[1].dayKeys).toEqual(['footer.wed', 'footer.thu']);
        expect(groups[2].closed).toBe(true);
    });
});
