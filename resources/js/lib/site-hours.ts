export type LocalizedText = Record<string, string>;

export const HOUR_DAY_KEYS = [
    'footer.mon',
    'footer.tue',
    'footer.wed',
    'footer.thu',
    'footer.fri',
    'footer.sat',
    'footer.sun',
] as const;

export type HourDayKey = (typeof HOUR_DAY_KEYS)[number];

export interface HourRange {
    value: string;
}

export interface SiteHourEntry {
    dayKey: string;
    ranges: HourRange[];
    closed?: boolean;
}

export interface DisplayHourGroup {
    dayKeys: string[];
    ranges: HourRange[];
    closed: boolean;
}

const DAY_ORDER: Record<string, number> = {
    'footer.mon': 0,
    'footer.tue': 1,
    'footer.wed': 2,
    'footer.thu': 3,
    'footer.fri': 4,
    'footer.sat': 5,
    'footer.sun': 6,
    'footer.monfri': 0,
};

export function normalizeHourEntry(entry: unknown): SiteHourEntry | null {
    if (!entry || typeof entry !== 'object') {
        return null;
    }

    const raw = entry as Record<string, unknown>;
    const dayKey = typeof raw.dayKey === 'string' ? raw.dayKey.trim() : '';

    if (!dayKey) {
        return null;
    }

    const rangeSource = Array.isArray(raw.ranges)
        ? raw.ranges
        : typeof raw.value === 'string' && raw.value.trim().length > 0
          ? [raw.value]
          : [];

    const ranges = rangeSource
        .map((range) => {
            if (typeof range === 'string') {
                return { value: range.trim() };
            }

            if (range && typeof range === 'object') {
                const rv = (range as Record<string, unknown>).value;
                if (typeof rv === 'string') {
                    return { value: rv.trim() };
                }
                return { value: '' };
            }

            return { value: '' };
        })
        .filter((range) => range.value.length > 0);

    const closed = Boolean(raw.closed) || ranges.length === 0;

    return {
        dayKey,
        ranges,
        closed,
    };
}

export function normalizeHours(entries: unknown): SiteHourEntry[] {
    if (!Array.isArray(entries)) {
        return [];
    }

    return entries
        .map(normalizeHourEntry)
        .filter((entry): entry is SiteHourEntry => entry !== null);
}

function _scheduleSignature(
    entry: Pick<SiteHourEntry, 'ranges' | 'closed'>,
): string {
    return [
        entry.closed ? 'closed' : 'open',
        ...entry.ranges.map((r) => r.value),
    ].join('|');
}

function dayOrderIndex(dayKey: string): number {
    return DAY_ORDER[dayKey] ?? 999;
}

export function groupConsecutiveHours(
    entries: SiteHourEntry[],
): DisplayHourGroup[] {
    const ordered = entries
        .map((entry, index) => ({ entry, index }))
        .filter(
            ({ entry }) =>
                typeof entry.dayKey === 'string' &&
                entry.dayKey.trim().length > 0,
        )
        .sort((a, b) => {
            const orderDiff =
                dayOrderIndex(a.entry.dayKey) - dayOrderIndex(b.entry.dayKey);
            return orderDiff !== 0 ? orderDiff : a.index - b.index;
        });

    const groups: DisplayHourGroup[] = [];

    for (const { entry } of ordered) {
        const previous = groups[groups.length - 1];

        if (previous) {
            const previousDayIndex = dayOrderIndex(
                previous.dayKeys[previous.dayKeys.length - 1],
            );
            const currentDayIndex = dayOrderIndex(entry.dayKey);
            const matchesSchedule =
                previous.closed === (entry.closed ?? false) &&
                previous.ranges.length === entry.ranges.length &&
                previous.ranges.every(
                    (range, index) =>
                        range.value === entry.ranges[index]?.value,
                );

            if (matchesSchedule && currentDayIndex === previousDayIndex + 1) {
                previous.dayKeys.push(entry.dayKey);
                continue;
            }
        }

        groups.push({
            dayKeys: [entry.dayKey],
            ranges: entry.ranges,
            closed: entry.closed ?? false,
        });
    }

    return groups;
}

export function formatHourRanges(
    entry: SiteHourEntry,
    closedLabel: string,
): string {
    if (entry.closed || entry.ranges.length === 0) {
        return closedLabel;
    }

    return entry.ranges.map((range) => range.value).join(', ');
}

export function formatHourGroupLabel(
    group: DisplayHourGroup,
    resolveLabel: (key: string) => string,
): string {
    if (group.dayKeys.length === 1) {
        return resolveLabel(group.dayKeys[0]);
    }

    return `${resolveLabel(group.dayKeys[0])} – ${resolveLabel(group.dayKeys[group.dayKeys.length - 1])}`;
}
