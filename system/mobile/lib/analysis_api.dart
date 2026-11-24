import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';

const maxText = 20000;
const maxImageBytes = 5 * 1024 * 1024;
typedef Json = Map<String, dynamic>;

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

  Future<Json> analyze(AnalysisInput input) async {
    final endpoint = base.resolve('/analises');
    if (input.bytes case final Uint8List bytes) {
      final file = http.MultipartFile.fromBytes(
        'imagem',
        bytes,
        filename: 'print.${input.mime!.split('/').last}',
        contentType: MediaType.parse(input.mime!),
      );
      final request = http.MultipartRequest('POST', endpoint)..files.add(file);
      return (await _send(request)) as Json;
    }
    final request = http.Request('POST', endpoint)
      ..headers['content-type'] = 'application/json; charset=utf-8'
      ..body = jsonEncode({'texto': input.text});
    return (await _send(request)) as Json;
  }

  Future<List<Json>> history(int offset) async {
    final result = await _send(
      http.Request('GET', base.resolve('/analises?offset=$offset')),
    );
    return (result as List).cast<Json>();
  }

  Future<Json> detail(String id) async =>
      (await _send(
            http.Request(
              'GET',
              base.resolve('/analises/${Uri.encodeComponent(id)}'),
            ),
          ))
          as Json;

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
      throw const ApiError('Entre com Google para continuar.');
    }
    request.headers['authorization'] = 'Bearer $accessToken';
    final response = await _client
        .send(request)
        .then(http.Response.fromStream)
        .timeout(const Duration(seconds: 75));
    if (response.statusCode == 204) return null;
    if (response.statusCode == 401) {
      throw const ApiError('Sua sessão expirou. Saia e entre novamente.');
    }
    Object? data;
    try {
      data = jsonDecode(utf8.decode(response.bodyBytes));
    } on FormatException {
      throw const ApiError('A API retornou uma resposta inválida.');
    }
    if (response.statusCode >= 200 && response.statusCode < 300) return data;
    final error = data is Json ? data['erro'] : null;
    throw ApiError(
      error is String ? error : 'Não foi possível concluir a solicitação.',
    );
  }

  void close() => _client.close();
}
