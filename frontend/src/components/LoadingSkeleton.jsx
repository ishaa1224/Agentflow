import React from 'react'

export function LineSkeleton({ className = "" }) {
  return (
    <div className={`skeleton-box h-4 rounded-md ${className}`} />
  )
}

export function CardSkeleton() {
  return (
    <div className="framer-card rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center">
        <LineSkeleton className="w-1/3 h-5" />
        <LineSkeleton className="w-1/6 h-4" />
      </div>
      <div className="space-y-2">
        <LineSkeleton className="w-full h-3" />
        <LineSkeleton className="w-5/6 h-3" />
        <LineSkeleton className="w-4/5 h-3" />
      </div>
      <div className="pt-3 border-t border-white/[0.04] flex justify-between">
        <LineSkeleton className="w-1/4 h-3.5" />
        <LineSkeleton className="w-1/5 h-3.5" />
      </div>
    </div>
  )
}

export function InboxSkeleton() {
  return (
    <div className="space-y-4 w-full">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="framer-card rounded-xl p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <LineSkeleton className="w-1/4 h-4" />
            <LineSkeleton className="w-1/6 h-3" />
          </div>
          <LineSkeleton className="w-1/2 h-5" />
          <LineSkeleton className="w-full h-3" />
          <LineSkeleton className="w-5/6 h-3" />
        </div>
      ))}
    </div>
  )
}

export function TaskListSkeleton() {
  return (
    <div className="space-y-3 w-full">
      {[1, 2, 3, 5].map((i) => (
        <div key={i} className="framer-card rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-3 w-2/3">
            <div className="skeleton-box h-4 w-4 rounded" />
            <div className="w-full space-y-1.5">
              <LineSkeleton className="w-1/2 h-4.5" />
              <LineSkeleton className="w-3/4 h-3" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="skeleton-box h-5 w-12 rounded-full" />
            <div className="skeleton-box h-5 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
