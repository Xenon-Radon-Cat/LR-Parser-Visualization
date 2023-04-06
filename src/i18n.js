import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from 'i18next-browser-languagedetector';
//import { resources } from "./resources.js";

const resources = {
   en: {
     translation: {
       "Welcome to React": "Welcome to React and react-i18next",
       "Visual Recursive Descent Analysis": "Visual Recursive Descent Analysis",
       "input production": "input production",
       "input grammar": "input grammar",
       "start analysis": "start analysis",
       "first&follow": "first&follow",
       "Predictive analysis table": "Predictive analysis table",
       "recursive analysis step": "recursive analysis step",
       "next step": "next step",
       "zh": "zh",
       "en": "en"
     },
   },
   fr: {
     translation: {
       "Welcome to React": "Bienvenue à React et react-i18next"
     }
   },
   zh: {
      translation: {
         "Visual Recursive Descent Analysis":"可视递归下降分析",
         "input production": "输入产生式",
         "input grammar": "输入文法",
         "start analysis": "开始分析",
         "first&follow": "first集和follow集",
         "Predictive analysis table": "预测分析表",
         "recursive analysis step": "递归分析步骤",
         "next step": "下一步",
         "zh": "中文",
         "en": "英文"
      }
   }
 };

i18n
   .use(LanguageDetector)
   // 將 i18next 傳入 react-i18next 裡面
   .use(initReactI18next)  
   // 實例化 initReactI18next
   .init({
      resources,
      // 當目前的語言檔找不到對應的字詞時，會用 fallbackLng (en) 作為預設語言
      fallbackLng: "en",
      // 預設語言
      lng: "zh",
      interpolation: {
         // 是否要讓字詞 escaped 來防止 xss 攻擊，這裡因為 React.js 已經做了，就設成 false即可
         escapeValue: false,
      },
   });

export default i18n;