import { Star, MapPin, Clock } from 'lucide-react';
import React from 'react';

interface TourSummaryProps {
    title: string;
    type?: string;
    locations: string[];
    durationDays: number;
    durationNights: number;
    rating?: number;
}

export function TourSummary({ title, type, locations, durationDays, durationNights, rating }: TourSummaryProps) {
    return (
        <header className="space-y-4">
            <div className="flex items-center gap-3">
                {type && <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{type}</span>}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{locations.join(' • ')}</span>
                </div>
                {rating !== undefined && (
                    <div className="ml-auto flex items-center gap-2 text-secondary">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="font-bold">{rating}</span>
                    </div>
                )}
            </div>

            <h1 className="font-serif text-4xl font-bold text-foreground">{title}</h1>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{durationDays} days • {durationNights} nights</span>
                </div>
            </div>
        </header>
    );
}
