-- =============================================================
-- Migration 0025: descrição de finalidade dos documentos
-- "Para que serve" cada documento — preenchida automaticamente
-- para os já registados, a partir do prefixo do código (CF-XXX)
-- e, em falta, da categoria. Espelha lib/documentos.js.
-- Só toca em documentos SEM descrição (não sobrescreve texto próprio).
-- =============================================================

-- 1) Documentos com código CF-XXX: finalidade pelo prefixo
update public.documentos d
set descricao = v.finalidade
from (values
  ('CF-MEM', 'Anúncios internos da equipa Conheça Farmácia — comunicação oficial entre membros.'),
  ('CF-PAR', 'Carta dirigida aos Parceiros do Conheça Farmácia.'),
  ('CF-PAT', 'Carta dirigida aos Patrocinadores de eventos do Conheça Farmácia.'),
  ('CF-REG', 'Carta às entidades reguladoras de saúde (OFA-CAPFA, ordens e seus membros).'),
  ('CF-SOL', 'Carta de solicitação da Conheça Farmácia — ex.: pedido de espaço para uma atividade.')
) as v(prefixo, finalidade)
where d.descricao is null
  and upper(d.codigo) ~ ('^' || v.prefixo || '($|[-_ ])');

-- 2) Restantes sem descrição: finalidade pela categoria
update public.documentos d
set descricao = v.finalidade
from (values
  ('Cartas e Ofícios',    'Cartas e ofícios oficiais emitidos pelo Conheça Farmácia.'),
  ('Conteúdos',           'Guias e estratégias para a produção de conteúdo do Conheça Farmácia.'),
  ('Contratos e Acordos', 'Contratos e acordos firmados com parceiros e patrocinadores.'),
  ('Equipa',              'Documentos sobre a estrutura e organização das equipas.'),
  ('Ideias',              'Propostas e protótipos criativos em exploração.'),
  ('Políticas e Termos',  'Regras, políticas e termos que regem a atuação do Conheça Farmácia.')
) as v(categoria, finalidade)
where d.descricao is null
  and d.categoria_id is not null
  and exists (
    select 1 from public.doc_categorias c
    where c.id = d.categoria_id and c.nome = v.categoria
  );
