import { cookies } from 'next/headers';
import { tr as trLocale, enGB } from 'date-fns/locale';
import { type Lang, type Messages, getT } from './messages';

export type { Lang, Messages };
export { getT };

/** Read language from cookie — server components only */
export function getLang(): Lang {
  const cookieStore = cookies();
  const val = cookieStore.get('app_lang')?.value;
  return val === 'en' ? 'en' : 'tr';
}

/** Get date-fns locale for the given language */
export function getDateLocale(lang: Lang) {
  return lang === 'en' ? enGB : trLocale;
}
