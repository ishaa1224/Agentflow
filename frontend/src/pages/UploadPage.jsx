import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  UploadCloud,
  FileText,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Clock,
  Send,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Sun,
  Moon
} from 'lucide-react'

// Backend upload api URL
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const API_URL = `${API_BASE}/upload`

export default function UploadPage() {
  const navigate = useNavigate()

  // Theme Sync state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('agentflow_theme') || 'light'
  })

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.add('dark')
    }
    localStorage.setItem('agentflow_theme', theme)
  }, [theme])
  
  // File State
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [extractedText, setExtractedText] = useState('')
  const [copied, setCopied] = useState(false)
  const [aiInsights, setAiInsights] = useState(null)
  
  const fileInputRef = useRef(null)

  // Handle Selection / drag drops
  const handleFileChange = (e) => {
    setError(null)
    setSuccess(null)
    setExtractedText('')
    
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Invalid file format. Please upload a PDF document.')
      setFile(null)
      return
    }

    if (selectedFile.size === 0) {
      setError('File is empty. Please select a valid PDF.')
      setFile(null)
      return
    }

    setFile(selectedFile)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setExtractedText('')
    
    const selectedFile = e.dataTransfer.files[0]
    if (!selectedFile) return

    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Invalid file format. Only PDF documents are supported.')
      setFile(null)
      return
    }

    if (selectedFile.size === 0) {
      setError('Dropped file is empty.')
      setFile(null)
      return
    }

    setFile(selectedFile)
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Please choose a PDF file.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)
    setExtractedText('')
    setAiInsights(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      })

      let data = {}
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        const rawText = await response.text()
        throw new Error(rawText || `Upload failed with status code ${response.status}.`)
      }

      if (!response.ok) {
        throw new Error(data.detail || 'An error occurred during upload.')
      }

      setSuccess(data.message || 'PDF uploaded and vector indexed successfully!')
      setExtractedText(data.text_preview || '')

      // Automatically analyze document content to extract tasks in the database
      if (data.text_preview) {
        setSuccess(prev => prev + ' AI Ingestion Active: Extracting tasks, meetings, and reminders...')
        fetch(`${API_BASE}/api/documents/extract`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: data.text_preview 
          })
        }).then(res => res.json()).then(result => {
          if (result.success) {
            setSuccess('PDF uploaded, vector indexed, and AI workflow executed successfully!')
            setAiInsights(result)
          } else {
            setSuccess('PDF uploaded & indexed. Automatic task extraction failed.')
          }
        }).catch(err => {
          console.error(err)
          setSuccess('PDF uploaded & indexed. Network error running task extraction.')
        })
      }
    } catch (err) {
      console.error(err)
      setError(err.message || 'Unable to connect to the backend server. Make sure the FastAPI backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyToClipboard = () => {
    if (!extractedText) return
    navigator.clipboard.writeText(extractedText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReset = () => {
    setFile(null)
    setError(null)
    setSuccess(null)
    setExtractedText('')
    setAiInsights(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col relative overflow-hidden font-sans selection:bg-purple-500/20 selection:text-white theme-transition">
      
      {/* Background Grids */}
      <div className="absolute inset-0 framer-grid pointer-events-none z-0"></div>
      <div className="absolute inset-0 framer-grid-radial-mask pointer-events-none z-0"></div>

      {/* Floating glow nodes */}
      <div className="absolute top-[15%] right-[15%] h-[500px] w-[500px] glow-purple pointer-events-none opacity-30 z-0"></div>
      <div className="absolute bottom-[20%] left-[10%] h-[400px] w-[400px] glow-blue pointer-events-none opacity-20 z-0"></div>

      {/* Top Header Navigation */}
      <header className="relative w-full z-20 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/60 backdrop-blur-md shrink-0">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <motion.button
              whileHover={{ x: -2 }}
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition bg-[var(--bg-secondary)] border border-[var(--border-color)] px-4 py-2.5 rounded-xl uppercase tracking-wider"
            >
              <ArrowLeft className="h-4.5 w-4.5" /> Return to Dashboard
            </motion.button>
            <span className="text-sm font-semibold text-[var(--text-tertiary)] hidden sm:inline">
              Pipelines / PDF Ingestion Engine
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme switcher */}
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg border border-[var(--border-color)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5 text-indigo-500" />}
            </button>

            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-white">
                <svg className="h-4.5 w-4.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 2h16v6h-8v6h8v6H4l8-8H4V2z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-[var(--text-primary)]">AgentFlow AI</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main split canvas layout */}
      <div className="flex-grow flex flex-col lg:flex-row relative z-10 w-full overflow-hidden">
        
        {/* Left/Center Canvas: DragZone and Ingestion Text Editor */}
        <div className="flex-grow lg:w-2/3 p-6 md:p-10 flex flex-col items-center justify-center overflow-y-auto custom-scrollbar h-full">
          <div className="w-full max-w-2xl space-y-6">
            
            {/* Status notifications popups */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-2xl bg-red-500/5 border border-red-500/15 p-4 flex gap-3 text-red-700 dark:text-red-300 text-sm font-light leading-relaxed"
                >
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-2xl bg-emerald-500/5 border border-emerald-500/15 p-4 flex gap-3 text-emerald-700 dark:text-emerald-300 text-sm font-light leading-relaxed"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {extractedText ? (
                // Code block layout showing extracted plain text
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="relative border border-[#a855f7]/30 rounded-2xl bg-[var(--bg-secondary)] shadow-2xl overflow-hidden"
                >
                  {/* Floating tag label */}
                  <div className="absolute -top-3.5 left-4 bg-purple-600 text-white text-xs font-bold px-3 py-0.5 rounded uppercase tracking-wider shadow-md select-none">
                    plainTextExtractor
                  </div>

                  {/* Document details bar */}
                  <div className="border-b border-[var(--border-color)] bg-[var(--bg-primary)] px-6 py-4 flex items-center justify-between">
                    <span className="text-sm font-mono text-[var(--text-secondary)] truncate pr-4">{file?.name}</span>
                    <div className="flex gap-2.5">
                      <button
                        onClick={handleCopyToClipboard}
                        className="btn-secondary py-2 px-3.5 rounded-lg text-sm flex items-center gap-1.5"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4.5 w-4.5 text-emerald-500" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4.5 w-4.5" /> Copy Text
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleReset}
                        className="btn-danger py-2 px-3.5 rounded-lg text-sm"
                      >
                        Reset Ingestion
                      </button>
                    </div>
                  </div>

                  {/* Extracted text console */}
                  <div className="p-6 bg-[var(--bg-primary)]/80">
                    <pre className="text-sm text-[var(--text-secondary)] font-mono whitespace-pre-wrap leading-relaxed max-h-[380px] overflow-y-auto custom-scrollbar pr-2">
                      {extractedText}
                    </pre>
                  </div>
                  
                  {/* AI Insights Card */}
                  {aiInsights && (
                    <div className="border-t border-purple-500/20 bg-purple-500/5 p-6 animate-fade-in">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="h-5 w-5 text-purple-500" />
                        <h4 className="font-bold text-[var(--text-primary)]">AI Insights Overview</h4>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="framer-card p-4 rounded-xl text-center bg-[var(--bg-primary)]">
                          <div className="text-2xl font-bold text-emerald-500">{aiInsights.tasks_found}</div>
                          <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mt-1 font-semibold">Tasks Extracted</div>
                        </div>
                        <div className="framer-card p-4 rounded-xl text-center bg-[var(--bg-primary)]">
                          <div className="text-2xl font-bold text-amber-500">{aiInsights.meetings_found + aiInsights.reminders_found}</div>
                          <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mt-1 font-semibold">Meetings/Reminders</div>
                        </div>
                        <div className="framer-card p-4 rounded-xl text-center bg-[var(--bg-primary)] border border-red-500/20">
                          <div className="text-2xl font-bold text-red-500">{aiInsights.high_priority_count}</div>
                          <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mt-1 font-semibold">High Priority</div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-[var(--border-color)] text-sm text-[var(--text-tertiary)] italic">
                        Items have been automatically added to your Dashboard, Calendar, and Notifications.
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                // Ingest Dropzone card
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className="framer-card rounded-3xl p-12 text-center cursor-pointer hover:border-purple-500/20 hover:bg-[var(--bg-secondary)]/60 transition-all duration-200 flex flex-col items-center justify-center min-h-[320px]"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf"
                    className="hidden"
                  />

                  {file ? (
                    <div className="space-y-4 animate-fade-in flex flex-col items-center">
                      <div className="h-16 w-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-md">
                        <FileText className="h-8 w-8" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[var(--text-primary)] truncate max-w-sm px-4">{file.name}</h4>
                        <span className="text-sm text-[var(--text-tertiary)] font-light mt-1.5 block">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleReset()
                        }}
                        className="text-sm text-red-500 hover:text-red-400 font-bold hover:underline"
                      >
                        Wipe Selection
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 flex flex-col items-center">
                      <div className="h-16 w-16 rounded-2xl bg-[var(--border-color)] flex items-center justify-center text-[var(--text-tertiary)] mb-2">
                        <UploadCloud className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Ingest technical PDF datasets</h3>
                        <p className="text-sm text-[var(--text-secondary)] mt-2 font-light max-w-xs leading-relaxed">
                          Drag and drop technical blueprints or documents here, or click to choose from filesystem.
                        </p>
                      </div>
                      <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest bg-[var(--border-color)] px-3 py-1 rounded-lg select-none">
                        PDF Format Required
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Pane: AI Ingestion Copilot Sidebar */}
        <div className="lg:w-1/3 border-t lg:border-t-0 lg:border-l border-[var(--border-color)] bg-[var(--bg-secondary)]/80 backdrop-blur-md flex flex-col justify-between max-w-md w-full mx-auto relative z-20 h-full p-6 transition-all duration-300">
          
          <div className="space-y-6">
            {/* Sidebar header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">AI Ingestion Copilot</span>
              </div>
              <HelpCircle className="h-5 w-5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition" />
            </div>

            {/* Prompt Box */}
            <div className="framer-card rounded-2xl p-5 bg-[var(--bg-primary)]/40 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 h-20 w-20 glow-purple pointer-events-none opacity-40"></div>
              <h4 className="text-sm text-[var(--text-primary)] font-medium leading-relaxed max-w-[90%]">
                Build a text extraction pipeline that reads uploaded bytes, runs pypdf reader, and displays parsed string outputs.
              </h4>
            </div>

            {/* Thought log */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-semibold tracking-wide uppercase">
                <Clock className="h-4 w-4 text-[var(--text-tertiary)]" />
                <span>Thought 1.2s</span>
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--border-color)]"></span>
                <span className="text-[var(--text-tertiary)] lowercase font-normal font-mono">local node</span>
              </div>
              
              <div className="framer-card rounded-xl p-4 bg-[var(--bg-primary)]/20 border border-[var(--border-color)]">
                <p className="text-sm text-[var(--text-secondary)] font-light leading-relaxed">
                  I'll read the binary stream, validate the extension header, write it to `uploads/{file?.name || 'document.pdf'}`, and extract string chunks page-by-page.
                </p>
              </div>
            </div>

            {/* Ingestion active indicators */}
            {file && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="framer-card rounded-xl p-4 bg-[var(--bg-primary)]/25 flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span className="text-[var(--text-tertiary)] select-none">{"<>"}</span>
                  <span className="font-mono text-[var(--text-primary)] truncate text-sm">{file.name}</span>
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
                  Ready
                </span>
              </motion.div>
            )}
          </div>

          {/* Action Trigger panel */}
          <div className="mt-8 space-y-4">
            <form onSubmit={handleUpload} className="relative">
              <input
                type="text"
                disabled={loading || !file}
                placeholder={file ? "Confirm and process PDF upload..." : "Select a PDF file to enable copilot..."}
                value={file && !loading && !success ? "Extract text from local dataset" : ""}
                readOnly
                onClick={(e) => {
                  if (file && !loading && !success) {
                    handleUpload(e)
                  }
                }}
                className="w-full glass-input py-4 pl-4 pr-12 rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-sm"
              />
              
              <button
                type="submit"
                disabled={loading || !file}
                className={`absolute right-2 top-2 p-2.5 rounded-xl transition ${
                  loading || !file
                    ? 'text-[var(--text-tertiary)]'
                    : 'text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)] hover:opacity-90 active:scale-[0.95]'
                }`}
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>
            <span className="block text-center text-xs text-[var(--text-tertiary)] font-light mt-1">
              Click prompt input or arrow button to trigger document parsing.
            </span>
          </div>

        </div>

      </div>

    </div>
  )
}
