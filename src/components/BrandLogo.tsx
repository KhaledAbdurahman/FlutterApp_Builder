import { cn } from '@/lib/utils';

type BrandLogoVariant = 'auto' | 'full' | 'white' | 'icon';

interface BrandLogoProps {
  className?: string;
  alt?: string;
  variant?: BrandLogoVariant;
  bg_color?: string;
}

export function BrandLogo({
  className,
  alt = 'AppBuilder Logo',
  variant = 'auto',
  bg_color = '',
}: BrandLogoProps) {
  const baseClassName = cn(
    variant === 'icon' ? 'h-10 w-auto' : 'h-10 w-auto max-w-full',
    'object-contain transition-all duration-200',
    className,
  );

  const responsiveSrcSet =
    '/logo-160w.png 160w, /logo-200w.png 200w, /logo-240w.png 240w, /logo-320w.png 320w, /logo-400w.png 400w, /logo-640w.png 640w';

  if (variant === 'auto') {
    return (
      <>
        <img
          src="/logo-full.png"
          srcSet={responsiveSrcSet}
          sizes="(max-width: 640px) 160px, 200px"
          alt={alt}
          width={200}
          height={44}
          className={cn(baseClassName, 'dark:hidden')}
          style={{ backgroundColor: bg_color }}
        />
        <img
          src="/logo-full-white-text.png"
          alt={alt}
          width={200}
          height={44}
          className={cn(baseClassName, 'hidden dark:block')}
          style={{ backgroundColor: bg_color }}
        />
      </>
    );
  }

  const src =
    variant === 'icon'
      ? '/logo-icon.png'
      : variant === 'white'
        ? '/logo-full-white-text.png'
        : '/logo-full.png';

  return (
    <img
      src={src}
      srcSet={variant === 'full' ? responsiveSrcSet : undefined}
      sizes="(max-width: 640px) 160px, 200px"
      alt={alt}
      width={variant === 'icon' ? 65 : 200}
      height={variant === 'icon' ? 93 : 44}
      className={baseClassName}
      style={{
        backgroundColor: bg_color,
      }}
    />
  );
}

export default BrandLogo;
