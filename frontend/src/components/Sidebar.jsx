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
  HelpCircle,
  Layers
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
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'documents', label: 'Knowledge Base', icon: Files },
    { id: 'rag', label: 'Copilot', icon: Sparkles },
    { id: 'inbox', label: 'Inbox', icon: Inbox },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'analytics', label: 'Insights', icon: BarChart3 },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotificationsCount },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <aside className="w-64 border-r border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col justify-between shrink-0 h-screen sticky top-0 text-[var(--text-secondary)] transition-all duration-300">
      
      {/* Top Brand Logo */}
      <div className="p-5 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center text-white">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-[var(--text-primary)] tracking-tight leading-none">AgentFlow</h1>
            <span className="text-[11px] text-[var(--text-tertiary)] font-medium mt-1 block">Workspace</span>
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-grow py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4.5 w-4.5 ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--text-tertiary)]'
                }`} />
                <span>{item.label}</span>
              </div>
              
              {item.badge > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Connection Monitor Panel */}
      <div className="p-4 border-t border-[var(--border-color)] space-y-4 shrink-0 bg-[var(--bg-primary)]/50">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-tertiary)]">Gmail Status</span>
            <span className={`inline-flex items-center gap-1.5 font-medium ${
              gmailConnected ? 'text-emerald-600' : 'text-amber-600'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${gmailConnected ? 'bg-emerald-600' : 'bg-amber-600'}`} />
              {gmailConnected ? 'Connected' : 'Sandbox mode'}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-tertiary)]">LLM Engine</span>
            <span className="text-[var(--text-secondary)] font-medium">
              {llmMode === 'Gemini' ? 'Gemini Pro' : 'Simulator'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-tertiary)]">Documents</span>
            <span className="text-[var(--text-secondary)] font-medium">
              {docCount} indexed
            </span>
          </div>
        </div>

        <div className="pt-4 space-y-2 border-t border-[var(--border-color)]">
          <button
            onClick={onTriggerOnboarding}
            className="w-full flex items-center justify-start gap-2 py-2 px-3 hover:bg-[var(--bg-secondary)] rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition font-medium"
          >
            <HelpCircle className="h-4 w-4" />
            <span>Help & Guide</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-start gap-2 py-2 px-3 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg text-xs text-red-600 dark:text-red-400 font-medium transition"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </div>
      </div>

    </aside>
  )
}
