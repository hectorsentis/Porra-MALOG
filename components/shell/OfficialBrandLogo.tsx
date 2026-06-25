import Image from "next/image";
import { cn } from "@/lib/utils";

type OfficialBrandLogoProps = {
  className?: string;
  priority?: boolean;
};

export function OfficialBrandLogo({
  className,
  priority = false,
}: OfficialBrandLogoProps) {
  return (
    <span
      className={cn(
        "flex h-12 w-24 shrink-0 items-center justify-center rounded-md border border-air-gold bg-[#FFFFFF] px-2 py-1 sm:h-14 sm:w-36",
        className,
      )}
      aria-hidden
    >
      <Image
        src="/assets/logo-rokiski-mundial-2026-full.svg"
        alt=""
        width={144}
        height={66}
        priority={priority}
        sizes="(min-width: 640px) 144px, 96px"
        className="h-full w-full object-contain"
      />
    </span>
  );
}
