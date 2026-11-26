# AutenticAI para Android

Cliente Flutter para Android 8 ou superior. Permite analisar texto digitado, um print escolhido no aparelho ou uma captura iniciada pelo botão flutuante.

Copie `.env.example` para `.env.local` em `system/mobile/`. Preencha a URL e a chave publicável do Supabase. Para usar o Worker local a partir do emulador, mantenha `http://10.0.2.2:8787` e inicie a [API](../backend/README.md). Em um aparelho físico com depuração USB, use `adb reverse tcp:8787 tcp:8787` e configure `http://127.0.0.1:8787`. Para distribuir o app, use a URL HTTPS do Worker.

O Supabase do projeto já aceita o retorno `br.edu.senai.autenticai://login-callback`. Em outro projeto, cadastre essa URL no Supabase Auth e habilite o Google.

```sh
flutter pub get
flutter run --dart-define-from-file=.env.local
```

1. Entre com Google. Use **Abrir histórico** para validar a sessão no Supabase.
2. Digite um texto e clique em **Revisar texto**, ou use **Escolher print**. A prévia permite confirmar ou cancelar.
3. Para capturar outro app, use **Autorizar sobreposição** e permita que o AutenticAI apareça sobre outros apps. Volte e toque em **Ativar botão flutuante**.
4. Abra a tela desejada, toque em **Capturar** e autorize a captura no diálogo do Android. A prévia aparece no AutenticAI. Use **Cancelar prévia** para testar a captura sem gastar cota.

O Android pede consentimento para cada captura. O app encerra a sessão depois de obter uma imagem, mantém a prévia em memória e informa quando o Android não retorna uma imagem legível. Para remover o botão, toque em **Desativar botão flutuante**. Execute `flutter analyze` e `flutter test` para validar o projeto.
