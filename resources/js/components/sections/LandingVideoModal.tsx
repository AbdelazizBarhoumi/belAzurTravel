import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Volume2, VolumeX } from 'lucide-react';
import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';

// Assume portrait until real metadata loads, since that's the common case
// for these clips — keeps the initial layout close to final, no big jump.
const FALLBACK_ASPECT_RATIO = 9 / 16;

export function LandingVideoModal() {
    const { settings } = useSiteSettingsContext();
    const [open, setOpen] = useState(false);
    const [muted, setMuted] = useState(true);
    const [aspectRatio, setAspectRatio] = useState(FALLBACK_ASPECT_RATIO);
    const [ready, setReady] = useState(false);
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

    const handleLoadedMetadata = () => {
        const el = videoRef.current;
        if (el && el.videoWidth && el.videoHeight) {
            setAspectRatio(el.videoWidth / el.videoHeight);
        }
        setReady(true);
    };

    if (!videoUrl) return null;

    const isLandscape = aspectRatio >= 1;

    // Bound the box inside ~90% of the viewport on both axes, then let the
    // real aspect ratio decide which axis is the limiting one. Handles
    // portrait phone clips and landscape clips the same way, on any screen
    // size, and scales small source videos up instead of leaving them tiny.
    const boxStyle: CSSProperties = {
        width: `min(90vw, calc(88dvh * ${aspectRatio}), ${isLandscape ? '1100px' : '480px'})`,
        aspectRatio: `${aspectRatio}`,
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="w-fit max-w-none border-0 bg-transparent p-0 shadow-none">
                <VisuallyHidden>
                    <DialogTitle>Landing Video</DialogTitle>
                </VisuallyHidden>
                <div
                    className="relative mx-auto overflow-hidden rounded-2xl bg-black/20 transition-opacity duration-300"
                    style={{ ...boxStyle, opacity: ready ? 1 : 0.6 }}
                >
                    <video
                        ref={videoRef}
                        src={videoUrl}
                        autoPlay
                        muted
                        playsInline
                        className="h-full w-full object-contain"
                        preload="metadata"
                        onLoadedMetadata={handleLoadedMetadata}
                        onEnded={() => setOpen(false)}
                    />
                    <button
                        onClick={() => {
                            if (videoRef.current) {
                                videoRef.current.muted =
                                    !videoRef.current.muted;
                                setMuted(videoRef.current.muted);
                            }
                        }}
                        className="absolute bottom-3 right-3 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                    >
                        {muted ? (
                            <VolumeX className="h-4 w-4" />
                        ) : (
                            <Volume2 className="h-4 w-4" />
                        )}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
