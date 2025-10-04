import { toPng } from 'html-to-image';

export async function exportNodeToPng(node, filename = 'export.png') {
  const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
