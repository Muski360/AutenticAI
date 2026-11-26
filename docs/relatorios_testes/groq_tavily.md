# Testes de IA com Groq e Tavily

## Número do teste
1

## Descrição
Pesquisar na Tavily fontes sobre Brasília ser a capital do Brasil.

## Resultado esperado
Receber trechos de evidência com links para as páginas de origem.

## Resultado real
A Tavily retornou HTTP 200 e cinco fontes, incluindo uma [página oficial do governo federal](https://www.gov.br/g20/pt-br/sobre-o-g20/cidades-sede/brasilia-df).

## Passou? S/N
S

---

---

## Número do teste
2

## Descrição
Analisar “Brasília é a capital do Brasil.” com a Groq (`openai/gpt-oss-120b`) usando as evidências da Tavily.

## Resultado esperado
Classificar a afirmação como sustentada e citar fontes da pesquisa.

## Resultado real
A Groq retornou HTTP 200 e classificou a afirmação como sustentada. Conferimos que os links do relatório vieram da resposta da Tavily.

## Passou? S/N
S

---

---

## Número do teste
3

## Descrição
Analisar “The Moon produces its own visible light.”

## Resultado esperado
Manter a afirmação em inglês e classificá-la como contradita, com evidências.

## Resultado real
Em uma rodada, a Groq copiou uma frase da evidência para o campo da afirmação. Após o ajuste no prompt, preservou o texto original, classificou a afirmação como contradita e citou a [NASA](https://science.nasa.gov/moon/moonlight).

## Passou? S/N
S

---

---

## Número do teste
4

## Descrição
Analisar um PNG com a frase “Brasilia is the capital of Brazil.”

## Resultado esperado
Transcrever a frase sem corrigir a grafia e classificá-la com fontes.

## Resultado real
Uma tentativa anterior corrigiu a grafia. Após o ajuste nos prompts, o modelo visual da Groq transcreveu a frase como estava na imagem. A análise a classificou como sustentada e citou fontes da Tavily.

## Passou? S/N
S

---

---

## Número do teste
5

## Descrição
Enviar “Brasília é a capital do Brasil.” pela web local com uma sessão Google.

## Resultado esperado
Mostrar a classificação sustentada com fontes, salvar a análise no Supabase e reabrir o relatório pelo histórico.

## Resultado real
O Worker retornou HTTP 201 após salvar o relatório no Supabase. A interface mostrou a classificação sustentada, a justificativa e cinco fontes. A análise apareceu no histórico, e a lista e a consulta do relatório salvo retornaram HTTP 200.

## Passou? S/N
S

---

## Número do teste
6

## Descrição
Enviar texto vazio e uma requisição sem sessão autenticada.

## Resultado esperado
Recusar os dois envios e não chamar os provedores de IA.

## Resultado real
O teste automatizado com serviços simulados recebeu HTTP 400 para texto vazio e HTTP 401 sem sessão. O teste também confirmou que uma origem não autorizada recebe HTTP 403.

## Passou? S/N
S, com serviços simulados.

---

---

## Número do teste
7

## Descrição
Testar afirmações sem fontes válidas e tentar inserir no relatório uma frase copiada das evidências.

## Resultado esperado
Classificar como inconclusiva a afirmação sem fonte válida e excluir frases copiadas das evidências.

## Resultado real
O teste automatizado simulou uma resposta do modelo sem referência válida e outra frase copiada da fonte. A API classificou a primeira como inconclusiva e removeu a segunda.

## Passou? S/N
S, com serviços simulados.

---

---

## Número do teste
8

## Descrição
Listar, abrir e excluir uma análise pelo histórico.

## Resultado esperado
Permitir que a conta consulte seu relatório salvo e exclua o próprio registro.

## Resultado real
Na web local com sessão Google, a lista do histórico e a consulta do relatório salvo retornaram HTTP 200. O teste automatizado verificou a rota de exclusão com respostas simuladas. A exclusão de um registro real no Supabase ainda está pendente.

## Passou? S/N
N, parcialmente. Listar e abrir passaram na sessão real; excluir passou com serviço simulado. Falta excluir um registro real.

---

---

## Número do teste
9

## Descrição
Conferir as rotas de saúde, a configuração CORS e a autenticação antes da análise.

## Resultado esperado
Responder à verificação de saúde, aceitar a origem local configurada e rejeitar requisições externas ou sem sessão.

## Resultado real
O teste smoke confirmou HTTP 200 em `/health`, HTTP 204 no preflight local e HTTP 401 para sessões ausente ou inválida. O Supabase respondeu e informou que o login Google está habilitado.

## Passou? S/N
S

---

---

## Número do teste
10

## Descrição
Provocar indisponibilidade ou limite de requisições na Groq e na Tavily.

## Resultado esperado
Exibir uma mensagem de erro útil e permitir uma nova tentativa sem salvar um relatório incompleto.

## Resultado real
O tratamento está coberto por código, mas os erros HTTP 429 e as falhas temporárias não foram provocados em chamadas reais nesta sessão.

## Passou? S/N
N, pendente de teste real de falha.

---

---

## Número do teste
11

## Descrição
Validar a exclusão de uma análise real e o isolamento do histórico entre duas contas.

## Resultado esperado
Excluir apenas o registro escolhido e impedir que uma conta leia ou apague o histórico de outra.

## Resultado real
O código e os testes automatizados verificam as rotas autenticadas. A exclusão de um relatório real e a comparação entre duas contas ainda não foram executadas.

## Passou? S/N
N, pendente de teste no Supabase.

---

---

## Número do teste
12

## Descrição
Analisar texto muito longo, texto em outro idioma e uma imagem sem texto legível.

## Resultado esperado
Respeitar os limites de entrada, analisar o idioma original ou informar com clareza quando não conseguir ler a imagem.

## Resultado real
Um texto em inglês e um print PNG com texto passaram. O limite de 20.000 caracteres e uma imagem sem texto legível ainda precisam de verificação específica.

## Passou? S/N
N, parcial; faltam os casos de limite e imagem ilegível.

---
