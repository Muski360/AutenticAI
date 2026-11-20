create table public.analises (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  texto_analisado text not null,
  indicios_ia text,
  limitacao text,
  criada_em timestamptz not null default now()
);

create index analises_usuario_data_idx on public.analises (usuario_id, criada_em desc, id desc);

create table public.afirmacoes (
  analise_id uuid references public.analises(id) on delete cascade,
  ordem integer check (ordem > 0),
  texto text not null,
  classificacao text not null check (classificacao in ('sustentada', 'contradita', 'mista', 'inconclusiva')),
  justificativa text not null,
  primary key (analise_id, ordem)
);

create table public.fontes (
  analise_id uuid references public.analises(id) on delete cascade,
  ordem integer check (ordem > 0),
  titulo text not null,
  url text not null check (url ~ '^https?://'),
  primary key (analise_id, ordem)
);

create table public.afirmacao_fontes (
  analise_id uuid,
  afirmacao_ordem integer,
  fonte_ordem integer,
  primary key (analise_id, afirmacao_ordem, fonte_ordem),
  foreign key (analise_id, afirmacao_ordem) references public.afirmacoes on delete cascade,
  foreign key (analise_id, fonte_ordem) references public.fontes on delete cascade
);

alter table public.analises enable row level security;
alter table public.afirmacoes enable row level security;
alter table public.fontes enable row level security;
alter table public.afirmacao_fontes enable row level security;

revoke all on public.analises, public.afirmacoes, public.fontes, public.afirmacao_fontes from public, anon, authenticated;
grant select, insert, delete on public.analises to authenticated;
grant select, insert on public.afirmacoes, public.fontes, public.afirmacao_fontes to authenticated;

create policy analises_do_usuario on public.analises for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

create policy afirmacoes_do_usuario on public.afirmacoes for all to authenticated
  using (analise_id in (select id from public.analises))
  with check (analise_id in (select id from public.analises));

create policy fontes_do_usuario on public.fontes for all to authenticated
  using (analise_id in (select id from public.analises))
  with check (analise_id in (select id from public.analises));

create policy vinculos_do_usuario on public.afirmacao_fontes for all to authenticated
  using (analise_id in (select id from public.analises))
  with check (analise_id in (select id from public.analises));

create function public.salvar_analise(relatorio jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  nova_analise uuid;
begin
  insert into public.analises (texto_analisado, indicios_ia, limitacao)
  values (relatorio->>'texto_analisado', relatorio->>'indicios_ia', relatorio->>'limitacao')
  returning id into nova_analise;

  insert into public.fontes (analise_id, ordem, titulo, url)
  select nova_analise, n, fonte->>'titulo', fonte->>'url'
  from jsonb_array_elements(relatorio->'fontes') with ordinality as f(fonte, n);

  insert into public.afirmacoes (analise_id, ordem, texto, classificacao, justificativa)
  select nova_analise, n, item->>'texto', item->>'classificacao', item->>'justificativa'
  from jsonb_array_elements(relatorio->'afirmacoes') with ordinality as a(item, n);

  insert into public.afirmacao_fontes (analise_id, afirmacao_ordem, fonte_ordem)
  select nova_analise, n, fonte_ordem::integer
  from jsonb_array_elements(relatorio->'afirmacoes') with ordinality as a(item, n)
  cross join lateral jsonb_array_elements_text(item->'fontes') as fonte_ordem;

  return nova_analise;
end;
$$;

revoke all on function public.salvar_analise(jsonb) from public, anon;
grant execute on function public.salvar_analise(jsonb) to authenticated;
