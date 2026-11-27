import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'identity.dart';

enum _AccessMode { login, signup, confirm }

class EntryScreen extends StatefulWidget {
  const EntryScreen({super.key, this.auth});
  final GoTrueClient? auth;

  @override
  State<EntryScreen> createState() => _EntryScreenState();
}

class _EntryScreenState extends State<EntryScreen> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _secret = TextEditingController();
  final _codeFocus = FocusNode();
  _AccessMode _mode = _AccessMode.login;
  String? _progress;
  String? _error;

  bool get _confirming => _mode == _AccessMode.confirm;

  void _changeMode(_AccessMode mode) {
    _secret.clear();
    setState(() {
      _mode = mode;
      _error = null;
    });
  }

  Future<void> _run(
    String progress,
    Future<void> Function() action,
    String failure,
  ) async {
    if (_progress != null) return;
    setState(() {
      _progress = progress;
      _error = null;
    });
    try {
      await action();
    } on AuthException catch (error) {
      if (mounted) setState(() => _error = _authMessage(error, failure));
    } catch (_) {
      if (mounted) setState(() => _error = failure);
    } finally {
      if (mounted) setState(() => _progress = null);
    }
  }

  Future<void> _submit(GoTrueClient auth) async {
    if (_progress != null || !_form.currentState!.validate()) return;
    final mode = _mode;
    final email = _email.text.trim();
    final secret = _secret.text;
    await _run(
      switch (mode) {
        _AccessMode.login => 'Entrando…',
        _AccessMode.signup => 'Criando conta…',
        _AccessMode.confirm => 'Confirmando e-mail…',
      },
      () async {
        final response = await switch (mode) {
          _AccessMode.login => auth.signInWithPassword(
            email: email,
            password: secret,
          ),
          _AccessMode.signup => auth.signUp(email: email, password: secret),
          _AccessMode.confirm => auth.verifyOTP(
            email: email,
            token: secret,
            type: OtpType.email,
          ),
        };
        if (!mounted || response.session != null) return;
        if (mode != _AccessMode.signup) {
          throw StateError('Sessão indisponível.');
        }
        _changeMode(_AccessMode.confirm);
        _codeFocus.requestFocus();
      },
      switch (mode) {
        _AccessMode.login => 'Não foi possível entrar. Tente novamente.',
        _AccessMode.signup =>
          'Não foi possível criar a conta. Confira os dados ou tente entrar.',
        _AccessMode.confirm =>
          'Não foi possível confirmar o e-mail. Confira o código e tente novamente.',
      },
    );
  }

  Future<void> _openGoogle(GoTrueClient auth) =>
      _run('Abrindo login Google…', () async {
        final opened = await auth.signInWithOAuth(
          OAuthProvider.google,
          redirectTo: 'br.edu.senai.autenticai://login-callback',
          authScreenLaunchMode: LaunchMode.externalApplication,
        );
        if (!opened) throw StateError('Falha ao abrir o navegador.');
      }, 'Não foi possível abrir o login Google. Tente novamente.');

  @override
  void dispose() {
    _email.dispose();
    _secret.dispose();
    _codeFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = widget.auth;
    final enabled = _progress == null;
    final action = switch (_mode) {
      _AccessMode.login => 'Entrar com e-mail',
      _AccessMode.signup => 'Criar conta',
      _AccessMode.confirm => 'Confirmar e-mail',
    };

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        children: [
          Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: Panel(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const EvidenceOrbit(),
                    const Divider(height: 24),
                    const DisplayTitle('Análise de', 'informações'),
                    const SizedBox(height: 18),
                    if (auth == null)
                      const FeedbackLine('O acesso ainda não está configurado.')
                    else
                      Form(
                        key: _form,
                        child: AutofillGroup(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              if (_error case final String error) ...[
                                FeedbackLine(error, error: true),
                                const SizedBox(height: 12),
                              ],
                              TextFormField(
                                controller: _email,
                                enabled: enabled,
                                readOnly: _confirming,
                                keyboardType: TextInputType.emailAddress,
                                textInputAction: TextInputAction.next,
                                autofillHints: const [AutofillHints.username],
                                decoration: const InputDecoration(
                                  labelText: 'E-mail',
                                ),
                                validator: (value) =>
                                    RegExp(
                                      r'^[^\s@]+@[^\s@]+$',
                                    ).hasMatch(value!.trim())
                                    ? null
                                    : 'Informe um e-mail válido.',
                              ),
                              const SizedBox(height: 10),
                              TextFormField(
                                key: ValueKey(_mode),
                                controller: _secret,
                                focusNode: _confirming ? _codeFocus : null,
                                enabled: enabled,
                                obscureText: !_confirming,
                                autocorrect: false,
                                enableSuggestions: false,
                                keyboardType: _confirming
                                    ? TextInputType.number
                                    : TextInputType.visiblePassword,
                                inputFormatters: _confirming
                                    ? [FilteringTextInputFormatter.digitsOnly]
                                    : null,
                                autofillHints: [
                                  switch (_mode) {
                                    _AccessMode.login => AutofillHints.password,
                                    _AccessMode.signup =>
                                      AutofillHints.newPassword,
                                    _AccessMode.confirm =>
                                      AutofillHints.oneTimeCode,
                                  },
                                ],
                                textInputAction: TextInputAction.done,
                                onFieldSubmitted: (_) => _submit(auth),
                                decoration: InputDecoration(
                                  labelText: _confirming
                                      ? 'Código de confirmação'
                                      : 'Senha',
                                  helperText: _confirming
                                      ? 'Use o código do e-mail ou confirme pelo link e volte para entrar.'
                                      : null,
                                  helperMaxLines: 3,
                                ),
                                validator: (value) => value!.isEmpty
                                    ? (_confirming
                                          ? 'Informe o código.'
                                          : 'Informe a senha.')
                                    : null,
                              ),
                              const SizedBox(height: 12),
                              FilledButton(
                                onPressed: enabled ? () => _submit(auth) : null,
                                child: Text(action),
                              ),
                              TextButton(
                                onPressed: enabled
                                    ? () => _changeMode(
                                        _mode == _AccessMode.login
                                            ? _AccessMode.signup
                                            : _AccessMode.login,
                                      )
                                    : null,
                                child: Text(
                                  _mode == _AccessMode.login
                                      ? 'Criar conta'
                                      : 'Voltar para entrar',
                                ),
                              ),
                              if (!_confirming) ...[
                                const Divider(height: 20),
                                OutlinedButton.icon(
                                  onPressed: enabled
                                      ? () => _openGoogle(auth)
                                      : null,
                                  icon: const Icon(
                                    Icons.arrow_outward,
                                    size: 17,
                                  ),
                                  iconAlignment: IconAlignment.end,
                                  label: const Text('Entrar com Google'),
                                ),
                              ],
                              if (_progress case final String progress) ...[
                                const SizedBox(height: 12),
                                FeedbackLine(progress, progress: true),
                              ],
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

String _authMessage(AuthException error, String fallback) {
  if (error.statusCode == '429') {
    return 'Muitas tentativas. Aguarde alguns instantes e tente novamente.';
  }
  return switch (error.code) {
    'invalid_credentials' => 'E-mail ou senha incorretos.',
    'email_not_confirmed' => 'Confirme seu e-mail antes de entrar.',
    'weak_password' => 'Escolha uma senha mais forte e tente novamente.',
    'otp_expired' =>
      'Código inválido ou expirado. Confira o código ou refaça o cadastro.',
    _ => fallback,
  };
}
