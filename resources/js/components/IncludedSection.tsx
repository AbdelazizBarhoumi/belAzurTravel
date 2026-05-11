import React from 'react';

interface IncludedSectionProps {
    inclusions: string[];
}

export function IncludedSection({ inclusions }: IncludedSectionProps) {
    return (
        <div className="rounded-2xl border border-border bg-card p-5">
            <h4 className="mb-3 font-semibold">Included</h4>
            <ul className="list-inside list-disc space-y-2 text-foreground">
                {inclusions.map((inc, i) => (
                    <li key={i}>{inc}</li>
                ))}
            </ul>
        </div>
    );
}
