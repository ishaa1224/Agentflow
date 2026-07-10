import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Inbox,
  Mail,
  RefreshCw,
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
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

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
  const [activeTab, setActiveTab] = useState(() => {
    return new URLSearchParams(window.location.search).get('tab') || 'overview'
  })
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
      const response = await fetchWithAuth(`${API_BASE}/`)
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
      const response = await fetchWithAuth(`${API_BASE}/tasks`, { cache: 'no-store' })
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


  const handleSyncGmail = async () => {
    setIsSyncing(true);
    try {
      const response = await fetchWithAuth(`${API_BASE}/api/gmail/sync`, { method: 'POST' });
      if (response.ok) {
        await fetchEmails();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchEmails = async () => {

    setLoadingEmails(true)
    try {
      if (session?.access_token) {
        const connectResponse = await fetchWithAuth(`${API_BASE}/api/gmail/connect?state_token=${session.access_token}`, { cache: 'no-store' })
        if (connectResponse.ok) {
          const connectData = await connectResponse.json()
          setGmailConnected(connectData.connected)
          setGmailAuthUrl(connectData.auth_url)
        }
      }
      
      const response = await fetchWithAuth(`${API_BASE}/api/gmail/emails`, { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        setEmails(Array.isArray(data) ? data : [])
        if (data.length > 0) {
          setActiveEmail(data[0])
        }
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
      const response = await fetchWithAuth(`${API_BASE}/documents`, { cache: 'no-store' })
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
      const response = await fetchWithAuth(`${API_BASE}/api/notifications`, { cache: 'no-store' })
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
      const response = await fetchWithAuth(`${API_BASE}/api/activities`, { cache: 'no-store' })
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
      const response = await fetchWithAuth(`${API_BASE}/api/chat_history`, { cache: 'no-store' })
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
        response = await fetchWithAuth(`${API_BASE}/tasks/${editingTask.id}?${queryParams.toString()}`, {
          method: 'PUT'
        })
      } else {
        response = await fetchWithAuth(`${API_BASE}/tasks?${queryParams.toString()}`, {
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
      const response = await fetchWithAuth(`${API_BASE}/tasks/${id}`, {
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
      const response = await fetchWithAuth(`${API_BASE}/tasks/${id}/complete`, {
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
      const response = await fetchWithAuth(`${API_BASE}/upload`, {
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

        fetchWithAuth(`${API_BASE}/api/chat`, {
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
      const response = await fetchWithAuth(`${API_BASE}/documents/${id}`, {
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
      const response = await fetchWithAuth(`${API_BASE}/api/chat`, {
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
      const response = await fetchWithAuth(`${API_BASE}/api/chat`, {
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
      const response = await fetchWithAuth(`${API_BASE}/api/reports/generate`, {
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
      const response = await fetchWithAuth(`${API_BASE}/api/reports/export`, {
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
          <div className="card rounded-lg p-8 relative overflow-hidden  from-[var(--bg-secondary)] via-[var(--bg-card)] ">
            <div className="absolute right-0 top-0 h-44 w-44  opacity-20 pointer-events-none"></div>
            
            <div className="space-y-4">
              <h2 className="text-5xl md:text-6xl font-light text-[var(--text-primary)] tracking-tight leading-tight">
                Good Evening, Isha 👋
              </h2>
              
              <p className="text-lg text-[var(--text-secondary)] font-light max-w-xl">
                You have <strong className="text-blue-600 dark:text-blue-400 font-semibold">{pendingTasks.length} pending deliverables</strong>, and your next major deadline is <strong className="text-[var(--text-primary)] font-medium">{nextDeadlineTask ? nextDeadlineTask.title : 'clear'}</strong>.
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
          <div className="card rounded-lg p-8 space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--border-color)]">
              <div>
                <h3 className="text-2xl font-light text-[var(--text-primary)] tracking-tight">Today's Focus</h3>
                <p className="text-sm text-[var(--text-tertiary)] mt-0.5">Primary checklist schedule metrics.</p>
              </div>
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{completionPercent}% done</span>
            </div>

            {/* Checklist progress bar */}
            <div className="w-full bg-[var(--border-color)] h-2 rounded-md overflow-hidden">
              <div className=" from-purple-500 to-blue-500 h-full transition-all duration-300" style={{ width: `${completionPercent}%` }} />
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
                    className="flex justify-between items-center p-4 border border-[var(--border-color)] bg-[var(--bg-primary)]/20 rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <button
                        onClick={() => handleToggleTaskComplete(task.id, task.title)}
                        className="h-5 w-5 rounded-md border border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-center shrink-0"
                      >
                        <Check className="h-3.5 w-3.5 opacity-0 hover:opacity-100 transition text-blue-600 dark:text-blue-400" />
                      </button>
                      <span className="font-semibold text-[var(--text-primary)] truncate">{task.title}</span>
                    </div>

                    <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
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
          <div className="card rounded-lg p-8 space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--border-color)]">
              <div>
                <h3 className="text-2xl font-light text-[var(--text-primary)] tracking-tight">Recent Documents</h3>
                <p className="text-sm text-[var(--text-tertiary)] mt-0.5">Dataset library vectors indexed.</p>
              </div>
              <button
                onClick={() => setActiveTab('documents')}
                className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-purple-400"
              >
                Browse All
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="py-12 text-center text-sm text-[var(--text-tertiary)] border border-dashed border-[var(--border-color)] rounded-lg">
                No active document indices.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {documents.slice(0, 2).map((doc) => (
                  <div
                    key={doc.id}
                    className="p-5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]/40 flex flex-col justify-between min-h-[130px] group"
                  >
                    <div className="flex items-start gap-3 justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400 shrink-0" />
                        <h4 className="font-semibold text-[var(--text-primary)] text-sm truncate max-w-[130px]" title={doc.filename}>
                          {doc.filename}
                        </h4>
                      </div>
                      
                      <button
                        onClick={() => {
                          setActiveTab('rag')
                          executeChatQuery(`Summarize document: ${doc.filename}`)
                        }}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold"
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
          <div className="card rounded-lg p-8 space-y-6">
            <h3 className="text-2xl font-light text-[var(--text-primary)] tracking-tight pb-3 border-b border-[var(--border-color)]">
              Workspace Activity
            </h3>
            
            <div className="relative pl-6 border-l border-[var(--border-color)] space-y-6">
              {activityLog.slice(0, 3).map((log) => (
                <div key={log.id} className="relative text-sm">
                  {/* Timeline dot */}
                  <span className="absolute -left-[30px] top-1 h-3.5 w-3.5 rounded-md border-2 border-[var(--bg-secondary)] bg-blue-600 shadow-sm" />
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
          <div className="card rounded-lg p-8 space-y-6  from-[var(--bg-secondary)]  border-blue-500/10">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-color)]">
              <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xl font-medium text-[var(--text-primary)]">AI Insights</h3>
            </div>

            <div className="space-y-4 text-sm text-[var(--text-secondary)] font-light leading-relaxed">
              <div className="p-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg space-y-2">
                <span className="text-xs font-bold text-amber-500 block uppercase tracking-wider">Productivity Reminder</span>
                <p className="text-[var(--text-primary)] font-normal leading-normal">
                  Study DSA for 2 more hours to clear pending mock schedule targets!
                </p>
              </div>

              <p className="leading-relaxed">
                You have completed <strong className="text-[var(--text-primary)]">{completionPercent}%</strong> of your tasks this week.
              </p>
              
              <div className="p-4 bg-blue-600/[0.03] border border-blue-500/10 rounded-lg text-[var(--text-primary)] font-normal">
                💡 Tip: Upload document logs to Knowledge Base to generate automated summary checklists.
              </div>
            </div>
          </div>

          {/* Section 4: Upcoming Deadlines */}
          <div className="card rounded-lg p-8 space-y-6">
            <h3 className="text-xl font-medium text-[var(--text-primary)] pb-3 border-b border-[var(--border-color)]">
              Upcoming Deadlines
            </h3>

            {pendingTasks.length === 0 ? (
              <p className="text-sm text-[var(--text-tertiary)]">No upcoming items.</p>
            ) : (
              <div className="space-y-3.5">
                {pendingTasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="p-4 border border-[var(--border-color)] rounded-lg space-y-2">
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
          <div className="card rounded-lg p-8 space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-var(--border-color)">
              <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 " />
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
                <button className="absolute right-2.5 top-2.5 p-1 bg-blue-600 text-white rounded-lg hover:opacity-90">
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
      <div className="flex flex-col gap-8 h-full animate-slide-up text-sm font-light leading-relaxed max-w-6xl mx-auto w-full">
        {/* Top: Upload Area */}
        <div className="card rounded-xl p-8 bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-sm">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="md:w-1/3 space-y-3">
              <div className="h-12 w-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                <UploadCloud className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] tracking-tight">Knowledge Ingestion</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Upload PDFs, notes, or manuals to expand your workspace's semantic search capabilities.
              </p>
            </div>
            
            <div className="md:w-2/3 w-full">
              {uploadError && (
                <div className="mb-4 p-3 bg-red-500/5 border border-red-500/10 rounded-lg text-sm text-red-500 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> {uploadError}
                </div>
              )}
              {uploadSuccess && (
                <div className="mb-4 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-sm text-emerald-600 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> {uploadSuccess}
                </div>
              )}
              
              <form onSubmit={handleUploadFile} className="flex flex-col sm:flex-row gap-4 w-full">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-grow border-2 border-dashed border-[var(--border-color)] rounded-xl p-5 text-center cursor-pointer hover:border-blue-500/40 hover:bg-blue-500/5 transition-all duration-200 flex items-center justify-center bg-[var(--bg-primary)]/40 min-h-[100px] group"
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
                    <div className="flex items-center gap-3 text-left w-full px-4">
                      <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400 shrink-0" />
                      <div className="overflow-hidden">
                        <span className="text-sm text-[var(--text-primary)] truncate font-semibold block">{uploadFile.name}</span>
                        <span className="text-xs text-[var(--text-tertiary)] font-mono">{(uploadFile.size / 1024).toFixed(0)} KB</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-left">
                      <div className="h-10 w-10 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus className="h-5 w-5 text-[var(--text-tertiary)]" />
                      </div>
                      <div>
                        <span className="text-sm text-[var(--text-primary)] font-semibold block">Select PDF Document</span>
                        <span className="text-xs text-[var(--text-tertiary)]">Drag & drop or click to browse</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={uploadLoading || !uploadFile}
                  className="sm:w-40 w-full btn-primary font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm transition-all hover:shadow-md"
                >
                  {uploadLoading ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    'Process PDF'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom: Documents List */}
        <div className="flex-grow flex flex-col bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] overflow-hidden shadow-sm">
          {/* Header & Search */}
          <div className="px-6 py-5 border-b border-[var(--border-color)] flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-black/5">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)]">Indexed Library</h3>
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="Search indexed files..."
                value={documentSearchQuery}
                onChange={(e) => setDocumentSearchQuery(e.target.value)}
                className="w-full glass-input py-2.5 pl-9 rounded-lg text-sm bg-[var(--bg-primary)] focus:ring-1 focus:ring-blue-500/50 outline-none border border-[var(--border-color)]"
              />
            </div>
          </div>

          {/* List Content */}
          <div className="flex-grow overflow-y-auto p-6 space-y-3 custom-scrollbar">
            {loadingDocs ? (
              <div className="space-y-3">
                <LineSkeleton className="w-full h-16 rounded-xl" />
                <LineSkeleton className="w-full h-16 rounded-xl" />
                <LineSkeleton className="w-full h-16 rounded-xl" />
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="text-center py-16 text-sm text-[var(--text-tertiary)] flex flex-col items-center justify-center h-full">
                <Files className="h-12 w-12 text-[var(--border-color)] mb-4" />
                <span className="font-medium text-[var(--text-secondary)]">Library is empty</span>
                <span className="mt-1 text-xs">Upload a document above to begin indexing.</span>
              </div>
            ) : (
              filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] flex flex-col sm:flex-row sm:items-center justify-between text-sm hover:border-blue-500/30 hover:shadow-sm transition-all gap-4 group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-12 w-12 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] shrink-0 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[var(--text-primary)] truncate font-semibold text-base">{doc.filename}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-[var(--text-tertiary)] font-mono bg-[var(--bg-secondary)] px-2 py-0.5 rounded-md">
                          {(doc.file_size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                        <span className="text-xs text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                          <Check className="w-3 h-3" /> Indexed
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setActiveTab('rag')
                        executeChatQuery(`Summarize document: ${doc.filename}`)
                      }}
                      className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 py-2 px-4 rounded-lg text-sm flex items-center gap-2 font-medium transition-colors"
                      title="Summarize document via AI"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Summarize</span>
                    </button>
                    
                    <button
                      onClick={() => handleDeleteDoc(doc.id, doc.filename)}
                      className="text-[var(--text-tertiary)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 p-2.5 border border-transparent hover:border-red-200 dark:hover:border-red-500/30 rounded-lg transition-colors"
                      title="Delete from knowledge base"
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
      <div className="card rounded-lg flex flex-col justify-between h-[calc(100vh-8rem)] min-h-[500px] overflow-hidden animate-slide-up text-sm font-light">
        {/* Chat header */}
        <div className="px-5 py-4 border-b border-[var(--border-color)] bg-black/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 bg-emerald-500 rounded-md " />
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">AI Assistant / RAG Chat</span>
          </div>
          
          <div className="flex items-center gap-1.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-1 text-xs text-[var(--text-secondary)] font-mono">
            <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
                  ? 'bg-blue-600/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
                  : 'bg-[var(--border-color)] text-[var(--text-secondary)]'
              }`}>
                {msg.role === 'user' ? <User className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
              </div>

              <div className="space-y-1.5">
                {msg.routedAgent && (
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] font-semibold tracking-wider uppercase mb-1.5">
                    <span>Thought Process</span>
                    <span className="h-1.5 w-1.5 rounded-md bg-[var(--border-color)]" />
                    <span className="text-blue-600 dark:text-blue-400">{msg.routedAgent.replace('_', ' ')}</span>
                  </div>
                )}
                
                <div className={`rounded-lg px-5 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-700 text-white rounded-tr-none shadow-md shadow-purple-600/15'
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
              <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-5 py-3 text-sm text-[var(--text-tertiary)] font-light shadow-sm">
                <span className="">Agent is thinking...</span>
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
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 rounded-lg transition"
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
              className="w-full glass-input py-4 pr-16 pl-4 rounded-lg text-sm"
              disabled={isChatSending}
            />
            <button
              type="submit"
              disabled={isChatSending || !currentMessage.trim()}
              className={`absolute right-2.5 p-3 rounded-lg transition ${
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
        <div className="lg:col-span-1 card rounded-lg overflow-hidden flex flex-col justify-between h-full bg-[var(--bg-secondary)]">
          <div className="px-5 py-4 border-b border-[var(--border-color)] bg-black/5 flex flex-col gap-3 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Inbox Threads</h3>
              <div className="flex items-center gap-2">
                {gmailSandbox && (
                  <span className="text-[10px] font-bold text-amber-600 border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 rounded uppercase tracking-wide">
                    Sandbox Mode
                  </span>
                )}
                {!gmailConnected && gmailAuthUrl && (
                  <a href={gmailAuthUrl} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 text-xs flex items-center gap-1.5 rounded transition shadow cursor-pointer">
                    <Mail className="w-3.5 h-3.5" /> Connect Gmail
                  </a>
                )}
                {gmailConnected && (
                  <button onClick={handleSyncGmail} disabled={isSyncing} className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 py-1.5 px-3 text-xs flex items-center gap-1.5 rounded transition shadow-sm font-semibold">
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} /> 
                    {isSyncing ? 'Syncing...' : 'Sync Inbox'}
                  </button>
                )}
              </div>
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
                    className={`p-4 rounded-lg border text-sm cursor-pointer transition-all duration-150 relative ${
                      isActive
                        ? 'bg-[var(--bg-primary)] border-blue-500/30'
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
              
              <div className="card rounded-lg p-6 bg-[var(--bg-secondary)] space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-[var(--border-color)]">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)] tracking-tight leading-relaxed">
                      {activeEmail.subject}
                    </h2>
                    <div className="text-xs text-[var(--text-secondary)] mt-1.5 flex items-center gap-1.5">
                      <span>Sender: <strong className="text-[var(--text-primary)]">{activeEmail.sender}</strong></span>
                      <span className="h-1.5 w-1.5 bg-[var(--text-tertiary)] rounded-md" />
                      <span>{activeEmail.date}</span>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-[var(--text-secondary)] font-light leading-relaxed whitespace-pre-wrap py-2 pr-2 overflow-y-auto max-h-[300px] custom-scrollbar">
                  {activeEmail.body || activeEmail.snippet}
                </div>
              </div>

              {/* AI Dispatch widget */}
              <div className="card rounded-lg p-6 border border-blue-500/10 bg-blue-600/5 relative overflow-hidden">
                <div className="absolute -right-16 -top-16 h-36 w-36  pointer-events-none opacity-40"></div>
                
                <h3 className="text-sm font-bold uppercase tracking-widest text-blue-700 dark:text-blue-300 dark:text-purple-400 mb-2.5 flex items-center gap-1.5">
                  <Sparkles className="h-5 w-5 " />
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
            <div className="card rounded-lg p-8 flex flex-col items-center justify-center text-center h-full bg-[var(--bg-secondary)]">
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
            className="btn-primary py-2.5 px-4 flex items-center gap-2 rounded-lg shadow-lg text-xs"
          >
            <Plus className="h-4.5 w-4.5" /> Log Task
          </button>
        </div>

        {loadingTasks ? (
          <TaskListSkeleton />
        ) : tasks.length === 0 ? (
          <div className="card rounded-lg p-12 text-center flex flex-col items-center justify-center border-dashed">
            <CheckSquare className="h-10 w-10 text-[var(--text-tertiary)] mb-2" />
            <h4 className="text-sm text-[var(--text-primary)] font-semibold">Checklist Empty</h4>
            <p className="text-xs text-[var(--text-tertiary)] mt-1.5">Use the Gmail Inbox tab to extract tasks or click "Log Task" above.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`card rounded-lg p-5 transition-all duration-200 flex flex-col justify-between  ${
                  task.completed ? 'opacity-50' : 'hover:border-[var(--text-secondary)] hover:bg-[var(--bg-primary)]/10'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() => handleToggleTaskComplete(task.id, task.title)}
                      className={`h-5 w-5 rounded-md border shrink-0 mt-1 flex items-center justify-center transition-all ${
                        task.completed
                          ? 'bg-blue-700 border-blue-500 text-white'
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
                  <span className={`px-2.5 py-0.5 rounded-md ${
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
          <div className="card rounded-lg p-6 flex flex-col items-center justify-center text-center space-y-4 bg-[var(--bg-secondary)] shadow-sm">
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
          <div className="card rounded-lg p-6 lg:col-span-2 space-y-6 bg-[var(--bg-secondary)]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] border-b border-[var(--border-color)] pb-3">
              Weekly Progress Dashboard
            </h3>
            
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between text-[var(--text-secondary)] text-xs mb-2">
                  <span>Tasks Completed Ratio</span>
                  <span className="font-semibold">{completedCount} of {totalCount}</span>
                </div>
                <div className="w-full bg-[var(--border-color)] rounded-md h-2.5 overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-md transition-all duration-300" style={{ width: `${completionPercent}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[var(--text-secondary)] text-xs mb-2">
                  <span>Documents Uploaded Metric</span>
                  <span className="font-semibold">{documents.length} Files</span>
                </div>
                <div className="w-full bg-[var(--border-color)] rounded-md h-2.5 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-md transition-all duration-300" style={{ width: `${Math.min(documents.length * 10, 100)}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[var(--text-secondary)] text-xs mb-2">
                  <span>Notifications Read Status</span>
                  <span className="font-semibold">{readNotifications.size} of {notifications.length}</span>
                </div>
                <div className="w-full bg-[var(--border-color)] rounded-md h-2.5 overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-md transition-all duration-300" style={{ width: `${notifications.length > 0 ? (readNotifications.size / notifications.length) * 100 : 100}%` }} />
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
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    
    // Find calendar tasks mapped to selected dates
    const selectedTasks = tasks.filter(task => {
      if (!task.deadline) return false
      return task.deadline.includes(selectedCalendarDate)
    })

    return (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 h-[calc(100vh-8rem)] min-h-[500px] animate-slide-up text-sm font-light">
        
        {/* Left: Monthly Calendar Grid */}
        <div className="xl:col-span-2 card rounded-xl p-6 flex flex-col h-full bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-sm">
          
          {/* Header */}
          <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-5 mb-5 shrink-0">
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">Timeline & Deadlines</h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Select a date to view scheduled tasks.</p>
            </div>
            <div className="bg-[var(--bg-primary)] px-4 py-2 rounded-lg border border-[var(--border-color)] font-mono text-sm shadow-sm font-semibold text-[var(--text-primary)]">
              June 2026
            </div>
          </div>

          <div className="flex-grow flex flex-col min-h-0 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] p-4 shadow-inner">
            {/* Days row */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)] pb-3 mb-2 border-b border-[var(--border-color)]/50 shrink-0">
              {daysOfWeek.map((day, idx) => (
                <div key={idx}>{day}</div>
              ))}
            </div>

            {/* Monthly Calendar Cells */}
            <div className="grid grid-cols-7 gap-2 flex-grow auto-rows-fr">
              {calendarDays.map((cell) => {
                const isSelected = selectedCalendarDate === cell.dateString
                const dueTasks = tasks.filter(t => t.deadline && t.deadline.includes(cell.dateString))
                
                // Determine style based on task priority
                const hasHigh = dueTasks.some(t => t.priority === 'High')
                const hasMed = dueTasks.some(t => t.priority === 'Medium')
                
                return (
                  <div
                    key={cell.dayNum}
                    onClick={() => setSelectedCalendarDate(cell.dateString)}
                    className={`rounded-xl border cursor-pointer p-2 sm:p-3 flex flex-col justify-between transition-all duration-200 relative group overflow-hidden ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md ring-1 ring-blue-500/50'
                        : 'border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-blue-400/50 hover:bg-[var(--bg-primary)]'
                    }`}
                  >
                    <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${
                      isSelected 
                        ? 'bg-blue-600 text-white' 
                        : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                    }`}>
                      {cell.dayNum}
                    </span>

                    {/* Task Indicators */}
                    {dueTasks.length > 0 && (
                      <div className="flex flex-col gap-1 w-full mt-2">
                        {dueTasks.slice(0, 3).map((t, i) => (
                          <div key={i} className={`h-1.5 w-full rounded-full opacity-80 ${
                            t.priority === 'High' ? 'bg-red-500' : t.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'
                          }`} />
                        ))}
                        {dueTasks.length > 3 && (
                          <span className="text-[10px] text-[var(--text-tertiary)] font-semibold text-right leading-none">
                            +{dueTasks.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right: Selected Date Agenda Drawer */}
        <div className="xl:col-span-1 card rounded-xl p-0 flex flex-col h-full bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-sm overflow-hidden">
          
          {/* Header */}
          <div className="bg-black/5 p-6 border-b border-[var(--border-color)] shrink-0">
            <span className="text-xs text-[var(--text-tertiary)] font-bold uppercase tracking-widest font-mono mb-1 block">
              Agenda
            </span>
            <h3 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
              <CalendarIcon className="h-6 w-6 text-blue-500" />
              June {selectedCalendarDate.split('-')[2]}
            </h3>
          </div>

          <div className="flex-grow overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[var(--bg-primary)]/30">
            {selectedTasks.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center h-full">
                <div className="h-16 w-16 bg-[var(--bg-primary)] rounded-full border border-dashed border-[var(--border-color)] flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-[var(--text-tertiary)]" />
                </div>
                <span className="text-[var(--text-secondary)] font-medium">Schedule is clear</span>
                <span className="text-xs text-[var(--text-tertiary)] mt-1">No tasks due on this date.</span>
              </div>
            ) : (
              selectedTasks.map((task) => (
                <div
                  key={task.id}
                  className="group p-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  {/* Left accent border based on priority */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    task.priority === 'High' ? 'bg-red-500' : task.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />
                  
                  <div className="pl-2">
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <h4 className="font-semibold text-[var(--text-primary)] leading-tight text-base">{task.title}</h4>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 border ${
                        task.priority === 'High' 
                          ? 'text-red-600 bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20' 
                          : task.priority === 'Medium'
                          ? 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20'
                          : 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                    
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-light line-clamp-3 mb-3">
                      {task.description || 'No description provided for this task.'}
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-tertiary)] bg-[var(--bg-secondary)] px-3 py-1.5 rounded-lg w-fit">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{task.deadline ? task.deadline.slice(11, 16) : 'Any time'}</span>
                    </div>
                  </div>
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
        <div className="lg:col-span-1 card rounded-lg p-6 flex flex-col justify-between h-full bg-[var(--bg-secondary)]">
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
        <div className="lg:col-span-2 card rounded-lg p-6 h-full overflow-hidden flex flex-col bg-[var(--bg-secondary)] shadow-sm">
          <div className="border-b border-[var(--border-color)] pb-3.5 mb-4 flex justify-between items-center shrink-0">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Report Preview</h3>
            <span className="text-xs text-[var(--text-tertiary)] font-mono">markdown supported</span>
          </div>

          <div className="flex-grow overflow-y-auto custom-scrollbar bg-[var(--bg-primary)]/40 border border-[var(--border-color)] rounded-lg p-5 text-sm text-[var(--text-secondary)] font-light leading-relaxed whitespace-pre-wrap">
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
            className="btn-secondary py-2 px-3 text-xs rounded-lg flex items-center gap-1.5"
          >
            <Check className="h-4.5 w-4.5 text-emerald-500" /> Mark all as read
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="card rounded-lg p-12 text-center flex flex-col items-center justify-center border-dashed bg-[var(--bg-secondary)]">
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
                  className={`p-4 rounded-lg border transition cursor-pointer flex gap-4 items-start ${
                    isRead 
                      ? 'bg-black/[0.01] border-[var(--border-color)] text-[var(--text-tertiary)]' 
                      : 'bg-purple-900/5 border-blue-500/20 text-[var(--text-primary)] shadow-sm'
                  }`}
                >
                  <div className={`h-9 w-9 rounded-lg border flex items-center justify-center shrink-0 ${
                    notif.type === 'error' 
                      ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                      : 'bg-blue-600/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
                  }`}>
                    <Bell className="h-4.5 w-4.5" />
                  </div>

                  <div className="flex-grow space-y-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <strong className="text-sm font-semibold">{notif.title}</strong>
                      {!isRead && (
                        <span className="h-2 w-2 rounded-md bg-blue-600 shrink-0 mt-1.5 " />
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
        <div className="card rounded-lg p-6 space-y-4 bg-[var(--bg-secondary)] shadow-sm">
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

        <div className="card rounded-lg p-6 space-y-4 bg-[var(--bg-secondary)] shadow-sm">
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
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 rounded-md uppercase tracking-wider shrink-0 self-start sm:self-center">
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
              <span className="text-xs font-bold text-amber-600 border border-amber-500/20 bg-amber-500/10 px-3.5 py-1 rounded-md uppercase tracking-wider shrink-0 self-start sm:self-center">
                Sandbox Mode Fallback
              </span>
            )}
          </div>

          {!gmailConnected && !gmailAuthUrl && (
            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-lg text-xs text-amber-600/90 leading-relaxed font-light">
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

        <div className="card rounded-lg p-6 bg-[var(--bg-secondary)] space-y-4 shadow-sm">
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
              <code className="text-blue-700 dark:text-blue-300 dark:text-purple-400 font-mono mt-1.5 block">
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

      <div className="absolute top-[10%] left-[20%] h-[600px] w-[600px]  pointer-events-none opacity-30 z-0"></div>
      <div className="absolute bottom-[20%] right-[10%] h-[500px] w-[500px]  pointer-events-none opacity-30 z-0"></div>

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
              className="w-full max-w-sm card rounded-lg p-6 relative animate-slide-up"
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
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 dark:text-purple-400 rounded-lg text-xs uppercase font-bold tracking-wider">
                <span className="h-2 w-2 bg-purple-400 rounded-md animate-ping" />
                Live Node Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-xs uppercase font-bold tracking-wider">
                <span className="h-2 w-2 bg-red-400 rounded-md" />
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
