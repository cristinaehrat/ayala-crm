import { useState } from 'react'

const INBOXES = [
  {
    id: 'inbound',
    label: '0162 — Inbound Meta',
    sublabel: 'Leads de anúncios',
    url: 'https://chat.ayalaoficial.com.br/app/accounts/1/inbox/17',
  },
  {
    id: 'paola',
    label: '6207 — Paola Ativo',
    sublabel: 'Outbound / follow-up',
    url: 'https://chat.ayalaoficial.com.br/app/accounts/1/inbox/19',
  },
]

export default function AtendimentoPage() {
  const [active, setActive] = useState('inbound')

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Tab bar */}
      <div className="flex shrink-0 bg-footer border-b border-white/10">
        {INBOXES.map((inbox) => {
          const isActive = active === inbox.id
          return (
            <button
              key={inbox.id}
              onClick={() => setActive(inbox.id)}
              className={`flex flex-col items-start px-5 py-2.5 text-left transition-colors border-b-2 ${
                isActive
                  ? 'border-orange text-white'
                  : 'border-transparent text-muted hover:text-white hover:border-white/30'
              }`}
            >
              <span className="text-sm font-semibold">{inbox.label}</span>
              <span className="text-xs opacity-70">{inbox.sublabel}</span>
            </button>
          )
        })}
      </div>

      {/* Iframes — ambos montados, só um visível (sem reload ao trocar aba) */}
      <div className="flex-1 relative overflow-hidden">
        {INBOXES.map((inbox) => (
          <iframe
            key={inbox.id}
            src={inbox.url}
            title={inbox.label}
            allow="clipboard-read; clipboard-write; microphone"
            className={`absolute inset-0 w-full h-full border-0 transition-opacity duration-150 ${
              active === inbox.id ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
