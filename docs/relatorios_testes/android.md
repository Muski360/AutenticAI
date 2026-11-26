# Testes do Android

## Número do teste
1

## Descrição
Abrir o app no emulador Android 14 com uma conta autenticada.

## Resultado esperado
Exibir a área de análise e o controle de saída.

## Resultado real
O emulador exibiu Nova análise, Histórico e Sair. A autenticação já estava concluída quando o teste começou.

## Passou? S/N
S

---

## Número do teste
2

## Descrição
Digitar uma frase, abrir a prévia e cancelá-la.

## Resultado esperado
Apresentar opções de confirmar e cancelar. Ao cancelar, retornar ao editor.

## Resultado real
A prévia exibiu Confirmar envio e Cancelar prévia. O cancelamento retornou ao editor.

## Passou? S/N
S

---

## Número do teste
3

## Descrição
Enviar a frase “Brasilia the capital of Brazil.” para análise.

## Resultado esperado
Exibir o resultado e as fontes encontradas.

## Resultado real
O app apresentou a frase, classificação sustentada, justificativa e cinco fontes. O texto perdeu a palavra “is” durante a entrada automatizada; o resultado corresponde à frase que foi efetivamente enviada.

## Passou? S/N
S para envio e exibição. A frase digitada diferiu da frase pretendida.

---

## Número do teste
4

## Descrição
Abrir o histórico no Android após o envio.

## Resultado esperado
Encontrar a análise recém-criada.

## Resultado real
O histórico exibiu “Brasilia the capital of Brazil.”. O mesmo registro também apareceu na web com a mesma conta.

## Passou? S/N
S

---

## Número do teste
5

## Descrição
Executar os testes automatizados Flutter.

## Resultado esperado
Passar os testes de interface, cancelamento, envio de print e validação de imagem.

## Resultado real
Os quatro testes passaram. As respostas da API e os canais de captura nesses testes foram simulados.

## Passou? S/N
S

Captura com sobreposição, seleção de imagem real, exclusão pelo Android e login desde o início permanecem pendentes.
