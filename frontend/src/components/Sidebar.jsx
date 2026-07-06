import React from 'react'
import {
  LayoutDashboard,
  Files,
  Sparkles,
  Inbox,
  CheckSquare,
  BarChart3,
  Calendar as CalendarIcon,
  FileText,
  Bell,
  Settings,
  LogOut,
  HelpCircle
} from 'lucide-react'

export default function Sidebar({
  activeTab,
  setActiveTab,
  gmailConnected,
  llmMode,
  docCount,
  onLogout,
  onTriggerOnboarding,
  unreadNotificationsCount = 0
}) {
  const menuItems = [
    { id: 'overview', label: 'Workspace', icon: LayoutDashboard },
    { id: 'documents', label: 'Knowledge Base', icon: Files },
    { id: 'rag', label: 'Copilot', icon: Sparkles },
    { id: 'inbox', label: 'Inbox', icon: Inbox },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'analytics', label: 'Insights', icon: BarChart3 },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'reports', label: 'Exports', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotificationsCount },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <aside className="w-64 border-r border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col justify-between shrink-0 h-screen sticky top-0 text-[var(--text-secondary)] transition-all duration-300">
      
      {/* Top Brand Logo */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/10">
            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 2h16v6h-8v6h8v6H4l8-8H4V2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-semibold text-[var(--text-primary)] tracking-tight leading-none">AgentFlow AI</h1>
            <span className="text-xs text-[var(--text-tertiary)] uppercase tracking-widest font-bold mt-1.5 block">Productivity Platform</span>
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-grow px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition duration-150 group ${
                isActive
                  ? 'bg-purple-500/5 text-[var(--text-primary)] border-l-2 border-purple-500'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--border-color)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Icon className={`h-5 w-5 transition-colors ${
                  isActive ? 'text-purple-500' : 'text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)]'
                }`} />
                <span>{item.label}</span>
              </div>
              
              {item.badge > 0 && (
                <span className="px-2.5 py-0.5 text-xs font-bold bg-purple-600 text-white rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Connection Monitor Panel */}
      <div className="p-4 border-t border-[var(--border-color)] bg-black/5 space-y-4 shrink-0">
        <div className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-tertiary)] font-medium">Gmail Link</span>
            <span className={`inline-flex items-center gap-1.5 font-semibold ${
              gmailConnected ? 'text-emerald-500' : 'text-amber-500'
            }`}>
              <span className={`h-2 w-2 rounded-full ${gmailConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {gmailConnected ? 'Connected' : 'Sandbox'}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-tertiary)] font-medium">LLM Mode</span>
            <span className="text-purple-500 font-semibold truncate max-w-[90px]" title={llmMode}>
              {llmMode === 'Gemini' ? 'Gemini AI' : 'Simulator'}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-tertiary)] font-medium">Knowledge</span>
            <span className="text-[var(--text-primary)] font-mono font-semibold">
              {docCount} {docCount === 1 ? 'Doc' : 'Docs'}
            </span>
          </div>
        </div>

        {/* Action button: Restart Onboarding */}
        <button
          onClick={onTriggerOnboarding}
          className="w-full flex items-center justify-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition font-medium"
        >
          <HelpCircle className="h-4 w-4" />
          <span>Show Guide Overlay</span>
        </button>

        {/* Sign out */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-3 px-3 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 border border-red-500/10 rounded-xl text-sm font-semibold transition"
        >
          <LogOut className="h-4.5 w-4.5" />
          <span>Exit Workspace</span>
        </button>
      </div>

    </aside>
  )
}
