# Testes da web

## Número do teste
1

## Descrição
Entrar com Google e acessar a área de análise em `localhost:3000`.

## Resultado esperado
Exibir a área de análise para uma sessão autenticada.

## Resultado real
O navegador de teste exibiu Nova análise, Histórico e o botão Sair com a sessão já iniciada.

## Passou? S/N
S

---

## Número do teste
2

## Descrição
Revisar e enviar a afirmação “A Lua emite luz própria.”

## Resultado esperado
Mostrar a prévia e retornar análise contradita com fontes.

## Resultado real
A prévia mostrou o texto e o aviso de envio. Após confirmação, a análise classificou a afirmação como contradita e exibiu cinco fontes. Entre elas havia resultados de redes sociais, cuja qualidade precisa ser avaliada pelo usuário.

## Passou? S/N
S

---

## Número do teste
3

## Descrição
Abrir o histórico, reabrir e excluir a análise criada no teste da Lua.

## Resultado esperado
Encontrar o registro, consultar o resultado e removê-lo após confirmação.

## Resultado real
O registro apareceu no histórico e foi reaberto. Após confirmar a exclusão, a interface informou “Análise excluída.”

## Passou? S/N
S

---

## Número do teste
4

## Descrição
Consultar no histórico web uma análise enviada pelo Android com a mesma conta.

## Resultado esperado
Exibir a análise no histórico da conta.

## Resultado real
O histórico web exibiu a análise de Brasília enviada pelo Android.

## Passou? S/N
S

---

## Número do teste
5

## Descrição
Consultar erros do console durante os testes e redimensionar o navegador para 375 × 812.

## Resultado esperado
Manter acesso à interface e não registrar erros de console.

## Resultado real
O navegador manteve a sessão e os controles apareceram no snapshot. O console não registrou erros. Não foi feita uma inspeção visual completa nem verificação por teclado nessa largura.

## Passou? S/N
S para sessão, controles e console. Inspeção visual e teclado pendentes.
