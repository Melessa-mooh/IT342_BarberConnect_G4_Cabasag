import type { SyntheticEvent } from 'react';

export const DEFAULT_HAIRCUT_IMAGES = {
  classic: '/images/default-haircuts/classic-cut.png',
  barber: '/images/default-haircuts/barber-cut.png',
  trend: '/images/default-haircuts/trend-cut.jpeg',
  premium: '/images/default-haircuts/premium-cut.jpg',
  fallback: '/images/default-haircuts/classic-cut.png',
};

type HaircutImageSource = {
  name?: string | null;
  imageUrl?: string | null;
};

const brokenImageFragments = [
  '/api/placeholder',
  'placeholder',
  'undefined',
  'null',
];

export function isUsableHaircutImageUrl(imageUrl?: string | null): imageUrl is string {
  const normalized = imageUrl?.trim();
  if (!normalized) return false;
  return !brokenImageFragments.some(fragment => normalized.toLowerCase().includes(fragment));
}

export function getDefaultHaircutImage(styleName?: string | null): string {
  const name = styleName?.toLowerCase() ?? '';
  if (name.includes('premium')) return DEFAULT_HAIRCUT_IMAGES.premium;
  if (name.includes('trend') || name.includes('modern')) return DEFAULT_HAIRCUT_IMAGES.trend;
  if (name.includes('barber')) return DEFAULT_HAIRCUT_IMAGES.barber;
  if (name.includes('classic')) return DEFAULT_HAIRCUT_IMAGES.classic;
  return DEFAULT_HAIRCUT_IMAGES.fallback;
}

export function getHaircutImage(style: HaircutImageSource): string {
  return isUsableHaircutImageUrl(style.imageUrl)
    ? style.imageUrl.trim()
    : getDefaultHaircutImage(style.name);
}

export function setHaircutImageFallback(
  event: SyntheticEvent<HTMLImageElement>,
  styleName?: string | null,
) {
  const image = event.currentTarget;
  const fallback = getDefaultHaircutImage(styleName);
  if (!image.src.endsWith(fallback)) {
    image.src = fallback;
  }
}
