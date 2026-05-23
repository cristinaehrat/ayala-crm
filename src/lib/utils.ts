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
  volvo:  { bg: '#1A3A6B', label: 'Volvo' },
  daf:    { bg: '#166534', label: 'DAF' },
  scania: { bg: '#D97706', label: 'Scania' },
}

export const INTERESSE_TAGS: { value: string; label: string; bg: string }[] = [
  { value: 'int_volvo',  label: 'Volvo',  bg: '#1A3A6B' },
  { value: 'int_scania', label: 'Scania', bg: '#D97706' },
  { value: 'int_daf',    label: 'DAF',    bg: '#166534' },
]

export const POTENCIAL_BADGES: Record<string, { label: string; bg: string }> = {
  quente: { label: '🔥 Quente', bg: '#DC2626' },
  morno:  { label: 'Morno',    bg: '#F97316' },
  frio:   { label: '❄ Frio',   bg: '#64748B' },
}

export function formatDate(d: string | null | undefined): string {
  if (!d) return '—'
  try {
    return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return d
  }
}

export function findRotaMes(
  cidade: string | null | undefined,
  marca: string | null | undefined,
  malha: import('@/lib/types').MalhaEstrategica[],
): string | null {
  if (!cidade || !marca) return null
  const cidadeLower = cidade.toLowerCase().trim()
  const entry = malha.find((m) => {
    if (m.marca !== marca) return false
    const base = m.cidade_base.toLowerCase().split('/')[0].trim()
    if (base.includes(cidadeLower) || cidadeLower.includes(base)) return true
    if (m.cidades_visitacao) {
      return m.cidades_visitacao
        .split(',')
        .map((c) => c.trim().toLowerCase().split('/')[0].trim())
        .some((c) => c.includes(cidadeLower) || cidadeLower.includes(c))
    }
    return false
  })
  return entry ? entry.mes : null
}
