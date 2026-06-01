import { useMutation } from '@tanstack/react-query'

const WEBHOOK_URL = 'https://n8n.ayalaoficial.com.br/webhook/roteiro-visitas'

export interface LeadInput {
  nome: string
  endereco: string
}

export interface RoteirizarInput {
  fonte: 'banco' | 'places' | 'manual'
  start_point: string
  regiao: string
  cidade?: string
  uf?: string
  marca?: string
  potencial_min?: string
  filtro_visita?: string
  leads?: LeadInput[]
  dias?: number
  return_point?: string
}

export interface Parada {
  seq: number
  nome: string
  endereco: string
  marca: string
  potencial: string
  telefone_oficina?: string
  whatsapp_responsavel?: string
  nome_responsavel?: string
}

export interface Rota {
  rota: number
  dia?: number
  de: number
  ate: number
  total_paradas: number
  paradas: Parada[]
  url: string
}

export interface DiaDado {
  dia: number
  total_paradas: number
  rotas: Rota[]
}

export interface RoteirizarResult {
  status: string
  regiao: string
  partida: string
  retorno: string
  total_leads: number
  total_rotas: number
  total_dias: number
  distancia_km: number
  tempo_estimado: string
  dias?: DiaDado[]
  rotas: Rota[]
  mensagem_whatsapp: string
}

export function useGerarRoteiro() {
  return useMutation({
    mutationFn: async (input: RoteirizarInput): Promise<RoteirizarResult> => {
      const resp = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!resp.ok) throw new Error(`Erro no servidor: ${resp.status}`)
      const data = await resp.json()
      if (data.status !== 'OK') throw new Error(data.error || data.message || 'Erro ao gerar roteiro')
      return data as RoteirizarResult
    },
  })
}

export function parseLeadsFromText(text: string): LeadInput[] {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map((line, i) => {
      const sepMatch = line.match(/^(.+?)(?:\s[—|]\s)(.+)$/)
      if (sepMatch) {
        return { nome: sepMatch[1].trim(), endereco: sepMatch[2].trim() }
      }
      return { nome: `Parada ${i + 1}`, endereco: line }
    })
}
