import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sun,
  Moon,
  Menu,
  X,
  ArrowRight,
  Files,
  CheckSquare,
  MessageSquare,
  Layers,
  ChevronDown,
  Play,
  Send
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
      q: "How does the document engine process PDFs?",
      a: "The system parses text from uploaded files, which are processed via embedding models and cataloged in a local ChromaDB database for semantic queries."
    },
    {
      q: "Can I connect my real Gmail mailbox?",
      a: "Yes. By default, the application runs in a high-fidelity local sandbox mode. You can configure your credentials file in the settings to activate OAuth and sync real emails."
    },
    {
      q: "How are the AI agents structured?",
      a: "AgentFlow AI leverages a supervisor router graph structured via LangGraph. This dynamically coordinates conversational queries, routing to specialized agents based on context."
    },
    {
      q: "How are productivity reports generated?",
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
    <div className="relative bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans w-full min-h-screen">
      
      {/* STICKY NAVBAR */}
      <header className="fixed top-0 left-0 w-full z-50 bg-[var(--bg-secondary)]/90 backdrop-blur-sm border-b border-[var(--border-color)] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center text-white">
              <Layers className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
              AgentFlow
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            {['Product', 'Features', 'Pricing', 'Resources'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`}
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium transition"
              >
                {item}
              </a>
            ))}
          </nav>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5 text-slate-500" />}
            </button>
            <Link 
              to="/login"
              className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            >
              Log in
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
              className="p-2 rounded-md text-[var(--text-secondary)]"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-slate-500" />}
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
              className="md:hidden border-t border-[var(--border-color)] bg-[var(--bg-secondary)]"
            >
              <div className="p-6 space-y-4 flex flex-col">
                {['Product', 'Features', 'Pricing', 'Resources'].map((item) => (
                  <a 
                    key={item} 
                    href={`#${item.toLowerCase()}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm text-[var(--text-secondary)] font-medium"
                  >
                    {item}
                  </a>
                ))}
                <div className="h-px bg-[var(--border-color)] my-2"></div>
                <div className="flex flex-col gap-3">
                  <Link 
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 text-sm font-medium text-[var(--text-primary)] border border-[var(--border-color)] rounded-lg"
                  >
                    Log In
                  </Link>
                  <Link 
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 text-sm font-medium btn-primary"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 1. HERO SECTION */}
      <section id="product" className="relative pt-32 pb-16 md:pt-40 md:pb-24 z-10 w-full">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-[var(--text-primary)] max-w-4xl mx-auto leading-tight">
            The intelligent workspace for <br className="hidden md:block" />
            document-driven teams
          </h1>
          <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
            AgentFlow AI integrates document parsing, semantic search, and autonomous task extraction into one clean workspace.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/login" className="btn-primary flex items-center gap-2">
              Start for free <ArrowRight className="h-4 w-4" />
            </Link>
            <button 
              onClick={() => setShowDemoVideo(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Play className="h-4 w-4" /> View product demo
            </button>
          </div>
        </div>

        {/* Product Interface Preview */}
        <div className="max-w-5xl mx-auto px-6 pt-16">
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-xl overflow-hidden framer-card">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/50">
              <div className="h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-600"></div>
              <div className="h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-600"></div>
              <div className="h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-600"></div>
            </div>
            <img 
              src="/dashboard_preview.png" 
              alt="AgentFlow Premium Interface" 
              className="w-full h-auto object-cover border-none"
            />
          </div>
        </div>
      </section>

      {/* 2. TRUSTED BY SECTION */}
      <section className="w-full py-10 bg-[var(--bg-secondary)] border-y border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm font-medium text-[var(--text-tertiary)] mb-6">
            Trusted by forward-thinking teams
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale">
            {['Acme Corp', 'Globex', 'Soylent', 'Initech', 'Umbrella'].map((company) => (
              <span key={company} className="text-xl font-bold tracking-tight text-[var(--text-secondary)]">
                {company}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FEATURES - ALTERNATING */}
      <section id="features" className="w-full py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6 space-y-24">
          
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl md:text-4xl font-semibold text-[var(--text-primary)]">
              Everything you need to manage knowledge work
            </h2>
            <p className="text-lg text-[var(--text-secondary)]">
              We leverage custom agents to coordinate checklists and semantic search in parallel.
            </p>
          </div>

          {/* Feature 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 border border-[var(--border-color)] bg-[var(--bg-secondary)] rounded-xl p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Document Storage</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 rounded">2 Active Docs</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)]">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded">
                    <Files className="h-5 w-5" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">infrastructure_specs.pdf</p>
                    <div className="w-full bg-[var(--border-color)] h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full w-full" />
                    </div>
                  </div>
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Indexed</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)]">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded">
                    <Files className="h-5 w-5" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">developer_onboarding.pdf</p>
                    <div className="w-full bg-[var(--border-color)] h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-purple-500 h-full rounded-full w-[80%]" />
                    </div>
                  </div>
                  <span className="text-xs font-medium text-[var(--text-secondary)]">80% Ingested</span>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 space-y-4">
              <div className="h-12 w-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center mb-6">
                <Files className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-semibold text-[var(--text-primary)]">Intelligent Document Ingestion</h3>
              <p className="text-[var(--text-secondary)] text-lg leading-relaxed">
                Directly upload technical manuals or corporate PDFs. The system extracts plaintext data, splits content chunks, and builds vector embeddings for rapid lookup via ChromaDB.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center mb-6">
                <CheckSquare className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-semibold text-[var(--text-primary)]">Automated Task Extraction</h3>
              <p className="text-[var(--text-secondary)] text-lg leading-relaxed">
                Our automations capture priorities, deadlines, and deliverables directly from unstructured documents, creating synced task entries automatically in your workspace.
              </p>
            </div>
            <div className="border border-[var(--border-color)] bg-[var(--bg-secondary)] rounded-xl p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Extracted Action Items</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 rounded">AI Autopilot</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)]">
                  <input type="checkbox" defaultChecked className="mt-1 accent-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)] line-through opacity-70">Initialize Supabase local DB schemas</p>
                    <span className="inline-block text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded mt-1.5">Priority: High</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)]">
                  <input type="checkbox" className="mt-1 accent-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Setup backend CORS configuration middleware</p>
                    <span className="inline-block text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded mt-1.5">Priority: Medium</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 border border-[var(--border-color)] bg-[var(--bg-secondary)] rounded-xl p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Semantic Copilot</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="space-y-3 font-light text-xs leading-relaxed">
                <div className="p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)] max-w-[85%] self-start text-left">
                  <p className="font-semibold text-blue-600 dark:text-blue-400 mb-1">User Query</p>
                  <p className="text-[var(--text-primary)]">What is the production deployment database URL?</p>
                </div>
                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/10 rounded-lg border border-blue-500/20 max-w-[90%] ml-auto text-left">
                  <p className="font-semibold text-purple-600 dark:text-purple-400 mb-1">Agent Response</p>
                  <p className="text-[var(--text-primary)]">Based on `infrastructure_specs.pdf`, the database URL is hosted on Render PG cluster with SSL mode enabled.</p>
                  <div className="mt-2 text-[10px] text-[var(--text-tertiary)] border-t border-[var(--border-color)] pt-1">
                    Source: <span className="font-mono text-blue-500">infrastructure_specs.pdf: L127</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 space-y-4">
              <div className="h-12 w-12 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center mb-6">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-semibold text-[var(--text-primary)]">AI Copilot & RAG Search</h3>
              <p className="text-[var(--text-secondary)] text-lg leading-relaxed">
                Submit questions regarding your documents. The RAG agent fetches matched context passages and compiles the answer using citation sources.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 4. PRICING */}
      <section id="pricing" className="w-full py-20 bg-[var(--bg-secondary)] border-t border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-semibold text-[var(--text-primary)]">Simple, transparent pricing</h2>
            <p className="text-[var(--text-secondary)]">Start for free, upgrade when you need more power.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free */}
            <div className="border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-xl p-8 flex flex-col">
              <h4 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Basic</h4>
              <p className="text-[var(--text-secondary)] mb-6">For individuals and small projects.</p>
              <p className="text-4xl font-semibold text-[var(--text-primary)] mb-8">$0</p>
              <ul className="space-y-3 mb-8 flex-1 text-[var(--text-secondary)]">
                <li className="flex items-center gap-2">✓ Local vector indexing</li>
                <li className="flex items-center gap-2">✓ Task extraction</li>
                <li className="flex items-center gap-2">✓ Standard copilot</li>
              </ul>
              <Link to="/login" className="btn-secondary text-center w-full">
                Get Started
              </Link>
            </div>

            {/* Pro */}
            <div className="border-2 border-blue-500 bg-[var(--bg-primary)] rounded-xl p-8 flex flex-col relative shadow-sm">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                Most Popular
              </div>
              <h4 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Professional</h4>
              <p className="text-[var(--text-secondary)] mb-6">For power users and teams.</p>
              <p className="text-4xl font-semibold text-[var(--text-primary)] mb-8">$29 <span className="text-lg font-normal text-[var(--text-secondary)]">/mo</span></p>
              <ul className="space-y-3 mb-8 flex-1 text-[var(--text-secondary)]">
                <li className="flex items-center gap-2">✓ Unlimited document processing</li>
                <li className="flex items-center gap-2">✓ Live Gmail integration</li>
                <li className="flex items-center gap-2">✓ Advanced LangGraph routing</li>
              </ul>
              <Link to="/login" className="btn-primary text-center w-full">
                Start Free Trial
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* 5. FAQ */}
      <section id="resources" className="w-full py-20">
        <div className="max-w-3xl mx-auto px-6 space-y-10">
          <h2 className="text-3xl font-semibold text-[var(--text-primary)] text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx
              return (
                <div key={idx} className="border border-[var(--border-color)] bg-[var(--bg-secondary)] rounded-lg">
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left font-medium text-[var(--text-primary)]"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`h-5 w-5 text-[var(--text-tertiary)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="p-5 pt-0 text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-color)] mt-4">
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

      {/* 6. FINAL CTA */}
      <section className="w-full py-24 bg-[var(--bg-secondary)] border-y border-[var(--border-color)]">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-semibold text-[var(--text-primary)]">
            Ready to streamline your workflow?
          </h2>
          <p className="text-lg text-[var(--text-secondary)]">
            Join thousands of professionals organizing their knowledge with AgentFlow AI.
          </p>
          <Link to="/login" className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3">
            Get Started Now <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full bg-[var(--bg-primary)] py-12 border-t border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          
          <div className="col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-blue-600 flex items-center justify-center text-white">
                <Layers className="h-3 w-3" />
              </div>
              <span className="text-base font-semibold text-[var(--text-primary)]">
                AgentFlow
              </span>
            </Link>
            <p className="text-sm text-[var(--text-secondary)] max-w-xs leading-relaxed">
              A professional productivity platform coordinating multi-agent workflows and document processing.
            </p>
            
            <div className="pt-4">
              <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Subscribe to our newsletter</p>
              {newsletterSubscribed ? (
                <p className="text-sm text-emerald-600 font-medium">Thanks for subscribing!</p>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex gap-2 max-w-xs">
                  <input 
                    type="email" 
                    required 
                    placeholder="Email address" 
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="glass-input flex-grow text-sm py-2" 
                  />
                  <button type="submit" className="btn-primary px-3 py-2">
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h5 className="font-semibold text-[var(--text-primary)]">Product</h5>
            <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
              <li><a href="#features" className="hover:text-[var(--text-primary)] transition">Features</a></li>
              <li><a href="#pricing" className="hover:text-[var(--text-primary)] transition">Pricing</a></li>
              <li><a href="#" className="hover:text-[var(--text-primary)] transition">Changelog</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h5 className="font-semibold text-[var(--text-primary)]">Resources</h5>
            <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
              <li><a href="#" className="hover:text-[var(--text-primary)] transition">Documentation</a></li>
              <li><a href="#" className="hover:text-[var(--text-primary)] transition">API Reference</a></li>
              <li><a href="#" className="hover:text-[var(--text-primary)] transition">Blog</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h5 className="font-semibold text-[var(--text-primary)]">Company</h5>
            <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
              <li><a href="#" className="hover:text-[var(--text-primary)] transition">About</a></li>
              <li><a href="#" className="hover:text-[var(--text-primary)] transition">Careers</a></li>
              <li><a href="#" className="hover:text-[var(--text-primary)] transition">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[var(--text-secondary)]">
            © 2026 AgentFlow AI Platform Inc. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-[var(--text-secondary)]">
            <a href="#" className="hover:text-[var(--text-primary)] transition">Terms of Service</a>
            <a href="#" className="hover:text-[var(--text-primary)] transition">Privacy Policy</a>
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative w-full max-w-4xl bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                <h3 className="font-semibold text-[var(--text-primary)]">Product Demo</h3>
                <button 
                  onClick={() => setShowDemoVideo(false)}
                  className="p-1 rounded hover:bg-[var(--border-color)] text-[var(--text-secondary)] transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="aspect-video w-full bg-[var(--bg-primary)] flex items-center justify-center">
                <div className="text-center text-[var(--text-secondary)]">
                  <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Demo video placeholder</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
