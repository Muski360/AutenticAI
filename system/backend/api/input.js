export const MAX_TEXT = 20_000;
const MAX_IMAGE = 5 * 1024 * 1024;
const MAX_BODY = MAX_IMAGE + 8192;

export class InputError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function readInput(request) {
  const type = request.headers.get('content-type') ?? '';
  const isJson = /^application\/json(?:;|$)/i.test(type);
  const isForm = /^multipart\/form-data(?:;|$)/i.test(type);
  if (!isJson && !isForm) throw new InputError('Envie texto em JSON ou um print em multipart/form-data.', 415);
  const limit = isJson ? 128 * 1024 : MAX_BODY;
  if (Number(request.headers.get('content-length')) > limit) throw new InputError('Envio muito grande.', 413);
  const reader = request.body?.getReader();
  if (!reader) throw new InputError('Envie texto ou uma imagem.');
  const chunks = [];
  let length = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > limit) {
      await reader.cancel();
      throw new InputError('Envio muito grande.', 413);
    }
    chunks.push(value);
  }
  const payload = new Response(new Blob(chunks), { headers: { 'content-type': type } });
  if (isJson) {
    const body = await payload.json().catch(() => null);
    const text = typeof body?.texto === 'string' ? body.texto.trim() : '';
    if (!text || text.length > MAX_TEXT) throw new InputError('Envie um texto de 1 a 20.000 caracteres.');
    return { text };
  }
  const form = await payload.formData().catch(() => null);
  const image = form?.get('imagem');
  if (!(image instanceof File) || !image.size) throw new InputError('Selecione uma imagem.');
  if (image.size > MAX_IMAGE) throw new InputError('A imagem deve ter até 5 MiB.', 413);
  const signature = new Uint8Array(await image.slice(0, 12).arrayBuffer());
  const matches = (bytes, offset = 0) => bytes.every((byte, index) => byte === signature[index + offset]);
  const valid = {
    'image/png': matches([137, 80, 78, 71, 13, 10, 26, 10]),
    'image/jpeg': matches([255, 216, 255]),
    'image/webp': matches([82, 73, 70, 70]) && matches([87, 69, 66, 80], 8),
  };
  if (valid[image.type] !== true) throw new InputError('Envie uma imagem PNG, JPEG ou WebP válida.', 415);
  const bytes = new Uint8Array(await image.arrayBuffer());
  const binary = [];
  for (let i = 0; i < bytes.length; i += 8192) {
    binary.push(String.fromCharCode(...bytes.subarray(i, i + 8192)));
  }
  return { inlineData: { mimeType: image.type, data: btoa(binary.join('')) } };
}
