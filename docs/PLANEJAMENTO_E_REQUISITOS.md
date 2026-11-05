# Planejamento e Definição de Requisitos

## Problema e proposta

A circulação de informações falsas ou enganosas dificulta a avaliação de conteúdos encontrados na internet. Verificar afirmações e consultar fontes pode exigir tempo e a utilização de diferentes ferramentas.

O AutenticAI é uma proposta de plataforma para apoiar essa verificação. A pessoa solicitará uma análise e receberá explicações e referências para avaliar o conteúdo. O projeto está em planejamento e suas funcionalidades ainda precisam ser desenvolvidas e validadas.

## Requisitos funcionais

- Permitir o envio de textos, links e imagens para análise na plataforma web.
- Identificar afirmações verificáveis e consultar fontes e evidências relevantes.
- Apresentar os resultados por afirmação, com justificativas e links para as fontes, inclusive quando não houver evidências suficientes para uma conclusão.
- Permitir a análise da página atual pela extensão Chrome e da tela pelo aplicativo Android, após ação e autorização do usuário.
- Oferecer cadastro, autenticação e gerenciamento do histórico de análises.
- Apresentar indícios de conteúdo gerado por IA separadamente da verificação factual, somente quando houver uma ferramenta adequada disponível. O resultado será uma estimativa, não uma prova de autoria.

## Requisitos não funcionais

- **Clareza:** apresentar resultados, fontes e limitações em linguagem compreensível.
- **Privacidade:** solicitar apenas os dados e permissões necessários; não armazenar capturas brutas permanentemente por padrão.
- **Controle:** iniciar análises somente por solicitação do usuário, sem monitoramento contínuo.
- **Segurança:** proteger contas e restringir o acesso ao histórico de cada usuário.
- **Acessibilidade:** oferecer interface responsiva e utilizável por teclado, sem depender apenas de cores para transmitir informações.
- **Confiabilidade:** informar falhas e resultados inconclusivos, sem apresentar estimativas como certezas.

## Etapas previstas

1. **Plataforma web:** iniciar pela análise de textos, links e imagens, com consulta a fontes e relatório explicativo.
2. **Extensão Chrome:** permitir a análise da página ativa por solicitação do usuário.
3. **Aplicativo Android:** permitir a análise de tela mediante autorização, respeitando as limitações do sistema e dos aplicativos.
4. **Evolução:** avaliar novos formatos e recursos após a validação das etapas iniciais.