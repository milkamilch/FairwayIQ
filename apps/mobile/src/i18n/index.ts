import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import de from './de';
import en from './en';

const deviceLang = Localization.getLocales()[0]?.languageCode ?? 'de';
const supportedLang = ['de', 'en'].includes(deviceLang) ? deviceLang : 'de';

i18n.use(initReactI18next).init({
  resources: {
    de: { translation: de },
    en: { translation: en },
  },
  lng: supportedLang,
  fallbackLng: 'de',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export default i18n;
