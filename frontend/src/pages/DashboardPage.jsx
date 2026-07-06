import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Inbox,
  CheckSquare,
  FileText,
  Settings,
  AlertTriangle,
  Clock,
  Plus,
  Trash2,
  CheckCircle,
  FileDown,
  UploadCloud,
  Send,
  Link,
  ChevronRight,
  Info,
  Calendar as CalendarIcon,
  Layers,
  ArrowRight,
  TrendingUp,
  User,
  Activity,
  Files,
  Search,
  Star,
  Bell,
  Check,
  Cpu,
  Sun,
  Moon
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

import Sidebar from '../components/Sidebar'
import Onboarding from '../components/Onboarding'
import { useAuth } from '../contexts/AuthContext'
import {
  InboxSkeleton,
  TaskListSkeleton,
  CardSkeleton,
  LineSkeleton
} from '../components/LoadingSkeleton'

// API endpoints
const API_BASE = 'http://127.0.0.1:8000'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  
  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }
  
  // Theme Switching state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('agentflow_theme') || 'light'
  })
  
  // Tab Routing State (Sidebar labels)
  const [activeTab, setActiveTab] = useState('overview')
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  
  // Data State
  const [tasks, setTasks] = useState([])
  const [emails, setEmails] = useState([])
  const [documents, setDocuments] = useState([])
  const [notifications, setNotifications] = useState([])
  const [activityLog, setActivityLog] = useState([])
  
  // Custom states for premium features
  const [documentSearchQuery, setDocumentSearchQuery] = useState('')
  const [emailSearchQuery, setEmailSearchQuery] = useState('')
  const [starredEmails, setStarredEmails] = useState(new Set())
  const [selectedCalendarDate, setSelectedCalendarDate] = useState('2026-06-30')
  const [readNotifications, setReadNotifications] = useState(new Set())
  
  // Chat State
  const [chatHistory, setChatHistory] = useState([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isChatSending, setIsChatSending] = useState(false)
  const [activeEmail, setActiveEmail] = useState(null)
  
  // PDF / Reports state
  const [reportMarkdown, setReportMarkdown] = useState('')
  const [isReportGenerating, setIsReportGenerating] = useState(false)
  const [pdfDownloading, setPdfDownloading] = useState(false)
  
  // Linkages
  const [gmailConnected, setGmailConnected] = useState(false)
  const [gmailAuthUrl, setGmailAuthUrl] = useState('')
  const [gmailSandbox, setGmailSandbox] = useState(true)
  const [llmMode, setLlmMode] = useState('Simulator')
  const [backendStatus, setBackendStatus] = useState('checking')
  
  // Loading flags
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [loadingEmails, setLoadingEmails] = useState(true)
  const [loadingDocs, setLoadingDocs] = useState(true)
  
  // Edit Tasks Modal
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDesc, setNewTaskDesc] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState('Medium')
  const [newTaskDeadline, setNewTaskDeadline] = useState('')
  const [editingTask, setEditingTask] = useState(null)
  
  // File upload state
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [uploadSuccess, setUploadSuccess] = useState(null)
  
  const fileInputRef = useRef(null)
  const chatEndRef = useRef(null)

  // Sync / local time helper
  const [lastSyncTime, setLastSyncTime] = useState('20:35')

  // Theme Toggler effect
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.add('dark')
    }
    localStorage.setItem('agentflow_theme', theme)
  }, [theme])

  // Initial Fetches & Polling
  useEffect(() => {
    const onboarded = localStorage.getItem('agentflow_onboarded')
    if (!onboarded) {
      setOnboardingOpen(true)
    }
    
    const fetchAllData = () => {
      fetchBackendStatus()
      fetchTasks()
      fetchEmails()
      fetchDocuments()
      fetchNotifications()
      fetchActivities()
      fetchChatHistory()
      
      const now = new Date()
      setLastSyncTime(now.toTimeString().slice(0, 5))
    }

    fetchAllData()

    // Auto-update dashboard every 30 seconds
    const interval = setInterval(fetchAllData, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  // ================= API HELPERS =================

  const fetchBackendStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/`)
      if (response.ok) {
        const data = await response.json()
        setBackendStatus('online')
        setLlmMode(data.settings.use_mock_llm ? 'Simulator' : 'Gemini')
        setGmailSandbox(data.settings.use_mock_gmail)
      }
    } catch (e) {
      setBackendStatus('offline')
      console.error(e)
    }
  }

  const fetchTasks = async () => {
    setLoadingTasks(true)
    try {
      const response = await fetch(`${API_BASE}/tasks`, { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingTasks(false)
    }
  }

  const fetchEmails = async () => {
    setLoadingEmails(true)
    try {
      const response = await fetch(`${API_BASE}/api/gmail/emails`, { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        setEmails(data)
        if (data.length > 0) {
          setActiveEmail(data[0])
        }
      }
      
      const connectResponse = await fetch(`${API_BASE}/api/gmail/connect`, { cache: 'no-store' })
      if (connectResponse.ok) {
        const connectData = await connectResponse.json()
        setGmailConnected(connectData.connected)
        setGmailAuthUrl(connectData.auth_url)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingEmails(false)
    }
  }

  const fetchDocuments = async () => {
    setLoadingDocs(true)
    try {
      const response = await fetch(`${API_BASE}/documents`, { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingDocs(false)
    }
  }

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/notifications`, { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchActivities = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/activities`, { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        setActivityLog(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchChatHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/chat_history`, { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        // Map backend history (query, response) to UI format
        const history = []
        data.forEach(item => {
          history.push({ role: 'user', content: item.query })
          history.push({ role: 'assistant', content: item.response })
        })
        if (history.length === 0) {
          history.push({ role: 'assistant', content: 'Welcome to the AgentFlow Multi-Agent Hub. I can coordinate with ChromaDB vectors, Gmail API mailboxes, SQLite checklists, and DuckDuckGo search queries. How can I help you today?' })
        }
        setChatHistory(history)
      }
    } catch (e) {
      console.error(e)
    }
  }

  // --- CRUD Task handlers ---

  const handleSaveTask = async (e) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    const queryParams = new URLSearchParams({
      title: newTaskTitle,
      description: newTaskDesc,
      priority: newTaskPriority,
    })
    if (newTaskDeadline) {
      queryParams.append('deadline', newTaskDeadline)
    }

    try {
      let response
      if (editingTask) {
        response = await fetch(`${API_BASE}/tasks/${editingTask.id}?${queryParams.toString()}`, {
          method: 'PUT'
        })
      } else {
        response = await fetch(`${API_BASE}/tasks?${queryParams.toString()}`, {
          method: 'POST'
        })
      }

      if (response.ok) {
        fetchTasks()
        fetchNotifications()
        
        // Fetch updated activity log
        fetchActivities()
        
        setTaskModalOpen(false)
        resetTaskForm()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteTask = async (id) => {
    if (!confirm("Delete this task from index?")) return
    try {
      const response = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        fetchTasks()
        fetchNotifications()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleToggleTaskComplete = async (id, title) => {
    try {
      const response = await fetch(`${API_BASE}/tasks/${id}/complete`, {
        method: 'POST'
      })
      if (response.ok) {
        const data = await response.json()
        fetchTasks()
        fetchNotifications()
        
        fetchActivities()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const resetTaskForm = () => {
    setNewTaskTitle('')
    setNewTaskDesc('')
    setNewTaskPriority('Medium')
    setNewTaskDeadline('')
    setEditingTask(null)
  }

  const triggerEditTask = (task) => {
    setEditingTask(task)
    setNewTaskTitle(task.title)
    setNewTaskDesc(task.description || '')
    setNewTaskPriority(task.priority)
    setNewTaskDeadline(task.deadline || '')
    setTaskModalOpen(true)
  }

  // --- Document indexing RAG ---

  const handleUploadFile = async (e) => {
    e.preventDefault()
    if (!uploadFile) return

    setUploadLoading(true)
    setUploadError(null)
    setUploadSuccess(null)

    const formData = new FormData()
    formData.append('file', uploadFile)

    try {
      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      })
      const data = await response.json()
      
      if (!response.ok) throw new Error(data.detail || 'Upload failed')

      setUploadSuccess(data.message)
      setUploadFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      fetchDocuments()
      
      fetchActivities()

      // Automatically analyze document content to extract tasks/deadlines/reminders/alerts in SQLite
      if (data.text_preview) {
        fetchActivities()

        fetch(`${API_BASE}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query: `Extract all tasks, deadlines, meetings, priorities, and action items from this document text: ${data.text_preview}` 
          })
        }).then(res => {
          if (res.ok) {
            fetchTasks()
            fetchNotifications()
            fetchActivities()
          }
        }).catch(err => {
          console.error("Auto task extraction failed", err)
        })
      }
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploadLoading(false)
    }
  }

  const handleDeleteDoc = async (id, filename) => {
    if (!confirm("Delete indexed vectors from ChromaDB workspace?")) return
    try {
      const response = await fetch(`${API_BASE}/documents/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        fetchDocuments()
        fetchActivities()
      }
    } catch (err) {
      console.error(err)
    }
  }

  // --- Multi-Agent chat routing ---

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!currentMessage.trim()) return

    const userMsg = currentMessage.trim()
    executeChatQuery(userMsg)
  }

  const executeChatQuery = async (queryText) => {
    setChatHistory(prev => [...prev, { role: 'user', content: queryText }])
    setCurrentMessage('')
    setIsChatSending(true)

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText })
      })

      if (response.ok) {
        const data = await response.json()
        setChatHistory(prev => [...prev, {
          role: 'assistant',
          content: data.response,
          routedAgent: data.routed_agent
        }])
        
        // Dynamic updates
        if (data.routed_agent === 'task_agent') {
          fetchTasks()
          fetchNotifications()
        } else if (data.routed_agent === 'email_agent') {
          fetchEmails()
        }
        
        fetchActivities()
      }
    } catch (err) {
      console.error(err)
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Connection failure with LLM API.' }])
    } finally {
      setIsChatSending(false)
    }
  }

  // --- AI buttons inbox triggers ---

  const handleAIInboxAction = async (actionType, email) => {
    setIsChatSending(true)
    let promptText = ''
    
    if (actionType === 'extract_tasks') {
      promptText = `extract tasks from email: ${email.body}`
      setActiveTab('tasks')
    } else if (actionType === 'draft_reply') {
      promptText = `draft reply to email from: ${email.sender} regarding ${email.subject}`
      setActiveTab('rag')
    }

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: promptText })
      })

      if (response.ok) {
        const data = await response.json()
        setChatHistory(prev => [...prev, {
          role: 'user',
          content: promptText
        }, {
          role: 'assistant',
          content: data.response,
          routedAgent: data.routed_agent
        }])
        
        if (actionType === 'extract_tasks') {
          fetchTasks()
          fetchNotifications()
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsChatSending(false)
    }
  }

  // --- PDF Reports Generation ---

  const handleGenerateReport = async () => {
    setIsReportGenerating(true)
    try {
      const response = await fetch(`${API_BASE}/api/reports/generate`, {
        method: 'POST'
      })
      if (response.ok) {
        const data = await response.json()
        setReportMarkdown(data.report_content)
        
        fetchActivities()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsReportGenerating(false)
    }
  }

  const handleExportPDF = async () => {
    if (!reportMarkdown) return
    setPdfDownloading(true)

    try {
      const response = await fetch(`${API_BASE}/api/reports/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: reportMarkdown })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = "AgentFlow_Workspace_Report.pdf"
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setPdfDownloading(false)
    }
  }

  // --- Inbox Star status toggle ---
  const toggleEmailStarred = (emailId) => {
    const updated = new Set(starredEmails)
    if (updated.has(emailId)) {
      updated.delete(emailId)
    } else {
      updated.add(emailId)
    }
    setStarredEmails(updated)
  }

  // --- Notifications toggle read status ---
  const toggleNotificationRead = (id) => {
    const updated = new Set(readNotifications)
    if (updated.has(id)) {
      updated.delete(id)
    } else {
      updated.add(id)
    }
    setReadNotifications(updated)
  }

  const markAllNotificationsRead = () => {
    const allIds = notifications.map(n => n.id)
    setReadNotifications(new Set(allIds))
  }

  // --- Calendar Date Picker utils ---
  const getCalendarDays = () => {
    // June 2026. Starts on Monday, 30 Days.
    return Array.from({ length: 30 }, (_, i) => {
      const day = i + 1
      const dayStr = day < 10 ? `0${day}` : `${day}`
      return {
        dayNum: day,
        dateString: `2026-06-${dayStr}`,
        labelName: 'Jun'
      }
    })
  }

  // ================= REDESIGNED TAB VIEWS =================

  // 1. Asymmetric Workspace Dashboard
  const renderWorkspace = () => {
    const pendingTasks = tasks.filter(t => !t.completed)
    const completedTasks = tasks.filter(t => t.completed)
    const nextDeadlineTask = pendingTasks.find(t => t.deadline)
    const completionPercent = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0
    const highPriorityCount = pendingTasks.filter(t => t.priority === 'High').length

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up leading-relaxed text-base font-light">
        
        {/* LEFT COLUMN - Col Span 2: Editorial Primary Details */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section 1: Large Hero Section */}
          <div className="framer-card rounded-3xl p-8 relative overflow-hidden bg-gradient-to-tr from-[var(--bg-secondary)] via-[var(--bg-card)] to-purple-500/[0.03]">
            <div className="absolute right-0 top-0 h-44 w-44 glow-purple opacity-20 pointer-events-none"></div>
            
            <div className="space-y-4">
              <h2 className="text-5xl md:text-6xl font-light text-[var(--text-primary)] tracking-tight leading-tight">
                Good Evening, Isha 👋
              </h2>
              
              <p className="text-lg text-[var(--text-secondary)] font-light max-w-xl">
                You have <strong className="text-purple-500 font-semibold">{pendingTasks.length} pending deliverables</strong>, and your next major deadline is <strong className="text-[var(--text-primary)] font-medium">{nextDeadlineTask ? nextDeadlineTask.title : 'clear'}</strong>.
              </p>
              
              <div className="flex flex-wrap items-center gap-6 pt-4 text-sm text-[var(--text-tertiary)] border-t border-[var(--border-color)]">
                <div>
                  <span className="block uppercase text-xs font-bold text-[var(--text-tertiary)] tracking-widest">Next Deadline</span>
                  <span className="text-[var(--text-primary)] mt-1 block">
                    {nextDeadlineTask && nextDeadlineTask.deadline ? nextDeadlineTask.deadline.slice(11, 16) : 'None scheduled'}
                  </span>
                </div>
                
                <div className="h-6 w-px bg-[var(--border-color)] hidden sm:block"></div>

                <div>
                  <span className="block uppercase text-xs font-bold text-[var(--text-tertiary)] tracking-widest">Last Synced</span>
                  <span className="text-[var(--text-primary)] mt-1 block font-mono">Today, {lastSyncTime}</span>
                </div>

                <div className="sm:ml-auto">
                  <button
                    onClick={() => setActiveTab('tasks')}
                    className="btn-primary py-3 px-6 text-sm flex items-center gap-1.5"
                  >
                    Continue Working <ArrowRight className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Today's Focus Checklist */}
          <div className="framer-card rounded-3xl p-8 space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--border-color)]">
              <div>
                <h3 className="text-2xl font-light text-[var(--text-primary)] tracking-tight">Today's Focus</h3>
                <p className="text-sm text-[var(--text-tertiary)] mt-0.5">Primary checklist schedule metrics.</p>
              </div>
              <span className="text-sm font-semibold text-purple-500">{completionPercent}% done</span>
            </div>

            {/* Checklist progress bar */}
            <div className="w-full bg-[var(--border-color)] h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-full transition-all duration-300" style={{ width: `${completionPercent}%` }} />
            </div>

            {pendingTasks.length === 0 ? (
              <div className="py-10 text-center text-sm text-[var(--text-tertiary)]">
                No pending items. Use the sidebar to log tasks.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="flex justify-between items-center p-4 border border-[var(--border-color)] bg-[var(--bg-primary)]/20 rounded-2xl text-sm"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <button
                        onClick={() => handleToggleTaskComplete(task.id, task.title)}
                        className="h-5 w-5 rounded-md border border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-center shrink-0"
                      >
                        <Check className="h-3.5 w-3.5 opacity-0 hover:opacity-100 transition text-purple-500" />
                      </button>
                      <span className="font-semibold text-[var(--text-primary)] truncate">{task.title}</span>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      task.priority === 'High' ? 'text-red-500 bg-red-500/10' : 'text-slate-500 bg-[var(--border-color)]'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 5: Recent Documents Card deck */}
          <div className="framer-card rounded-3xl p-8 space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--border-color)]">
              <div>
                <h3 className="text-2xl font-light text-[var(--text-primary)] tracking-tight">Recent Documents</h3>
                <p className="text-sm text-[var(--text-tertiary)] mt-0.5">Dataset library vectors indexed.</p>
              </div>
              <button
                onClick={() => setActiveTab('documents')}
                className="text-sm font-semibold text-purple-500 hover:text-purple-400"
              >
                Browse All
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="py-12 text-center text-sm text-[var(--text-tertiary)] border border-dashed border-[var(--border-color)] rounded-2xl">
                No active document indices.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {documents.slice(0, 2).map((doc) => (
                  <div
                    key={doc.id}
                    className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)]/40 flex flex-col justify-between min-h-[130px] group"
                  >
                    <div className="flex items-start gap-3 justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-6 w-6 text-purple-500 shrink-0" />
                        <h4 className="font-semibold text-[var(--text-primary)] text-sm truncate max-w-[130px]" title={doc.filename}>
                          {doc.filename}
                        </h4>
                      </div>
                      
                      <button
                        onClick={() => {
                          setActiveTab('rag')
                          executeChatQuery(`Summarize document: ${doc.filename}`)
                        }}
                        className="text-xs text-purple-500 hover:underline font-bold"
                      >
                        AI Summarize
                      </button>
                    </div>

                    <span className="text-xs text-[var(--text-tertiary)] font-mono block mt-4">
                      {(doc.file_size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 6: Recent Activity Timeline */}
          <div className="framer-card rounded-3xl p-8 space-y-6">
            <h3 className="text-2xl font-light text-[var(--text-primary)] tracking-tight pb-3 border-b border-[var(--border-color)]">
              Workspace Activity
            </h3>
            
            <div className="relative pl-6 border-l border-[var(--border-color)] space-y-6">
              {activityLog.slice(0, 3).map((log) => (
                <div key={log.id} className="relative text-sm">
                  {/* Timeline dot */}
                  <span className="absolute -left-[30px] top-1 h-3.5 w-3.5 rounded-full border-2 border-[var(--bg-secondary)] bg-purple-500 shadow-sm" />
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-primary)] font-medium">{log.action || log.text}</span>
                    <span className="text-xs text-[var(--text-tertiary)] font-mono">{log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : log.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN - Col Span 1: Asymmetric sidebar details widgets */}
        <div className="space-y-8">
          
          {/* Section 3: AI Insights */}
          <div className="framer-card rounded-3xl p-8 space-y-6 bg-gradient-to-b from-[var(--bg-secondary)] to-purple-500/[0.02] border-purple-500/10">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-color)]">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <h3 className="text-xl font-medium text-[var(--text-primary)]">AI Insights</h3>
            </div>

            <div className="space-y-4 text-sm text-[var(--text-secondary)] font-light leading-relaxed">
              <div className="p-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl space-y-2">
                <span className="text-xs font-bold text-amber-500 block uppercase tracking-wider">Productivity Reminder</span>
                <p className="text-[var(--text-primary)] font-normal leading-normal">
                  Study DSA for 2 more hours to clear pending mock schedule targets!
                </p>
              </div>

              <p className="leading-relaxed">
                You have completed <strong className="text-[var(--text-primary)]">{completionPercent}%</strong> of your tasks this week.
              </p>
              
              <div className="p-4 bg-purple-500/[0.03] border border-purple-500/10 rounded-2xl text-[var(--text-primary)] font-normal">
                💡 Tip: Upload document logs to Knowledge Base to generate automated summary checklists.
              </div>
            </div>
          </div>

          {/* Section 4: Upcoming Deadlines */}
          <div className="framer-card rounded-3xl p-8 space-y-6">
            <h3 className="text-xl font-medium text-[var(--text-primary)] pb-3 border-b border-[var(--border-color)]">
              Upcoming Deadlines
            </h3>

            {pendingTasks.length === 0 ? (
              <p className="text-sm text-[var(--text-tertiary)]">No upcoming items.</p>
            ) : (
              <div className="space-y-3.5">
                {pendingTasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="p-4 border border-[var(--border-color)] rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-sm text-[var(--text-primary)] truncate max-w-[140px]">{task.title}</h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        task.priority === 'High' ? 'text-red-500 bg-red-500/10' : 'text-slate-500 bg-[var(--border-color)]'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
                      <Clock className="h-4 w-4" />
                      <span>{task.deadline ? task.deadline.slice(0, 16).replace('T', ' ') : 'No deadline'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 7: AI Copilot Widget */}
          <div className="framer-card rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-var(--border-color)">
              <Sparkles className="h-5 w-5 text-purple-500 animate-pulse" />
              <h3 className="text-xl font-medium text-[var(--text-primary)]">AI Assistant</h3>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {['Pending tasks count', 'Extract emails'].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setActiveTab('rag')
                      executeChatQuery(prompt)
                    }}
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-1.5 rounded-lg transition"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Ask copilot..."
                  className="w-full glass-input py-3 pl-4 pr-12 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      const val = e.target.value.trim()
                      e.target.value = ''
                      setActiveTab('rag')
                      executeChatQuery(val)
                    }
                  }}
                />
                <button className="absolute right-2.5 top-2.5 p-1 bg-purple-500 text-white rounded-lg hover:opacity-90">
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    )
  }

  // 2. Knowledge Base (Documents listing + uploads)
  const renderDocuments = () => {
    const filteredDocs = documents.filter(doc => 
      doc.filename.toLowerCase().includes(documentSearchQuery.toLowerCase())
    )

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-8rem)] min-h-[500px] animate-slide-up text-sm font-light leading-relaxed">
        {/* Upload Pane */}
        <div className="lg:col-span-1 framer-card rounded-2xl p-6 flex flex-col gap-6 h-fit">
          <h3 className="text-base font-bold uppercase tracking-widest text-[var(--text-secondary)] pb-2.5 border-b border-[var(--border-color)]">
            Ingest Document
          </h3>
          
          {uploadError && (
            <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-sm text-red-500">
              {uploadError}
            </div>
          )}
          {uploadSuccess && (
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-sm text-emerald-500">
              {uploadSuccess}
            </div>
          )}
          
          <form onSubmit={handleUploadFile} className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-[var(--border-color)] rounded-2xl p-8 text-center cursor-pointer hover:border-purple-500/20 hover:bg-[var(--bg-secondary)]/50 transition duration-150 flex flex-col items-center justify-center bg-[var(--bg-primary)]/40"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  setUploadError(null)
                  setUploadSuccess(null)
                  setUploadFile(e.target.files[0])
                }}
                accept=".pdf"
                className="hidden"
              />
              
              {uploadFile ? (
                <>
                  <FileText className="h-10 w-10 text-purple-500 mb-2" />
                  <span className="text-sm text-[var(--text-primary)] truncate max-w-full font-medium">{uploadFile.name}</span>
                  <span className="text-xs text-[var(--text-tertiary)] mt-1">{(uploadFile.size / 1024).toFixed(0)} KB</span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-10 w-10 text-[var(--text-tertiary)] mb-2" />
                  <span className="text-sm text-[var(--text-primary)] font-medium">Click to select PDF</span>
                  <span className="text-xs text-[var(--text-tertiary)] mt-1.5">Supports local notes & manuals</span>
                </>
              )}
            </div>
            
            <button
              type="submit"
              disabled={uploadLoading || !uploadFile}
              className="w-full btn-primary py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              {uploadLoading ? 'Indexing vectors...' : 'Process Document'}
            </button>
          </form>
        </div>

        {/* Documents deck list */}
        <div className="lg:col-span-2 flex flex-col gap-6 h-full overflow-y-auto pr-1">
          <div className="framer-card rounded-2xl p-6 flex flex-col h-full bg-[var(--bg-secondary)]">
            
            {/* Search Input Bar */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[var(--border-color)] pb-4 mb-4 shrink-0">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)]">Workspace Library</h3>
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={documentSearchQuery}
                  onChange={(e) => setDocumentSearchQuery(e.target.value)}
                  className="w-full glass-input py-2.5 pl-10 text-sm"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-grow overflow-y-auto space-y-4 pr-1 custom-scrollbar">
              {loadingDocs ? (
                <div className="space-y-4">
                  <LineSkeleton className="w-full h-12" />
                  <LineSkeleton className="w-full h-12" />
                </div>
              ) : filteredDocs.length === 0 ? (
                <div className="text-center py-20 text-sm text-[var(--text-tertiary)] border border-dashed border-[var(--border-color)] rounded-xl flex flex-col items-center justify-center h-full">
                  <Files className="h-10 w-10 text-[var(--text-tertiary)] mb-2" />
                  <span>No documents matched your search.</span>
                </div>
              ) : (
                filteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)]/45 flex items-center justify-between text-sm hover:border-[var(--text-secondary)] transition gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[var(--text-primary)] truncate font-semibold text-sm">{doc.filename}</h4>
                        <span className="text-xs text-[var(--text-tertiary)] font-mono mt-0.5 block">
                          {(doc.file_size / (1024 * 1024)).toFixed(2)} MB • Indexed
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => {
                          setActiveTab('rag')
                          executeChatQuery(`Summarize document: ${doc.filename}`)
                        }}
                        className="btn-secondary py-2 px-3.5 rounded-lg text-sm flex items-center gap-1.5"
                        title="Summarize document via AI"
                      >
                        <Sparkles className="h-4 w-4 text-purple-500" />
                        <span>AI Summarize</span>
                      </button>
                      
                      <button
                        onClick={() => handleDeleteDoc(doc.id, doc.filename)}
                        className="text-[var(--text-tertiary)] hover:text-red-500 p-2.5 border border-[var(--border-color)] hover:border-red-500/20 bg-[var(--bg-secondary)] rounded-lg transition"
                        title="Wipe indexing"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      </div>
    )
  }

  // 3. Copilot (AI Assistant Chat panel)
  const renderRAG = () => {
    const suggestedPrompts = [
      "Summarize my uploaded notes.",
      "What are my pending tasks?",
      "What does chapter 3 discuss?"
    ]

    return (
      <div className="framer-card rounded-2xl flex flex-col justify-between h-[calc(100vh-8rem)] min-h-[500px] overflow-hidden animate-slide-up text-sm font-light">
        {/* Chat header */}
        <div className="px-5 py-4 border-b border-[var(--border-color)] bg-black/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">AI Assistant / RAG Chat</span>
          </div>
          
          <div className="flex items-center gap-1.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-1 text-xs text-[var(--text-secondary)] font-mono">
            <Layers className="h-4 w-4 text-purple-500" />
            <span>Multi-Agent Dispatcher</span>
          </div>
        </div>

        {/* Chat messages viewport */}
        <div className="flex-grow p-6 overflow-y-auto space-y-4 custom-scrollbar bg-black/[0.02]">
          {chatHistory.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3.5 max-w-[85%] animate-slide-up ${
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              <div className={`h-9 w-9 rounded-lg border flex items-center justify-center shrink-0 ${
                msg.role === 'user'
                  ? 'bg-purple-500/10 border-purple-500/20 text-purple-500'
                  : 'bg-[var(--border-color)] text-[var(--text-secondary)]'
              }`}>
                {msg.role === 'user' ? <User className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
              </div>

              <div className="space-y-1.5">
                {msg.routedAgent && (
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] font-semibold tracking-wider uppercase mb-1.5">
                    <span>Thought Process</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--border-color)]" />
                    <span className="text-purple-500">{msg.routedAgent.replace('_', ' ')}</span>
                  </div>
                )}
                
                <div className={`rounded-2xl px-5 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-purple-600 text-white rounded-tr-none shadow-md shadow-purple-600/15'
                    : 'bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-tl-none font-light shadow-sm'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div className="whitespace-pre-wrap font-mono leading-relaxed">{msg.content}</div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isChatSending && (
            <div className="flex gap-3.5 mr-auto max-w-[85%] items-center">
              <div className="h-9 w-9 rounded-lg bg-[var(--border-color)] text-[var(--text-secondary)] flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 animate-spin" />
              </div>
              <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl px-5 py-3 text-sm text-[var(--text-tertiary)] font-light shadow-sm">
                <span className="animate-pulse">Agent is thinking...</span>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* Suggested Prompts & Form Input */}
        <div className="p-5 border-t border-[var(--border-color)] bg-black/5 space-y-4 shrink-0">
          
          {/* Suggested prompts chips */}
          <div className="flex flex-wrap gap-2.5">
            {suggestedPrompts.map((promptText, i) => (
              <button
                key={i}
                onClick={() => executeChatQuery(promptText)}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 rounded-xl transition"
              >
                {promptText}
              </button>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="relative flex items-center">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Ask a technical question, summarize documents, check pending tasks..."
              className="w-full glass-input py-4 pr-16 pl-4 rounded-2xl text-sm"
              disabled={isChatSending}
            />
            <button
              type="submit"
              disabled={isChatSending || !currentMessage.trim()}
              className={`absolute right-2.5 p-3 rounded-xl transition ${
                !currentMessage.trim() || isChatSending
                  ? 'text-[var(--text-tertiary)]'
                  : 'text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)] hover:opacity-90 active:scale-[0.95]'
              }`}
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>

      </div>
    )
  }

  // 4. Inbox (Gmail threads panel)
  const renderInbox = () => {
    const filteredEmails = emails.filter(email => 
      email.sender.toLowerCase().includes(emailSearchQuery.toLowerCase()) ||
      email.subject.toLowerCase().includes(emailSearchQuery.toLowerCase()) ||
      email.snippet.toLowerCase().includes(emailSearchQuery.toLowerCase())
    )

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-8rem)] min-h-[500px] animate-slide-up text-sm font-light">
        {/* Inbox list pane */}
        <div className="lg:col-span-1 framer-card rounded-2xl overflow-hidden flex flex-col justify-between h-full bg-[var(--bg-secondary)]">
          <div className="px-5 py-4 border-b border-[var(--border-color)] bg-black/5 flex flex-col gap-3 shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Inbox Threads</h3>
              {gmailSandbox && (
                <span className="text-[10px] font-bold text-amber-600 border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 rounded uppercase tracking-wide">
                  Sandbox Mode
                </span>
              )}
            </div>

            {/* Email Search input */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="Search emails..."
                value={emailSearchQuery}
                onChange={(e) => setEmailSearchQuery(e.target.value)}
                className="w-full glass-input py-2 pl-9 text-sm"
              />
            </div>
          </div>

          <div className="flex-grow overflow-y-auto p-4 space-y-3.5 custom-scrollbar bg-black/[0.02]">
            {loadingEmails ? (
              <InboxSkeleton />
            ) : filteredEmails.length === 0 ? (
              <div className="text-center py-10 text-[var(--text-tertiary)] text-sm">
                No emails matched search.
              </div>
            ) : (
              filteredEmails.map((email) => {
                const isActive = activeEmail?.id === email.id
                const isStarred = starredEmails.has(email.id)
                return (
                  <div
                    key={email.id}
                    onClick={() => setActiveEmail(email)}
                    className={`p-4 rounded-xl border text-sm cursor-pointer transition-all duration-150 relative ${
                      isActive
                        ? 'bg-[var(--bg-primary)] border-purple-500/30'
                        : 'border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-[var(--text-secondary)]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5 gap-2">
                      <span className="text-xs font-bold text-[var(--text-secondary)] truncate max-w-[120px]">
                        {email.sender.split('<')[0]}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleEmailStarred(email.id)
                          }}
                          className={`p-0.5 rounded hover:bg-white/5 transition ${
                            isStarred ? 'text-amber-500' : 'text-[var(--text-tertiary)]'
                          }`}
                        >
                          <Star className="h-4 w-4" fill={isStarred ? "currentColor" : "none"} />
                        </button>
                        <span className="text-xs text-[var(--text-tertiary)] font-mono">{email.date.slice(0, 11)}</span>
                      </div>
                    </div>
                    <h4 className={`font-semibold text-xs truncate ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                      {email.subject}
                    </h4>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1.5 truncate">{email.snippet}</p>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Email content read viewport */}
        <div className="lg:col-span-2 flex flex-col gap-6 h-full overflow-y-auto pr-1">
          {activeEmail ? (
            <div className="space-y-6 flex flex-col h-full">
              
              <div className="framer-card rounded-2xl p-6 bg-[var(--bg-secondary)] space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-[var(--border-color)]">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)] tracking-tight leading-relaxed">
                      {activeEmail.subject}
                    </h2>
                    <div className="text-xs text-[var(--text-secondary)] mt-1.5 flex items-center gap-1.5">
                      <span>Sender: <strong className="text-[var(--text-primary)]">{activeEmail.sender}</strong></span>
                      <span className="h-1.5 w-1.5 bg-[var(--text-tertiary)] rounded-full" />
                      <span>{activeEmail.date}</span>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-[var(--text-secondary)] font-light leading-relaxed whitespace-pre-wrap py-2 pr-2 overflow-y-auto max-h-[300px] custom-scrollbar">
                  {activeEmail.body || activeEmail.snippet}
                </div>
              </div>

              {/* AI Dispatch widget */}
              <div className="framer-card rounded-2xl p-6 border border-purple-500/10 bg-purple-500/5 relative overflow-hidden">
                <div className="absolute -right-16 -top-16 h-36 w-36 glow-purple pointer-events-none opacity-40"></div>
                
                <h3 className="text-sm font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-2.5 flex items-center gap-1.5">
                  <Sparkles className="h-5 w-5 animate-pulse" />
                  AI Ingestion Operations Console
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-light mb-4">
                  Trigger autonomous agents to process this email. The Task Agent will extract structured project deliverables straight to your Task Board, or compile replies via Gmail drafts.
                </p>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleAIInboxAction('extract_tasks', activeEmail)}
                    disabled={isChatSending}
                    className="btn-primary py-2.5 px-4 rounded-lg flex items-center gap-1.5 hover:opacity-95 text-xs"
                  >
                    Extract Tasks <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleAIInboxAction('draft_reply', activeEmail)}
                    disabled={isChatSending}
                    className="btn-secondary py-2.5 px-4 rounded-lg flex items-center gap-1.5 text-xs"
                  >
                    Compose AI Response Draft
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="framer-card rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full bg-[var(--bg-secondary)]">
              <Inbox className="h-10 w-10 text-[var(--text-tertiary)] mb-2" />
              <h4 className="text-sm text-[var(--text-primary)] font-semibold">No Email Selected</h4>
              <p className="text-xs text-[var(--text-tertiary)] mt-1.5">Select a mailbox item from the feed to view contents.</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // 5. Tasks (Workspace tasks checklist)
  const renderTasks = () => {
    return (
      <div className="space-y-6 animate-slide-up text-sm font-light">
        <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-4">
          <div>
            <h2 className="text-2xl font-light text-[var(--text-primary)] tracking-tight">Workspace Task Board</h2>
            <p className="text-xs text-[var(--text-tertiary)] font-light mt-1">Edit, complete, or configure project deliverables.</p>
          </div>

          <button
            onClick={() => {
              resetTaskForm()
              setTaskModalOpen(true)
            }}
            className="btn-primary py-2.5 px-4 flex items-center gap-2 rounded-xl shadow-lg text-xs"
          >
            <Plus className="h-4.5 w-4.5" /> Log Task
          </button>
        </div>

        {loadingTasks ? (
          <TaskListSkeleton />
        ) : tasks.length === 0 ? (
          <div className="framer-card rounded-2xl p-12 text-center flex flex-col items-center justify-center border-dashed">
            <CheckSquare className="h-10 w-10 text-[var(--text-tertiary)] mb-2" />
            <h4 className="text-sm text-[var(--text-primary)] font-semibold">Checklist Empty</h4>
            <p className="text-xs text-[var(--text-tertiary)] mt-1.5">Use the Gmail Inbox tab to extract tasks or click "Log Task" above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`framer-card rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between min-h-[140px] ${
                  task.completed ? 'opacity-50' : 'hover:border-[var(--text-secondary)] hover:bg-[var(--bg-primary)]/10'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() => handleToggleTaskComplete(task.id, task.title)}
                      className={`h-5 w-5 rounded-md border shrink-0 mt-1 flex items-center justify-center transition-all ${
                        task.completed
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-[var(--text-secondary)]'
                      }`}
                    >
                      {task.completed && <CheckSquare className="h-4 w-4" />}
                    </button>
                    
                    <div className="min-w-0">
                      <h4 className={`text-base font-semibold leading-relaxed truncate ${
                        task.completed ? 'line-through text-[var(--text-tertiary)]' : 'text-[var(--text-primary)]'
                      }`}>
                        {task.title}
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)] mt-1 font-light leading-relaxed line-clamp-2">
                        {task.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                    <button
                      onClick={() => triggerEditTask(task)}
                      className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 font-bold uppercase transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-[var(--text-tertiary)] hover:text-red-500 p-1.5 rounded transition"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--border-color)] flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className={`px-2.5 py-0.5 rounded-full ${
                    task.priority === 'High'
                      ? 'text-red-600 dark:text-red-400 border border-red-500/10 bg-red-500/5'
                      : task.priority === 'Medium'
                      ? 'text-amber-600 dark:text-amber-400 border border-amber-500/10 bg-amber-500/5'
                      : 'text-slate-500 border border-[var(--border-color)] bg-[var(--bg-primary)]'
                  }`}>
                    {task.priority} Priority
                  </span>

                  <span className="text-[var(--text-tertiary)] flex items-center gap-1.5 font-normal font-mono lowercase">
                    <CalendarIcon className="h-4 w-4 text-[var(--text-tertiary)] uppercase" />
                    {task.deadline ? task.deadline.slice(0, 16).replace('T', ' ') : 'no deadline'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // 6. Insights (Analytics charts & score indicators)
  const renderAnalytics = () => {
    const completedCount = tasks.filter(t => t.completed).length
    const totalCount = tasks.length
    const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

    return (
      <div className="space-y-6 animate-slide-up text-sm font-light">
        <div className="border-b border-[var(--border-color)] pb-4">
          <h2 className="text-2xl font-light text-[var(--text-primary)] tracking-tight">System Insights</h2>
          <p className="text-xs text-[var(--text-tertiary)] font-light mt-1">Track weekly checklist progress and indexed data stats.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Radial progress meter showing Productivity score */}
          <div className="framer-card rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4 bg-[var(--bg-secondary)] shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] self-start">Productivity Score</h3>
            
            <div className="relative h-44 w-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="88"
                  cy="88"
                  r="74"
                  stroke="var(--border-color)"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="88"
                  cy="88"
                  r="74"
                  stroke="#a855f7"
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 74}
                  strokeDashoffset={2 * Math.PI * 74 * (1 - completionPercent / 100)}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              
              <div className="absolute text-center">
                <span className="text-4xl font-light text-[var(--text-primary)]">{completionPercent}%</span>
                <span className="block text-xs text-[var(--text-tertiary)] uppercase tracking-wider mt-1">Completed</span>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] max-w-[200px] leading-relaxed">
              Productivity calculated dynamically from complete checklist ratios.
            </p>
          </div>

          {/* Core progress parameters */}
          <div className="framer-card rounded-2xl p-6 lg:col-span-2 space-y-6 bg-[var(--bg-secondary)]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] border-b border-[var(--border-color)] pb-3">
              Weekly Progress Dashboard
            </h3>
            
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between text-[var(--text-secondary)] text-xs mb-2">
                  <span>Tasks Completed Ratio</span>
                  <span className="font-semibold">{completedCount} of {totalCount}</span>
                </div>
                <div className="w-full bg-[var(--border-color)] rounded-full h-2.5 overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full transition-all duration-300" style={{ width: `${completionPercent}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[var(--text-secondary)] text-xs mb-2">
                  <span>Documents Uploaded Metric</span>
                  <span className="font-semibold">{documents.length} Files</span>
                </div>
                <div className="w-full bg-[var(--border-color)] rounded-full h-2.5 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(documents.length * 10, 100)}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[var(--text-secondary)] text-xs mb-2">
                  <span>Notifications Read Status</span>
                  <span className="font-semibold">{readNotifications.size} of {notifications.length}</span>
                </div>
                <div className="w-full bg-[var(--border-color)] rounded-full h-2.5 overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full transition-all duration-300" style={{ width: `${notifications.length > 0 ? (readNotifications.size / notifications.length) * 100 : 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    )
  }

  // 7. Calendar View (Interactive monthly grids)
  const renderCalendar = () => {
    const calendarDays = getCalendarDays()
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    
    // Find calendar tasks mapped to selected dates
    const selectedTasks = tasks.filter(task => {
      if (!task.deadline) return false
      return task.deadline.includes(selectedCalendarDate)
    })

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-8rem)] min-h-[500px] animate-slide-up text-sm font-light">
        {/* Calendar Grid Box */}
        <div className="lg:col-span-2 framer-card rounded-2xl p-6 flex flex-col justify-between h-full bg-[var(--bg-secondary)]">
          
          <div className="space-y-4 flex-grow flex flex-col">
            <div className="flex justify-between items-center pb-2.5 border-b border-[var(--border-color)] shrink-0">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">June 2026</h3>
              <span className="text-[10px] text-[var(--text-tertiary)] bg-[var(--border-color)] px-2 py-0.5 rounded font-mono">monthly.grid</span>
            </div>

            {/* Days row */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-[var(--text-secondary)] py-2 shrink-0">
              {daysOfWeek.map((day, idx) => (
                <div key={idx}>{day}</div>
              ))}
            </div>

            {/* Monthly Calendar Cells */}
            <div className="grid grid-cols-7 gap-2 flex-grow auto-rows-fr min-h-[220px]">
              {calendarDays.map((cell) => {
                const isSelected = selectedCalendarDate === cell.dateString
                
                // Check tasks/deadlines scheduled for this cell date
                const dueTasks = tasks.filter(t => t.deadline && t.deadline.includes(cell.dateString))
                const hasHigh = dueTasks.some(t => t.priority === 'High')
                
                return (
                  <div
                    key={cell.dayNum}
                    onClick={() => setSelectedCalendarDate(cell.dateString)}
                    className={`rounded-xl border cursor-pointer p-2.5 flex flex-col justify-between transition relative ${
                      isSelected
                        ? 'border-purple-600 bg-purple-500/10'
                        : 'border-[var(--border-color)] bg-[var(--bg-primary)]/40 hover:border-[var(--text-secondary)]'
                    }`}
                  >
                    <span className={`text-xs font-semibold ${isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-[var(--text-secondary)]'}`}>
                      {cell.dayNum}
                    </span>

                    {/* Indicator dots */}
                    {dueTasks.length > 0 && (
                      <div className="flex gap-1 justify-center mt-1">
                        <span className={`h-2 w-2 rounded-full ${hasHigh ? 'bg-red-500 animate-pulse' : 'bg-purple-500'}`} />
                        {dueTasks.length > 1 && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          
        </div>

        {/* Selected date events console drawer */}
        <div className="lg:col-span-1 framer-card rounded-2xl p-6 flex flex-col h-full bg-[var(--bg-secondary)] shadow-sm">
          <div className="border-b border-[var(--border-color)] pb-3.5 mb-4 shrink-0">
            <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest block font-mono">Selected Date Agenda</span>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight mt-1.5">
              June {selectedCalendarDate.split('-')[2]}, 2026
            </h3>
          </div>

          <div className="flex-grow overflow-y-auto space-y-4 custom-scrollbar pr-1">
            {selectedTasks.length === 0 ? (
              <div className="py-20 text-center text-xs text-[var(--text-tertiary)] flex flex-col items-center justify-center h-full">
                <Clock className="h-8 w-8 text-[var(--text-tertiary)] mb-2" />
                <span>No tasks or meetings due on this date.</span>
              </div>
            ) : (
              selectedTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)]/40 space-y-2.5 text-xs"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[var(--text-primary)] truncate pr-2 text-sm">{task.title}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                      task.priority === 'High' ? 'text-red-500 bg-red-500/10' : 'text-slate-500 bg-[var(--border-color)]'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-light line-clamp-2">
                    {task.description || 'No description provided.'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  // 8. Exports (Report markdown & PDF export download)
  const renderReports = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-8rem)] min-h-[500px] animate-slide-up text-sm font-light">
        {/* Generate card */}
        <div className="lg:col-span-1 framer-card rounded-2xl p-6 flex flex-col justify-between h-full bg-[var(--bg-secondary)]">
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Reports Engine</h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-light">
              Create compiled workspace summaries capturing active task progress logs, Gmail thread counts, and system metrics configurations. Download PDFs to export report.
            </p>
            
            <button
              onClick={handleGenerateReport}
              disabled={isReportGenerating}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 font-semibold disabled:opacity-50 text-xs"
            >
              {isReportGenerating ? 'Compiling statistics...' : 'Compile Markdown Summary'}
            </button>
          </div>

          {reportMarkdown && (
            <button
              onClick={handleExportPDF}
              disabled={pdfDownloading}
              className="w-full btn-secondary py-3.5 flex items-center justify-center gap-2 font-semibold disabled:opacity-50 text-[var(--text-primary)] text-xs"
            >
              <FileDown className="h-5 w-5" />
              {pdfDownloading ? 'Exporting PDF...' : 'Download Report PDF'}
            </button>
          )}
        </div>

        {/* Preview block */}
        <div className="lg:col-span-2 framer-card rounded-2xl p-6 h-full overflow-hidden flex flex-col bg-[var(--bg-secondary)] shadow-sm">
          <div className="border-b border-[var(--border-color)] pb-3.5 mb-4 flex justify-between items-center shrink-0">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Report Preview</h3>
            <span className="text-xs text-[var(--text-tertiary)] font-mono">markdown supported</span>
          </div>

          <div className="flex-grow overflow-y-auto custom-scrollbar bg-[var(--bg-primary)]/40 border border-[var(--border-color)] rounded-xl p-5 text-sm text-[var(--text-secondary)] font-light leading-relaxed whitespace-pre-wrap">
            {isReportGenerating ? (
              <div className="space-y-4">
                <LineSkeleton className="w-1/2 h-5" />
                <LineSkeleton className="w-full h-3" />
                <LineSkeleton className="w-5/6 h-3" />
              </div>
            ) : reportMarkdown ? (
              <div className="font-mono text-[var(--text-primary)] text-xs">{reportMarkdown}</div>
            ) : (
              <div className="text-center py-20 text-[var(--text-tertiary)] flex flex-col items-center justify-center h-full text-xs">
                <FileText className="h-10 w-10 text-[var(--text-tertiary)] mb-2" />
                <span className="text-sm">No Report Generated</span>
                <p className="text-xs text-[var(--text-tertiary)] mt-1.5 max-w-xs leading-normal">Click 'Compile Markdown Summary' in the left console to generate report.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 9. Notifications (Check off / Alert warnings listing)
  const renderNotifications = () => {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-slide-up text-sm font-light">
        <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-4">
          <div>
            <h2 className="text-2xl font-light text-[var(--text-primary)] tracking-tight">System Notifications</h2>
            <p className="text-xs text-[var(--text-tertiary)] font-light mt-1">Manage and check system alerts and inbox count warnings.</p>
          </div>

          <button
            onClick={markAllNotificationsRead}
            className="btn-secondary py-2 px-3 text-xs rounded-xl flex items-center gap-1.5"
          >
            <Check className="h-4.5 w-4.5 text-emerald-500" /> Mark all as read
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="framer-card rounded-2xl p-12 text-center flex flex-col items-center justify-center border-dashed bg-[var(--bg-secondary)]">
            <Bell className="h-10 w-10 text-[var(--text-tertiary)] mb-2" />
            <h4 className="text-sm text-[var(--text-primary)] font-semibold">All Clear</h4>
            <p className="text-xs text-[var(--text-tertiary)] mt-1.5">No active system warnings or alerts.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {notifications.map((notif) => {
              const isRead = readNotifications.has(notif.id)
              return (
                <div
                  key={notif.id}
                  onClick={() => toggleNotificationRead(notif.id)}
                  className={`p-4 rounded-2xl border transition cursor-pointer flex gap-4 items-start ${
                    isRead 
                      ? 'bg-black/[0.01] border-[var(--border-color)] text-[var(--text-tertiary)]' 
                      : 'bg-purple-900/5 border-purple-500/20 text-[var(--text-primary)] shadow-sm'
                  }`}
                >
                  <div className={`h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 ${
                    notif.type === 'error' 
                      ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                      : 'bg-purple-500/10 border-purple-500/20 text-purple-500'
                  }`}>
                    <Bell className="h-4.5 w-4.5" />
                  </div>

                  <div className="flex-grow space-y-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <strong className="text-sm font-semibold">{notif.title}</strong>
                      {!isRead && (
                        <span className="h-2 w-2 rounded-full bg-purple-500 shrink-0 mt-1.5 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed">{notif.message || notif.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // 10. Settings (Account connections + Active theme switcher)
  const renderSettings = () => {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-slide-up text-sm font-light">
        
        {/* Switcher details */}
        <div className="framer-card rounded-2xl p-6 space-y-4 bg-[var(--bg-secondary)] shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] border-b border-[var(--border-color)] pb-3 mb-2">
            Active Theme Settings
          </h3>
          
          <div className="flex justify-between items-center py-2">
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">Layout Visual Mode</h4>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-light">
                Switch workspace templates between dark night shifts and soft white layouts.
              </p>
            </div>
            
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="btn-secondary flex items-center gap-2 py-2.5 px-4 text-xs font-semibold"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-4.5 w-4.5 text-amber-500" />
                  <span>Switch to Light</span>
                </>
              ) : (
                <>
                  <Moon className="h-4.5 w-4.5 text-indigo-500" />
                  <span>Switch to Dark</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="framer-card rounded-2xl p-6 space-y-4 bg-[var(--bg-secondary)] shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] border-b border-[var(--border-color)] pb-3 mb-2">
            Google Integration Settings
          </h3>
          
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 py-2">
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">Gmail API Account</h4>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-light">
                {gmailConnected ? 'Linked account allows reading recent emails and composition of drafts.' : 'Integrate your Google Account to unlock live emails synchronization.'}
              </p>
            </div>
            
            {gmailConnected ? (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 rounded-full uppercase tracking-wider shrink-0 self-start sm:self-center">
                Connected
              </span>
            ) : gmailAuthUrl ? (
              <a
                href={gmailAuthUrl}
                className="btn-primary py-2.5 px-4 rounded-lg text-center text-xs font-semibold hover:opacity-95 shrink-0 self-start sm:self-center flex items-center gap-1.5"
              >
                <Link className="h-4 w-4" /> Authorize Account
              </a>
            ) : (
              <span className="text-xs font-bold text-amber-600 border border-amber-500/20 bg-amber-500/10 px-3.5 py-1 rounded-full uppercase tracking-wider shrink-0 self-start sm:self-center">
                Sandbox Mode Fallback
              </span>
            )}
          </div>

          {!gmailConnected && !gmailAuthUrl && (
            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl text-xs text-amber-600/90 leading-relaxed font-light">
              <strong>Info:</strong> credentials.json file was not found in the backend root directory. AgentFlow is running on <strong>Gmail Sandbox Mode</strong> (mock mailbox). To connect a live account:
              <ol className="list-decimal pl-4 mt-2 space-y-1">
                <li>Create OAuth Client credentials on Google Cloud Console.</li>
                <li>Download details as client secrets <code>credentials.json</code>.</li>
                <li>Place the downloaded file in the <code>backend/</code> folder.</li>
                <li>Reload this settings screen to trigger Google authentication link flow.</li>
              </ol>
            </div>
          )}
        </div>

        <div className="framer-card rounded-2xl p-6 bg-[var(--bg-secondary)] space-y-4 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] border-b border-[var(--border-color)] pb-3 mb-2">
            System Operations Environment
          </h3>
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[var(--text-tertiary)] block">Backend Server URL</span>
              <code className="text-[var(--text-primary)] font-mono mt-1.5 block">{API_BASE}</code>
            </div>
            <div>
              <span className="text-[var(--text-tertiary)] block">ChromaDB Persistent Store</span>
              <code className="text-[var(--text-primary)] font-mono mt-1.5 block">/backend/chroma_db</code>
            </div>
            <div>
              <span className="text-[var(--text-tertiary)] block">Database Provider</span>
              <code className="text-[var(--text-primary)] font-mono mt-1.5 block">SQLite Engine</code>
            </div>
            <div>
              <span className="text-[var(--text-tertiary)] block">Active LLM API</span>
              <code className="text-purple-600 dark:text-purple-400 font-mono mt-1.5 block">
                {llmMode === 'Gemini' ? 'Gemini Pro Model' : 'Offline Rule-based simulator'}
              </code>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const unreadNotificationsCount = notifications.filter(n => !readNotifications.has(n.id)).length

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] relative overflow-hidden font-sans theme-transition">
      
      {/* Background patterns */}
      <div className="absolute inset-0 framer-grid pointer-events-none z-0"></div>
      <div className="absolute inset-0 framer-grid-radial-mask pointer-events-none z-0"></div>

      <div className="absolute top-[10%] left-[20%] h-[600px] w-[600px] glow-purple pointer-events-none opacity-30 z-0"></div>
      <div className="absolute bottom-[20%] right-[10%] h-[500px] w-[500px] glow-blue pointer-events-none opacity-30 z-0"></div>

      {/* Guide Overlay */}
      {onboardingOpen && (
        <Onboarding onClose={() => setOnboardingOpen(false)} />
      )}

      {/* Task Modal Editor Overlay */}
      <AnimatePresence>
        {taskModalOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-sm framer-card rounded-2xl p-6 relative animate-slide-up"
            >
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-4">
                {editingTask ? 'Edit Workspace Task' : 'Log New Task'}
              </h3>
              
              <form onSubmit={handleSaveTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-1.5">Task Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Task title details..."
                    className="w-full glass-input text-sm"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-1.5">Description</label>
                  <textarea
                    placeholder="Task details and scope context..."
                    className="w-full glass-input min-h-[70px] resize-none text-sm"
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-1.5">Priority</label>
                    <select
                      className="w-full glass-input py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm"
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value)}
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-1.5">Deadline</label>
                    <input
                      type="datetime-local"
                      className="w-full glass-input py-1.5 text-sm"
                      value={newTaskDeadline}
                      onChange={(e) => setNewTaskDeadline(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-grow btn-primary py-2 font-semibold text-xs"
                  >
                    Save Task
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskModalOpen(false)}
                    className="btn-secondary py-2 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        gmailConnected={gmailConnected}
        llmMode={llmMode}
        docCount={documents.length}
        onLogout={handleLogout}
        onTriggerOnboarding={() => setOnboardingOpen(true)}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      {/* Main Workspace Frame */}
      <div className="flex-grow flex flex-col min-w-0 relative z-10 h-screen overflow-hidden">
        
        {/* Header bar */}
        <header className="h-16 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/60 backdrop-blur-md px-8 flex items-center justify-between shrink-0 transition-all duration-300">
          <div>
            <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-widest font-mono">Active workspace</span>
            <h2 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight leading-none mt-1.5 capitalize">
              Pipeline / {activeTab === 'overview' ? 'Workspace Overview' : activeTab.replace('_', ' ')}
            </h2>
          </div>
          
          <div className="flex items-center gap-4 text-sm font-semibold">
            {/* Theme switcher toggle button in top navigation bar */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg border border-[var(--border-color)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-indigo-500" />}
            </button>

            <button
              onClick={() => navigate('/upload')}
              className="btn-secondary py-2 px-3.5 rounded-lg text-xs uppercase font-bold tracking-wider flex items-center gap-1.5"
            >
              Upload PDF Dataset <ArrowRight className="h-4 w-4" />
            </button>

            {backendStatus === 'online' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 rounded-lg text-xs uppercase font-bold tracking-wider">
                <span className="h-2 w-2 bg-purple-400 rounded-full animate-ping" />
                Live Node Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-xs uppercase font-bold tracking-wider">
                <span className="h-2 w-2 bg-red-400 rounded-full" />
                Offline
              </span>
            )}
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-grow p-8 overflow-y-auto custom-scrollbar bg-black/[0.01]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeTab === 'overview' && renderWorkspace()}
              {activeTab === 'documents' && renderDocuments()}
              {activeTab === 'rag' && renderRAG()}
              {activeTab === 'inbox' && renderInbox()}
              {activeTab === 'tasks' && renderTasks()}
              {activeTab === 'analytics' && renderAnalytics()}
              {activeTab === 'calendar' && renderCalendar()}
              {activeTab === 'reports' && renderReports()}
              {activeTab === 'notifications' && renderNotifications()}
              {activeTab === 'settings' && renderSettings()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

    </div>
  )
}
