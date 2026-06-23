import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { processCsvFile } from '../services/csvService'

interface CsvImportModalProps {
  open: boolean
  onClose: () => void
  onImportComplete: () => void
}

export function CsvImportModal({ open, onClose, onImportComplete }: CsvImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [wipeOld, setWipeOld] = useState(true)
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleImport = async () => {
    if (!file) return
    setLoading(true)
    setStatusMsg('Iniciando importação...')

    try {
      await processCsvFile(file, wipeOld, (msg) => setStatusMsg(msg))
      alert('Importação concluída com sucesso!')
      onImportComplete()
      onClose()
      setFile(null)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro na importação.')
      setStatusMsg('Falha na importação.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="modal-overlay">
        <motion.div
          className="modal-content"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
        >
          <div className="modal-header">
            <h2>Importar CSV Manualmente</h2>
            <button className="close-btn" onClick={onClose} disabled={loading}>
              ✕
            </button>
          </div>

          <div className="modal-body">
            <p className="modal-description">
              Faça o upload do arquivo CSV para atualizar o ranking. 
              <br/>
              <strong>Colunas esperadas:</strong> <code>Vendedor</code>, <code>Valor</code>, <code>Status</code>.
            </p>

            <div className="file-input-wrapper" onClick={() => !loading && fileInputRef.current?.click()}>
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={loading}
              />
              <div className="file-drop-area">
                <span className="file-icon">📄</span>
                <span className="file-name">
                  {file ? file.name : 'Clique para selecionar um arquivo .csv'}
                </span>
              </div>
            </div>

            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={wipeOld} 
                onChange={e => setWipeOld(e.target.checked)}
                disabled={loading}
              />
              Apagar todas as propostas anteriores antes de importar (Recomendado se o CSV contiver o total atualizado).
            </label>

            {statusMsg && (
              <div className="import-status">
                {loading && <span className="spinner" />}
                {statusMsg}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn-cancel" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button 
              className="btn-primary" 
              onClick={handleImport} 
              disabled={!file || loading}
            >
              {loading ? 'Importando...' : 'Iniciar Importação'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
