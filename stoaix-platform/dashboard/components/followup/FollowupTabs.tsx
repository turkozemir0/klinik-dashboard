'use client'

import { useState } from 'react'

interface Tab {
  key: string
  label: string
}

interface Props {
  tabs: Tab[]
  manualPanel:   React.ReactNode
  sequencePanel: React.ReactNode | null
  voicePanel:    React.ReactNode | null
}

export default function FollowupTabs({ tabs, manualPanel, sequencePanel, voicePanel }: Props) {
  const [active, setActive] = useState(tabs[0]?.key ?? 'manual')

  const panels: Record<string, React.ReactNode> = {
    manual:   manualPanel,
    sequence: sequencePanel,
    calls:    voicePanel,
  }

  return (
    <div className="space-y-4">
      {/* Tab bar — sadece birden fazla tab varsa göster */}
      {tabs.length > 1 && (
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                active === tab.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Panel */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        {panels[active]}
      </div>
    </div>
  )
}
