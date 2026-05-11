import { motion } from 'framer-motion';

interface TourItineraryTimelineProps {
    itinerary: string[];
}

export function TourItineraryTimeline({ itinerary }: TourItineraryTimelineProps) {
    return (
        <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="mb-4 font-serif text-xl font-bold">Itinerary timeline</h3>
            <div className="space-y-5">
                {itinerary.map((step, index) => (
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08 }}
                        className="flex gap-4"
                    >
                        <div className="flex flex-col items-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                                {index + 1}
                            </div>
                            {index < itinerary.length - 1 && <div className="mt-2 h-full w-px bg-border" />}
                        </div>
                        <div className="pb-5 text-sm text-foreground">{step}</div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
