import store from "redux/store";

const myLanguages = {
  welcomeToMtd: {
    en: "Welcome to MoveToData",
    fr: "Bienvenue sur MoveToData",
    de: "Willkommen bei MoveToData",
    es: "Bienvenido a MoveToData",
    hi: "MoveToData में आपका स्वागत है",
    nl: "Welkom bij MoveToData",
  },
  welcomeToMtdSubTitle: {
    en: "Your all-in-one data platform — store, manage, orchestrate and visualize your data from a single place.",
    fr: "Votre plateforme data tout-en-un — stockez, gérez, orchestrez et visualisez vos données depuis un seul endroit.",
    de: "Ihre All-in-One-Datenplattform — speichern, verwalten, orchestrieren und visualisieren Sie Ihre Daten an einem Ort.",
    es: "Su plataforma de datos todo en uno — almacene, gestione, orqueste y visualice sus datos desde un solo lugar.",
    hi: "आपका ऑल-इन-वन डेटा प्लेटफ़ॉर्म — एक ही स्थान से डेटा संग्रहीत करें, प्रबंधित करें और विज़ुअलाइज़ करें।",
    nl: "Uw alles-in-één dataplatform — sla op, beheer, orkestreer en visualiseer uw data vanaf één plek.",
  },
  builds: {
    en: "Builds",
    fr: "Historique de compilation",
    de: "Baut",
    es: "Construye",
    hi: "बनाता",
    nl: "Bouwt",
  },
};

export type AllLabels = keyof typeof myLanguages;

function getLanguageLabel(label: AllLabels) {
  const state = store.getState();
  const detectBrowserLanguage = require("detect-browser-language");
  let userLanguage = state.userDetails?.user?.preferences?.language;
  if (userLanguage == undefined || userLanguage == null) userLanguage = "en";

  const browserLan = detectBrowserLanguage().substring(0, 2);

  if (myLanguages[label] === undefined) {
    return "!! " + label;
  } else {
    const myLanguageLabel = myLanguages[label] as any;
    if (
      userLanguage == "auto" &&
      detectBrowserLanguage != undefined &&
      myLanguageLabel[browserLan] != undefined
    )
      return myLanguageLabel[browserLan];
    else if (myLanguageLabel[userLanguage] === undefined) {
      return myLanguageLabel["en"]; // return default language if not found
    } else {
      return myLanguageLabel[userLanguage];
    }
  }
}

getLanguageLabel("builds");
