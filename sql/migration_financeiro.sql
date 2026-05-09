  -- === BLOCO A: campos financeiros em inscritos (obrigatório) ===
  ALTER TABLE public.inscritos
    ADD COLUMN IF NOT EXISTS pagante_nome_nf          text,
    ADD COLUMN IF NOT EXISTS pagante_documento         text,
    ADD COLUMN IF NOT EXISTS pagante_email_nf          text,
    ADD COLUMN IF NOT EXISTS fluxo_pagamento           text
      CHECK (fluxo_pagamento IN
        ('link_whatsapp','boleto_parceiro','maquina_presencial','pix_direto')),
    ADD COLUMN IF NOT EXISTS custodia_entrada          text
      CHECK (custodia_entrada IN ('Ayala','Parceiro')),
    ADD COLUMN IF NOT EXISTS comprovante_validado      boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS observacoes_negociacao    text;

  -- === BLOCO B: despesas na turma (obrigatório) ===
  ALTER TABLE public.turmas
    ADD COLUMN IF NOT EXISTS despesas_operacionais_total numeric(10,2) DEFAULT 0;

  -- === BLOCO C: campos financeiros extras — verificar antes de executar ===
  -- (podem já existir; comentados para decisão manual)
  -- ALTER TABLE public.inscritos
  --   ADD COLUMN IF NOT EXISTS forma_pagamento   text,
  --   ADD COLUMN IF NOT EXISTS qtd_parcelas      integer DEFAULT 1,
  --   ADD COLUMN IF NOT EXISTS valor_parcela     numeric(10,2);
