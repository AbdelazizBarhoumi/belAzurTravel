import * as React from 'react';

interface CardMediaProps {
  src?: string | null;
  alt?: string;
  // wrapperClass allows passing aspect-, height- or utility classes for the container
  wrapperClass?: string;
  imgClass?: string;
}

export function CardMedia({ src, alt = '', wrapperClass = 'aspect-[8/3]', imgClass = '' }: CardMediaProps) {
  return (
    <div className={`overflow-hidden ${wrapperClass}`.trim()}>
      {src ? (
        // loading and object-fit handled by classes used across the app
        // keep class small and predictable
        <img src={src} alt={alt} className={`h-full w-full object-cover ${imgClass}`.trim()} loading="lazy" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted">{/* empty placeholder */}</div>
      )}
    </div>
  );
}

export default CardMedia;
