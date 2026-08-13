import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  getLanguageOption,
  isSupportedLanguage,
  TRANSLATIONS,
  type SupportedLanguage,
} from './translations'


const UI_LANGUAGE_KEY =
  'scopediff_ui_language_v1'

const REPORT_LANGUAGE_KEY =
  'scopediff_report_language_v1'


interface LanguageContextValue {
  language: SupportedLanguage

  reportLanguage:
    SupportedLanguage

  locale: string

  setLanguage:
    (
      language:
        SupportedLanguage,
    ) => void

  setReportLanguage:
    (
      language:
        SupportedLanguage,
    ) => void

  t:
    (
      key: string,
    ) => string
}


const LanguageContext =
  createContext<
    LanguageContextValue
    | undefined
  >(undefined)


function readLanguage(
  key: string,
  fallback:
    SupportedLanguage,
): SupportedLanguage {
  try {
    const value =
      localStorage.getItem(
        key,
      )

    if (
      value
      && isSupportedLanguage(
        value,
      )
    ) {
      return value
    }

  } catch {
  }

  return fallback
}


export function LanguageProvider(
  {
    children,
  }: {
    children: ReactNode
  },
) {
  const [
    language,
    setLanguageState,
  ] = useState<
    SupportedLanguage
  >(
    () =>
      readLanguage(
        UI_LANGUAGE_KEY,
        'tr',
      ),
  )


  const [
    reportLanguage,
    setReportLanguageState,
  ] = useState<
    SupportedLanguage
  >(
    () =>
      readLanguage(
        REPORT_LANGUAGE_KEY,
        'en',
      ),
  )


  const locale =
    getLanguageOption(
      language,
    ).locale


  useEffect(() => {
    document.documentElement.lang =
      language

    try {
      localStorage.setItem(
        UI_LANGUAGE_KEY,
        language,
      )
    } catch {
    }
  }, [
    language,
  ])


  useEffect(() => {
    try {
      localStorage.setItem(
        REPORT_LANGUAGE_KEY,
        reportLanguage,
      )
    } catch {
    }
  }, [
    reportLanguage,
  ])


  function setLanguage(
    value:
      SupportedLanguage,
  ) {
    setLanguageState(
      value,
    )
  }


  function setReportLanguage(
    value:
      SupportedLanguage,
  ) {
    setReportLanguageState(
      value,
    )
  }


  function t(
    key: string,
  ): string {
    return (
      TRANSLATIONS[
        language
      ][key]
      ?? TRANSLATIONS.tr[key]
      ?? key
    )
  }


  const value =
    useMemo<
      LanguageContextValue
    >(
      () => ({
        language,

        reportLanguage,

        locale,

        setLanguage,

        setReportLanguage,

        t,
      }),
      [
        language,
        reportLanguage,
        locale,
      ],
    )


  return (
    <LanguageContext.Provider
      value={value}
    >
      {children}
    </LanguageContext.Provider>
  )
}


export function useLanguage():
LanguageContextValue {
  const context =
    useContext(
      LanguageContext,
    )

  if (!context) {
    throw new Error(
      'useLanguage must be used inside LanguageProvider.',
    )
  }

  return context
}