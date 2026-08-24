import styles from '@/components/brand-logo.module.css';

type IBrandLogoVariant = 'auto' | 'full' | 'white' | 'icon';

interface IBrandLogoProps {
  className?: string;
  alt?: string;
  variant?: IBrandLogoVariant;
  backgroundColor?: string;
}

export function BrandLogo({
  className,
  alt = 'AppBuilder Logo',
  variant = 'auto',
  backgroundColor = '',
}: IBrandLogoProps) {
  const baseClassName = `${styles.logo} ${variant === 'icon' ? styles.icon : ''} ${className ?? ''}`;

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
          className={`${baseClassName} ${styles.lightLogo}`}
          style={{ backgroundColor }}
        />
        <img
          src="/logo-full-white-text.png"
          alt={alt}
          width={200}
          height={44}
          className={`${baseClassName} ${styles.darkLogo}`}
          style={{ backgroundColor }}
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
        backgroundColor,
      }}
    />
  );
}

export default BrandLogo;
