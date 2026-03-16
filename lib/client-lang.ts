import type { Lang } from './i18n/messages';

export function getClientLang(): Lang {
  if (typeof document === 'undefined') return 'tr';
  const match = document.cookie.match(/(?:^|;\s*)app_lang=([^;]*)/);
  return match?.[1] === 'en' ? 'en' : 'tr';
}

export function setClientLang(lang: Lang): void {
  const maxAge = 60 * 60 * 24 * 365; // 1 year
  document.cookie = `app_lang=${lang}; path=/; max-age=${maxAge}; SameSite=Lax`;
}
