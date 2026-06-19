import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';

export function LandingVideoModal() {
    const { settings } = useSiteSettingsContext();
    const [open, setOpen] = useState(false);
    const [muted, setMuted] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const videoUrl = settings.landingVideo?.url;

    useEffect(() => {
        if (!videoUrl) return;

        const timer = setTimeout(() => setOpen(true), 500);
        return () => clearTimeout(timer);
    }, [videoUrl]);

    // Unmute after video loads (browsers require muted for autoplay)
    useEffect(() => {
        if (!open || !videoRef.current) return;
        const el = videoRef.current;

        const unmute = () => {
            el.muted = false;
            setMuted(false);
        };

        el.addEventListener('loadeddata', unmute, { once: true });
        const timer = setTimeout(unmute, 1000);

        return () => {
            el.removeEventListener('loadeddata', unmute);
            clearTimeout(timer);
        };
    }, [open]);

    if (!videoUrl) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-3xl border-0 bg-transparent p-0 shadow-none">
                <VisuallyHidden>
                    <DialogTitle>Landing Video</DialogTitle>
                </VisuallyHidden>
                <div className="relative">
                    <div className="overflow-hidden rounded-xl">
                        <video
                            ref={videoRef}
                            src={videoUrl}
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="w-full"
                            preload="metadata"
                        />
                    </div>
                    <button
                        onClick={() => {
                            if (videoRef.current) {
                                videoRef.current.muted = !videoRef.current.muted;
                                setMuted(videoRef.current.muted);
                            }
                        }}
                        className="absolute bottom-3 right-3 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                    >
                        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
