import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

import 'analysis_api.dart';
import 'identity.dart';

const android = MethodChannel('autenticai/android');

class Workspace extends StatefulWidget {
  const Workspace({
    super.key,
    required this.api,
    required this.accessToken,
    this.client,
  });
  final Uri api;
  final String? Function() accessToken;
  final http.Client? client;

  @override
  State<Workspace> createState() => _WorkspaceState();
}

class _WorkspaceState extends State<Workspace> {
  final _text = TextEditingController();
  final _scroll = ScrollController();
  late final _api = AnalysisApi(
    widget.api,
    widget.accessToken,
    client: widget.client,
  );
  late final _lifecycle = AppLifecycleListener(onResume: _syncAndroid);
  bool _allowed = false;
  bool _overlay = false;
  AnalysisInput? _preview;
  Json? _report;
  List<Json>? _history;
  int _offset = 0;
  String? _busy;
  String? _error;
  String? _notice;

  @override
  void initState() {
    super.initState();
    _lifecycle;
    android.setMethodCallHandler((call) async {
      if (call.method == 'captureReady') await _syncAndroid();
    });
    unawaited(_syncAndroid());
  }

  Future<void> _syncAndroid() async {
    try {
      final status = await android.invokeMapMethod<String, bool>(
        'overlayStatus',
      );
      if (!mounted) return;
      final capture = await android.invokeMapMethod<String, Object>(
        'takeCapture',
      );
      if (!mounted) return;
      setState(() {
        _allowed = status?['allowed'] ?? false;
        _overlay = status?['active'] ?? false;
        if (capture?['error'] case final String error) {
          _error = error;
        } else if (capture?['image'] case final Uint8List image) {
          _preview = AnalysisInput.image(image);
          _error = null;
          _notice = null;
        }
      });
      if (capture != null) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted && _scroll.hasClients) _scroll.jumpTo(0);
        });
      }
    } on MissingPluginException {
      // O canal está disponível na aplicação Android.
    } on PlatformException catch (error) {
      if (mounted) {
        setState(
          () =>
              _error = error.message ?? 'Não foi possível consultar a captura.',
        );
      }
    } on ApiError catch (error) {
      if (mounted) setState(() => _error = error.message);
    }
  }

  Future<void> _run(String progress, Future<void> Function() action) async {
    if (_busy != null) return;
    setState(() {
      _busy = progress;
      _error = null;
      _notice = null;
    });
    try {
      await action();
    } catch (error) {
      if (!mounted) return;
      setState(
        () => _error = switch (error) {
          ApiError() => error.message,
          PlatformException() =>
            error.message ?? 'O Android não concluiu esta ação.',
          TimeoutException() =>
            'A solicitação demorou demais. Tente novamente.',
          http.ClientException() =>
            'Não foi possível conectar à API. Verifique a conexão.',
          _ => 'Não foi possível concluir esta ação.',
        },
      );
    } finally {
      if (mounted) setState(() => _busy = null);
    }
  }

  void _reviewText() {
    final value = _text.text.trim();
    setState(() {
      _notice = null;
      if (value.isEmpty || value.length > maxText) {
        _error = 'Digite um texto de 1 a 20.000 caracteres.';
      } else {
        _error = null;
        _preview = AnalysisInput.text(value);
      }
    });
  }

  Future<void> _pickImage() => _run('Abrindo seletor…', () async {
    final bytes = await android.invokeMethod<Uint8List>('pickImage');
    if (mounted && bytes != null) {
      setState(() => _preview = AnalysisInput.image(bytes));
    }
  });

  Future<void> _toggleOverlay() => _run('Alterando botão flutuante…', () async {
    if (!_allowed) {
      await android.invokeMethod<void>('overlaySettings');
      return;
    }
    await android.invokeMethod<void>(_overlay ? 'stopOverlay' : 'startOverlay');
    if (mounted) setState(() => _overlay = !_overlay);
  });

  Future<void> _submit(AnalysisInput input) =>
      _run('Analisando conteúdo…', () async {
        final report = await _api.analyze(input);
        if (!mounted) return;
        setState(() {
          if (identical(_preview, input)) _preview = null;
          if (input.text != null) _text.clear();
          _report = report;
          _history = null;
        });
      });

  Future<void> _loadHistory(int offset) =>
      _run('Carregando histórico…', () async {
        final rows = await _api.history(offset);
        if (mounted) {
          setState(() {
            _history = rows;
            _offset = offset;
          });
        }
      });

  Future<void> _delete(String id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Excluir análise?'),
        content: const Text('O relatório será removido do seu histórico.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(backgroundColor: danger),
            child: const Text('Confirmar exclusão'),
          ),
        ],
      ),
    );
    if (!mounted || confirmed != true) return;
    await _run('Excluindo análise…', () async {
      await _api.delete(id);
      if (!mounted) return;
      setState(() {
        _history?.removeWhere((row) => row['id'] == id);
        if (_report?['id'] == id) _report = null;
        _notice = 'Análise excluída.';
      });
    });
  }

  @override
  void dispose() {
    android.setMethodCallHandler(null);
    _lifecycle.dispose();
    _scroll.dispose();
    _text.dispose();
    _api.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final enabled = _busy == null;
    final preview = _preview;
    final report = _report;
    final history = _history;
    final type = Theme.of(context).textTheme;

    return SafeArea(
      top: false,
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 720),
          child: ListView(
            controller: _scroll,
            padding: const EdgeInsets.fromLTRB(16, 24, 16, 32),
            children: [
              if (_busy case final String progress) ...[
                FeedbackLine(progress, progress: true),
                const SizedBox(height: 12),
              ],
              if (_error case final String error) ...[
                FeedbackLine(error, error: true),
                const SizedBox(height: 12),
              ],
              if (_notice case final String notice) ...[
                FeedbackLine(notice),
                const SizedBox(height: 12),
              ],
              if (preview != null)
                Panel(
                  highlight: true,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Eyebrow('Prévia'),
                      const SizedBox(height: 9),
                      Text('Revise o conteúdo', style: type.titleLarge),
                      const SizedBox(height: 14),
                      if (preview.text case final String text)
                        Panel(color: surface, child: SelectableText(text)),
                      if (preview.bytes case final Uint8List bytes)
                        ConstrainedBox(
                          constraints: const BoxConstraints(maxHeight: 360),
                          child: Image.memory(
                            bytes,
                            fit: BoxFit.contain,
                            semanticLabel: 'Prévia do print',
                            errorBuilder: (_, _, _) =>
                                const Text('Não foi possível exibir a imagem.'),
                          ),
                        ),
                      const SizedBox(height: 12),
                      const Text(
                        'Ao confirmar, seu conteúdo será enviado ao Gemini para análise.',
                        style: TextStyle(color: muted),
                      ),
                      const SizedBox(height: 14),
                      FilledButton.icon(
                        onPressed: enabled ? () => _submit(preview) : null,
                        icon: const Icon(Icons.arrow_outward, size: 17),
                        label: const Text('Confirmar envio'),
                      ),
                      TextButton(
                        onPressed: enabled
                            ? () => setState(() {
                                _preview = null;
                                _error = null;
                              })
                            : null,
                        child: const Text('Cancelar prévia'),
                      ),
                    ],
                  ),
                )
              else ...[
                const Eyebrow('Nova análise'),
                const SizedBox(height: 12),
                const DisplayTitle('O que vamos', 'investigar?'),
                const SizedBox(height: 12),
                const Text(
                  'Escolha um texto ou print. Você revisa antes de enviar.',
                  style: TextStyle(color: muted),
                ),
                const SizedBox(height: 18),
                Panel(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      TextField(
                        controller: _text,
                        enabled: enabled,
                        minLines: 3,
                        maxLines: 6,
                        maxLength: maxText,
                        decoration: const InputDecoration(
                          labelText: 'Texto para análise',
                          hintText:
                              'Digite ou cole o texto que você quer investigar.',
                        ),
                      ),
                      FilledButton.icon(
                        onPressed: enabled ? _reviewText : null,
                        icon: const Icon(Icons.arrow_outward, size: 17),
                        label: const Text('Revisar texto'),
                      ),
                      const SizedBox(height: 6),
                      OutlinedButton.icon(
                        onPressed: enabled ? _pickImage : null,
                        icon: const Icon(Icons.image_outlined, size: 18),
                        label: const Text('Escolher print'),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 14),
              Panel(
                color: tint,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Eyebrow('Botão flutuante'),
                    const SizedBox(height: 9),
                    Text('Captura de tela', style: type.titleLarge),
                    const SizedBox(height: 7),
                    const Text(
                      'Habilite o botão flutuante para iniciar uma captura sobre outro app.',
                      style: TextStyle(color: muted),
                    ),
                    const SizedBox(height: 10),
                    OutlinedButton.icon(
                      onPressed: enabled ? _toggleOverlay : null,
                      icon: const Icon(Icons.screenshot_outlined, size: 18),
                      label: Text(
                        _overlay
                            ? 'Desativar botão flutuante'
                            : _allowed
                            ? 'Ativar botão flutuante'
                            : 'Autorizar sobreposição',
                      ),
                    ),
                  ],
                ),
              ),
              if (report != null) ...[
                const SizedBox(height: 24),
                ReportView(report: report),
              ],
              const SizedBox(height: 22),
              Panel(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Eyebrow('Seu espaço de investigação'),
                    const SizedBox(height: 9),
                    Text('Histórico', style: type.titleLarge),
                    const SizedBox(height: 10),
                    OutlinedButton.icon(
                      onPressed: enabled ? () => _loadHistory(0) : null,
                      icon: const Icon(Icons.schedule_outlined, size: 18),
                      label: const Text('Abrir histórico'),
                    ),
                    if (history != null) ...[
                      if (history.isEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 10),
                          child: Text(
                            _offset == 0
                                ? 'Você ainda não tem análises.'
                                : 'Fim do histórico.',
                            style: const TextStyle(color: muted),
                          ),
                        ),
                      for (final item in history) ...[
                        const Divider(height: 20),
                        Text(_historyTitle(item), style: type.titleMedium),
                        Wrap(
                          children: [
                            TextButton(
                              onPressed: enabled
                                  ? () => _run('Carregando análise…', () async {
                                      final detail = await _api.detail(
                                        item['id'] as String,
                                      );
                                      if (mounted) {
                                        setState(() => _report = detail);
                                      }
                                    })
                                  : null,
                              child: const Text('Ver análise'),
                            ),
                            TextButton(
                              style: TextButton.styleFrom(
                                foregroundColor: danger,
                              ),
                              onPressed: enabled
                                  ? () => _delete(item['id'] as String)
                                  : null,
                              child: const Text('Excluir'),
                            ),
                          ],
                        ),
                      ],
                      Wrap(
                        children: [
                          if (_offset > 0)
                            TextButton(
                              onPressed: enabled
                                  ? () => _loadHistory(_offset - 20)
                                  : null,
                              child: const Text('Anterior'),
                            ),
                          if (history.length == 20)
                            TextButton(
                              onPressed: enabled
                                  ? () => _loadHistory(_offset + 20)
                                  : null,
                              child: const Text('Próxima'),
                            ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _historyTitle(Json item) {
    final text = (item['texto_analisado'] as String).trim();
    if (text.isEmpty) return 'Análise de print';
    return text.characters.length > 120
        ? '${text.characters.take(120)}…'
        : text;
  }
}

class ReportView extends StatelessWidget {
  const ReportView({super.key, required this.report});
  final Json report;
  static const _labels = {
    'sustentada': 'Sustentada',
    'contradita': 'Contradita',
    'mista': 'Evidências mistas',
    'inconclusiva': 'Inconclusiva',
  };

  @override
  Widget build(BuildContext context) {
    final claims = (report['afirmacoes'] as List).cast<Json>();
    final sources = (report['fontes'] as List).cast<Json>();
    final type = Theme.of(context).textTheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Eyebrow('Da dúvida à evidência'),
        const SizedBox(height: 9),
        Text(
          'Resultado',
          style: type.headlineMedium?.copyWith(letterSpacing: -1.15),
        ),
        const SizedBox(height: 12),
        Panel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (report['texto_analisado'] case final String text
                  when text.isNotEmpty)
                ExpansionTile(
                  title: const Text('Texto analisado'),
                  children: [SelectableText(text)],
                ),
              if (report['limitacao'] case final String note)
                FeedbackLine(note),
              if (claims.isEmpty)
                const Text('Nenhuma afirmação verificável foi identificada.'),
              for (final (index, claim) in claims.indexed) ...[
                const Divider(height: 24),
                Eyebrow('Afirmação ${index + 1}'),
                const SizedBox(height: 6),
                Text(claim['texto'] as String, style: type.titleMedium),
                const SizedBox(height: 8),
                Verdict(
                  text: _labels[claim['classificacao']] ?? 'Inconclusiva',
                  code: claim['classificacao'],
                ),
                const SizedBox(height: 8),
                Text(claim['justificativa'] as String),
                if (claim['fontes'] case final List refs when refs.isNotEmpty)
                  Text(
                    'Fontes: ${refs.join(', ')}',
                    style: const TextStyle(color: muted),
                  ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 12),
        Panel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Eyebrow('Rastreabilidade'),
              const SizedBox(height: 8),
              Text('Fontes', style: type.titleLarge),
              if (sources.isEmpty)
                const Text(
                  'Nenhuma fonte disponível para este relatório.',
                  style: TextStyle(color: muted),
                ),
              for (final (index, source) in sources.indexed)
                if (Uri.tryParse(source['url'] as String) case final Uri link
                    when link.isScheme('https') || link.isScheme('http'))
                  TextButton.icon(
                    onPressed: () =>
                        launchUrl(link, mode: LaunchMode.externalApplication),
                    icon: const Icon(Icons.arrow_outward, size: 16),
                    label: Text('${index + 1}. ${source['titulo']}'),
                  ),
              if (report['sugestoes_google'] case final String html
                  when html.isNotEmpty)
                SearchSuggestions(key: ValueKey(html), html: html),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Panel(
          color: tint,
          highlight: true,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Eyebrow('Sobre a autoria'),
              const SizedBox(height: 7),
              Text(
                'Indícios de conteúdo gerado por IA',
                style: type.titleMedium,
              ),
              const SizedBox(height: 8),
              Text(
                report['indicios_ia'] as String? ??
                    'O relatório não apontou indícios.',
              ),
              const Text(
                'Indícios não confirmam a autoria do conteúdo.',
                style: TextStyle(color: muted),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class SearchSuggestions extends StatefulWidget {
  const SearchSuggestions({super.key, required this.html});
  final String html;

  @override
  State<SearchSuggestions> createState() => _SearchSuggestionsState();
}

class _SearchSuggestionsState extends State<SearchSuggestions> {
  late final WebViewController controller;

  @override
  void initState() {
    super.initState();
    controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.disabled)
      ..setNavigationDelegate(
        NavigationDelegate(
          onNavigationRequest: (request) {
            final url = Uri.tryParse(request.url);
            if (url != null &&
                url.isScheme('https') &&
                ['www.google.com', 'www.google.com.br'].contains(url.host)) {
              unawaited(launchUrl(url, mode: LaunchMode.externalApplication));
            }
            return NavigationDecision.prevent;
          },
        ),
      )
      ..loadHtmlString("""
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data: https:; base-uri 'none'; form-action 'none'">
${widget.html}
""");
  }

  @override
  Widget build(BuildContext context) =>
      SizedBox(height: 136, child: WebViewWidget(controller: controller));
}
