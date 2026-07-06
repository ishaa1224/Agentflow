import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sun,
  Moon,
  Menu,
  X,
  ArrowRight,
  Sparkles,
  Cpu,
  Files,
  BarChart3,
  CheckSquare,
  FileText,
  Check,
  Play,
  Layers,
  ShieldCheck,
  Zap,
  ChevronDown,
  Mail,
  Send,
  Workflow,
  MessageSquare,
  Clock,
  Bell
} from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeFaq, setActiveFaq] = useState(null)
  const [emailInput, setEmailInput] = useState('')
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false)
  const [showDemoVideo, setShowDemoVideo] = useState(false)

  // Default theme is 'light'
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

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  // FAQ Contents
  const faqs = [
    {
      q: "How does the document understanding engine process PDFs?",
      a: "Our backend utilizes PyPDF to parse text chunks from uploaded files, which are immediately processed via embedding models and cataloged in the local ChromaDB database for RAG context queries."
    },
    {
      q: "Can I connect my real Gmail mailbox to the workspace?",
      a: "Yes. By default, the application runs in a high-fidelity local sandbox mode. You can configure your credentials file in the settings to activate OAuth and sync real emails."
    },
    {
      q: "What routing mechanism drives the AI agents?",
      a: "AgentFlow AI leverages a supervisor router graph structured via LangGraph. This architecture dynamically coordinates conversational queries, routing to specialized agents (e.g. Task Specialist, RAG Agent) based on context."
    },
    {
      q: "How are productivity reports compiled and generated?",
      a: "The Report Specialist agent compiles recent checklist accomplishments, email flags, and activity counts into Markdown files, generating corporate PDF reports ready for download."
    }
  ]

  const handleNewsletterSubmit = (e) => {
    e.preventDefault()
    if (emailInput.trim()) {
      setNewsletterSubscribed(true)
      setEmailInput('')
    }
  }

  return (
    <div className="relative bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans selection:bg-purple-500/20 theme-transition w-full">
      
      {/* Background Dots */}
      <div className="absolute inset-0 framer-grid pointer-events-none z-0"></div>
      <div className="absolute inset-0 framer-grid-radial-mask pointer-events-none z-0"></div>

      {/* STICKY NAVBAR */}
      <header className="fixed top-0 left-0 w-full z-50 border-b border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md transition-all duration-300">
        <div className="max-w-[1280px] mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-purple-500/10">
              <svg className="h-5.5 w-5.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 2h16v6h-8v6h8v6H4l8-8H4V2z" />
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)] bg-clip-text text-transparent">
              AgentFlow AI
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            {['Product', 'Features', 'Solutions', 'Pricing', 'Resources'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`}
                className="text-xs lg:text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium transition"
              >
                {item}
              </a>
            ))}
          </nav>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-[var(--border-color)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5 text-indigo-500" />}
            </button>

            <Link 
              to="/login"
              className="text-xs lg:text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-4 py-2 transition"
            >
              Log In
            </Link>

            <Link 
              to="/login"
              className="btn-primary"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu triggers */}
          <div className="flex items-center gap-3 md:hidden">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)]"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-indigo-500" />}
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[var(--text-primary)]"
            >
              {mobileMenuOpen ? <X className="h-5.5 w-5.5" /> : <Menu className="h-5.5 w-5.5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/95 backdrop-blur-lg"
            >
              <div className="p-6 space-y-4 flex flex-col">
                {['Product', 'Features', 'Solutions', 'Pricing', 'Resources'].map((item) => (
                  <a 
                    key={item} 
                    href={`#${item.toLowerCase()}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium transition"
                  >
                    {item}
                  </a>
                ))}
                <div className="h-px bg-[var(--border-color)] my-1"></div>
                <div className="flex flex-col gap-2">
                  <Link 
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 text-xs font-semibold border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--border-color)] transition"
                  >
                    Log In
                  </Link>
                  <Link 
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 text-xs font-semibold btn-primary"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* CONTINUOUS VERTICAL FLOW SECTIONS */}
      {/* 1. HERO SECTION (appears immediately below navbar) */}
      <section id="product" className="relative pt-24 md:pt-32 z-10 w-full">
        <div className="max-w-[1280px] mx-auto px-8 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column */}
          <div className="space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/15 text-purple-600 dark:text-purple-400 rounded-full text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" /> Productivity Workspace
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-light tracking-tight text-[var(--text-primary)] leading-[1.1]">
              Your AI Copilot for <br />
              <span className="font-semibold bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500 bg-clip-text text-transparent">
                Smart Workflows
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[var(--text-secondary)] font-light leading-relaxed">
              Upload documents, automate tasks, manage deadlines, and stay productive. Index PDFs into high-density vector databases and coordinate workflows in parallel.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/login" className="btn-primary py-3 px-6 text-sm flex items-center justify-center gap-2">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Link>
              <button 
                onClick={() => setShowDemoVideo(true)}
                className="btn-secondary py-3 px-6 text-sm bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:bg-[var(--border-color)] transition flex items-center justify-center gap-2"
              >
                <Play className="h-4 w-4 text-purple-500 fill-purple-500" /> Watch Demo
              </button>
            </div>
          </div>

          {/* Right Column (Product mockup/browser view) */}
          <div className="w-full">
            <div className="relative rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 shadow-xl overflow-hidden text-left">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)] mb-4">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-500"></div>
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500"></div>
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500"></div>
                </div>
                <div className="px-3 py-0.5 rounded bg-[var(--bg-primary)] text-[9px] text-[var(--text-tertiary)] border border-[var(--border-color)] font-mono select-none">
                  agentflow-ai.preview
                </div>
                <div className="w-8"></div>
              </div>

              {/* Simplified Mockup Grid */}
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl">
                    <span className="text-[8px] uppercase tracking-wider text-[var(--text-tertiary)] font-bold block">Vectors</span>
                    <span className="text-sm font-bold text-[var(--text-primary)] block mt-1">1,482 Chunks</span>
                  </div>
                  <div className="p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl">
                    <span className="text-[8px] uppercase tracking-wider text-[var(--text-tertiary)] font-bold block">Tasks Done</span>
                    <span className="text-sm font-bold text-purple-500 block mt-1">12 / 16 Done</span>
                  </div>
                  <div className="p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl">
                    <span className="text-[8px] uppercase tracking-wider text-[var(--text-tertiary)] font-bold block">Agents</span>
                    <span className="text-sm font-bold text-blue-400 block mt-1">6 Active</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 dark:bg-black/50 border border-[var(--border-color)] rounded-xl font-mono text-[9px] text-zinc-400 space-y-1">
                  <p className="text-purple-400 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> [Supervisor] Triggering document task agent...
                  </p>
                  <p className="text-zinc-500 pl-4">// Ingesting standard_specification.pdf...</p>
                  <p className="text-emerald-400 pl-4">✓ Checklist parsed and synced to database.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. TRUSTED BY SECTION */}
      <section className="relative w-full border-y border-[var(--border-color)] bg-[var(--bg-secondary)]/30 z-10">
        <div className="max-w-[1280px] mx-auto px-8 py-10 text-center space-y-6">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
            Trusted by creators and platform developers worldwide
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 items-center justify-items-center opacity-60">
            {['Google', 'Microsoft', 'OpenAI', 'GitHub', 'NVIDIA'].map((company) => (
              <span 
                key={company}
                className="text-base sm:text-lg font-extrabold tracking-tight text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-default select-none"
              >
                {company}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FEATURES SECTION */}
      <section id="features" className="relative w-full z-10">
        <div className="max-w-[1280px] mx-auto px-8 py-16 md:py-24 space-y-16">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-500">Workspace Features</span>
            <h2 className="text-3xl md:text-5xl font-light tracking-tight text-[var(--text-primary)]">
              Modular design for <span className="font-semibold text-purple-500">complex tasks</span>
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-xl mx-auto font-light">
              We leverage an enterprise supervisor state graph running custom agents to coordinate checklists and vectors in parallel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature card 1 */}
            <div className="border border-[var(--border-color)] bg-[var(--bg-secondary)] rounded-2xl p-6 text-left space-y-4 shadow-sm">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                <Files className="h-5.5 w-5.5" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">AI Ingestion</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-light">
                Directly upload technical manuals or corporate PDFs. The system extracts plaintext data, splits content chunks, and builds high-density vector embeddings for rapid lookup.
              </p>
            </div>
            
            {/* Feature card 2 */}
            <div className="border border-[var(--border-color)] bg-[var(--bg-secondary)] rounded-2xl p-6 text-left space-y-4 shadow-sm">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                <CheckSquare className="h-5.5 w-5.5" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Smart Checklists</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-light">
                Our automations capture priorities, deadlines, and deliverables directly from unstructured query prompts and document uploads, creating synced task entries automatically.
              </p>
            </div>

            {/* Feature card 3 */}
            <div className="border border-[var(--border-color)] bg-[var(--bg-secondary)] rounded-2xl p-6 text-left space-y-4 shadow-sm">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <Sparkles className="h-5.5 w-5.5" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">RAG Chat Copilot</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-light">
                Submit questions regarding your documents. The RAG agent fetches matched context passages, compiles the answer using citation sources, and updates your chat history automatically.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 4. WORKFLOW AUTOMATION SECTION */}
      <section id="solutions" className="relative w-full bg-[var(--bg-secondary)]/30 border-y border-[var(--border-color)] z-10">
        <div className="max-w-[1280px] mx-auto px-8 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 space-y-6 text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-500 font-mono">Parallel Pipeline</span>
            <h2 className="text-3xl md:text-5xl font-light tracking-tight text-[var(--text-primary)]">
              Workflow <br />
              <span className="font-semibold text-purple-500">Automation</span>
            </h2>
            <p className="text-sm text-[var(--text-secondary)] font-light leading-relaxed">
              Connect variables dynamically. Document ingestion triggers secondary processes like checklist updates, SQLite sync routines, and alert notifications instantly.
            </p>
            <div className="space-y-3">
              {[
                { title: "Upload PDF Manuals", desc: "Triggers background RAG indexing" },
                { title: "Automatic Task Extraction", desc: "SQLite checklist sync in real-time" },
                { title: "Notification Dispatch", desc: "Bell warnings active immediately" }
              ].map((step, idx) => (
                <div key={idx} className="flex gap-4 items-start text-xs">
                  <div className="h-6 w-6 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center font-bold shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--text-primary)]">{step.title}</h4>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="border border-[var(--border-color)] rounded-2xl bg-[var(--bg-secondary)] p-6 shadow-lg text-left text-xs font-mono">
              <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3 mb-4 text-zinc-500">
                <span>PIPELINE_ROUTE_MONITOR</span>
                <span className="text-purple-500">Active</span>
              </div>
              <div className="space-y-4 pl-4 border-l-2 border-dashed border-purple-500/30">
                <div className="relative">
                  <span className="absolute -left-[23px] top-0.5 h-2 w-2 rounded-full bg-purple-500"></span>
                  <span className="text-purple-400">Trigger: PDF Upload Success</span>
                </div>
                <div className="relative">
                  <span className="absolute -left-[23px] top-0.5 h-2 w-2 rounded-full bg-purple-500"></span>
                  <span className="text-[var(--text-primary)]">Action: Vector Store Indexing</span>
                </div>
                <div className="relative">
                  <span className="absolute -left-[23px] top-0.5 h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-700"></span>
                  <span className="text-[var(--text-secondary)]">Action: Extract Tasks & sync SQLite</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 5. DOCUMENT INTELLIGENCE SECTION */}
      <section className="relative w-full z-10">
        <div className="max-w-[1280px] mx-auto px-8 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6 lg:order-last space-y-6 text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-500">ChromaDB Vectors</span>
            <h2 className="text-3xl md:text-5xl font-light tracking-tight text-[var(--text-primary)]">
              Document <br />
              <span className="font-semibold text-purple-500">Intelligence</span>
            </h2>
            <p className="text-sm md:text-base text-[var(--text-secondary)] leading-relaxed font-light">
              Transform unstructured technical guides, spreadsheets, or financial reports into high-density vector maps. Search matches semantically and verify citation sources within the same dashboard window.
            </p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <Check className="h-4 w-4 text-emerald-500" /> PyPDF Extraction
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <Check className="h-4 w-4 text-emerald-500" /> ChromaDB Storage
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 rounded-2xl p-5 shadow-lg text-left space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                <span className="text-[10px] font-mono text-[var(--text-tertiary)]">vector_mapping_run</span>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              </div>
              <div className="font-mono text-[9px] text-[var(--text-secondary)] space-y-2 leading-relaxed">
                <p className="text-purple-400"># Ingesting file payload: standard_manual.pdf</p>
                <p className="text-zinc-500">// Running text chunks segmentation...</p>
                <p className="text-zinc-500">// Generated 4 sub-embeddings in persistent ChromaDB store.</p>
                <p className="text-emerald-400 font-semibold">✓ Embeddings synced successfully. Source mapped.</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 6. AI COPILOT SECTION */}
      <section className="relative w-full bg-[var(--bg-secondary)]/20 border-y border-[var(--border-color)] z-10">
        <div className="max-w-[1280px] mx-auto px-8 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 space-y-6 text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-500">RAG Chat Canvas</span>
            <h2 className="text-3xl md:text-5xl font-light tracking-tight text-[var(--text-primary)]">
              AI <span className="font-semibold text-purple-500">Copilot</span>
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-light">
              Submit questions directly. The supervisor coordinates conversational routing, allowing you to fetch vector passages, query upcoming SQLite deadlines, and compile summaries from a single field.
            </p>
          </div>

          <div className="lg:col-span-7 w-full">
            <div className="border border-[var(--border-color)] rounded-2xl bg-[var(--bg-secondary)] p-4 shadow-lg text-left text-xs font-sans">
              <div className="space-y-3">
                <div className="bg-[var(--bg-primary)] p-2.5 rounded-xl text-[var(--text-secondary)] max-w-[80%]">
                  What is the revenue growth forecast on page 3?
                </div>
                <div className="bg-purple-500/10 border border-purple-500/15 p-2.5 rounded-xl text-[var(--text-primary)] max-w-[80%] ml-auto leading-relaxed">
                  Based on <strong>company_profile.pdf</strong> page 3, the forecast projected growth is 24% for the upcoming cycle.
                  <p className="text-[8px] text-[var(--text-tertiary)] mt-1.5">Sources: `company_profile.pdf`</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 7. PRICING SECTION */}
      <section id="pricing" className="relative w-full z-10">
        <div className="max-w-[1280px] mx-auto px-8 py-16 md:py-24 space-y-16">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-500">Pricing Models</span>
            <h2 className="text-3xl md:text-5xl font-light tracking-tight text-[var(--text-primary)]">
              Flexible options to <span className="font-semibold text-purple-500">get started</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Free */}
            <div className="border border-[var(--border-color)] bg-[var(--bg-secondary)] rounded-2xl p-6 text-left flex flex-col justify-between hover:border-purple-500/20 transition shadow-sm">
              <div className="space-y-4">
                <h4 className="text-base font-bold text-[var(--text-primary)]">Free Plan</h4>
                <p className="text-2xl font-black text-[var(--text-primary)]">$0</p>
                <div className="h-px bg-[var(--border-color)]" />
                <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-light">
                  <li>• Local RAG vector index</li>
                  <li>• SQLite checklist mapping</li>
                  <li>• Workspace sandbox modes</li>
                </ul>
              </div>
              <Link to="/login" className="btn-secondary text-center block py-2.5 rounded-lg text-xs font-semibold w-full mt-6 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--border-color)]">
                Get Started
              </Link>
            </div>

            {/* Pro */}
            <div className="border-2 border-purple-500 bg-[var(--bg-secondary)] rounded-2xl p-6 text-left flex flex-col justify-between shadow-lg relative">
              <span className="absolute top-0 right-4 -translate-y-1/2 bg-purple-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Popular</span>
              <div className="space-y-4">
                <h4 className="text-base font-bold text-[var(--text-primary)]">Pro Workspace</h4>
                <p className="text-2xl font-black text-[var(--text-primary)]">$29 <span className="text-xs font-normal text-[var(--text-secondary)]">/mo</span></p>
                <div className="h-px bg-[var(--border-color)]" />
                <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-light">
                  <li>• Unlimited PDF Ingestions</li>
                  <li>• Connected Gmail Auth API</li>
                  <li>• Priority supervisor nodes</li>
                </ul>
              </div>
              <Link to="/login" className="btn-primary text-center block py-2.5 rounded-lg text-xs font-semibold w-full mt-6">
                Go Pro
              </Link>
            </div>

            {/* Enterprise */}
            <div className="border border-[var(--border-color)] bg-[var(--bg-secondary)] rounded-2xl p-6 text-left flex flex-col justify-between hover:border-purple-500/20 transition shadow-sm">
              <div className="space-y-4">
                <h4 className="text-base font-bold text-[var(--text-primary)]">Enterprise</h4>
                <p className="text-2xl font-black text-[var(--text-primary)]">Custom</p>
                <div className="h-px bg-[var(--border-color)]" />
                <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-light">
                  <li>• Custom Graph configurations</li>
                  <li>• Priority support agreements</li>
                  <li>• Dedicated database storage</li>
                </ul>
              </div>
              <Link to="/login" className="btn-secondary text-center block py-2.5 rounded-lg text-xs font-semibold w-full mt-6 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--border-color)]">
                Contact Sales
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* 8. TESTIMONIALS SECTION */}
      <section className="relative w-full bg-[var(--bg-secondary)]/30 border-y border-[var(--border-color)] z-10">
        <div className="max-w-[1280px] mx-auto px-8 py-16 md:py-24 space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-500">Testimonials</span>
            <h2 className="text-3xl md:text-5xl font-light tracking-tight text-[var(--text-primary)]">
              What platform <span className="font-semibold text-purple-500">developers</span> say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {[
              {
                quote: "AgentFlow completely automated our project compliance reporting. Parsing raw customer guidelines via local ChromaDB RAG saves us days.",
                author: "Sarah Chen",
                role: "Lead Platform Architect, Vercel",
                avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              },
              {
                quote: "The SQLite task extraction combined with LangGraph is incredible. We can trace exact supervisor node updates automatically.",
                author: "Marcus Vance",
                role: "VP of Engineering, Linear",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              },
              {
                quote: "A premium interface that is fast and responsive. The mock/sandbox fallback triggers make local testing incredibly simple.",
                author: "Elena Rostova",
                role: "Senior AI Researcher, OpenAI",
                avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              }
            ].map((t, idx) => (
              <div key={idx} className="border border-[var(--border-color)] bg-[var(--bg-secondary)] rounded-2xl p-6 text-left flex flex-col justify-between hover:border-purple-500/25 transition shadow-sm">
                <p className="text-xs md:text-sm text-[var(--text-secondary)] font-light leading-relaxed italic mb-6">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <img src={t.avatar} alt={t.author} className="h-9 w-9 rounded-full object-cover border border-[var(--border-color)]" />
                  <div>
                    <h5 className="text-xs font-bold text-[var(--text-primary)]">{t.author}</h5>
                    <p className="text-[10px] text-[var(--text-tertiary)]">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 9. FAQ SECTION */}
      <section id="resources" className="relative w-full z-10">
        <div className="max-w-[1280px] mx-auto px-8 py-16 md:py-24 space-y-12">
          
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-5xl font-light tracking-tight text-[var(--text-primary)]">
              Frequently Asked <span className="font-semibold text-purple-500">Questions</span>
            </h2>
            <p className="text-xs md:text-sm text-[var(--text-secondary)] font-light">
              Review core technical parameters and API details of the application.
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx
              return (
                <div 
                  key={idx}
                  className="border border-[var(--border-color)] bg-[var(--bg-secondary)] rounded-xl overflow-hidden transition"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left text-xs sm:text-sm font-semibold text-[var(--text-primary)]"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`h-4 w-4 text-[var(--text-tertiary)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-[var(--border-color)]/30"
                      >
                        <p className="p-5 text-xs text-[var(--text-secondary)] font-light leading-relaxed">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>

        </div>
      </section>

      {/* 10. CTA SECTION */}
      <section className="relative w-full z-10 max-w-[1280px] mx-auto px-8 py-16 md:py-20 bg-gradient-to-r from-purple-500/5 to-blue-500/5 border border-[var(--border-color)] rounded-3xl mb-12">
        <div className="text-center space-y-6 max-w-xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-light text-[var(--text-primary)]">
            Ready to <span className="font-semibold text-purple-500">Supercharge</span> your output?
          </h2>
          <p className="text-xs md:text-sm text-[var(--text-secondary)] font-light leading-relaxed">
            Initialize your local RAG workspace. Ingest documents and manage action items instantly.
          </p>
          <Link to="/login" className="btn-primary py-3.5 px-7 rounded-xl inline-flex items-center gap-2">
            Access Dashboard Hub <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="bg-[var(--bg-secondary)] border-t border-[var(--border-color)] pt-16 pb-8 text-left transition duration-300 relative z-10 w-full">
        <div className="max-w-[1280px] mx-auto px-8 grid grid-cols-1 md:grid-cols-6 gap-8 pb-12">
          
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-white">
                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 2h16v6h-8v6h8v6H4l8-8H4V2z" />
                </svg>
              </div>
              <span className="text-base font-bold tracking-tight text-[var(--text-primary)]">
                AgentFlow AI
              </span>
            </Link>
            <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed max-w-xs">
              A premium technical RAG platform coordinating multi-agent workflows, Gmail sync frameworks, and SQLite task checklists.
            </p>
            {/* Newsletter */}
            <div className="space-y-2 pt-2">
              <span className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] font-bold block">Newsletter subscription</span>
              {newsletterSubscribed ? (
                <p className="text-xs text-purple-500 font-semibold">✓ Subscribed successfully!</p>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex gap-2 max-w-xs">
                  <input 
                    type="email" 
                    required 
                    placeholder="email@company.com" 
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="glass-input flex-grow py-1.5 text-xs" 
                  />
                  <button type="submit" className="btn-primary py-1.5 px-3 rounded-lg text-xs flex items-center justify-center">
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Product</h5>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-light">
              <li><a href="#features" className="hover:text-[var(--text-primary)] transition">RAG search</a></li>
              <li><a href="#features" className="hover:text-[var(--text-primary)] transition">Task compiler</a></li>
              <li><a href="#pricing" className="hover:text-[var(--text-primary)] transition">Pricing matrix</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Resources</h5>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-light">
              <li><a href="#resources" className="hover:text-[var(--text-primary)] transition">Documents docs</a></li>
              <li><a href="#resources" className="hover:text-[var(--text-primary)] transition">API schema</a></li>
              <li><a href="#resources" className="hover:text-[var(--text-primary)] transition">SQLite setup</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Solutions</h5>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-light">
              <li><a href="#features" className="hover:text-[var(--text-primary)] transition">Legal auditing</a></li>
              <li><a href="#features" className="hover:text-[var(--text-primary)] transition">Stats dashboard</a></li>
              <li><a href="#features" className="hover:text-[var(--text-primary)] transition">Gmail callbacks</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Developers</h5>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-light">
              <li><a href="#product" className="hover:text-[var(--text-primary)] transition">Github client</a></li>
              <li><a href="#product" className="hover:text-[var(--text-primary)] transition">Status tracker</a></li>
              <li><a href="#product" className="hover:text-[var(--text-primary)] transition">Beta access</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-[1280px] mx-auto px-8 pt-8 border-t border-[var(--border-color)]/30 flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--text-tertiary)] gap-4 font-light">
          <p>© 2026 AgentFlow AI Platform Inc. Built with React, Vite, Tailwind CSS, & Framer Motion.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-[var(--text-primary)] transition">Terms</a>
            <a href="#" className="hover:text-[var(--text-primary)] transition">Privacy</a>
          </div>
        </div>
      </footer>

      {/* WATCH DEMO MODAL */}
      <AnimatePresence>
        {showDemoVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative w-full max-w-4xl bg-zinc-950 rounded-2xl border border-white/10 overflow-hidden shadow-2xl p-1"
            >
              <button 
                onClick={() => setShowDemoVideo(false)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 border border-white/10 transition"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black flex flex-col justify-between p-6 text-left relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-blue-500/10 pointer-events-none"></div>
                <div className="flex items-center gap-3 relative z-10">
                  <div className="h-8 w-8 rounded bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-white">
                    <Sparkles className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-none">AgentFlow AI Workflow</h4>
                    <span className="text-[8px] text-zinc-500">Autonomous Graph Nodes</span>
                  </div>
                </div>

                <div className="my-auto max-w-md mx-auto text-center space-y-4 relative z-10">
                  <motion.div 
                    animate={{ scale: [1, 1.04, 1] }} 
                    transition={{ duration: 2.5, repeat: Infinity }}
                    className="inline-flex h-14 w-14 items-center justify-center bg-purple-600 text-white rounded-full shadow-lg cursor-pointer"
                  >
                    <Play className="h-6 w-6 text-white fill-white ml-0.5" />
                  </motion.div>
                  <h3 className="text-lg font-bold text-white">Ingestion and Task Automation</h3>
                  <p className="text-xs text-zinc-400 font-light max-w-xs mx-auto leading-relaxed">
                    Watch the supervisor coordinate multi-agent nodes to extract task schedules directly from document vector passages.
                  </p>
                </div>

                <div className="flex items-center justify-between text-zinc-500 text-[9px] relative z-10 pt-3 border-t border-white/5 font-mono">
                  <span>0:32 / 2:15</span>
                  <div className="flex-grow mx-4 bg-zinc-800 h-1 rounded-full relative overflow-hidden">
                    <div className="bg-purple-500 h-full w-[24%]" />
                  </div>
                  <span className="text-purple-400 font-bold">HD 1080p</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
