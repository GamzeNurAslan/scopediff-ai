import {
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  UploadCloud,
  X,
} from 'lucide-react'

import {
  useRef,
  useState,
} from 'react'

import type {
  ChangeEvent,
  DragEvent,
} from 'react'

import {
  useNavigate,
} from 'react-router'

import {
  compareRequirementFiles,
} from '../services/api'


type FileSlot =
  | 'source'
  | 'target'


function formatFileSize(
  bytes: number,
): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (
    bytes
    < 1024 * 1024
  ) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`
  }

  return `${(
    bytes
    / (1024 * 1024)
  ).toFixed(1)} MB`
}


function UploadPage() {
  const navigate =
    useNavigate()

  const [
    sourceFile,
    setSourceFile,
  ] = useState<File | null>(
    null,
  )

  const [
    targetFile,
    setTargetFile,
  ] = useState<File | null>(
    null,
  )

  const [
    analysisName,
    setAnalysisName,
  ] = useState('')

  const [
    analyzing,
    setAnalyzing,
  ] = useState(false)

  const [
    analysisError,
    setAnalysisError,
  ] = useState<
    string | null
  >(null)

  const sourceInputRef =
    useRef<HTMLInputElement>(
      null,
    )

  const targetInputRef =
    useRef<HTMLInputElement>(
      null,
    )


  function isExcelFile(
    file: File,
  ): boolean {
    return (
      file.name
        .toLowerCase()
        .endsWith('.xlsx')
    )
  }


  function setFile(
    slot: FileSlot,
    file: File,
  ) {
    if (
      !isExcelFile(file)
    ) {
      window.alert(
        'Lütfen .xlsx uzantılı bir Excel dosyası seç.',
      )

      return
    }

    setAnalysisError(
      null,
    )

    if (
      slot === 'source'
    ) {
      setSourceFile(
        file,
      )

      return
    }

    setTargetFile(
      file,
    )
  }


  function handleFileChange(
    event:
      ChangeEvent<HTMLInputElement>,
    slot: FileSlot,
  ) {
    const file =
      event
        .target
        .files?.[0]

    if (!file) {
      return
    }

    setFile(
      slot,
      file,
    )
  }


  function handleDrop(
    event:
      DragEvent<HTMLDivElement>,
    slot: FileSlot,
  ) {
    event.preventDefault()

    const file =
      event
        .dataTransfer
        .files?.[0]

    if (!file) {
      return
    }

    setFile(
      slot,
      file,
    )
  }


  function removeFile(
    slot: FileSlot,
  ) {
    setAnalysisError(
      null,
    )

    if (
      slot === 'source'
    ) {
      setSourceFile(
        null,
      )

      if (
        sourceInputRef.current
      ) {
        sourceInputRef
          .current
          .value = ''
      }

      return
    }

    setTargetFile(
      null,
    )

    if (
      targetInputRef.current
    ) {
      targetInputRef
        .current
        .value = ''
    }
  }


  const filesReady =
    sourceFile !== null
    && targetFile !== null


  /*
   * GERÇEK KARŞILAŞTIRMA
   */
  async function handleStartComparison() {
    if (
      sourceFile === null
      || targetFile === null
    ) {
      return
    }

    try {
      setAnalyzing(
        true,
      )

      setAnalysisError(
        null,
      )

      await compareRequirementFiles(
        sourceFile,
        targetFile,
        analysisName,
      )

      /*
       * Backend yeni analizi
       * SQLite'a kaydediyor.
       *
       * /analyses endpoint'i
       * id DESC döndüğü için
       * Dashboard yeni analizi
       * otomatik seçiyor.
       */
      navigate(
        '/dashboard',
      )

    } catch (error) {
      if (
        error
        instanceof Error
      ) {
        setAnalysisError(
          error.message,
        )
      } else {
        setAnalysisError(
          'Karşılaştırma işlemi tamamlanamadı.',
        )
      }

    } finally {
      setAnalyzing(
        false,
      )
    }
  }


  return (
    <div className="upload-page">

      {/* =========================================
          BAŞLIK
      ========================================= */}

      <section className="upload-intro">

        <div>
          <span className="section-label">
            YENİ ANALİZ
          </span>

          <h2>
            Gereksinim versiyonlarını
            karşılaştır
          </h2>

          <p>
            İki farklı gereksinim
            versiyonunu yükleyerek
            anlamsal değişiklikleri,
            risk seviyelerini ve
            incelenmesi gereken
            değişiklikleri analiz et.
          </p>
        </div>


        <div className="upload-step-badge">
          <span>
            1
          </span>

          Dosyaları yükle
        </div>

      </section>


      {/* =========================================
          EXCEL DOSYALARI
      ========================================= */}

      <section className="upload-grid">

        {/* KAYNAK VERSİYON */}

        <article className="upload-card">

          <div className="upload-card-heading">

            <div className="upload-number">
              1
            </div>

            <div>
              <h3>
                Kaynak Versiyon
              </h3>

              <p>
                Karşılaştırmanın eski
                gereksinim dosyası
              </p>
            </div>

          </div>


          <input
            ref={
              sourceInputRef
            }
            type="file"
            accept=".xlsx"
            hidden
            disabled={
              analyzing
            }
            onChange={
              (event) =>
                handleFileChange(
                  event,
                  'source',
                )
            }
          />


          {!sourceFile ? (

            <div
              className="file-drop-zone"
              onDragOver={
                (event) =>
                  event.preventDefault()
              }
              onDrop={
                (event) =>
                  handleDrop(
                    event,
                    'source',
                  )
              }
              onClick={() => {
                if (!analyzing) {
                  sourceInputRef
                    .current
                    ?.click()
                }
              }}
            >

              <div className="drop-icon">
                <UploadCloud
                  size={25}
                />
              </div>

              <strong>
                Excel dosyasını
                buraya bırak
              </strong>

              <span>
                veya dosya seçmek
                için tıkla
              </span>

              <small>
                .xlsx
              </small>

            </div>

          ) : (

            <div className="selected-file">

              <div className="file-icon">
                <FileSpreadsheet
                  size={23}
                />
              </div>


              <div className="file-info">

                <strong>
                  {
                    sourceFile.name
                  }
                </strong>

                <span>
                  {
                    formatFileSize(
                      sourceFile.size,
                    )
                  }
                </span>

              </div>


              <CheckCircle2
                className="file-success"
                size={20}
              />


              <button
                type="button"
                className="remove-file-button"
                disabled={
                  analyzing
                }
                onClick={() =>
                  removeFile(
                    'source',
                  )
                }
                aria-label={
                  'Kaynak dosyayı kaldır'
                }
              >
                <X
                  size={17}
                />
              </button>

            </div>

          )}

        </article>


        {/* HEDEF VERSİYON */}

        <article className="upload-card">

          <div className="upload-card-heading">

            <div className="upload-number">
              2
            </div>

            <div>
              <h3>
                Hedef Versiyon
              </h3>

              <p>
                Karşılaştırmanın yeni
                gereksinim dosyası
              </p>
            </div>

          </div>


          <input
            ref={
              targetInputRef
            }
            type="file"
            accept=".xlsx"
            hidden
            disabled={
              analyzing
            }
            onChange={
              (event) =>
                handleFileChange(
                  event,
                  'target',
                )
            }
          />


          {!targetFile ? (

            <div
              className="file-drop-zone"
              onDragOver={
                (event) =>
                  event.preventDefault()
              }
              onDrop={
                (event) =>
                  handleDrop(
                    event,
                    'target',
                  )
              }
              onClick={() => {
                if (!analyzing) {
                  targetInputRef
                    .current
                    ?.click()
                }
              }}
            >

              <div className="drop-icon">
                <UploadCloud
                  size={25}
                />
              </div>

              <strong>
                Excel dosyasını
                buraya bırak
              </strong>

              <span>
                veya dosya seçmek
                için tıkla
              </span>

              <small>
                .xlsx
              </small>

            </div>

          ) : (

            <div className="selected-file">

              <div className="file-icon">
                <FileSpreadsheet
                  size={23}
                />
              </div>


              <div className="file-info">

                <strong>
                  {
                    targetFile.name
                  }
                </strong>

                <span>
                  {
                    formatFileSize(
                      targetFile.size,
                    )
                  }
                </span>

              </div>


              <CheckCircle2
                className="file-success"
                size={20}
              />


              <button
                type="button"
                className="remove-file-button"
                disabled={
                  analyzing
                }
                onClick={() =>
                  removeFile(
                    'target',
                  )
                }
                aria-label={
                  'Hedef dosyayı kaldır'
                }
              >
                <X
                  size={17}
                />
              </button>

            </div>

          )}

        </article>

      </section>


      {/* =========================================
          HATA MESAJI
      ========================================= */}

      {analysisError && (
        <div className="dashboard-message error">
          {analysisError}
        </div>
      )}


      {/* =========================================
          ANALİZ AYARLARI
      ========================================= */}

      <section className="upload-settings-card">

        <div className="upload-settings-heading">

          <h3>
            Analiz Ayarları
          </h3>

          <p>
            Karşılaştırma için isteğe
            bağlı bir analiz adı
            belirleyebilirsin.
          </p>

        </div>


        <div className="analysis-name-field">

          <label htmlFor="analysis-name">
            ANALİZ ADI

            <span>
              İsteğe bağlı
            </span>
          </label>


          <input
            id="analysis-name"
            type="text"
            value={
              analysisName
            }
            disabled={
              analyzing
            }
            maxLength={200}
            placeholder={
              'Örn. v1.0 → v2.0 Aktivasyon Analizi'
            }
            onChange={
              (event) =>
                setAnalysisName(
                  event
                    .target
                    .value,
                )
            }
          />

        </div>


        <div className="upload-action-row">

          <div className="upload-ready-status">

            {analyzing ? (
              <>
                <FileSpreadsheet
                  size={17}
                />

                ScopeDiff AI
                gereksinimleri
                analiz ediyor...
              </>

            ) : filesReady ? (
              <>
                <CheckCircle2
                  size={17}
                />

                İki dosya da
                karşılaştırmaya hazır
              </>

            ) : (
              <>
                <FileSpreadsheet
                  size={17}
                />

                Devam etmek için
                iki Excel dosyasını seç
              </>
            )}

          </div>


          <button
            type="button"
            className="start-comparison-button"
            disabled={
              !filesReady
              || analyzing
            }
            onClick={
              handleStartComparison
            }
          >

            {analyzing
              ? 'Analiz Yapılıyor...'
              : 'Karşılaştırmayı Başlat'}

            {!analyzing && (
              <ArrowRight
                size={17}
              />
            )}

          </button>

        </div>

      </section>

    </div>
  )
}


export default UploadPage