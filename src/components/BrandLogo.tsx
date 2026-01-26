import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  alt?: string;
  bg_color?: string;
}

export function BrandLogo({
  className,
  alt = "AppBuilder Logo",
  bg_color = "",
}: BrandLogoProps) {
  const { resolvedTheme, themes } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <img
      src="/Builder.png"
      alt={alt}
      className={cn(
        "h-10 w-25 object-contain transition-all duration-200",
        isDark ? "brightness-110" : "",
        className,
      )}
      style={{
        backgroundColor: isDark ? bg_color : "",
      }}
    />
  );
}

export default BrandLogo;
