import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function relativeTime(date: string | null | undefined): string {
  if (!date) return '—'
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR })
  } catch {
    return '—'
  }
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 13) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`
  }
  if (digits.length === 12) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`
  }
  return phone
}

export function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('55')) return digits
  if (digits.length === 11) return `55${digits}`
  if (digits.length === 10) return `55${digits}`
  return digits
}

// Etiquetas Chatwoot — cores exatas
export const ETIQUETA_CORES: Record<string, string> = {
  lead_novo:            '#1565C0',
  negociacao:           '#E53935',
  inscrito:             '#2E7D32',
  hot_lead:             '#C62828',
  aguardando_pagamento: '#F9A825',
  pgto_confirmado:      '#558B2F',
  lista_espera:         '#E65100',
  visita_agendada:      '#FDCB67',
}

export const ETIQUETA_LABELS: Record<string, string> = {
  lead_novo:            'Novo',
  negociacao:           'Negociação',
  inscrito:             'Inscrito',
  hot_lead:             'Hot Lead',
  aguardando_pagamento: 'Ag. Pagamento',
  pgto_confirmado:      'Pago',
  lista_espera:         'Lista Espera',
  visita_agendada:      'Visita',
}

export const MARCA_BADGES: Record<string, { bg: string; label: string }> = {
  Volvo:  { bg: '#1A3A6B', label: 'Volvo' },
  DAF:    { bg: '#166534', label: 'DAF' },
  Scania: { bg: '#D97706', label: 'Scania' },
}
