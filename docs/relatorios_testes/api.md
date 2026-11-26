# Testes da API

## Número do teste
1

## Descrição
Executar `npm test` no backend.

## Resultado esperado
Passar os testes de autenticação, origem, análise e histórico.

## Resultado real
Os três testes passaram. Groq, Tavily e Supabase foram simulados nesses testes.

## Passou? S/N
S

---

## Número do teste
2

## Descrição
Executar `npm run smoke` com a API local e o Supabase configurado.

## Resultado esperado
Verificar saúde, CORS, rejeição de sessão ausente ou inválida e comunicação com Supabase.

## Resultado real
O Worker e o Supabase passaram na verificação básica. O teste informou login Google habilitado.

## Passou? S/N
S

---

## Número do teste
3

## Descrição
Executar `npm run check` para conferir o empacotamento do Worker.

## Resultado esperado
Gerar o pacote em modo de simulação.

## Resultado real
O comando `wrangler deploy --dry-run` terminou com sucesso.

## Passou? S/N
S
