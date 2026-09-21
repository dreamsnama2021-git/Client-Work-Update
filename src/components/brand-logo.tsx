import Image from "next/image";

import { cn } from "@/lib/utils";

// The logo has dark lettering on a transparent background, so it sits on a
// white tile to stay readable in the dark theme.
export function BrandLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/greens-media-logo.png"
      alt="Greens Media"
      width={480}
      height={356}
      priority
      unoptimized
      className={cn("w-auto rounded-md bg-white p-1", className)}
    />
  );
}
