# Planejamento e requisitos — AutenticAI

## Problema e objetivo

Verificar informações encontradas na internet pode exigir tempo e consultas a várias fontes. O AutenticAI é um projeto acadêmico do SENAI que ajuda nessa pesquisa, apresentando explicações e referências em uma interface simples.

## Requisitos funcionais

| ID | O sistema deverá permitir |
|---|---|
| RF01 | Entrar e sair usando uma conta Google pelo Supabase Auth. |
| RF02 | Enviar texto digitado ou print escolhido para análise na web e no Android. |
| RF03 | Solicitar a análise do texto da página ativa pela extensão Chrome. |
| RF04 | Usar um botão flutuante no Android para iniciar a captura, após as permissões necessárias. |
| RF05 | Revisar e confirmar o conteúdo antes de enviá-lo para análise. |
| RF06 | Analisar afirmações com a Groq e apresentar justificativas com fontes encontradas pela Tavily. |
| RF07 | Apresentar separadamente eventuais indícios de conteúdo gerado por IA, sem porcentagem ou certeza de autoria. |
| RF08 | Consultar e excluir as próprias análises no histórico. |
| RF09 | Informar processamento, falha, falta de evidências e permissões negadas. |

Quando possível, classificar afirmações como **sustentadas, contraditas, com evidências mistas ou inconclusivas**. A ausência de fontes não prova que uma afirmação seja falsa. Os indícios de IA também podem estar errados e não determinam a veracidade do conteúdo.

## Requisitos não funcionais

| ID | Requisito |
|---|---|
| RNF01 | Usar HTTPS e restringir o histórico a seu proprietário. |
| RNF02 | Analisar conteúdo somente por ação do usuário; informar o envio ao provedor de IA. |
| RNF03 | Salvar texto, resultado e fontes; não guardar o print original permanentemente. |
| RNF04 | Manter interfaces legíveis, responsivas e acessíveis por teclado ou toque. |
| RNF05 | Tratar erros de conexão, limites do provedor e indisponibilidade de fontes com mensagens claras. |

## Tecnologias e entregas

| Parte | Tecnologia ou entrega |
|---|---|
| Web e API | Next.js e Cloudflare Workers |
| Extensão | Chrome Manifest V3 |
| Android | Flutter e integração nativa para sobreposição e captura |
| Dados e login | PostgreSQL e autenticação Google no Supabase |
| Análise e pesquisa | Groq (`openai/gpt-oss-120b`) e Tavily Search |

A ordem de desenvolvimento será: **estrutura e login → análise web e histórico → extensão Chrome → Android → testes da entrega**. Apenas o nível **Light** será implementado. Médio, Alto e Ultra são possibilidades futuras, sem recursos ou modelos definidos.

## Critérios de conclusão

A entrega deve demonstrar login, análise nas três plataformas, resultado com fontes quando disponíveis, histórico individual e tratamento de falhas. A captura Android deve respeitar as permissões e informar quando uma tela estiver protegida.
