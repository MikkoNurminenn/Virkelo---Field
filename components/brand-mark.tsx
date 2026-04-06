import Image from "next/image";

import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  alt?: string;
  className?: string;
  priority?: boolean;
  size?: number;
};

export const BrandMark = ({
  alt = brand.logoAlt,
  className,
  priority = false,
  size = 88,
}: BrandMarkProps) => (
  <Image
    alt={alt}
    className={cn("h-auto w-auto", className)}
    height={size}
    priority={priority}
    src={brand.logoMarkSrc}
    width={size}
  />
);
