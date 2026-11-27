import 'dart:async';

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'entry_screen.dart';
import 'identity.dart';
import 'workspace.dart';

const _url = String.fromEnvironment('SUPABASE_URL');
const _key = String.fromEnvironment('SUPABASE_PUBLISHABLE_KEY');
const _api = String.fromEnvironment('API_URL');

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

  Future<void> _signOut() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await widget.auth.signOut(scope: SignOutScope.local);
    } catch (_) {
      if (mounted) {
        setState(() => _error = 'Não foi possível sair. Tente novamente.');
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
              onPressed: _busy ? null : _signOut,
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
            Expanded(child: EntryScreen(auth: widget.auth))
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
