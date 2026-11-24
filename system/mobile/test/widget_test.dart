import 'dart:convert';
import 'dart:typed_data';

import 'package:autenticai/analysis_api.dart';
import 'package:autenticai/main.dart';
import 'package:autenticai/workspace.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

final png = base64Decode(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aNA8AAAAASUVORK5CYII=',
);

Widget workspace(http.Client client) => MaterialApp(
  home: Scaffold(
    body: Workspace(
      api: Uri.parse('https://example.test'),
      accessToken: () => 'test-token',
      client: client,
    ),
  ),
);

void main() {
  testWidgets('Exibe o nome do AutenticAI ao abrir o app', (tester) async {
    final semantics = tester.ensureSemantics();
    try {
      await tester.pumpWidget(const AutenticAIApp());
      expect(find.bySemanticsLabel('AutenticAI'), findsOneWidget);
    } finally {
      semantics.dispose();
    }
  });

  testWidgets(
    'Cancela o texto sem envio e conserva a prévia quando a API falha',
    (tester) async {
      var calls = 0;
      await tester.pumpWidget(
        workspace(
          MockClient((request) async {
            calls++;
            expect(request.method, 'POST');
            expect(request.headers['authorization'], 'Bearer test-token');
            expect(jsonDecode(request.body), {
              'texto': 'Brasília é a capital do Brasil.',
            });
            return http.Response(
              '{"erro":"Cota indisponível."}',
              429,
              headers: {'content-type': 'application/json; charset=utf-8'},
            );
          }),
        ),
      );
      await tester.pumpAndSettle();
      await tester.enterText(
        find.byType(TextField),
        'Brasília é a capital do Brasil.',
      );
      await tester.tap(find.text('Revisar texto'));
      await tester.pumpAndSettle();
      expect(find.text('Revise o conteúdo'), findsOneWidget);
      expect(calls, 0);
      await tester.tap(find.text('Cancelar prévia'));
      await tester.pumpAndSettle();
      expect(calls, 0);
      await tester.tap(find.text('Revisar texto'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Confirmar envio'));
      await tester.pumpAndSettle();
      expect(calls, 1);
      expect(find.text('Cota indisponível.'), findsOneWidget);
      expect(find.text('Revise o conteúdo'), findsOneWidget);
    },
  );

  testWidgets(
    'Print escolhido e captura nativa exigem confirmação antes do multipart',
    (tester) async {
      final messenger =
          TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger;
      Map<String, Object>? capture = {'image': png};
      messenger.setMockMethodCallHandler(
        android,
        (call) async => switch (call.method) {
          'overlayStatus' => {'allowed': true, 'active': false},
          'pickImage' => png,
          'takeCapture' => (() {
            final pending = capture;
            capture = null;
            return pending;
          })(),
          _ => null,
        },
      );
      addTearDown(() => messenger.setMockMethodCallHandler(android, null));
      var posts = 0;
      await tester.pumpWidget(
        workspace(
          MockClient((request) async {
            posts++;
            expect(request.method, 'POST');
            expect(
              request.headers['content-type'],
              startsWith('multipart/form-data'),
            );
            expect(
              latin1.decode(request.bodyBytes),
              contains('name="imagem"; filename="print.png"'),
            );
            return http.Response(
              '{"id":"test","texto_analisado":"Exemplo","afirmacoes":[],"fontes":[]}',
              201,
            );
          }),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('Revise o conteúdo'), findsOneWidget);
      expect(posts, 0);
      await tester.tap(find.text('Cancelar prévia'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Escolher print'));
      await tester.pumpAndSettle();
      expect(find.text('Revise o conteúdo'), findsOneWidget);
      expect(posts, 0);
      await tester.tap(find.text('Confirmar envio'));
      await tester.pumpAndSettle();
      expect(posts, 1);
      await tester.scrollUntilVisible(
        find.text('Nenhuma afirmação verificável foi identificada.'),
        100,
        scrollable: find
            .descendant(
              of: find.byType(ListView),
              matching: find.byType(Scrollable),
            )
            .first,
      );
      expect(find.text('Resultado'), findsOneWidget);
    },
  );

  test('Recusa print inválido e acima do limite', () {
    expect(() => imageMime(Uint8List(8)), throwsA(isA<ApiError>()));
    expect(
      () => imageMime(Uint8List(maxImageBytes + 1)),
      throwsA(isA<ApiError>()),
    );
    expect(imageMime(png), 'image/png');
  });
}
