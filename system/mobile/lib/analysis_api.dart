import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';

const maxText = 20000;
const maxImageBytes = 5 * 1024 * 1024;
const historyPageSize = 20;

typedef AnalysisSummary = ({String id, String text});
typedef AnalysisClaim = ({
  String text,
  String classification,
  String explanation,
  List<int> references,
});
typedef AnalysisSource = ({String title, String url});
typedef AnalysisReport = ({
  String id,
  String? text,
  String? aiSignals,
  String? limitation,
  List<AnalysisClaim> claims,
  List<AnalysisSource> sources,
});

class ApiError implements Exception {
  const ApiError(this.message);
  final String message;
}

class AnalysisInput {
  const AnalysisInput.text(this.text) : bytes = null, mime = null;
  AnalysisInput.image(Uint8List image)
    : bytes = image,
      text = null,
      mime = imageMime(image);
  final String? text;
  final Uint8List? bytes;
  final String? mime;
}

String imageMime(Uint8List bytes) {
  if (bytes.length > maxImageBytes) {
    throw const ApiError('O print deve ter até 5 MiB.');
  }
  bool matches(List<int> signature, [int offset = 0]) {
    if (bytes.length < offset + signature.length) return false;
    for (var i = 0; i < signature.length; i++) {
      if (bytes[offset + i] != signature[i]) return false;
    }
    return true;
  }

  if (matches([137, 80, 78, 71, 13, 10, 26, 10])) return 'image/png';
  if (matches([255, 216, 255])) return 'image/jpeg';
  if (matches([82, 73, 70, 70]) && matches([87, 69, 66, 80], 8)) {
    return 'image/webp';
  }
  throw const ApiError('Selecione um print válido em PNG, JPEG ou WebP.');
}

class AnalysisApi {
  AnalysisApi(this.base, this.token, {http.Client? client})
    : _client = client ?? http.Client();
  final Uri base;
  final String? Function() token;
  final http.Client _client;

  Future<AnalysisReport> analyze(AnalysisInput input) async {
    final endpoint = base.resolve('/analises');
    if (input.bytes case final Uint8List bytes) {
      final file = http.MultipartFile.fromBytes(
        'imagem',
        bytes,
        filename: 'print.${input.mime!.split('/').last}',
        contentType: MediaType.parse(input.mime!),
      );
      final request = http.MultipartRequest('POST', endpoint)..files.add(file);
      return _readReport(await _send(request));
    }
    final request = http.Request('POST', endpoint)
      ..headers['content-type'] = 'application/json; charset=utf-8'
      ..body = jsonEncode({'texto': input.text});
    return _readReport(await _send(request));
  }

  Future<List<AnalysisSummary>> history(int offset) async {
    final result = await _send(
      http.Request('GET', base.resolve('/analises?offset=$offset')),
    );
    if (result is! List) throw _invalidResponse;
    return result
        .map(
          (item) => switch (item) {
            {'id': final String id, 'texto_analisado': final String text} => (
              id: id,
              text: text,
            ),
            _ => throw _invalidResponse,
          },
        )
        .toList();
  }

  Future<AnalysisReport> detail(String id) async => _readReport(
    await _send(
      http.Request('GET', base.resolve('/analises/${Uri.encodeComponent(id)}')),
    ),
  );

  Future<void> delete(String id) async {
    await _send(
      http.Request(
        'DELETE',
        base.resolve('/analises/${Uri.encodeComponent(id)}'),
      ),
    );
  }

  Future<Object?> _send(http.BaseRequest request) async {
    final accessToken = token();
    if (accessToken == null) {
      throw const ApiError('Entre com sua conta para continuar.');
    }
    request.headers['authorization'] = 'Bearer $accessToken';
    // A análise de um print pode usar quatro chamadas externas antes de salvar.
    final timeout = Duration(seconds: request.method == 'POST' ? 135 : 25);
    final response = await _client
        .send(request)
        .then(http.Response.fromStream)
        .timeout(timeout);
    if (response.statusCode == 204) return null;
    if (response.statusCode == 401) {
      throw const ApiError('Sua sessão expirou. Saia e entre novamente.');
    }
    final ok = response.statusCode >= 200 && response.statusCode < 300;
    const requestFailed = ApiError('Não foi possível concluir a solicitação.');
    Object? data;
    try {
      data = jsonDecode(utf8.decode(response.bodyBytes));
    } on FormatException {
      throw ok ? _invalidResponse : requestFailed;
    }
    if (ok) return data;
    if (data case {'erro': final String message}) throw ApiError(message);
    throw requestFailed;
  }

  void close() => _client.close();
}

const _invalidResponse = ApiError('A API retornou uma resposta inválida.');

AnalysisReport _readReport(Object? data) {
  if (data case {
    'id': final String id,
    'afirmacoes': final List claims,
    'fontes': final List sources,
  }) {
    return (
      id: id,
      text: _optionalText(data['texto_analisado']),
      aiSignals: _optionalText(data['indicios_ia']),
      limitation: _optionalText(data['limitacao']),
      claims: claims
          .map(
            (claim) => switch (claim) {
              {
                'texto': final String text,
                'classificacao': final String classification,
                'justificativa': final String explanation,
                'fontes': final List references,
              } =>
                (
                  text: text,
                  classification: classification,
                  explanation: explanation,
                  references: references.whereType<int>().toList(),
                ),
              _ => throw _invalidResponse,
            },
          )
          .toList(),
      sources: sources
          .map(
            (source) => switch (source) {
              {'titulo': final String title, 'url': final String url} => (
                title: title,
                url: url,
              ),
              _ => throw _invalidResponse,
            },
          )
          .toList(),
    );
  }
  throw _invalidResponse;
}

String? _optionalText(Object? value) => value is String ? value : null;
