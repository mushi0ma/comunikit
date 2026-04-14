import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ru from "@/locales/ru.json";
import kk from "@/locales/kk.json";

const STORAGE_KEY = "comunikit_lang";

i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    kk: { translation: kk },
  },
  lng: localStorage.getItem(STORAGE_KEY) || "ru",
  fallbackLng: "ru",
  interpolation: { escapeValue: false },
});

/** Persist language choice and switch */
export function setLanguage(lang: "ru" | "kk") {
  localStorage.setItem(STORAGE_KEY, lang);
  void i18n.changeLanguage(lang);
}

export default i18n;
