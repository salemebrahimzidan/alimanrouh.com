import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { resources, type AppLanguage } from './resources'

const LANGUAGE_STORAGE_KEY = 'rouh-aleman:lang'

function getInitialLanguage(): AppLanguage {
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (saved === 'ar' || saved === 'en') return saved
  return 'ar'
}

function applyDocumentDirection(lang: AppLanguage) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.dir = dir
  document.documentElement.lang = lang
}

void i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  defaultNS: 'shared',
  ns: [
    'shared',
    'home',
    'flights',
    'hajj',
    'umrah',
    'tourism',
    'hotels',
    'offers',
    'contact',
    'about',
    'booking',
    'account',
  ],
  interpolation: { escapeValue: false },
  react: {
    bindI18nStore: 'added removed',
  },
})

applyDocumentDirection(i18n.language as AppLanguage)
i18n.on('languageChanged', (lng) => {
  const lang = (lng === 'ar' ? 'ar' : 'en') as AppLanguage
  localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
  applyDocumentDirection(lang)
})

export { i18n, LANGUAGE_STORAGE_KEY }
