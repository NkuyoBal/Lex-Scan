import * as pdfjsLib from 'pdfjs-dist';
import { DocumentElement, ElementType, TableData } from '../types';

// Set up pdf.js worker
if (typeof window !== 'undefined' && 'Worker' in window) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
  } catch (e) {
    console.warn('PDF.js worker setup warning:', e);
  }
}

export interface RenderedPageResult {
  pageNumber: number;
  canvas: HTMLCanvasElement;
  dataUrl: string;
  width: number;
  height: number;
  digitalTextBlocks: Array<{
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
    fontName: string;
    bold: boolean;
  }>;
  embeddedImages: Array<{
    dataUrl: string;
    bbox: { x: number; y: number; width: number; height: number };
  }>;
}

export async function loadPdfDocument(data: ArrayBuffer | Uint8Array): Promise<pdfjsLib.PDFDocumentProxy> {
  const loadingTask = pdfjsLib.getDocument({
    data,
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist/cmaps/',
    cMapPacked: true,
  });
  return await loadingTask.promise;
}

export async function renderPdfPage(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  scale: number = 2.0
): Promise<RenderedPageResult> {
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Canvas 2D context creation failed');
  }

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: ctx,
    viewport: viewport,
  };

  await page.render(renderContext as any).promise;

  // Extract Digital Text Layer if present
  const digitalTextBlocks: RenderedPageResult['digitalTextBlocks'] = [];
  try {
    const textContent = await page.getTextContent();
    for (const item of textContent.items as any[]) {
      if (item.str && item.str.trim()) {
        const tx = item.transform; // [scaleX, skewY, skewX, scaleY, transX, transY]
        const fontSize = Math.sqrt((tx[0] * tx[0]) + (tx[1] * tx[1]));
        const x = tx[4] * (scale / (viewport.scale || 1));
        const y = viewport.height - (tx[5] * (scale / (viewport.scale || 1)));

        digitalTextBlocks.push({
          text: item.str,
          x,
          y,
          width: item.width * scale,
          height: item.height * scale,
          fontSize,
          fontName: item.fontName || '',
          bold: /bold|black|heavy|medium/i.test(item.fontName || ''),
        });
      }
    }
  } catch (err) {
    console.warn('Could not extract digital text content:', err);
  }

  // Extract page image as data URL
  const dataUrl = canvas.toDataURL('image/png');

  // Detect embedded image candidates (e.g. logos or diagrams on canvas)
  const embeddedImages: RenderedPageResult['embeddedImages'] = [];

  return {
    pageNumber,
    canvas,
    dataUrl,
    width: viewport.width,
    height: viewport.height,
    digitalTextBlocks,
    embeddedImages,
  };
}

// Convert native digital text items into structured elements with table detection
export function reconstructDigitalElements(
  textBlocks: RenderedPageResult['digitalTextBlocks'],
  canvasWidth: number,
  canvasHeight: number
): DocumentElement[] {
  if (!textBlocks || textBlocks.length === 0) return [];

  // Sort blocks top-to-bottom, left-to-right
  const sorted = [...textBlocks].sort((a, b) => {
    if (Math.abs(a.y - b.y) > 6) {
      return a.y - b.y;
    }
    return a.x - b.x;
  });

  // Group into horizontal lines
  const lines: Array<{
    y: number;
    items: typeof textBlocks;
    text: string;
    maxFontSize: number;
    isBold: boolean;
  }> = [];

  for (const item of sorted) {
    const existingLine = lines.find((l) => Math.abs(l.y - item.y) <= 8);
    if (existingLine) {
      existingLine.items.push(item);
      existingLine.items.sort((a, b) => a.x - b.x);
      existingLine.text = existingLine.items.map((i) => i.text).join(' ');
      existingLine.maxFontSize = Math.max(existingLine.maxFontSize, item.fontSize);
      if (item.bold) existingLine.isBold = true;
    } else {
      lines.push({
        y: item.y,
        items: [item],
        text: item.text,
        maxFontSize: item.fontSize,
        isBold: item.bold,
      });
    }
  }

  // Sort lines by y
  lines.sort((a, b) => a.y - b.y);

  const elements: DocumentElement[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.text.trim();

    // Check if line looks like Table row (multiple horizontally spaced items with gaps)
    if (line.items.length >= 2 && line.items.length <= 8) {
      // Check distance between items
      const isSpreadOut = line.items.some((it, idx) => {
        if (idx === 0) return false;
        return (it.x - (line.items[idx - 1].x + line.items[idx - 1].width)) > 20;
      });

      if (isSpreadOut) {
        const tableRows: string[][] = [line.items.map((it) => it.text.trim())];
        let j = i + 1;

        while (j < lines.length) {
          const nextLine = lines[j];
          if (nextLine.items.length >= 2 && Math.abs(nextLine.items.length - line.items.length) <= 1) {
            const nextRow = nextLine.items.map((it) => it.text.trim());
            const maxCols = Math.max(tableRows[0].length, nextRow.length);
            while (nextRow.length < maxCols) nextRow.push('');
            tableRows.push(nextRow.slice(0, maxCols));
            j++;
          } else {
            break;
          }
        }

        if (tableRows.length >= 2) {
          elements.push({
            id: `tbl-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            type: 'table',
            tableData: {
              headers: tableRows[0],
              rows: tableRows.slice(1),
              hasHeaderRow: true,
            },
          });
          i = j;
          continue;
        }
      }
    }

    // Headings (large font size or bold title)
    if (line.maxFontSize > 16 || (line.maxFontSize > 12 && line.isBold && trimmed.length < 70)) {
      const headingType: ElementType = line.maxFontSize > 20 ? 'heading1' : line.maxFontSize > 15 ? 'heading2' : 'heading3';
      elements.push({
        id: `hd-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type: headingType,
        text: trimmed,
        bold: true,
        alignment: line.items[0].x > canvasWidth * 0.25 && line.items[0].x < canvasWidth * 0.4 ? 'center' : 'left',
      });
      i++;
      continue;
    }

    // Bullet Lists
    if (/^[•\-\*]\s+/.test(trimmed)) {
      const listItems: string[] = [trimmed.replace(/^[•\-\*]\s+/, '')];
      let j = i + 1;
      while (j < lines.length && /^[•\-\*]\s+/.test(lines[j].text.trim())) {
        listItems.push(lines[j].text.trim().replace(/^[•\-\*]\s+/, ''));
        j++;
      }
      elements.push({
        id: `list-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type: 'bullet_list',
        listItems,
      });
      i = j;
      continue;
    }

    // Standard Paragraph
    elements.push({
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: 'paragraph',
      text: trimmed,
      alignment: 'justify',
    });
    i++;
  }

  return elements;
}
