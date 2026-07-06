import React, { useState } from 'react'
import { Sparkles, Terminal, Shield, CheckCircle2 } from 'lucide-react'

export default function Onboarding({ onClose }) {
  const [step, setStep] = useState(1)

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1)
    } else {
      localStorage.setItem('agentflow_onboarded', 'true')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in font-sans">
      <div className="absolute inset-0 framer-grid pointer-events-none opacity-40"></div>
      <div className="absolute inset-0 framer-grid-radial-mask pointer-events-none"></div>

      <div className="w-full max-w-lg framer-card rounded-3xl p-8 relative overflow-hidden flex flex-col items-center text-center animate-slide-up">
        {/* Glow accent */}
        <div className="absolute -top-24 h-48 w-48 glow-purple pointer-events-none"></div>

        {/* Step dots */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-6 bg-purple-500' : 'w-2.5 bg-white/10'
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="h-16 w-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto mb-4 shadow-md">
              <Sparkles className="h-7 w-7 animate-pulse" />
            </div>
            <h2 className="text-2xl font-light text-white tracking-tight sm:text-3xl">
              Welcome to AgentFlow AI
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed font-light">
              Your next-generation autonomous productivity platform. Harness specialized AI agents to automate your emails, extract task lists, perform semantic document research, and compile weekly performance reports.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="h-16 w-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto mb-4 shadow-md">
              <Terminal className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-light text-white tracking-tight sm:text-3xl">
              Multi-Agent Engine
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed font-light">
              Powered by LangGraph, AgentFlow orchestrates six cooperative expert agents. Chat with them directly in the chat panel to fetch Gmail inbox feeds, extract structured database task schedules, search the web, and build PDFs.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-4 shadow-md">
              <Shield className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-light text-white tracking-tight sm:text-3xl">
              Secure Sandbox Mode
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed font-light">
              No API credentials configured? No worries. AgentFlow operates in a fully operational local simulator sandbox by default, using pre-populated email logs and local models to let you test everything immediately.
            </p>
          </div>
        )}

        <button
          onClick={handleNext}
          className="mt-8 w-full btn-primary py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-all font-semibold text-sm active:scale-[0.98] shadow-lg"
        >
          {step === 3 ? (
            <>
              Enter Workspace <CheckCircle2 className="h-4.5 w-4.5" />
            </>
          ) : (
            'Continue'
          )}
        </button>

        {step < 3 && (
          <button
            onClick={() => {
              localStorage.setItem('agentflow_onboarded', 'true')
              onClose()
            }}
            className="mt-4 text-xs text-slate-500 hover:text-slate-300 font-medium transition"
          >
            Skip Intro
          </button>
        )}
      </div>
    </div>
  )
}
