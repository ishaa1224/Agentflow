import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, Layers, Sun, Moon, AlertTriangle } from 'lucide-react'
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
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col lg:flex-row font-sans w-full">

      {/* LEFT PANEL: Brand / Visual */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 lg:p-16 border-r border-[var(--border-color)] bg-[var(--bg-secondary)]">
        
        {/* Top brand */}
        <div className="flex items-center justify-between w-full">
          <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center text-white">
              <Layers className="h-4 w-4" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">AgentFlow</h1>
          </Link>

          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-md border border-[var(--border-color)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] transition"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5 text-slate-500" />}
          </button>
        </div>

        {/* Center copy */}
        <div className="my-auto space-y-6 max-w-md">
          <h2 className="text-4xl font-semibold text-[var(--text-primary)] leading-tight">
            Manage your knowledge work intelligently.
          </h2>
          <p className="text-[var(--text-secondary)] text-lg leading-relaxed">
            Upload documents, automate your task extraction, and coordinate workflows in one unified workspace.
          </p>
        </div>

        {/* Footer */}
        <div className="text-sm text-[var(--text-tertiary)]">
          © {new Date().getFullYear()} AgentFlow AI Platform Inc.
        </div>
      </div>

      {/* RIGHT PANEL: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16 relative bg-[var(--bg-primary)]">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between lg:hidden">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-blue-600 flex items-center justify-center text-white">
              <Layers className="h-3 w-3" />
            </div>
            <h1 className="text-base font-semibold tracking-tight">AgentFlow</h1>
          </Link>
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-[var(--text-secondary)]"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-slate-500" />}
          </button>
        </div>

        <div className="w-full max-w-[400px] space-y-8 mt-12 lg:mt-0">
          
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold text-[var(--text-primary)]">
              {isSignUp ? 'Create an account' : 'Welcome back'}
            </h3>
            <p className="text-[var(--text-secondary)]">
              {isSignUp ? 'Enter your details to get started.' : 'Log in to your workspace.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[var(--text-primary)]">
                Email address
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-[var(--text-tertiary)]">
                  <Mail className="h-4.5 w-4.5" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full glass-input pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-[var(--text-primary)]">
                  Password
                </label>
                {!isSignUp && (
                  <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    Forgot password?
                  </a>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-[var(--text-tertiary)]">
                  <Lock className="h-4.5 w-4.5" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full glass-input pl-10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary mt-2 flex items-center justify-center gap-2"
            >
              {isLoading ? 'Processing...' : (isSignUp ? 'Create account' : 'Sign in')}
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </button>
            
            <div className="text-center text-sm pt-4">
              <span className="text-[var(--text-secondary)]">
                {isSignUp ? "Already have an account? " : "Don't have an account? "}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError('')
                }}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </div>
          </form>

        </div>
      </div>

    </div>
  )
}
