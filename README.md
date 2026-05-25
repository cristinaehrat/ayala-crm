# Ayala CRM

PWA comercial da Operação Ayala.

- Produção: `https://crm.ayalaoficial.com.br`
- Stack: `React + Vite + TypeScript + Supabase + React Query`
- Deploy: `Vercel`

## Comandos

```bash
npm run dev
npm run build
npm run lint
```

## Deploy

O deploy oficial deste projeto é feito por `push` no branch `main`.

```bash
git push origin main
```

A Vercel publica automaticamente a revisão enviada.

## Estado Atual

O CRM já incorpora:

- etapas 1, 2 e 3 da refatoração comercial
- saneamento visual da lista de leads
- ajustes visuais da página `/prospectos`
- promoção de prospectos de visita para `leads_v2`
- soma de etiquetas comerciais sem sobrescrever histórico

## Regra de `ex_aluno`

Ao encerrar uma turma, o CRM adiciona a etiqueta `ex_aluno` ao lead sem remover `inscrito` nem outras etiquetas já existentes.

Comportamento atual:

- `ex_aluno` é salvo em `leads_v2.etiqueta_chatwoot`
- a etiqueta aparece visualmente na lista de leads
- a etiqueta aparece no detalhe do lead
- o `status` comercial é preservado

Implementação principal:

- `src/hooks/useTurmas.ts`
- `src/lib/utils.ts`
- `src/components/leads/LeadCard.tsx`
- `src/components/leads/LeadRow.tsx`
- `src/components/leads/LeadDetail.tsx`

## Observação sobre lint

O projeto pode gerar erros de lint já existentes em módulos fora do escopo da refatoração atual. O `build` é a validação mínima obrigatória antes de publicar.
