// Redimensiona e comprime uma imagem no navegador antes do upload.
// Gera um WebP quadrado (crop central) leve, ideal para logos/avatares.
export const LOGO_SIZE_PX = 256;
export const LOGO_MAX_INPUT_BYTES = 5 * 1024 * 1024; // 5 MB — limite do arquivo original
export const LOGO_ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export async function processLogoFile(file: File): Promise<Blob> {
  if (!LOGO_ACCEPTED_TYPES.includes(file.type)) {
    throw new Error('Formato não suportado. Use PNG, JPG ou WebP.');
  }
  if (file.size > LOGO_MAX_INPUT_BYTES) {
    throw new Error('Arquivo muito grande. Envie uma imagem de até 5 MB.');
  }

  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = LOGO_SIZE_PX;
  canvas.height = LOGO_SIZE_PX;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível processar a imagem.');

  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, LOGO_SIZE_PX, LOGO_SIZE_PX);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', 0.85)
  );
  if (!blob) throw new Error('Não foi possível comprimir a imagem.');
  return blob;
}
