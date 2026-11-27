import 'dart:convert';

import 'package:autenticai/main.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class _MemoryStorage implements GotrueAsyncStorage {
  final _values = <String, String>{};

  @override
  Future<String?> getItem({required String key}) async => _values[key];

  @override
  Future<void> setItem({required String key, required String value}) async {
    _values[key] = value;
  }

  @override
  Future<void> removeItem({required String key}) async {
    _values.remove(key);
  }
}

void main() {
  testWidgets('Acessa com senha, sai e confirma um cadastro por código', (
    tester,
  ) async {
    const email = 'pessoa@example.test';
    const password = ' senha de teste ';
    const user = {
      'id': 'fixture',
      'email': email,
      'app_metadata': {'provider': 'email'},
    };
    final session = {
      'access_token': 'fixture.access.token',
      'refresh_token': 'fixture-refresh',
      'expires_in': 3600,
      'token_type': 'bearer',
      'user': user,
    };
    http.Response json(Object data, [int status = 200]) => http.Response(
      jsonEncode(data),
      status,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'x-supabase-api-version': '2024-01-01',
      },
    );

    final calls = <String>[];
    final auth = GoTrueClient(
      url: 'https://auth.example.test/auth/v1',
      autoRefreshToken: false,
      asyncStorage: _MemoryStorage(),
      httpClient: MockClient((request) async {
        final endpoint = request.url.pathSegments.last;
        calls.add(endpoint);
        if (endpoint == 'logout') return http.Response('', 204);
        final body = jsonDecode(request.body) as Map;
        expect(body['email'], email);
        if (endpoint == 'signup') {
          expect(body['password'], password);
          expect(body['code_challenge_method'], 's256');
          return json(user);
        }
        if (endpoint == 'verify') {
          expect(body['type'], 'email');
          if (body['token'] == '000001') return json(session);
          return json({'msg': 'Invalid OTP', 'code': 'otp_expired'}, 403);
        }
        expect(endpoint, 'token');
        expect(request.url.queryParameters['grant_type'], 'password');
        if (body['password'] == password) return json(session);
        return json({
          'msg': 'Invalid credentials',
          'code': 'invalid_credentials',
        }, 400);
      }),
    );
    addTearDown(auth.dispose);

    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await tester.pumpWidget(
      AutenticAIApp(auth: auth, api: Uri.parse('https://api.example.test')),
    );
    await tester.pumpAndSettle();

    Future<void> tap(String label) async {
      final target = find.text(label);
      await tester.ensureVisible(target);
      await tester.tap(target);
      await tester.pumpAndSettle();
    }

    final fields = find.byType(TextFormField);
    expect(find.text('Entrar com Google'), findsOneWidget);
    await tester.enterText(fields.first, email);
    await tester.enterText(fields.last, 'incorreta');
    await tap('Entrar com e-mail');
    expect(find.text('E-mail ou senha incorretos.'), findsOneWidget);
    expect(auth.currentSession, isNull);
    await tester.enterText(fields.last, password);
    await tap('Entrar com e-mail');
    expect(auth.currentSession?.user.email, email);
    await tap('Sair');
    expect(auth.currentSession, isNull);

    await tap('Criar conta');
    await tester.enterText(fields.first, email);
    await tester.enterText(fields.last, password);
    await tap('Criar conta');
    expect(find.text('Código de confirmação'), findsOneWidget);
    expect(auth.currentSession, isNull);
    expect(tester.widget<TextFormField>(fields.last).controller?.text, isEmpty);
    await tester.enterText(fields.last, '000000');
    await tap('Confirmar e-mail');
    expect(find.textContaining('Código inválido ou expirado.'), findsOneWidget);
    await tester.enterText(fields.last, '000001');
    await tap('Confirmar e-mail');
    expect(auth.currentSession?.user.email, email);
    expect(calls, ['token', 'token', 'logout', 'signup', 'verify', 'verify']);
  });
}
