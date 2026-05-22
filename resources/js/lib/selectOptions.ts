export function uniqueNonEmptySelectOptions(
    values: Array<string | null | undefined>,
): string[] {
    return Array.from(
        new Set(
            values
                .map((value) => (typeof value === 'string' ? value.trim() : ''))
                .filter((value) => value.length > 0),
        ),
    );
}
