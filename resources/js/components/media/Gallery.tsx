import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface GalleryProps {
    images: string[];
    hotelName: string;
}

export function Gallery({ images, hotelName }: GalleryProps) {
    const { dir } = useLanguage();
    const isRtl = dir === 'rtl';
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    useEffect(() => {
        if (!lightboxOpen) return undefined;

        const previousBodyOverflow = document.body.style.overflow;
        const previousHtmlOverflow = document.documentElement.style.overflow;

        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousBodyOverflow;
            document.documentElement.style.overflow = previousHtmlOverflow;
        };
    }, [lightboxOpen]);

    const nextImage = () =>
        setSelectedIndex((prev) => (prev + 1) % images.length);
    const prevImage = () =>
        setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);

    const openLightbox = (index: number) => {
        setSelectedIndex(index);
        setLightboxOpen(true);
    };

    return (
        <>
            <div className="flex flex-col gap-3">
                {/* Main image */}
                <motion.div
                    role="button"
                    tabIndex={0}
                    aria-label={`Open image ${selectedIndex + 1} of ${images.length}`}
                    onClick={() => openLightbox(selectedIndex)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openLightbox(selectedIndex);
                        }
                    }}
                    whileHover={{ y: -2 }}
                    className="group relative w-full overflow-hidden rounded-3xl border border-border bg-card shadow-sm"
                >
                    <AnimatePresence mode="wait">
                        <motion.img
                            key={selectedIndex}
                            src={images[selectedIndex]}
                            alt={`${hotelName} main image`}
                            initial={{ opacity: 0, scale: 1.03 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="h-[300px] w-full object-cover md:h-[360px]"
                            loading="eager"
                        />
                    </AnimatePresence>

                    <div className="absolute bottom-3 left-3 rounded-full bg-card/95 px-2.5 py-1 text-xs font-medium text-foreground shadow-md backdrop-blur-sm">
                        {selectedIndex + 1} / {images.length}
                    </div>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (isRtl) {
                                nextImage();
                            } else {
                                prevImage();
                            }
                        }}
                        aria-label={isRtl ? 'Next image' : 'Previous image'}
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white opacity-0 transition-opacity hover:bg-black/60 group-hover:opacity-100"
                    >
                        {isRtl ? (
                            <ChevronRight className="h-4 w-4" />
                        ) : (
                            <ChevronLeft className="h-4 w-4" />
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (isRtl) {
                                prevImage();
                            } else {
                                nextImage();
                            }
                        }}
                        aria-label={isRtl ? 'Previous image' : 'Next image'}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white opacity-0 transition-opacity hover:bg-black/60 group-hover:opacity-100"
                    >
                        {isRtl ? (
                            <ChevronLeft className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </button>
                </motion.div>

                {/* Thumbnails row */}
                <div className="hidden gap-2 overflow-x-auto pb-1 lg:flex">
                    {images.map((image, index) => {
                        const active = index === selectedIndex;
                        return (
                            <motion.button
                                key={`${image}-${index}`}
                                type="button"
                                onClick={() => setSelectedIndex(index)}
                                whileHover={{ scale: 1.04 }}
                                className={`group relative shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                                    active
                                        ? 'border-primary ring-2 ring-primary/30'
                                        : 'border-border opacity-60 hover:opacity-100'
                                }`}
                            >
                                <img
                                    src={image}
                                    alt={`${hotelName} thumbnail ${index + 1}`}
                                    className="h-14 w-20 object-cover transition-transform duration-300 group-hover:scale-105"
                                    loading="lazy"
                                />
                                {index === 5 && images.length > 6 && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-sm font-bold text-white">
                                        +{images.length - 6}
                                    </div>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Lightbox */}
            <AnimatePresence>
                {lightboxOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-0"
                        onClick={() => setLightboxOpen(false)}
                    >
                        <div className="relative flex h-full w-full items-center justify-center p-4">
                            <button
                                type="button"
                                onClick={() => setLightboxOpen(false)}
                                className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                            >
                                <X className="h-6 w-6" />
                            </button>

                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (isRtl) {
                                        nextImage();
                                    } else {
                                        prevImage();
                                    }
                                }}
                                aria-label={
                                    isRtl ? 'Next image' : 'Previous image'
                                }
                                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
                            >
                                {isRtl ? (
                                    <ChevronRight className="h-6 w-6" />
                                ) : (
                                    <ChevronLeft className="h-6 w-6" />
                                )}
                            </button>

                            <motion.img
                                key={selectedIndex}
                                src={images[selectedIndex]}
                                alt={`${hotelName} gallery ${selectedIndex + 1}`}
                                initial={{ opacity: 0, scale: 0.92 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.92 }}
                                className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            />

                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (isRtl) {
                                        prevImage();
                                    } else {
                                        nextImage();
                                    }
                                }}
                                aria-label={
                                    isRtl ? 'Previous image' : 'Next image'
                                }
                                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
                            >
                                {isRtl ? (
                                    <ChevronLeft className="h-6 w-6" />
                                ) : (
                                    <ChevronRight className="h-6 w-6" />
                                )}
                            </button>

                            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 overflow-x-auto rounded-2xl bg-black/40 p-2 backdrop-blur-sm">
                                {images.map((img, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedIndex(i);
                                        }}
                                        className={`shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                                            i === selectedIndex
                                                ? 'border-primary'
                                                : 'border-transparent opacity-60 hover:opacity-100'
                                        }`}
                                    >
                                        <img
                                            src={img}
                                            alt=""
                                            className="h-12 w-16 object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
