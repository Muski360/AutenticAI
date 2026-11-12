# Identificação do Problema — AutenticAI

> **Atualização:** 12 de novembro de 2026

## 1. Contextualização

A circulação de informações falsas, imprecisas ou descontextualizadas não é um fenômeno restrito a notícias inventadas. Ela também envolve manchetes que omitem dados relevantes, imagens reutilizadas fora de seu contexto original, afirmações sem comprovação e conteúdos alterados ou produzidos com inteligência artificial (IA). Essas informações podem chegar ao público por sites, redes sociais, aplicativos de mensagens e outros meios digitais, frequentemente sem os elementos necessários para avaliar sua origem e confiabilidade.

O problema está relacionado tanto à qualidade da informação disponível quanto à capacidade das pessoas de investigá-la. A UNESCO considera a **alfabetização midiática e informacional** essencial para acessar, avaliar criticamente e utilizar informações de maneira responsável, incluindo a compreensão dos efeitos da IA no ambiente digital [1].

A questão, portanto, não é apenas oferecer mais informações, mas **tornar a verificação acessível no momento em que surge uma dúvida**, sem eliminar a necessidade de interpretação humana.

## 2. Evidências e dimensão do problema

Os estudos consultados apontam dificuldades concretas na relação entre consumo de notícias, confiança e práticas de checagem.

| Evidência | Resultado | Relevância para o projeto |
|---|---|---|
| **Painel TIC — Integridade da Informação 2025** | **36%** citaram esquecer de conferir informações e **33%** citaram falta de tempo entre os motivos para deixar de verificá-las [2]. | Indica que o esforço e a interrupção da navegação podem representar barreiras práticas à checagem. |
| **Painel TIC — Integridade da Informação 2025** | **48%** declararam ter pouca ou nenhuma confiança em sua capacidade de identificar informações falsas ou enganosas (29% pouco confiantes; 19% nada confiantes) [3]. | Reforça a necessidade de apresentar evidências e explicações compreensíveis, em vez de apenas um rótulo de verdadeiro ou falso. |
| **Digital News Report 2026 — Brasil** | Apenas **36%** dos entrevistados afirmaram confiar nas notícias em geral; **47%** disseram evitá-las às vezes ou frequentemente [4]. | Contextualiza um cenário de baixa confiança informacional, embora esses indicadores não meçam diretamente a quantidade de conteúdo falso. |
| **Digital News Report 2026 — panorama internacional** | **62%** dos entrevistados, em média nos mercados pesquisados, demonstraram preocupação com informações falsas na internet [5]. | Mostra a abrangência internacional do problema e a importância da credibilidade das fontes. |

**Observação metodológica:** o Painel TIC citado foi conduzido com usuários de internet de 16 anos ou mais, por questionário online e amostragem não probabilística. Seus percentuais descrevem os participantes e devem ser interpretados conforme os limites metodológicos do levantamento; não representam, isoladamente, uma medição causal da necessidade do AutenticAI [6].

## 3. Caracterização do problema

A dificuldade central está na **fragmentação do processo de verificação**. Para avaliar uma afirmação suspeita, o usuário pode precisar identificar o trecho verificável, pesquisar sua origem, localizar dados oficiais, comparar diferentes fontes, conferir datas e interpretar possíveis contradições. Em imagens, ainda pode ser necessário investigar o contexto original ou identificar elementos manipulados.

Essa jornada apresenta quatro obstáculos principais:

1. **Atrito operacional:** copiar trechos, abrir outras páginas e alternar entre ferramentas exige tempo e atenção. O CERT.br recomenda consultar múltiplas fontes e verificar fatos, nomes, imagens e comunicados oficiais — práticas importantes, mas nem sempre simples de executar durante a navegação cotidiana [7].
2. **Dificuldade de interpretação:** encontrar resultados de busca não significa compreender a evidência. Fontes podem apresentar informações incompletas, divergentes ou referentes a períodos diferentes.
3. **Ausência de contexto:** uma informação pode ser tecnicamente verdadeira, mas ter sido publicada com legenda enganosa, recorte inadequado ou contexto temporal incorreto.
4. **Incerteza sobre conteúdos sintéticos:** ferramentas de IA ampliam as possibilidades de criação e manipulação de materiais. Entretanto, detectar uma possível origem artificial não equivale a determinar se uma afirmação é factual ou falsa.

No último ponto, há ainda um risco técnico: estudos acadêmicos identificaram falsos positivos e fragilidades em detectores de texto gerado por IA, especialmente em determinados grupos de autores e cenários de avaliação [8][9]. Por isso, resultados de detecção devem ser tratados como **estimativas sujeitas a erro**, separadas da checagem factual.

## 4. Impactos e público afetado

A ausência de uma checagem acessível pode favorecer o compartilhamento de afirmações não verificadas e dificultar decisões baseadas em evidências. Dependendo do conteúdo, isso pode afetar discussões públicas, consumo, saúde, educação e reputação de pessoas ou organizações. Esses impactos são riscos associados à desinformação; **não se afirma que todos sejam consequência direta da falta de uma ferramenta integrada**.

| Público potencial | Situação de uso | Necessidade identificada |
|---|---|---|
| **Público geral** | Recebe notícias, mensagens e publicações de procedência incerta. | Conferir afirmações sem realizar pesquisas extensas em diferentes serviços. |
| **Estudantes e educadores** | Encontram dados, citações e imagens durante estudos e atividades. | Consultar fontes e compreender por que uma informação é sustentada, contradita ou inconclusiva. |
| **Profissionais e equipes de comunicação** | Precisam avaliar informações antes de compartilhar ou utilizar um conteúdo. | Reunir evidências rastreáveis e registrar o resultado da análise. |

O público-alvo inicial do AutenticAI é o **usuário comum**, com possibilidade de validação piloto no ambiente educacional do SENAI. Os demais segmentos representam oportunidades de uso, ainda não demandas confirmadas por pesquisa direta com usuários.

## 5. Alternativas existentes e análise de concorrentes

O mercado já oferece iniciativas relevantes de checagem jornalística, busca por verificações publicadas, análise de mídia e detecção de IA. A oportunidade do AutenticAI precisa ser avaliada em comparação a essas soluções — e não partir da premissa de que não existem ferramentas similares.

| Solução | Categoria | Recursos existentes | Diferença de posicionamento em relação ao AutenticAI |
|---|---|---|---|
| **Aos Fatos / Fátima** | Checagem jornalística e assistente conversacional | Disponibiliza verificações jornalísticas e a assistente Fátima, integrada ao site e alimentada por checagens e reportagens do veículo [10]. | O AutenticAI propõe processar conteúdos enviados pelo usuário e apresentar evidências por afirmação, inclusive quando não houver uma checagem previamente publicada. |
| **Agência Lupa** | Checagem jornalística e educação midiática | Produz verificações, investigações, conteúdos educativos e projetos voltados à integridade da informação [11]. | A proposta do AutenticAI enfatiza uma ferramenta de uso individual e contextual, complementar ao trabalho editorial especializado. |
| **Google Fact Check Explorer** | Busca de checagens existentes | Permite localizar verificações publicadas por organizações independentes, inclusive por palavras-chave e imagens [12]. | A busca depende da disponibilidade de verificações indexadas; o AutenticAI pretende também organizar evidências para afirmações ainda não contempladas por uma checagem localizada. |
| **InVID-WeVerify** | Extensão de verificação de mídia | Reúne busca reversa, extração de quadros de vídeos, metadados e ferramentas de análise visual, especialmente úteis a verificadores e jornalistas [13]. | O AutenticAI busca uma experiência mais guiada para o público geral, inicialmente focada em texto, links e imagens, sem substituir ferramentas forenses especializadas. |
| **NewsGuard** | Avaliação de confiabilidade de fontes | Atribui avaliações fundamentadas em critérios jornalísticos a sites e veículos de informação, com extensão e relatórios explicativos [14]. | Avaliar a reputação de um veículo é diferente de verificar uma afirmação específica; o AutenticAI pretende priorizar a análise do conteúdo apresentado. |
| **Full Fact AI** | Ferramentas profissionais de apoio à checagem | Oferece identificação, monitoramento e análise de afirmações para organizações de fact-checking [15]. | Opera principalmente como solução profissional; o AutenticAI pretende uma jornada acessível ao usuário final, acionada pontualmente. |
| **GPTZero** | Detecção de conteúdo por IA | Analisa textos e documentos para estimar se foram escritos por IA, inclusive por extensão de navegador [16]. | Seu foco é autoria provável; o AutenticAI separará essa estimativa da investigação de veracidade e das fontes que sustentam afirmações. |

**Interpretação do levantamento:** as soluções analisadas comprovam que há tecnologias consolidadas em partes do processo. A diferenciação pretendida pelo AutenticAI está na **combinação entre checagem por afirmação, evidências explicadas e acesso contextual por web, Chrome e Android**. Isso é uma hipótese de posicionamento, não uma declaração de exclusividade ou superioridade já demonstrada.

## 6. Oportunidade identificada

O AutenticAI pretende reduzir a distância entre **encontrar uma informação suspeita** e **obter elementos para avaliá-la**. A proposta é que o usuário inicie uma análise quando desejar, com o menor número possível de etapas e sem monitoramento permanente de sua atividade.

O fluxo idealizado é:

**Conteúdo encontrado → solicitação de análise → identificação de afirmações → busca e comparação de evidências → relatório com justificativas, fontes e limitações.**

Os resultados deverão distinguir, sempre que tecnicamente possível, afirmações **sustentadas**, **contraditas**, com **evidências mistas** ou **inconclusivas**. A eventual análise de origem por IA será apresentada à parte, sem servir como prova de falsidade.

O diferencial central não é prometer que a plataforma descobrirá automaticamente a verdade, mas **facilitar uma verificação documentada e compreensível**, mantendo o usuário responsável pela interpretação e pelo uso do resultado.

## 7. Questão norteadora e hipóteses de validação

**Questão norteadora:** como facilitar a verificação de informações encontradas na internet, reduzindo a necessidade de alternar entre ferramentas, sem comprometer a transparência das fontes, a privacidade e o reconhecimento das limitações da IA?

Antes de considerar a proposta validada, será necessário investigar:

| Hipótese | Como poderá ser avaliada no piloto |
|---|---|
| **H1 — Menor esforço:** a captura contextual reduz etapas em comparação à pesquisa manual. | Comparar tempo e quantidade de ações para analisar os mesmos conteúdos. |
| **H2 — Maior compreensão:** relatórios por afirmação ajudam o usuário a entender as evidências. | Aplicar tarefas de interpretação e coletar feedback sobre clareza e confiança. |
| **H3 — Transparência:** o usuário reconhece quando as fontes são insuficientes ou contraditórias. | Testar exemplos inconclusivos e observar se os participantes compreendem os limites do resultado. |

O levantamento atual sustenta a relevância **potencial** do problema, mas ainda não demonstra que o AutenticAI solucionará essas dificuldades. Entrevistas, testes de usabilidade e avaliação da qualidade das análises serão necessários para verificar essa hipótese.

## 8. Delimitação da proposta

O projeto está em planejamento. O desenvolvimento começará pela plataforma web, com textos, URLs e imagens; a extensão Chrome e o aplicativo Android serão etapas posteriores. As análises dependerão de ação explícita do usuário e deverão respeitar permissões de acesso, privacidade e limitações das plataformas.

O sistema não substituirá profissionais de checagem, não garantirá conclusões infalíveis e não tratará ausência de evidência como prova de falsidade. Recursos especializados de detecção de conteúdo gerado por IA dependerão da disponibilidade e da avaliação técnica de ferramentas adequadas.

## 9. Referências

**Pesquisa, contexto e fundamentos**

1. **UNESCO.** *Media and Information Literacy*. Disponível em: https://www.unesco.org/en/communication-information/priorities/media-information-literacy
2. **Cetic.br / NIC.br.** *Painel TIC 2025 — Integridade da Informação: práticas e motivos para a não verificação* (resultados divulgados em 2026). Disponível em: https://nic.br/noticia/na-midia/brasileiros-desconfiam-mais-de-noticias-de-veiculos-jornalisticos-que-de-conteudo-de-amigos-em-redes-sociais-e-mensagens/
3. **Cetic.br / NIC.br.** *Painel TIC 2025 — Indicador I2: confiança na capacidade de identificar informações falsas ou enganosas*. Disponível em: https://www.cetic.br/pt/tics/painel/painel/integridade/I2/expandido/
4. **REUTERS INSTITUTE FOR THE STUDY OF JOURNALISM.** *Digital News Report 2026 — Brazil*. Disponível em: https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2026/brazil
5. **REUTERS INSTITUTE FOR THE STUDY OF JOURNALISM.** *Digital News Report 2026 — Overview and Key Findings*. Disponível em: https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2026/dnr-executive-summary
6. **Cetic.br / NIC.br.** *Painel TIC 2025 — Integridade da Informação: microdados e documentação metodológica*. Disponível em: https://www.cetic.br/pt/pesquisa/painel/microdados/
7. **CERT.br / NIC.br.** *Cartilha de Segurança para Internet — Fascículo Boatos*. Disponível em: https://cartilha.cert.br/fasciculos/boatos/fasciculo-boatos-grafica.pdf
8. **LIANG, W. et al.** *GPT detectors are biased against non-native English writers*. *Patterns*, 2023. DOI: https://doi.org/10.1016/j.patter.2023.100779
9. **TUFTS, B.; ZHAO, X.; LI, L.** *A Practical Examination of AI-Generated Text Detectors for Large Language Models*. Findings of NAACL, 2025. Disponível em: https://aclanthology.org/2025.findings-naacl.271/

**Soluções existentes e análise de mercado**

10. **AOS FATOS.** *Robô checadora Fátima ganha novo design e integração com o site do Aos Fatos*. 2025. Disponível em: https://www.aosfatos.org/noticias/robo-checadora-fatima-ganha-novo-design-e-integracao-com-o-site-do-aos-fatos/
11. **AGÊNCIA LUPA.** *Sobre a Lupa*. Disponível em: https://www.agencialupa.org/sobre-a-lupa/
12. **GOOGLE NEWS INITIATIVE.** *Fact Check Explorer — Fact-checking images*. Disponível em: https://newsinitiative.withgoogle.com/resources/trainings/fact-check-explorer/
13. **INVID / WEVERIFY.** *Verification Plugin*. Disponível em: https://weverify.eu/verification-plugin/
14. **NEWSGUARD.** *Website Rating Process and Criteria*. Disponível em: https://www.newsguardtech.com/ratings/rating-process-criteria/
15. **FULL FACT.** *Full Fact AI*. Disponível em: https://fullfact.org/ai/
16. **GPTZERO.** *How do I use GPTZero?*. Disponível em: https://support.gptzero.me/articles/9172706201-how-do-i-use-gptzero

*Acesso às fontes: 12 de novembro de 2026.*
