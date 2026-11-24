import 'dart:async';

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'identity.dart';
import 'workspace.dart';

const _url = String.fromEnvironment('SUPABASE_URL');
const _key = String.fromEnvironment('SUPABASE_PUBLISHABLE_KEY');
const _api = String.fromEnvironment('API_URL');
const _returnUrl = 'br.edu.senai.autenticai://login-callback';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  if (_url.isEmpty || _key.isEmpty || _api.isEmpty) {
    runApp(const AutenticAIApp());
    return;
  }
  await Supabase.initialize(url: _url, publishableKey: _key);
  runApp(
    AutenticAIApp(auth: Supabase.instance.client.auth, api: Uri.parse(_api)),
  );
}

class AutenticAIApp extends StatelessWidget {
  const AutenticAIApp({super.key, this.auth, this.api});
  final GoTrueClient? auth;
  final Uri? api;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AutenticAI',
      debugShowCheckedModeBanner: false,
      theme: investigationTheme(),
      home: auth == null || api == null
          ? Scaffold(
              appBar: AppBar(title: const BrandLockup()),
              body: const EntryScreen(),
            )
          : Account(auth: auth!, api: api!),
    );
  }
}

class Account extends StatefulWidget {
  const Account({super.key, required this.auth, required this.api});
  final GoTrueClient auth;
  final Uri api;

  @override
  State<Account> createState() => _AccountState();
}

class _AccountState extends State<Account> {
  late Session? _session = widget.auth.currentSession;
  late final StreamSubscription<AuthState> _auth;
  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _auth = widget.auth.onAuthStateChange.listen(
      (state) {
        if (!mounted) return;
        setState(() {
          _session = state.session;
          _error = null;
        });
        if (state.session == null) unawaited(_stopCapture());
      },
      onError: (Object error) {
        if (mounted) {
          setState(
            () => _error =
                'Não foi possível recuperar a sessão. Tente entrar novamente.',
          );
        }
      },
    );
    if (_session == null) unawaited(_stopCapture());
  }

  Future<void> _stopCapture() async {
    try {
      await android.invokeMethod<void>('stopOverlay');
    } catch (_) {}
  }

  Future<void> _changeAccount() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    final signedIn = _session != null;
    try {
      if (signedIn) {
        await widget.auth.signOut(scope: SignOutScope.local);
      } else {
        final opened = await widget.auth.signInWithOAuth(
          OAuthProvider.google,
          redirectTo: _returnUrl,
          authScreenLaunchMode: LaunchMode.externalApplication,
        );
        if (!opened) throw StateError('Falha ao abrir o navegador.');
      }
    } catch (_) {
      if (mounted) {
        setState(
          () => _error = signedIn
              ? 'Não foi possível sair. Tente novamente.'
              : 'Não foi possível abrir o login Google. Tente novamente.',
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  void dispose() {
    unawaited(_auth.cancel());
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final session = _session;
    return Scaffold(
      appBar: AppBar(
        title: const BrandLockup(),
        actions: [
          if (session != null)
            TextButton(
              onPressed: _busy ? null : _changeAccount,
              child: const Text('Sair'),
            ),
        ],
      ),
      body: Column(
        children: [
          if (_error case final String error)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
              child: FeedbackLine(error, error: true),
            ),
          if (session == null)
            Expanded(
              child: EntryScreen(
                configured: true,
                onLogin: _busy ? null : _changeAccount,
              ),
            )
          else
            Expanded(
              child: Workspace(
                key: ValueKey(session.user.id),
                api: widget.api,
                accessToken: () => widget.auth.currentSession?.accessToken,
              ),
            ),
        ],
      ),
    );
  }
}

class EntryScreen extends StatelessWidget {
  const EntryScreen({super.key, this.configured = false, this.onLogin});
  final bool configured;
  final VoidCallback? onLogin;

  @override
  Widget build(BuildContext context) => SafeArea(
    child: ListView(
      padding: const EdgeInsets.fromLTRB(20, 26, 20, 24),
      children: [
        Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 560),
            child: Panel(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const EvidenceOrbit(),
                  const Divider(height: 24),
                  const DisplayTitle('Análise de', 'informações'),
                  const SizedBox(height: 18),
                  if (configured)
                    FilledButton.icon(
                      onPressed: onLogin,
                      icon: const Icon(Icons.arrow_outward, size: 17),
                      iconAlignment: IconAlignment.end,
                      label: const Text('Entrar com Google'),
                    )
                  else
                    const FeedbackLine('O acesso ainda não está configurado.'),
                ],
              ),
            ),
          ),
        ),
      ],
    ),
  );
}
