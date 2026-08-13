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
  previewRequirementFile,
} from '../services/api'

import type {
  RequirementField,
  RequirementFilePreview,
} from '../types/api'

import {
  useProfile,
} from '../context/ProfileContext'

import {
  useLanguage,
} from '../i18n/LanguageContext'

import {
  localizeProfileValue,
} from '../components/Topbar'


type FileSlot =
  | 'source'
  | 'target'


const REQUIREMENT_FIELDS: Array<{
  key: RequirementField
  label: string
  required?: boolean
}> = [
  {
    key: 'requirement_text',
    label: 'Gereksinim metni',
    required: true,
  },
  {
    key: 'requirement_id',
    label: 'Gereksinim ID',
  },
  {
    key: 'module',
    label: 'Modül / kategori',
  },
  {
    key: 'version',
    label: 'Versiyon',
  },
]


interface RequirementPreviewCardProps {
  preview: RequirementFilePreview
  onChange: (preview: RequirementFilePreview) => void
  disabled?: boolean
}


function RequirementPreviewCard({
  preview,
  onChange,
  disabled = false,
}: RequirementPreviewCardProps) {
  const selectedSheet =
    preview.sheets.find(
      (sheet) =>
        sheet.name === preview.selected_sheet,
    )
    ?? preview.sheets[0]

  if (!selectedSheet) {
    return null
  }

  function selectSheet(
    sheetName: string,
  ) {
    const nextSheet =
      preview.sheets.find(
        (sheet) => sheet.name === sheetName,
      )

    if (!nextSheet) {
      return
    }

    onChange({
      ...preview,
      selected_sheet: nextSheet.name,
    })
  }

  function selectField(
    field: RequirementField,
    column: string,
  ) {
    const nextMapping = {
      ...selectedSheet.mapping,
      [field]: column || null,
    }

    onChange({
      ...preview,
      sheets: preview.sheets.map(
        (sheet) =>
          sheet.name === selectedSheet.name
            ? {
                ...sheet,
                mapping: nextMapping,
              }
            : sheet,
      ),
    })
  }

  const sampleColumns =
    selectedSheet.columns.slice(0, 3)

  return (
    <div className="upload-mapping-card">
      <div className="upload-mapping-heading">
        <div>
          <strong>Dosya yapısı kontrol edildi</strong>
          <span>
            {selectedSheet.rows} satır · {selectedSheet.columns.length} kolon
          </span>
        </div>

        <span className="upload-mapping-ok">
          Alanları eşleştir
        </span>
      </div>

      {preview.sheets.length > 1 && (
        <label className="upload-mapping-control">
          <span>Çalışma sayfası</span>
          <select
            value={selectedSheet.name}
            disabled={disabled}
            onChange={(event) =>
              selectSheet(event.target.value)
            }
          >
            {preview.sheets.map((sheet) => (
              <option key={sheet.name} value={sheet.name}>
                {sheet.name} ({sheet.rows} satır)
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="upload-mapping-fields">
        {REQUIREMENT_FIELDS.map((field) => (
          <label
            className="upload-mapping-control"
            key={field.key}
          >
            <span>
              {field.label}
              {field.required ? ' *' : ''}
            </span>
            <select
              value={selectedSheet.mapping[field.key] ?? ''}
              disabled={disabled}
              onChange={(event) =>
                selectField(
                  field.key,
                  event.target.value,
                )
              }
            >
              <option value="">
                {field.required
                  ? 'Kolon seçin'
                  : 'Yoksa otomatik oluştur'}
              </option>
              {selectedSheet.columns.map((column) => (
                <option key={`${field.key}-${column}`} value={column}>
                  {column}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <div className="upload-mapping-sample">
        <span>Örnek veri</span>
        <div>
          {selectedSheet.sample_rows.slice(0, 2).map((row, index) => (
            <p key={index}>
              {sampleColumns
                .map((column) =>
                  String(row[column] ?? '—'),
                )
                .join(' · ')}
            </p>
          ))}
        </div>
      </div>

      {selectedSheet.warnings.length > 0 && (
        <p className="upload-mapping-warning">
          {selectedSheet.warnings.join(' ')}
        </p>
      )}
    </div>
  )
}


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


  const {
    profile,
  } = useProfile()


  const {
    t,
    language,
  } = useLanguage()


  const localizedDepartment = profile
    ? localizeProfileValue(
        profile.department,
        'department',
        language,
      )
    : ''


  const localizedRole = profile
    ? localizeProfileValue(
        profile.role,
        'role',
        language,
      )
    : ''


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
    sourcePreview,
    setSourcePreview,
  ] = useState<RequirementFilePreview | null>(
    null,
  )


  const [
    targetPreview,
    setTargetPreview,
  ] = useState<RequirementFilePreview | null>(
    null,
  )


  const [
    previewingSlot,
    setPreviewingSlot,
  ] = useState<FileSlot | null>(
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
      !isExcelFile(
        file,
      )
    ) {
      window.alert(
        t(
          'upload.error.xlsx',
        ),
      )

      return
    }


    setAnalysisError(
      null,
    )

    if (slot === 'source') {
      setSourcePreview(null)
    } else {
      setTargetPreview(null)
    }


    if (
      slot === 'source'
    ) {
      setSourceFile(
        file,
      )

      void previewFile(slot, file)

      return
    }


    setTargetFile(
      file,
    )

    void previewFile(slot, file)
  }


  async function previewFile(
    slot: FileSlot,
    file: File,
  ) {
    try {
      setPreviewingSlot(slot)

      const preview = await previewRequirementFile(file)

      if (slot === 'source') {
        setSourcePreview(preview)
      } else {
        setTargetPreview(preview)
      }
    } catch (error) {
      setAnalysisError(
        error instanceof Error
          ? error.message
          : 'Excel yapısı okunamadı.',
      )
    } finally {
      setPreviewingSlot((current) =>
        current === slot ? null : current,
      )
    }
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

      setSourcePreview(null)

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

    setTargetPreview(null)


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
    && sourcePreview !== null
    && targetPreview !== null
    && Boolean(
      sourcePreview.sheets.find(
        (sheet) => sheet.name === sourcePreview.selected_sheet,
      )?.mapping.requirement_text,
    )
    && Boolean(
      targetPreview.sheets.find(
        (sheet) => sheet.name === targetPreview.selected_sheet,
      )?.mapping.requirement_text,
    )


  async function handleStartComparison() {
    if (
      sourceFile === null
      || targetFile === null
      || sourcePreview === null
      || targetPreview === null
    ) {
      return
    }


    if (!profile) {
      setAnalysisError(
        t(
          'upload.error.profile',
        ),
      )

      return
    }


    try {
      setAnalyzing(
        true,
      )

      setAnalysisError(
        null,
      )


      await compareRequirementFiles({
        sourceFile,

        targetFile,

        sourceSheet:
          sourcePreview.selected_sheet,

        targetSheet:
          targetPreview.selected_sheet,

        sourceMapping:
          sourcePreview.sheets.find(
            (sheet) => sheet.name === sourcePreview.selected_sheet,
          )?.mapping,

        targetMapping:
          targetPreview.sheets.find(
            (sheet) => sheet.name === targetPreview.selected_sheet,
          )?.mapping,

        analysisName,

        creator: {
          userId:
            profile.userId,

          fullName:
            profile.fullName,

          corporateEmail:
            profile.corporateEmail,

          department:
            profile.department,

          role:
            profile.role,
        },
      })


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
          t(
            'upload.error.comparison',
          ),
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



      <section className="upload-intro">

        <div>

          <span className="section-label">
            {
              t(
                'upload.kicker',
              )
            }
          </span>


          <h2>
            {
              t(
                'upload.title',
              )
            }
          </h2>


          <p>
            {
              t(
                'upload.description',
              )
            }
          </p>

        </div>


        <div className="upload-step-badge">

          <span>
            1
          </span>

          {
            t(
              'upload.step',
            )
          }

        </div>

      </section>




      <section className="upload-grid">



        <article className="upload-card">

          <div className="upload-card-heading">

            <div className="upload-number">
              1
            </div>


            <div>

              <h3>
                {
                  t(
                    'upload.source.title',
                  )
                }
              </h3>

              <p>
                {
                  t(
                    'upload.source.description',
                  )
                }
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


          {
            !sourceFile
              ? (
                <div
                  className="file-drop-zone"
                  onDragOver={
                    (event) =>
                      event
                        .preventDefault()
                  }
                  onDrop={
                    (event) =>
                      handleDrop(
                        event,
                        'source',
                      )
                  }
                  onClick={
                    () => {
                      if (
                        !analyzing
                      ) {
                        sourceInputRef
                          .current
                          ?.click()
                      }
                    }
                  }
                >

                  <div className="drop-icon">

                    <UploadCloud
                      size={25}
                    />

                  </div>


                  <strong>
                    {
                      t(
                        'upload.drop.title',
                      )
                    }
                  </strong>


                  <span>
                    {
                      t(
                        'upload.drop.subtitle',
                      )
                    }
                  </span>


                  <small>
                    .xlsx
                  </small>

                </div>
              )

              : (
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
                    aria-label={
                      t(
                        'upload.source.remove',
                      )
                    }
                    onClick={
                      () =>
                        removeFile(
                          'source',
                        )
                    }
                  >

                    <X
                      size={17}
                    />

                  </button>

                </div>
              )
          }

          {sourcePreview && (
            <RequirementPreviewCard
              preview={sourcePreview}
              disabled={
                analyzing
                || previewingSlot === 'source'
              }
              onChange={setSourcePreview}
            />
          )}

        </article>




        <article className="upload-card">

          <div className="upload-card-heading">

            <div className="upload-number">
              2
            </div>


            <div>

              <h3>
                {
                  t(
                    'upload.target.title',
                  )
                }
              </h3>

              <p>
                {
                  t(
                    'upload.target.description',
                  )
                }
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


          {
            !targetFile
              ? (
                <div
                  className="file-drop-zone"
                  onDragOver={
                    (event) =>
                      event
                        .preventDefault()
                  }
                  onDrop={
                    (event) =>
                      handleDrop(
                        event,
                        'target',
                      )
                  }
                  onClick={
                    () => {
                      if (
                        !analyzing
                      ) {
                        targetInputRef
                          .current
                          ?.click()
                      }
                    }
                  }
                >

                  <div className="drop-icon">

                    <UploadCloud
                      size={25}
                    />

                  </div>


                  <strong>
                    {
                      t(
                        'upload.drop.title',
                      )
                    }
                  </strong>


                  <span>
                    {
                      t(
                        'upload.drop.subtitle',
                      )
                    }
                  </span>


                  <small>
                    .xlsx
                  </small>

                </div>
              )

              : (
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
                    aria-label={
                      t(
                        'upload.target.remove',
                      )
                    }
                    onClick={
                      () =>
                        removeFile(
                          'target',
                        )
                    }
                  >

                    <X
                      size={17}
                    />

                  </button>

                </div>
              )
          }

          {targetPreview && (
            <RequirementPreviewCard
              preview={targetPreview}
              disabled={
                analyzing
                || previewingSlot === 'target'
              }
              onChange={setTargetPreview}
            />
          )}

        </article>

      </section>




      {
        analysisError
        && (
          <div className="dashboard-message error">
            {analysisError}
          </div>
        )
      }




      <section className="upload-settings-card">

        <div className="upload-settings-heading">

          <h3>
            {
              t(
                'upload.settings.title',
              )
            }
          </h3>


          <p>
            {
              t(
                'upload.settings.description',
              )
            }
          </p>

        </div>


        <div className="analysis-name-field">

          <label htmlFor="analysis-name">

            {
              t(
                'upload.analysisName',
              )
            }

            <span>
              {
                t(
                  'upload.optional',
                )
              }
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
              t(
                'upload.placeholder',
              )
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




        {
          profile
          && (
            <div className="analysis-creator-card">

              <FileSpreadsheet
                size={16}
              />


              <div>

                <span>
                  {
                    t(
                      'upload.creator',
                    )
                  }
                </span>


                <strong>
                  {
                    profile.fullName
                  }
                </strong>


                <small>
                  {
                    localizedDepartment
                  }
                  {' · '}
                  {
                    localizedRole
                  }
                </small>

              </div>

            </div>
          )
        }




        <div className="upload-action-row">

          <div className="upload-ready-status">

            {
              analyzing
                ? (
                  <>
                    <FileSpreadsheet
                      size={17}
                    />

                    {
                      t(
                        'upload.ready.analyzing',
                      )
                    }
                  </>
                )

                : filesReady
                  ? (
                    <>
                      <CheckCircle2
                        size={17}
                      />

                      {
                        t(
                          'upload.ready.ready',
                        )
                      }
                    </>
                  )

                  : (
                    <>
                      <FileSpreadsheet
                        size={17}
                      />

                      {
                        t(
                          'upload.ready.select',
                        )
                      }
                    </>
                  )
            }

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

            {
              analyzing
                ? t(
                    'upload.button.analyzing',
                  )

                : t(
                    'upload.button.start',
                  )
            }


            {
              !analyzing
              && (
                <ArrowRight
                  size={17}
                />
              )
            }

          </button>

        </div>

      </section>

    </div>
  )
}


export default UploadPage
