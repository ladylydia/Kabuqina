import { cn } from "../lib/cn";
import { useI18n } from "../lib/i18n";

type BrandMarkProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClass = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-12 w-12 sm:h-14 sm:w-14",
} as const;

/**
 * App logo (designer PNG v1 — extra-bold H; best legibility at small UI sizes).
 */
export function BrandMark({ className, size = "md" }: BrandMarkProps) {
  const { t } = useI18n();
  return (
    <img
      src="/logo.png"
      width={512}
      height={512}
      alt={t("brand")}
      className={cn("shrink-0 object-contain", sizeClass[size], className)}
    />
  );
}
