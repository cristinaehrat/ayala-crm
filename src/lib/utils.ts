import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Lead } from '@/lib/types'

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

const CITY_SMALL_WORDS = new Set(['da', 'das', 'de', 'do', 'dos', 'e'])

const CITY_INVALID_PATTERNS = [
  /btn_/i,
  /bom dia/i,
  /boa tarde/i,
  /boa noite/i,
  /^oi$/i,
  /^ol[áa]$/i,
  /mensagem/i,
  /retornaremos/i,
  /treinamento/i,
  /cpf/i,
  /cnpj/i,
  /consultora/i,
  /comprovante/i,
  /pix:/i,
]

export function normalizeCity(value: string | null | undefined): string | null {
  if (!value) return null

  let city = value
    .replace(/\s+/g, ' ')
    .replace(/\s*\/\s*[A-Z]{2}$/u, '')
    .replace(/\s*-\s*[A-Z]{2}$/u, '')
    .replace(/\s+[A-Z]{2}$/u, '')
    .replace(/\s*\(.*?\)\s*$/u, '')
    .replace(/^regi[aã]o\s+/iu, '')
    .trim()

  if (!city) return null

  city = city
    .toLocaleLowerCase('pt-BR')
    .split(' ')
    .filter(Boolean)
    .map((part, index) => {
      if (index > 0 && CITY_SMALL_WORDS.has(part)) return part
      return part.charAt(0).toLocaleUpperCase('pt-BR') + part.slice(1)
    })
    .join(' ')

  return city || null
}

export function isSuspiciousCity(value: string | null | undefined): boolean {
  const raw = value?.trim()
  if (!raw) return false

  if (raw.length > 40) return true
  if (/\n|\r/.test(raw)) return true
  if (/[0-9]/.test(raw)) return true
  if (/[*:]/.test(raw)) return true
  if (raw.split(' ').filter(Boolean).length > 5) return true

  return CITY_INVALID_PATTERNS.some((pattern) => pattern.test(raw))
}

// Etiquetas Chatwoot — cores exatas
export const ETIQUETA_CORES: Record<string, string> = {
  lead_novo:            '#1565C0',
  negociacao:           '#E53935',
  inscrito:             '#2E7D32',
  ex_aluno:             '#0D1F3C',
  hot_lead:             '#C62828',
  aguardando_ismenia:   '#F97316',
  aguardando_pagamento: '#F9A825',
  pgto_confirmado:      '#558B2F',
  lista_espera:         '#E65100',
  visualizou_preco:     '#B45309',
  visita_agendada:      '#FDCB67',
}

export const ETIQUETA_LABELS: Record<string, string> = {
  lead_novo:            'Novo',
  negociacao:           'Negociação',
  inscrito:             'Inscrito',
  ex_aluno:             'Ex-aluno',
  hot_lead:             'Hot Lead',
  aguardando_ismenia:   'Ag. Ismênia',
  aguardando_pagamento: 'Ag. Pagamento',
  pgto_confirmado:      'Pago',
  lista_espera:         'Lista Espera',
  visualizou_preco:     'Visualizou Preço',
  visita_agendada:      'Visita',
}

const ETIQUETA_PRIORITY = [
  'ex_aluno',
  'hot_lead',
  'aguardando_ismenia',
  'aguardando_pagamento',
  'inscrito',
  'lista_espera',
  'visualizou_preco',
  'lead_novo',
]

export const ACTION_SIGNAL_STYLES = {
  hot_lead: {
    label: 'Hot Lead',
    bg: '#C62828',
    text: '#FFFFFF',
  },
  aguardando_ismenia: {
    label: 'Ag. Ismênia',
    bg: '#F97316',
    text: '#FFFFFF',
  },
  follow_up: {
    label: 'Follow-up',
    bg: '#FDE68A',
    text: '#7C2D12',
  },
} as const

const FOLLOW_UP_RESOLVED_STATUSES = new Set([
  'reserva',
  'aguardando_pagamento',
  'inscrito',
  'lista_espera',
  'sem_interesse',
  'perdido',
])

export function parseLeadLabels(value: string | null | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((label) => label.trim())
    .filter(Boolean)
}

export function hasLeadLabel(value: string | null | undefined, label: string): boolean {
  return parseLeadLabels(value).includes(label)
}

export function mergeLeadLabels(value: string | null | undefined, ...labels: string[]): string | null {
  const merged = new Set(parseLeadLabels(value))
  for (const label of labels) {
    if (label?.trim()) merged.add(label.trim())
  }
  return merged.size > 0 ? [...merged].join(',') : null
}

export function removeLeadLabels(value: string | null | undefined, ...labels: string[]): string | null {
  const blocked = new Set(labels.map((label) => label.trim()).filter(Boolean))
  const filtered = parseLeadLabels(value).filter((label) => !blocked.has(label))
  return filtered.length > 0 ? filtered.join(',') : null
}

export function getPrimaryLeadLabel(value: string | null | undefined): string | null {
  const labels = parseLeadLabels(value)
  if (labels.length === 0) return null
  for (const priority of ETIQUETA_PRIORITY) {
    if (labels.includes(priority)) return priority
  }
  return labels[0] ?? null
}

export function needsLeadFollowUp(
  lead: Pick<Lead, 'etiqueta_chatwoot' | 'status' | 'follow_up_enviado'>,
): boolean {
  const labels = parseLeadLabels(lead.etiqueta_chatwoot)
  if (!labels.includes('visualizou_preco')) return false
  if (labels.includes('hot_lead')) return false
  if (FOLLOW_UP_RESOLVED_STATUSES.has(lead.status ?? '')) return false
  return !lead.follow_up_enviado
}

export function getLeadActionSignals(
  lead: Pick<Lead, 'etiqueta_chatwoot' | 'status' | 'follow_up_enviado'>,
): Array<{ id: keyof typeof ACTION_SIGNAL_STYLES; label: string; bg: string; text: string }> {
  const labels = parseLeadLabels(lead.etiqueta_chatwoot)
  const signals: Array<{ id: keyof typeof ACTION_SIGNAL_STYLES; label: string; bg: string; text: string }> = []

  if (labels.includes('hot_lead')) {
    signals.push({ id: 'hot_lead', ...ACTION_SIGNAL_STYLES.hot_lead })
  }
  if (labels.includes('aguardando_ismenia')) {
    signals.push({ id: 'aguardando_ismenia', ...ACTION_SIGNAL_STYLES.aguardando_ismenia })
  }
  if (needsLeadFollowUp(lead)) {
    signals.push({ id: 'follow_up', ...ACTION_SIGNAL_STYLES.follow_up })
  }

  return signals
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

export const UF_OPTIONS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO',
]

export const STATUS_ALL_OPTIONS: { id: string; label: string }[] = [
  { id: 'lead_novo',            label: 'Novo Lead' },
  { id: 'qualificado',          label: 'Qualificado' },
  { id: 'aguardando_ismenia',   label: 'Ag. Ismênia' },
  { id: 'visualizou_preco',     label: 'Visualizou Preço' },
  { id: 'reserva',              label: 'Reserva' },
  { id: 'aguardando_pagamento', label: 'Ag. Pagamento' },
  { id: 'inscrito',             label: 'Inscrito' },
  { id: 'lista_espera',         label: 'Lista Espera' },
  { id: 'sem_interesse',        label: 'Sem Interesse' },
  { id: 'perdido',              label: 'Perdido' },
]

export const CANAL_ORIGEM_OPTIONS: { value: string; label: string }[] = [
  { value: 'whatsapp',        label: 'WhatsApp' },
  { value: 'instagram',       label: 'Instagram' },
  { value: 'site',            label: 'Site' },
  { value: 'indicacao',       label: 'Indicação' },
  { value: 'visita',          label: 'Visita Presencial' },
  { value: 'outro',           label: 'Outro' },
]

export const PORTE_OFICINA_OPTIONS: { value: string; label: string }[] = [
  { value: 'pequena', label: 'Pequena (1–3)' },
  { value: 'media',   label: 'Média (4–10)' },
  { value: 'grande',  label: 'Grande (10+)' },
]

export const PERFIL_OPTIONS: { value: string; label: string }[] = [
  { value: 'individual', label: 'Individual' },
  { value: 'grupo_b2b',  label: 'Grupo B2B' },
]

export const CONSULTORES = ['Ismênia', 'Paola', 'Cristina', 'Bena'] as const

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
