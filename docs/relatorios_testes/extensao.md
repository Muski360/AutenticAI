# Testes da extensão Chrome

## Número do teste
1

## Descrição
Configurar a extensão para o Supabase e a API local e executar `npm run build`.

## Resultado esperado
Gerar os arquivos da extensão na pasta `dist`.

## Resultado real
O build passou após corrigir a formatação inicial do arquivo local de configuração. A primeira tentativa juntou as variáveis na mesma linha e retornou erro de URL inválida.

## Passou? S/N
S no reteste.

O carregamento no Chrome, login e análise de uma página ainda precisam ser testados.
