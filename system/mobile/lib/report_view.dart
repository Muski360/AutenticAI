import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import 'analysis_api.dart';
import 'identity.dart';

class ReportView extends StatelessWidget {
  const ReportView({super.key, required this.report});
  final AnalysisReport report;
  static const _labels = {
    'sustentada': 'Sustentada',
    'contradita': 'Contradita',
    'mista': 'Evidências mistas',
    'inconclusiva': 'Inconclusiva',
  };

  @override
  Widget build(BuildContext context) {
    final claims = report.claims;
    final sources = report.sources;
    final type = Theme.of(context).textTheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Resultado',
          style: type.headlineMedium?.copyWith(letterSpacing: -1.15),
        ),
        const SizedBox(height: 12),
        Panel(
          highlight: true,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (report.text case final String text when text.isNotEmpty)
                ExpansionTile(
                  title: const Text('Texto analisado'),
                  children: [SelectableText(text)],
                ),
              if (report.limitation case final String note) FeedbackLine(note),
              if (claims.isEmpty)
                const Text('Nenhuma afirmação verificável foi identificada.'),
              for (final claim in claims) ...[
                const Divider(height: 24),
                Text(claim.text, style: type.titleMedium),
                const SizedBox(height: 8),
                Verdict(
                  text: _labels[claim.classification] ?? 'Inconclusiva',
                  code: claim.classification,
                ),
                const SizedBox(height: 8),
                Text(claim.explanation),
                if (claim.references.isNotEmpty)
                  Text(
                    'Fontes: ${claim.references.join(', ')}',
                    style: const TextStyle(color: muted),
                  ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 12),
        Panel(
          color: surface,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Fontes', style: type.titleLarge),
              if (sources.isEmpty)
                const Text(
                  'Nenhuma fonte disponível para este relatório.',
                  style: TextStyle(color: muted),
                ),
              for (final (index, source) in sources.indexed) ...[
                const Divider(height: 16),
                if (Uri.tryParse(source.url) case final Uri link
                    when (link.isScheme('https') || link.isScheme('http')) &&
                        link.host.isNotEmpty &&
                        link.userInfo.isEmpty)
                  TextButton.icon(
                    onPressed: () =>
                        launchUrl(link, mode: LaunchMode.externalApplication),
                    icon: const Icon(Icons.arrow_outward, size: 16),
                    iconAlignment: IconAlignment.end,
                    label: Text('${index + 1}. ${source.title}'),
                  )
                else
                  Text('${index + 1}. ${source.title}'),
              ],
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
              Text(
                'Indícios de conteúdo gerado por IA',
                style: type.titleMedium,
              ),
              const SizedBox(height: 8),
              Text(report.aiSignals ?? 'O relatório não apontou indícios.'),
              const Text(
                'Indícios não confirmam autoria.',
                style: TextStyle(color: muted),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
