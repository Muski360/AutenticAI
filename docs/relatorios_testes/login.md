# Testes de login

Os testes foram executados em 26/11/2026 para o requisito RF01. [Requisitos do AutenticAI](../PLANEJAMENTO_E_REQUISITOS.md#requisitos-funcionais)

## Número do teste

1

## Descrição

Entrar com Google na web e no popup pelo Playwright, com OAuth simulado.

## Resultado esperado

Iniciar a autorização com PKCE, trocar o código por uma sessão e abrir a área de análise.

## Resultado real

Os dois clientes iniciaram o fluxo Google com PKCE, trocaram o código e exibiram a área autenticada.

## Passou? S/N

S

---

## Número do teste

2

## Descrição

Entrar com e-mail e senha na web com Supabase local. Repetir o fluxo no Flutter e no popup com respostas simuladas.

## Resultado esperado

Recusar senha incorreta, aceitar senha válida e voltar à tela de acesso ao sair.

## Resultado real

A tentativa inválida exibiu a mensagem de erro. A senha correta iniciou a sessão e o botão **Sair** retornou à tela de acesso.

## Passou? S/N

S

---

## Número do teste

3

## Descrição

Criar e confirmar uma conta na web e pelo SDK com Supabase local e Mailpit. Exercitar a confirmação no Flutter e no popup com respostas simuladas.

## Resultado esperado

Entregar o código por e-mail, bloquear o login antes da confirmação, recusar código inválido e aceitar o código correto.

## Resultado real

O Mailpit recebeu o e-mail com o código do modelo do AutenticAI. O Supabase local bloqueou o login antes da confirmação. O código inválido foi recusado e o válido iniciou a sessão.

## Passou? S/N

S

---

## Número do teste

4

## Descrição

Reabrir o popup após iniciar um cadastro. O Playwright simulou as APIs do Chrome e o Supabase.

## Resultado esperado

Restaurar o formulário de confirmação com o endereço pendente e remover esse endereço após confirmar.

## Resultado real

O popup restaurou o endereço ao reabrir e removeu o dado temporário após a confirmação.

## Passou? S/N

S

---

## Número do teste

5

## Descrição

Consultar e excluir análises com duas contas de teste no Worker e PostgreSQL locais. Verificar também a rejeição de sessões inválidas.

## Resultado esperado

Exibir apenas o histórico da própria conta, bloquear consulta e exclusão de registros de outra conta e rejeitar sessões ausentes, inválidas ou anônimas.

## Resultado real

Cada conta listou apenas seu registro. A consulta e a exclusão de registros da outra conta retornaram `404`. A exclusão do próprio registro retornou `204`. Sessões ausentes ou inválidas retornaram `401`. O teste automatizado do Worker recusou uma sessão anônima com `403`.

## Passou? S/N

S

---

## Número do teste

6

## Descrição

Executar `npm test`, `npm run check` e `npm run smoke` no backend.

## Resultado esperado

Passar os testes da API, gerar o pacote do Worker e verificar a comunicação com o Supabase local.

## Resultado real

Os oito testes passaram. O pacote do Worker foi gerado em modo de simulação e o smoke passou com o Supabase local. [Testes do Worker](../../system/backend/api/worker.test.js)

## Passou? S/N

S

---

## Número do teste

7

## Descrição

Executar o lint da web e gerar os builds da web e da extensão. Verificar o formulário em diferentes larguras e usar o teclado no Playwright.

## Resultado esperado

Gerar os pacotes e manter o formulário acessível, com foco no campo de confirmação e envio por teclado.

## Resultado real

O lint e os builds passaram. O Playwright conferiu a web em 320, 390, 768 e 1440 px e o popup em 320 px. O campo de código recebeu foco, o formulário aceitou envio pelo teclado e a execução registrou zero exceções JavaScript.

## Passou? S/N

S

---

## Número do teste

8

## Descrição

Executar `flutter test --no-pub` na pasta do app Android.

## Resultado esperado

Passar a suíte do Flutter, incluindo login por senha, saída e confirmação de cadastro.

## Resultado real

Os seis testes passaram. O caso de login verificou senha inválida, acesso, saída e confirmação de cadastro com respostas simuladas do Supabase. [Teste de login do Flutter](../../system/mobile/test/login_test.dart)

## Passou? S/N

S

## Ajustes e limites

No ambiente hospedado, os critérios de aceitação são concluir o retorno do Google pela URL cadastrada e confirmar um cadastro com o e-mail entregue pelo SMTP configurado. [Configuração de login por e-mail](../../system/backend/README.md#login-por-e-mail)
