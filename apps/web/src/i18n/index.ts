import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { en } from './en';
import { es } from './es';

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

void i18n
  .use(initReactI18next)
  .init({
    resources: { es: { translation: es }, en: { translation: en } },
    lng: 'es',
    fallbackLng: 'es',
    interpolation: { escapeValue: false },
  })
  .then(() => {
    document.documentElement.lang = i18n.language;
  });

export default i18n;
