# Testes de IA com Gemini

## Número do teste
1

## Descrição
Enviar um texto para análise factual com pesquisa de fontes pelo Gemini.

## Resultado esperado
Receber uma análise com justificativas e fontes.

## Resultado real
A API retornou HTTP 404. O modelo ou recurso solicitado não estava disponível para a requisição.

## Passou? S/N
N

---

## Número do teste
2

## Descrição
Repetir a análise após trocar o modelo Gemini, incluindo a tentativa com `gemini-2.5-flash-lite`.

## Resultado esperado
Receber uma análise com justificativas e fontes usando a chave disponível.

## Resultado real
A API retornou HTTP 429, que indica limite de uso ou de cota. As trocas de modelo não produziram uma análise completa.

## Passou? S/N
N
