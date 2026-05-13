import { motion } from 'framer-motion';
import { Users, Wifi, Wind, Bath, Tv } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface Room {
    id: string;
    name: string;
    description: string;
    pricePerNight: number;
    capacity: number;
    size: number;
    features: string[];
    images: string[];
}

interface RoomsListProps {
    rooms: Room[];
    onBookRoom: (roomId: string) => void;
}

const FEATURE_ICONS: Record<string, typeof Wifi> = {
    wifi: Wifi,
    ac: Wind,
    bathroom: Bath,
    tv: Tv,
};

export function RoomsList({ rooms, onBookRoom }: RoomsListProps) {
    const { t } = useLanguage();

    return (
        <div className="mb-12">
            <h2 className="mb-6 font-serif text-3xl font-bold text-foreground">
                {t('hotelDetail.availableRooms')}
            </h2>

            <div className="space-y-6">
                {rooms.map((room, index) => (
                    <motion.div
                        key={room.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="overflow-hidden rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-lg"
                    >
                        <div className="grid gap-6 lg:grid-cols-4">
                            {/* Image */}
                            <div className="lg:col-span-1">
                                <img
                                    src={room.images[0]}
                                    alt={room.name}
                                    className="h-40 w-full rounded-lg object-cover"
                                    loading="lazy"
                                />
                            </div>

                            {/* Details */}
                            <div className="lg:col-span-2">
                                <h3 className="mb-2 font-serif text-xl font-bold text-foreground">
                                    {room.name}
                                </h3>

                                <p className="mb-4 text-sm text-muted-foreground">
                                    {room.description}
                                </p>

                                <div className="mb-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Users className="h-4 w-4" />
                                        {room.capacity}{' '}
                                        {t('hotelDetail.guests')}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        •
                                    </div>
                                    <div>{room.size} m²</div>
                                </div>

                                {/* Features */}
                                <div className="flex flex-wrap gap-2">
                                    {room.features.map((feature) => {
                                        const Icon =
                                            FEATURE_ICONS[
                                                feature as keyof typeof FEATURE_ICONS
                                            ];
                                        if (!Icon) return null;

                                        return (
                                            <div
                                                key={feature}
                                                className="flex items-center gap-2 rounded-lg bg-muted px-2 py-1"
                                            >
                                                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="text-xs text-muted-foreground">
                                                    {feature}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Price & CTA */}
                            <div className="flex flex-col items-end justify-between lg:col-span-1">
                                <div className="text-right">
                                    <div className="text-sm text-muted-foreground">
                                        {t('hotelDetail.pricePerNight')}
                                    </div>
                                    <div className="mb-4 font-serif text-3xl font-bold text-secondary">
                                        ${room.pricePerNight}
                                    </div>
                                </div>

                                <Button
                                    onClick={() => onBookRoom(room.id)}
                                    className="w-full"
                                >
                                    {t('hotelDetail.selectRoom')}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
