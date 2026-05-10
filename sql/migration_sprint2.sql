-- === SPRINT 2: RLS + Schema Changes ===
-- Executar no Supabase (via MCP ou psql direto)

-- === BLOCO 1: RLS nas 3 tabelas ===
ALTER TABLE public.leads_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscritos ENABLE ROW LEVEL SECURITY;

-- Apenas usuários autenticados via Supabase Auth têm CRUD completo
CREATE POLICY "auth_crud_leads_v2" ON public.leads_v2
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_crud_turmas" ON public.turmas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_crud_inscritos" ON public.inscritos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- === BLOCO 2: Colunas aprovadas em inscritos ===
ALTER TABLE public.inscritos
  ADD COLUMN IF NOT EXISTS url_comprovante  text,
  ADD COLUMN IF NOT EXISTS cobrar_em_aula   boolean DEFAULT false;
