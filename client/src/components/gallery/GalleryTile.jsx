import { useState } from "react";
import { motion } from "framer-motion";
import { ImageOff, Play } from "lucide-react";
import { titleOf, captionOf } from "../../gallery/galleryApi";

/**
 * One gallery tile.
 *
 * The aspect-ratio box reserves the exact space before the file arrives, so
 * nothing shifts as images stream in. A photo that fails to load degrades to a
 * labelled placeholder inside the same box instead of collapsing the grid or
 * showing a broken-image icon.
 */
export default function GalleryTile({ item, index, onOpen }) {
  const [state, setState] = useState("loading");
  const heading = titleOf(item);
  const caption = captionOf(item);

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(index)}
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index, 11) * 0.04, ease: [0.21, 0.65, 0.36, 1] }}
      className="group relative flex w-full cursor-pointer flex-col overflow-hidden rounded-[20px] border border-line bg-white text-left shadow-soft transition-shadow duration-300 hover:border-primary/30 hover:shadow-lift focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 motion-reduce:transform-none"
      aria-label={`Open photo: ${heading}`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-sage">
        {state === "failed" ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-sage/70 text-center">
            <ImageOff size={26} className="text-primary/40" aria-hidden="true" />
            <span className="px-4 text-xs font-medium text-primary/60">Image unavailable</span>
          </div>
        ) : item.type === "video" ? (
          <video
            src={item.image}
            muted
            playsInline
            preload="none"
            onError={() => setState("failed")}
            className="h-full w-full object-cover transition-transform duration-700 ease-out motion-reduce:transform-none group-hover:scale-105"
          />
        ) : (
          <>
            <img
              src={item.thumb || item.image}
              srcSet={item.srcSet || undefined}
              sizes={item.srcSet ? item.sizes || undefined : undefined}
              alt={item.alt || heading}
              loading="lazy"
              decoding="async"
              width={item.width || 800}
              height={item.height || 600}
              onLoad={() => setState("ready")}
              onError={() => setState("failed")}
              className={`h-full w-full object-cover transition-all duration-700 ease-out motion-reduce:transform-none group-hover:scale-105 ${
                state === "ready" ? "opacity-100" : "opacity-0"
              }`}
            />
            {state === "loading" ? (
              <span className="absolute inset-0 animate-pulse bg-sage/60 motion-reduce:animate-none" aria-hidden="true" />
            ) : null}
          </>
        )}

        <span
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-95"
          aria-hidden="true"
        />

        {item.type === "video" ? (
          <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-primary shadow-lift">
              <Play size={22} className="ml-0.5 fill-primary" />
            </span>
          </span>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          {item.year ? (
            <span className="mb-2 inline-block rounded-full bg-lime/95 px-2.5 py-1 text-[11px] font-bold tracking-wide text-ink">
              {item.year}
            </span>
          ) : null}
                <span className="block font-heading font-semibold leading-snug text-white line-clamp-2 sm:text-base">
            {heading}
          </span>
          {caption ? (
            <span className="mt-1.5 block text-xs leading-relaxed text-white/75 line-clamp-2">{caption}</span>
          ) : null}
        </div>
      </div>
    </motion.button>
  );
}
