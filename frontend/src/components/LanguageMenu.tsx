import {
  ChevronDown,
  Languages,
  X,
} from 'lucide-react'

import {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  useLanguage,
} from '../i18n/LanguageContext'

import {
  getLanguageOption,
  parseLanguage,
  SUPPORTED_LANGUAGES,
} from '../i18n/translations'


function LanguageMenu() {
  const [
    open,
    setOpen,
  ] = useState(false)


  const menuRef =
    useRef<HTMLDivElement | null>(
      null,
    )


  const {
    language,

    reportLanguage,

    setLanguage,

    setReportLanguage,

    t,
  } = useLanguage()


  const activeLanguage =
    getLanguageOption(
      language,
    )


  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent,
    ) {
      const target =
        event.target

      if (
        !(target instanceof Node)
      ) {
        return
      }

      if (
        menuRef.current
        && !menuRef.current.contains(
          target,
        )
      ) {
        setOpen(false)
      }
    }


    document.addEventListener(
      'mousedown',
      handleOutsideClick,
    )


    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick,
      )
    }
  }, [])


  return (
    <div
      ref={menuRef}
      className="sd-language-menu"
    >

      <button
        type="button"
        className={
          open
            ? 'sd-language-trigger open'
            : 'sd-language-trigger'
        }
        onClick={
          () =>
            setOpen(
              (current) =>
                !current,
            )
        }
      >

        <Languages
          size={15}
        />

        <strong>
          {
            activeLanguage
              .shortLabel
          }
        </strong>

        <span>
          {
            activeLanguage
              .label
          }
        </span>

        <ChevronDown
          size={14}
          className="sd-language-chevron"
        />

      </button>


      {
        open
        && (
          <div className="sd-language-popover">

            <div className="sd-language-popover-head">

              <div>

                <span>
                  {
                    t(
                      'common.language',
                    )
                  }
                </span>

                <strong>
                  {
                    t(
                      'common.languageSettings',
                    )
                  }
                </strong>

              </div>


              <button
                type="button"
                aria-label={
                  t(
                    'common.close',
                  )
                }
                onClick={
                  () =>
                    setOpen(
                      false,
                    )
                }
              >
                <X size={15} />
              </button>

            </div>


            <div className="sd-language-field">

              <label
                htmlFor="ui-language"
              >
                {
                  t(
                    'common.interfaceLanguage',
                  )
                }
              </label>


              <select
                id="ui-language"
                value={language}
                onChange={
                  (event) =>
                    setLanguage(
                      parseLanguage(
                        event
                          .currentTarget
                          .value,
                      ),
                    )
                }
              >

                {
                  SUPPORTED_LANGUAGES
                    .map(
                      (item) => (
                        <option
                          key={
                            item.code
                          }
                          value={
                            item.code
                          }
                        >
                          {
                            item
                              .shortLabel
                          } · {
                            item.label
                          }
                        </option>
                      ),
                    )
                }

              </select>

            </div>


            <div className="sd-language-divider" />


            <div className="sd-language-field">

              <label
                htmlFor="report-language"
              >
                {
                  t(
                    'common.reportLanguage',
                  )
                }
              </label>


              <select
                id="report-language"
                value={
                  reportLanguage
                }
                onChange={
                  (event) =>
                    setReportLanguage(
                      parseLanguage(
                        event
                          .currentTarget
                          .value,
                      ),
                    )
                }
              >

                {
                  SUPPORTED_LANGUAGES
                    .map(
                      (item) => (
                        <option
                          key={
                            item.code
                          }
                          value={
                            item.code
                          }
                        >
                          {
                            item
                              .shortLabel
                          } · {
                            item.label
                          }
                        </option>
                      ),
                    )
                }

              </select>


              <p>
                {
                  t(
                    'common.reportLanguageHint',
                  )
                }
              </p>

            </div>

          </div>
        )
      }

    </div>
  )
}


export default LanguageMenu