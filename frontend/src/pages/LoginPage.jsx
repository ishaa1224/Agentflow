import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Mail, Lock, ArrowRight, ShieldCheck, Cpu, Sun, Moon, AlertTriangle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { signIn, signUp } = useAuth()

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

  const handleAuth = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password)
        if (error) throw error
        navigate('/dashboard')
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col lg:flex-row font-sans selection:bg-purple-500/20 selection:text-white theme-transition w-full">

      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 framer-grid pointer-events-none z-0"></div>
      <div className="absolute inset-0 framer-grid-radial-mask pointer-events-none z-0"></div>

      {/* LEFT PANEL: Split-Screen Hero Canvas */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-12 lg:p-16 relative z-10 border-b lg:border-b-0 lg:border-r border-[var(--border-color)] bg-[var(--bg-secondary)]/30 backdrop-blur-sm transition-all duration-300">
        
        {/* Top brand signature with theme toggle */}
        <div className="flex items-center justify-between w-full">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-white shadow-md">
              <svg className="h-5.5 w-5.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 2h16v6h-8v6h8v6H4l8-8H4V2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-[var(--text-primary)] tracking-tight leading-none">AgentFlow AI</h1>
              <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest font-bold block mt-1">Workspace Pipeline</span>
            </div>
          </Link>

          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg border border-[var(--border-color)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5 text-indigo-500" />}
          </button>
        </div>

        {/* Center premium showcase layout */}
        <div className="my-12 space-y-8 flex flex-col justify-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/15 text-purple-600 dark:text-purple-400 rounded-full text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" /> Autonomous Multi-Agent Workspace
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-[var(--text-primary)] tracking-tight leading-[1.3] w-full max-w-[600px] break-words">
              Design your productivity <br />
              <span className="bg-gradient-to-r from-purple-500 via-indigo-400 to-blue-500 bg-clip-text text-transparent font-medium">
                in parallel flows.
              </span>
            </h2>

            <p className="text-sm text-[var(--text-secondary)] font-light leading-[1.5] max-w-[500px]">
              Ingest technical PDF datasets into persistent vector stores, query documents via context-aware RAG search, automate your email threads, and monitor upcoming task milestones on an AI-powered pipeline.
            </p>
          </div>

          {/* Micro-Grid representing agent architecture */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-[500px]">
            <div className="framer-card rounded-2xl p-5 bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-2.5">
              <Cpu className="h-5 w-5 text-purple-500" />
              <h4 className="text-xs font-bold text-[var(--text-primary)]">LangGraph Routing</h4>
              <p className="text-xs text-[var(--text-secondary)] font-light leading-[1.4]">6 expert agents cooperating dynamically via state graphs.</p>
            </div>
            <div className="framer-card rounded-2xl p-5 bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-2.5">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <h4 className="text-xs font-bold text-[var(--text-primary)]">ChromaDB RAG</h4>
              <p className="text-xs text-[var(--text-secondary)] font-light leading-[1.4]">Persistent vectors indexing matching text documents.</p>
            </div>
          </div>
        </div>

        {/* Footer legal block */}
        <div className="text-xs text-[var(--text-tertiary)] font-light">
          © 2026 AgentFlow AI Platform Inc. All rights reserved.
        </div>
      </div>

      {/* RIGHT PANEL: Login form view */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-12 lg:p-16 relative z-10 bg-[var(--bg-primary)] theme-transition">
        <div className="w-full max-w-[500px] space-y-8">
          
          {/* Headline titles */}
          <div className="space-y-2.5 text-center lg:text-left">
            <h3 className="text-2xl sm:text-3xl font-light text-[var(--text-primary)] tracking-tight">
              {isSignUp ? 'Create Workspace' : 'Access Workspace'}
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light leading-[1.4]">
              {isSignUp ? 'Enter your details below to create a new agent pipeline.' : 'Enter email details below to unlock your multi-agent dashboard pipeline.'}
            </p>
          </div>

          {/* Login container Card with glassmorphism */}
          <div className="framer-card rounded-3xl p-8 bg-[var(--bg-secondary)] relative overflow-hidden space-y-6">
            <form onSubmit={handleAuth} className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
                  Work Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-[var(--text-tertiary)]">
                    <Mail className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full glass-input pl-11 py-3 text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
                    Security Password
                  </label>
                  <a href="#" className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 hover:opacity-85">
                    Forgot Key?
                  </a>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-[var(--text-tertiary)]">
                    <Lock className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full glass-input pl-11 py-3 text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 shadow-md hover:opacity-90 transition disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Log In to Workspace')} <ArrowRight className="h-4 w-4" />
              </button>
              
              <div className="text-center text-xs mt-4">
                <span className="text-[var(--text-secondary)]">
                  {isSignUp ? "Already have an account? " : "Don't have an account? "}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp)
                    setError('')
                  }}
                  className="font-semibold text-purple-600 dark:text-purple-400 hover:opacity-85"
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>

    </div>
  )
}
