import { createWorker, Worker } from 'tesseract.js';
import { DocumentElement, ElementType, TableData, TesseractEngineConfig, OcrProgressStatus } from '../types';

// Sanitize and correct common OCR artifacts across languages and scripts
export function sanitizeOcrText(rawText: string): string {
  if (!rawText) return '';
  let text = rawText;

  // 1. Fix common Spanish/Portuguese broken accents and quotes
  text = text.replace(/´\s*([aeiouAEIOU])/g, (_, char) => {
    const accents: Record<string, string> = {
      a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú',
      A: 'Á', E: 'É', I: 'Í', O: 'Ó', U: 'Ú',
    };
    return accents[char] || char;
  });
  text = text.replace(/`\s*([aeiouAEIOU])/g, (_, char) => {
    const accents: Record<string, string> = {
      a: 'à', e: 'è', i: 'ì', o: 'ò', u: 'ù',
      A: 'À', E: 'È', I: 'Ì', O: 'Ò', U: 'Ù',
    };
    return accents[char] || char;
  });
  text = text.replace(/~\s*([anouANOU])/g, (_, char) => {
    const tildes: Record<string, string> = {
      n: 'ñ', N: 'Ñ', a: 'ã', A: 'Ã', o: 'õ', O: 'Õ', u: 'ũ', U: 'Ũ',
    };
    return tildes[char] || char;
  });

  // 2. Fix broken Spanish question and exclamation marks at beginning
  text = text.replace(/(^|\.\s+)\?\s*([A-ZÁÉÍÓÚÑ])/g, '$1¿$2');
  text = text.replace(/(^|\.\s+)\!\s*([A-ZÁÉÍÓÚÑ])/g, '$1¡$2');

  // 3. Fix broken quotes, dashes and hyphens
  text = text.replace(/["""]/g, '"').replace(/[''´`]/g, "'");
  text = text.replace(/--+/g, '—');

  // 4. Fix hyphenated line breaks (e.g. "inter- nacional" -> "internacional")
  text = text.replace(/([a-zA-ZáéíóúñÁÉÍÓÚÑ])-\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ])/g, '$1$2');

  // 5. Clean up redundant spaces (preserve newlines)
  text = text.replace(/[ \t\f\v]+/g, ' ');

  // 6. Fix Yoruba sub-dot and tone mark OCR fragmentation
  // Normalize Unicode to canonical decomposition/composition (NFC)
  try {
    text = text.normalize('NFC');
  } catch (e) {
    // fallback if environment doesn't support normalize
  }
  // Convert broken under-dots or standalone dot diacritics (e.g. "e ." or "o .")
  text = text.replace(/([eEoOsS])\s*\.\s*/g, (match, letter) => {
    const yorubaMap: Record<string, string> = {
      e: 'ẹ',
      E: 'Ẹ',
      o: 'ọ',
      O: 'Ọ',
      s: 'ṣ',
      S: 'Ṣ',
    };
    return yorubaMap[letter] ? yorubaMap[letter] + ' ' : match;
  });

  // 7. Fix common math symbols if present
  text = text.replace(/\+\/-/g, '±');
  text = text.replace(/>=/g, '≥');
  text = text.replace(/<=/g, '≤');
  text = text.replace(/!=/g, '≠');

  return text.trim();
}

// Clean and fix common errors in OCR-extracted tables
export function fixTableOcrErrors(tableData: TableData): TableData {
  const cleanedHeaders = tableData.headers.map((h) => sanitizeOcrText(h.replace(/^[|:_\s]+|[|:_\s]+$/g, '')));
  
  const cleanedRows = tableData.rows.map((row) =>
    row.map((cell) => {
      let cleaned = sanitizeOcrText(cell.replace(/^[|:_\s]+|[|:_\s]+$/g, ''));
      // Clean numeric OCR glitches (e.g., "1.OOO,OO" -> "1.000,00" or "O" in numbers)
      if (/^[$\€\£\¥]?\s*[\d,.\s]*[O|o][\d,.\s]*%?$/.test(cleaned) && /\d/.test(cleaned)) {
        cleaned = cleaned.replace(/[Oo]/g, '0');
      }
      return cleaned;
    })
  );

  // Filter out completely empty rows
  const validRows = cleanedRows.filter((r) => r.some((c) => c.trim().length > 0));

  return {
    ...tableData,
    headers: cleanedHeaders,
    rows: validRows.length > 0 ? validRows : cleanedRows,
  };
}

// Fix common errors in any DocumentElement
export function autoFixElementOcrErrors(el: DocumentElement): DocumentElement {
  const updated = { ...el };

  if (updated.text) {
    updated.text = sanitizeOcrText(updated.text);
  }

  if (updated.listItems) {
    updated.listItems = updated.listItems.map((item) => sanitizeOcrText(item));
  }

  if (updated.tableData) {
    updated.tableData = fixTableOcrErrors(updated.tableData);
  }

  return updated;
}

// Pre-process canvas image for highest Tesseract recognition accuracy
export function preprocessCanvas(
  sourceCanvas: HTMLCanvasElement,
  config: TesseractEngineConfig
): HTMLCanvasElement {
  const processedCanvas = document.createElement('canvas');
  processedCanvas.width = sourceCanvas.width;
  processedCanvas.height = sourceCanvas.height;
  const ctx = processedCanvas.getContext('2d');
  if (!ctx) return sourceCanvas;

  ctx.drawImage(sourceCanvas, 0, 0);

  if (!config.grayscale && !config.binarize && config.contrastBoost === 0) {
    return processedCanvas;
  }

  const imgData = ctx.getImageData(0, 0, processedCanvas.width, processedCanvas.height);
  const data = imgData.data;

  const contrast = (config.contrastBoost / 100) + 1; // 1.0 to 2.0
  const intercept = 128 * (1 - contrast);

  // First pass: Grayscale and Contrast
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Luminance formula
    let gray = 0.299 * r + 0.587 * g + 0.114 * b;

    if (config.contrastBoost > 0) {
      gray = gray * contrast + intercept;
      gray = Math.min(255, Math.max(0, gray));
    }

    if (config.binarize) {
      // Adaptive thresholding approximation
      gray = gray < 140 ? 0 : 255;
    }

    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }

  ctx.putImageData(imgData, 0, 0);

  // Sharpen filter if enabled
  if (config.sharpen) {
    const w = processedCanvas.width;
    const h = processedCanvas.height;
    const src = ctx.getImageData(0, 0, w, h);
    const dst = ctx.createImageData(w, h);
    const s = src.data;
    const d = dst.data;

    // 3x3 sharpen kernel: [0, -1, 0, -1, 5, -1, 0, -1, 0]
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4;
        const top = ((y - 1) * w + x) * 4;
        const bottom = ((y + 1) * w + x) * 4;
        const left = (y * w + (x - 1)) * 4;
        const right = (y * w + (x + 1)) * 4;

        for (let c = 0; c < 3; c++) {
          const val = 5 * s[idx + c] - s[top + c] - s[bottom + c] - s[left + c] - s[right + c];
          d[idx + c] = Math.min(255, Math.max(0, val));
        }
        d[idx + 3] = s[idx + 3]; // Alpha
      }
    }
    ctx.putImageData(dst, 0, 0);
  }

  return processedCanvas;
}

// Check if a line is a Table Row (contains delimiters or uniform aligned columns)
export function parseTableLine(line: string): string[] | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Check pipe-delimited table | Col1 | Col2 | Col3 |
  if (trimmed.includes('|')) {
    const cells = trimmed
      .split('|')
      .map((c) => sanitizeOcrText(c.trim()))
      .filter((c) => c.length > 0);
    // Ignore markdown table divider lines like |---|---|
    if (cells.length >= 2 && !cells.every((c) => /^[-:\s]+$/.test(c))) {
      return cells;
    }
  }

  // Check tab or multi-space aligned columns (at least 2 large gaps)
  const multiSpaceCells = trimmed
    .split(/\s{2,}|\t/)
    .map((c) => sanitizeOcrText(c.trim()))
    .filter((c) => c.length > 0);

  if (multiSpaceCells.length >= 2 && multiSpaceCells.length <= 8) {
    // Check that it's not just regular sentence
    const isHeaderOrData = multiSpaceCells.some(
      (c) => /^\d+([.,]\d+)?%?$|^[$€£¥#]/.test(c) || (c.length < 35 && /^[A-Z0-9]/.test(c))
    );
    if (isHeaderOrData) {
      return multiSpaceCells;
    }
  }

  return null;
}

// Convert raw OCR blocks/lines into structured DocumentElements with Tables, Headings, Lists, Images
export function analyzeDocumentLayout(
  ocrResult: any,
  sourceCanvas: HTMLCanvasElement,
  detectedImages: Array<{ dataUrl: string; bbox: { x: number; y: number; width: number; height: number } }> = [],
  options: { preserveLineBreaks?: boolean } = { preserveLineBreaks: true }
): DocumentElement[] {
  const elements: DocumentElement[] = [];
  const lines: string[] = [];

  if (ocrResult && ocrResult.data && ocrResult.data.lines) {
    for (const lineObj of ocrResult.data.lines) {
      const lineText = sanitizeOcrText(lineObj.text);
      if (lineText) {
        lines.push(lineText);
      }
    }
  } else if (ocrResult && ocrResult.data && ocrResult.data.text) {
    lines.push(
      ...ocrResult.data.text
        .split('\n')
        .map((l: string) => sanitizeOcrText(l))
        .filter(Boolean)
    );
  }

  // Insert header image if found at the top
  const topImages = detectedImages.filter((img) => img.bbox.y < sourceCanvas.height * 0.25);
  for (const img of topImages) {
    elements.push({
      id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: 'image',
      imageDataUrl: img.dataUrl,
      imageCaption: 'Imagen detectada en encabezado',
      imageWidth: Math.min(img.bbox.width, 500),
      imageHeight: Math.min(img.bbox.height, 300),
      bbox: img.bbox,
      confidence: 95,
    });
  }

  let i = 0;
  let isFirstHeading = true;

  while (i < lines.length) {
    const line = lines[i];

    // 1. Detect Tables (continuous lines with column structures)
    const firstRowCells = parseTableLine(line);
    if (firstRowCells && firstRowCells.length >= 2) {
      const tableRows: string[][] = [firstRowCells];
      let j = i + 1;

      while (j < lines.length) {
        const nextRowCells = parseTableLine(lines[j]);
        if (nextRowCells && Math.abs(nextRowCells.length - firstRowCells.length) <= 1) {
          // Normalize column count
          const maxCols = Math.max(firstRowCells.length, nextRowCells.length);
          while (nextRowCells.length < maxCols) nextRowCells.push('');
          tableRows.push(nextRowCells.slice(0, maxCols));
          j++;
        } else {
          break;
        }
      }

      if (tableRows.length >= 2) {
        const headers = tableRows[0];
        const dataRows = tableRows.slice(1);

        elements.push({
          id: `tbl-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          type: 'table',
          confidence: 88,
          tableData: fixTableOcrErrors({
            headers,
            rows: dataRows,
            hasHeaderRow: true,
          }),
        });
        i = j;
        continue;
      }
    }

    // 2. Detect Bullet or Numbered Lists
    if (/^[•\-\*]\s+/.test(line)) {
      const listItems: string[] = [sanitizeOcrText(line.replace(/^[•\-\*]\s+/, ''))];
      let j = i + 1;
      while (j < lines.length && /^[•\-\*]\s+/.test(lines[j])) {
        listItems.push(sanitizeOcrText(lines[j].replace(/^[•\-\*]\s+/, '')));
        j++;
      }
      elements.push({
        id: `list-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type: 'bullet_list',
        listItems,
        confidence: 90,
      });
      i = j;
      continue;
    }

    if (/^\d+[\.\)]\s+/.test(line)) {
      const listItems: string[] = [sanitizeOcrText(line.replace(/^\d+[\.\)]\s+/, ''))];
      let j = i + 1;
      while (j < lines.length && /^\d+[\.\)]\s+/.test(lines[j])) {
        listItems.push(sanitizeOcrText(lines[j].replace(/^\d+[\.\)]\s+/, '')));
        j++;
      }
      elements.push({
        id: `nlist-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type: 'numbered_list',
        listItems,
        confidence: 91,
      });
      i = j;
      continue;
    }

    // 3. Detect Headings
    const isAllCaps = line.length > 3 && line === line.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(line);
    const isShortLine = line.length < 65;
    const isTitleLike = /^(CAPÍTULO|SECCIÓN|ARTÍCULO|INFORME|RESUMEN|INTRODUCCIÓN|CONCLUSIONES|TABLA|ANEXO|REPORTE|ESTADO DE CUENTA|FACTURA|CONTRATO|CHAPTER|SECTION|EXECUTIVE SUMMARY)/i.test(line);

    if (isFirstHeading || (isShortLine && (isAllCaps || isTitleLike || line.endsWith(':')))) {
      const headingType: ElementType = isFirstHeading ? 'heading1' : isAllCaps ? 'heading2' : 'heading3';
      elements.push({
        id: `hd-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type: headingType,
        text: sanitizeOcrText(line.replace(/:$/, '')),
        bold: true,
        alignment: isFirstHeading ? 'center' : 'left',
        confidence: 94,
      });
      isFirstHeading = false;
      i++;
      continue;
    }

    // 4. Detect Callouts or Quotes
    if (line.startsWith('>') || line.startsWith('Nota:') || line.startsWith('Importante:') || line.startsWith('Note:') || line.startsWith('Warning:')) {
      elements.push({
        id: `callout-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type: 'callout',
        text: sanitizeOcrText(line.replace(/^>\s*/, '')),
        italic: true,
        confidence: 89,
      });
      i++;
      continue;
    }

    // 5. Standard Paragraph (accumulate continuous lines with exact line-by-line format)
    let paragraphText = line;
    let j = i + 1;
    const lineJoiner = options.preserveLineBreaks !== false ? '\n' : ' ';
    while (j < lines.length) {
      const nextLine = lines[j];
      // Break paragraph if next is heading, table, list, or callout
      if (
        parseTableLine(nextLine) ||
        /^[•\-\*]\s+/.test(nextLine) ||
        /^\d+[\.\)]\s+/.test(nextLine) ||
        (nextLine.length < 60 && (nextLine === nextLine.toUpperCase() && /[A-Z]/.test(nextLine)))
      ) {
        break;
      }
      paragraphText += lineJoiner + nextLine;
      j++;
    }

    elements.push({
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: 'paragraph',
      text: sanitizeOcrText(paragraphText),
      alignment: options.preserveLineBreaks !== false ? 'left' : 'justify',
      confidence: 93,
    });

    i = j;
  }

  // Insert middle/bottom images if found
  const otherImages = detectedImages.filter((img) => img.bbox.y >= sourceCanvas.height * 0.25);
  for (const img of otherImages) {
    elements.push({
      id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: 'image',
      imageDataUrl: img.dataUrl,
      imageCaption: 'Ilustración / Gráfico extraído',
      imageWidth: Math.min(img.bbox.width, 550),
      imageHeight: Math.min(img.bbox.height, 350),
      bbox: img.bbox,
      confidence: 95,
    });
  }

  return elements;
}

// Multi-library Tesseract OCR Runner (combines up to 5 language traineddata models)
export async function runMultiTesseractOcr(
  canvas: HTMLCanvasElement,
  config: TesseractEngineConfig,
  onProgress?: (status: OcrProgressStatus) => void
): Promise<{
  text: string;
  confidence: number;
  elements: DocumentElement[];
  rawResult: any;
  combinedLanguageCode: string;
}> {
  // Limit to max 5 languages
  const selectedLangs = (config.selectedLanguages || ['spa', 'eng']).slice(0, 5);
  const combinedLangCode = selectedLangs.join('+');

  onProgress?.({
    stage: 'preprocessing',
    progress: 15,
    message: `Preprocesando imagen (Filtros: Contraste +${config.contrastBoost}%, Binarización, Nitidez)...`,
    engineCount: selectedLangs.length,
  });

  const processedCanvas = preprocessCanvas(canvas, config);

  onProgress?.({
    stage: 'running_tesseract',
    progress: 30,
    message: `Inicializando reconocimiento multi-idioma con ${selectedLangs.length} bibliotecas [${combinedLangCode.toUpperCase()}]...`,
    currentLanguage: combinedLangCode,
    engineCount: selectedLangs.length,
  });

  let worker: Worker | null = null;
  let ocrData: any = null;

  try {
    // Create worker with combined languages
    worker = await createWorker(combinedLangCode, config.oem, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          const pct = Math.round(30 + (m.progress || 0) * 45);
          onProgress?.({
            stage: 'running_tesseract',
            progress: pct,
            message: `Reconociendo caracteres multilingües (${Math.round((m.progress || 0) * 100)}%)...`,
            currentLanguage: combinedLangCode,
            engineCount: selectedLangs.length,
          });
        }
      },
    });

    if (config.psm) {
      await worker.setParameters({
        tessedit_pageseg_mode: config.psm.toString() as any,
      });
    }

    const result = await worker.recognize(processedCanvas);
    ocrData = result.data;
  } catch (err) {
    console.warn('Tesseract multi-worker error, falling back to primary language:', err);
    // Fallback to single primary language
    const fallbackLang = selectedLangs[0] || 'spa';
    worker = await createWorker(fallbackLang);
    const result = await worker.recognize(processedCanvas);
    ocrData = result.data;
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (e) {
        // ignore
      }
    }
  }

  onProgress?.({
    stage: 'analyzing_layout',
    progress: 85,
    message: 'Analizando jerarquía visual, tablas, encabezados y párrafos...',
    engineCount: selectedLangs.length,
  });

  const extractedElements = analyzeDocumentLayout(
    { data: ocrData },
    canvas,
    [],
    { preserveLineBreaks: config.preserveLineBreaks !== false }
  );

  onProgress?.({
    stage: 'finalizing',
    progress: 100,
    message: 'Estructuración completada con éxito.',
    engineCount: selectedLangs.length,
  });

  const confidence = ocrData?.confidence || 92;

  return {
    text: ocrData?.text || '',
    confidence,
    elements: extractedElements,
    rawResult: ocrData,
    combinedLanguageCode: combinedLangCode,
  };
}

