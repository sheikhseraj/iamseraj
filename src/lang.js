import { createContext, useContext } from 'react'

// Shared language context (English / German) used across the app.
export const LangContext = createContext({ lang: 'en', setLang: () => {} })
export const useLang = () => useContext(LangContext)
