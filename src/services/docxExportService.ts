import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ImageRun,
  Header,
  Footer,
  PageNumber,
  ShadingType,
} from 'docx';
import { saveAs } from 'file-saver';
import { DocumentModel, DocxStyleTheme, DocxExportSettings } from '../types';

export const DOCX_THEMES: DocxStyleTheme[] = [
  {
    id: 'corporate_blue',
    name: 'Corporativo Moderno (Azul Marino)',
    fontFamily: 'Calibri',
    primaryColor: '1E3A8A', // Deep Navy
    secondaryColor: '3B82F6',
    heading1Size: 32, // in half-points (16pt)
    bodySize: 22, // 11pt
    tableHeaderBg: '1E3A8A',
    tableAltRowBg: 'F1F5F9',
    tableBorderColor: 'CBD5E1',
  },
  {
    id: 'executive_slate',
    name: 'Ejecutivo Elegante (Pizarra & Grafito)',
    fontFamily: 'Aptos',
    primaryColor: '0F172A',
    secondaryColor: '475569',
    heading1Size: 32,
    bodySize: 22,
    tableHeaderBg: '334155',
    tableAltRowBg: 'F8FAFC',
    tableBorderColor: 'E2E8F0',
  },
  {
    id: 'academic_formal',
    name: 'Académico Formal (Times New Roman)',
    fontFamily: 'Times New Roman',
    primaryColor: '111827',
    secondaryColor: '374151',
    heading1Size: 28,
    bodySize: 24, // 12pt
    tableHeaderBg: '374151',
    tableAltRowBg: 'F9FAFB',
    tableBorderColor: '9CA3AF',
  },
  {
    id: 'emerald_clean',
    name: 'Editorial Esmeralda (Verde Bosque)',
    fontFamily: 'Georgia',
    primaryColor: '064E3B',
    secondaryColor: '059669',
    heading1Size: 32,
    bodySize: 22,
    tableHeaderBg: '065F46',
    tableAltRowBg: 'ECFDF5',
    tableBorderColor: 'A7F3D0',
  },
  {
    id: 'minimal_monochrome',
    name: 'Mínimo Monocromático (Escala de Grises)',
    fontFamily: 'Arial',
    primaryColor: '141414',
    secondaryColor: '404040',
    heading1Size: 30,
    bodySize: 22,
    tableHeaderBg: '262626',
    tableAltRowBg: 'F5F5F5',
    tableBorderColor: 'D4D4D4',
  },
];

export const DEFAULT_EXPORT_SETTINGS: DocxExportSettings = {
  mode: 'high_fidelity',
  themeId: 'corporate_blue',
  tableStyle: 'styled_borders',
  tableAutoFit: true,
  repeatTableHeader: true,
  stripedRows: true,
  headingStyle: 'colored_styled',
  autoHeadingNumbering: false,
  keepHeadingsWithNext: true,
  includeImages: true,
  imagePlacement: 'centered_block',
  includeCaptions: true,
  pageFlow: 'exact_page_breaks',
  margins: 'standard',
  includeHeadersFooters: true,
  lineSpacing: '1.15',
  preserveLineBreaks: true,
  lineBreakMode: 'soft_breaks',
};

export const HIGH_EDITABILITY_PRESET: DocxExportSettings = {
  mode: 'high_editability',
  themeId: 'corporate_blue',
  tableStyle: 'plain_editable',
  tableAutoFit: true,
  repeatTableHeader: false,
  stripedRows: false,
  headingStyle: 'standard_native',
  autoHeadingNumbering: false,
  keepHeadingsWithNext: false,
  includeImages: true,
  imagePlacement: 'inline_editable',
  includeCaptions: true,
  pageFlow: 'continuous_flow',
  margins: 'standard',
  includeHeadersFooters: true,
  lineSpacing: '1.15',
  preserveLineBreaks: true,
  lineBreakMode: 'soft_breaks',
};

// Helper to convert base64 data URL to Uint8Array
function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper to convert text with newlines (\n) into line-by-line TextRuns with breaks
function createLineTextRuns(
  text: string,
  options: {
    bold?: boolean;
    italics?: boolean;
    size?: number;
    color?: string;
    font?: string;
    preserveLineBreaks?: boolean;
  }
): TextRun[] {
  const content = text ?? '';
  if (options.preserveLineBreaks === false || !content.includes('\n')) {
    return [
      new TextRun({
        text: content,
        bold: options.bold,
        italics: options.italics,
        size: options.size,
        color: options.color,
        font: options.font,
      }),
    ];
  }

  const lines = content.split('\n');
  return lines.map((line, idx) => {
    return new TextRun({
      text: line,
      break: idx > 0 ? 1 : 0,
      bold: options.bold,
      italics: options.italics,
      size: options.size,
      color: options.color,
      font: options.font,
    });
  });
}

// Convert DocumentModel to genuine Microsoft Word Document with custom settings
export async function exportToDocx(
  docModel: DocumentModel,
  settings: DocxExportSettings = DEFAULT_EXPORT_SETTINGS
): Promise<Blob> {
  const theme = DOCX_THEMES.find((t) => t.id === settings.themeId) || DOCX_THEMES[0];
  const isHighEditability = settings.mode === 'high_editability';

  // Determine line spacing in twentieths of a point (dxa)
  const lineSpacingDxa =
    settings.lineSpacing === 'single' ? 240 : settings.lineSpacing === '1.5' ? 360 : 276;

  // Determine margin sizes in dxa (1 inch = 1440 dxa)
  const marginDxa =
    settings.margins === 'narrow' ? 720 : settings.margins === 'wide' ? 1800 : 1440;

  // Track heading numbering if enabled
  let h1Count = 0;
  let h2Count = 0;
  let h3Count = 0;

  const sections: any[] = [];
  const allContinuousChildren: any[] = [];

  // Group elements page by page or continuous
  for (let pIdx = 0; pIdx < docModel.pages.length; pIdx++) {
    const page = docModel.pages[pIdx];
    const pageChildren: any[] = [];

    for (const el of page.elements) {
      switch (el.type) {
        case 'heading1': {
          h1Count++;
          h2Count = 0;
          h3Count = 0;
          const prefix = settings.autoHeadingNumbering ? `${h1Count}. ` : '';
          const displayText = `${prefix}${el.text || ''}`;

          pageChildren.push(
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              keepNext: settings.keepHeadingsWithNext,
              alignment:
                el.alignment === 'center'
                  ? AlignmentType.CENTER
                  : el.alignment === 'right'
                  ? AlignmentType.RIGHT
                  : AlignmentType.LEFT,
              spacing: { before: 280, after: 120 },
              children: createLineTextRuns(displayText, {
                bold: true,
                size: isHighEditability ? undefined : theme.heading1Size,
                color: isHighEditability && settings.headingStyle === 'standard_native' ? undefined : theme.primaryColor,
                font: isHighEditability ? undefined : theme.fontFamily,
                preserveLineBreaks: settings.preserveLineBreaks,
              }),
            })
          );
          break;
        }

        case 'heading2': {
          h2Count++;
          h3Count = 0;
          const prefix = settings.autoHeadingNumbering ? `${h1Count}.${h2Count} ` : '';
          const displayText = `${prefix}${el.text || ''}`;

          pageChildren.push(
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              keepNext: settings.keepHeadingsWithNext,
              alignment:
                el.alignment === 'center'
                  ? AlignmentType.CENTER
                  : el.alignment === 'right'
                  ? AlignmentType.RIGHT
                  : AlignmentType.LEFT,
              spacing: { before: 200, after: 80 },
              children: createLineTextRuns(displayText, {
                bold: true,
                size: isHighEditability ? undefined : theme.heading1Size - 4,
                color: isHighEditability && settings.headingStyle === 'standard_native' ? undefined : theme.secondaryColor,
                font: isHighEditability ? undefined : theme.fontFamily,
                preserveLineBreaks: settings.preserveLineBreaks,
              }),
            })
          );
          break;
        }

        case 'heading3': {
          h3Count++;
          const prefix = settings.autoHeadingNumbering ? `${h1Count}.${h2Count}.${h3Count} ` : '';
          const displayText = `${prefix}${el.text || ''}`;

          pageChildren.push(
            new Paragraph({
              heading: HeadingLevel.HEADING_3,
              keepNext: settings.keepHeadingsWithNext,
              spacing: { before: 160, after: 60 },
              children: createLineTextRuns(displayText, {
                bold: true,
                size: isHighEditability ? undefined : theme.bodySize + 2,
                color: isHighEditability && settings.headingStyle === 'standard_native' ? undefined : theme.secondaryColor,
                font: isHighEditability ? undefined : theme.fontFamily,
                preserveLineBreaks: settings.preserveLineBreaks,
              }),
            })
          );
          break;
        }

        case 'paragraph': {
          const rawText = el.text || '';
          if (settings.lineBreakMode === 'paragraph_lines' && rawText.includes('\n')) {
            // Split into separate paragraph lines
            const pLines = rawText.split('\n');
            pLines.forEach((pLine, lIdx) => {
              pageChildren.push(
                new Paragraph({
                  alignment:
                    el.alignment === 'center'
                      ? AlignmentType.CENTER
                      : el.alignment === 'right'
                      ? AlignmentType.RIGHT
                      : el.alignment === 'justify'
                      ? AlignmentType.JUSTIFIED
                      : AlignmentType.LEFT,
                  spacing: { after: lIdx === pLines.length - 1 ? 120 : 40, line: lineSpacingDxa },
                  children: [
                    new TextRun({
                      text: pLine,
                      bold: el.bold,
                      italics: el.italic,
                      size: isHighEditability ? 22 : theme.bodySize,
                      font: isHighEditability ? undefined : theme.fontFamily,
                    }),
                  ],
                })
              );
            });
          } else {
            pageChildren.push(
              new Paragraph({
                alignment:
                  el.alignment === 'center'
                    ? AlignmentType.CENTER
                    : el.alignment === 'right'
                    ? AlignmentType.RIGHT
                    : el.alignment === 'justify'
                    ? AlignmentType.JUSTIFIED
                    : AlignmentType.LEFT,
                spacing: { after: 120, line: lineSpacingDxa },
                children: createLineTextRuns(rawText, {
                  bold: el.bold,
                  italics: el.italic,
                  size: isHighEditability ? 22 : theme.bodySize,
                  font: isHighEditability ? undefined : theme.fontFamily,
                  preserveLineBreaks: settings.preserveLineBreaks,
                }),
              })
            );
          }
          break;
        }

        case 'callout':
          if (isHighEditability) {
            // Render as simple italic blockquote paragraph for effortless editing
            pageChildren.push(
              new Paragraph({
                indent: { left: 720 },
                spacing: { before: 100, after: 120, line: lineSpacingDxa },
                children: createLineTextRuns(`"${el.text || ''}"`, {
                  italics: true,
                  size: theme.bodySize,
                  color: '475569',
                  preserveLineBreaks: settings.preserveLineBreaks,
                }),
              })
            );
          } else {
            pageChildren.push(
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        shading: {
                          fill: theme.tableAltRowBg,
                          type: ShadingType.CLEAR,
                        },
                        margins: { top: 120, bottom: 120, left: 180, right: 180 },
                        borders: {
                          left: {
                            style: BorderStyle.SINGLE,
                            size: 18,
                            color: theme.secondaryColor,
                          },
                          top: { style: BorderStyle.NONE },
                          right: { style: BorderStyle.NONE },
                          bottom: { style: BorderStyle.NONE },
                        },
                        children: [
                          new Paragraph({
                            children: createLineTextRuns(el.text || '', {
                              italics: true,
                              size: theme.bodySize,
                              font: theme.fontFamily,
                              color: theme.primaryColor,
                              preserveLineBreaks: settings.preserveLineBreaks,
                            }),
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              })
            );
            pageChildren.push(new Paragraph({ spacing: { after: 100 } }));
          }
          break;

        case 'bullet_list':
          if (el.listItems) {
            for (const itemText of el.listItems) {
              pageChildren.push(
                new Paragraph({
                  bullet: { level: 0 },
                  spacing: { after: 60 },
                  children: createLineTextRuns(itemText, {
                    size: isHighEditability ? 22 : theme.bodySize,
                    font: isHighEditability ? undefined : theme.fontFamily,
                    preserveLineBreaks: settings.preserveLineBreaks,
                  }),
                })
              );
            }
            pageChildren.push(new Paragraph({ spacing: { after: 60 } }));
          }
          break;

        case 'numbered_list':
          if (el.listItems) {
            el.listItems.forEach((itemText, idx) => {
              pageChildren.push(
                new Paragraph({
                  spacing: { after: 60 },
                  children: [
                    new TextRun({
                      text: `${idx + 1}. `,
                      bold: true,
                      size: isHighEditability ? 22 : theme.bodySize,
                      font: isHighEditability ? undefined : theme.fontFamily,
                    }),
                    ...createLineTextRuns(itemText, {
                      size: isHighEditability ? 22 : theme.bodySize,
                      font: isHighEditability ? undefined : theme.fontFamily,
                      preserveLineBreaks: settings.preserveLineBreaks,
                    }),
                  ],
                })
              );
            });
            pageChildren.push(new Paragraph({ spacing: { after: 60 } }));
          }
          break;

        case 'table':
          if (el.tableData && el.tableData.headers && el.tableData.headers.length > 0) {
            const tableRows: TableRow[] = [];
            const isPlainEditable = settings.tableStyle === 'plain_editable' || isHighEditability;
            const isMinimal = settings.tableStyle === 'minimal_stripes';

            // Header Row
            const headerCells = el.tableData.headers.map(
              (headerText) =>
                new TableCell({
                  shading: isPlainEditable
                    ? undefined
                    : {
                        fill: isMinimal ? 'F1F5F9' : theme.tableHeaderBg,
                        type: ShadingType.CLEAR,
                      },
                  margins: { top: 120, bottom: 120, left: 120, right: 120 },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: createLineTextRuns(headerText, {
                        bold: true,
                        color: isPlainEditable || isMinimal ? '141414' : 'FFFFFF',
                        size: theme.bodySize,
                        font: isHighEditability ? undefined : theme.fontFamily,
                        preserveLineBreaks: settings.preserveLineBreaks,
                      }),
                    }),
                  ],
                })
            );
            tableRows.push(
              new TableRow({
                children: headerCells,
                tableHeader: settings.repeatTableHeader,
              })
            );

            // Data Rows
            if (el.tableData.rows) {
              el.tableData.rows.forEach((row, rIdx) => {
                const isAlt = settings.stripedRows && rIdx % 2 === 1 && !isPlainEditable;
                const rowCells = row.map((cellText) => {
                  const isNumeric = /^-?\$?€?£?\d+([.,]\d+)?%?$/.test(cellText.trim());
                  return new TableCell({
                    shading: isAlt
                      ? { fill: theme.tableAltRowBg, type: ShadingType.CLEAR }
                      : undefined,
                    margins: { top: 100, bottom: 100, left: 120, right: 120 },
                    children: [
                      new Paragraph({
                        alignment: isNumeric ? AlignmentType.RIGHT : AlignmentType.LEFT,
                        children: createLineTextRuns(cellText || '', {
                          size: isHighEditability ? 20 : theme.bodySize - 2,
                          font: isHighEditability ? undefined : theme.fontFamily,
                          preserveLineBreaks: settings.preserveLineBreaks,
                        }),
                      }),
                    ],
                  });
                });
                tableRows.push(new TableRow({ children: rowCells }));
              });
            }

            pageChildren.push(
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: tableRows,
              })
            );
            pageChildren.push(new Paragraph({ spacing: { after: 120 } }));
          }
          break;

        case 'image':
          if (settings.includeImages && el.imageDataUrl) {
            try {
              const imgBytes = dataUrlToUint8Array(el.imageDataUrl);
              const maxW = isHighEditability ? 450 : 500;
              const maxH = isHighEditability ? 280 : 300;
              const w = el.imageWidth || 400;
              const h = el.imageHeight || 250;
              const scaleRatio = Math.min(maxW / w, maxH / h, 1);

              pageChildren.push(
                new Paragraph({
                  alignment:
                    settings.imagePlacement === 'centered_block'
                      ? AlignmentType.CENTER
                      : AlignmentType.LEFT,
                  spacing: { before: 120, after: 60 },
                  children: [
                    new ImageRun({
                      data: imgBytes,
                      transformation: {
                        width: Math.round(w * scaleRatio),
                        height: Math.round(h * scaleRatio),
                      },
                    } as any),
                  ],
                })
              );

              if (settings.includeCaptions && el.imageCaption) {
                pageChildren.push(
                  new Paragraph({
                    alignment:
                      settings.imagePlacement === 'centered_block'
                        ? AlignmentType.CENTER
                        : AlignmentType.LEFT,
                    spacing: { after: 120 },
                    children: [
                      new TextRun({
                        text: el.imageCaption,
                        italics: true,
                        size: theme.bodySize - 4,
                        color: '64748B',
                        font: isHighEditability ? undefined : theme.fontFamily,
                      }),
                    ],
                  })
                );
              }
            } catch (err) {
              console.warn('Could not insert image into Word doc:', err);
            }
          }
          break;
      }
    }

    if (settings.pageFlow === 'exact_page_breaks') {
      // Page break between pages (except last)
      if (pIdx < docModel.pages.length - 1) {
        pageChildren.push(
          new Paragraph({
            children: [new TextRun({ text: '' })],
            pageBreakBefore: true,
          })
        );
      }

      sections.push({
        properties: {
          page: {
            margin: {
              top: marginDxa,
              right: marginDxa,
              bottom: marginDxa,
              left: marginDxa,
            },
          },
        },
        headers: settings.includeHeadersFooters
          ? {
              default: new Header({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                      new TextRun({
                        text: docModel.title || 'Documento Convertido',
                        size: 18,
                        color: '94A3B8',
                        font: isHighEditability ? undefined : theme.fontFamily,
                      }),
                    ],
                  }),
                ],
              }),
            }
          : undefined,
        footers: settings.includeHeadersFooters
          ? {
              default: new Footer({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'Página ',
                        size: 18,
                        color: '94A3B8',
                        font: isHighEditability ? undefined : theme.fontFamily,
                      }),
                      new TextRun({
                        children: [PageNumber.CURRENT],
                        size: 18,
                        color: '94A3B8',
                        font: isHighEditability ? undefined : theme.fontFamily,
                      }),
                      new TextRun({
                        text: ' de ',
                        size: 18,
                        color: '94A3B8',
                        font: isHighEditability ? undefined : theme.fontFamily,
                      }),
                      new TextRun({
                        children: [PageNumber.TOTAL_PAGES],
                        size: 18,
                        color: '94A3B8',
                        font: isHighEditability ? undefined : theme.fontFamily,
                      }),
                    ],
                  }),
                ],
              }),
            }
          : undefined,
        children: pageChildren,
      });
    } else {
      // Continuous flow mode: aggregate all children into a single seamless document section
      allContinuousChildren.push(...pageChildren);
      if (pIdx < docModel.pages.length - 1) {
        allContinuousChildren.push(new Paragraph({ spacing: { after: 180 } }));
      }
    }
  }

  // If continuous flow was selected
  if (settings.pageFlow === 'continuous_flow') {
    sections.push({
      properties: {
        page: {
          margin: {
            top: marginDxa,
            right: marginDxa,
            bottom: marginDxa,
            left: marginDxa,
          },
        },
      },
      headers: settings.includeHeadersFooters
        ? {
            default: new Header({
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      text: docModel.title || 'Documento Convertido',
                      size: 18,
                      color: '94A3B8',
                      font: isHighEditability ? undefined : theme.fontFamily,
                    }),
                  ],
                }),
              ],
            }),
          }
        : undefined,
      footers: settings.includeHeadersFooters
        ? {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: 'Página ',
                      size: 18,
                      color: '94A3B8',
                      font: isHighEditability ? undefined : theme.fontFamily,
                    }),
                    new TextRun({
                      children: [PageNumber.CURRENT],
                      size: 18,
                      color: '94A3B8',
                      font: isHighEditability ? undefined : theme.fontFamily,
                    }),
                  ],
                }),
              ],
            }),
          }
        : undefined,
      children: allContinuousChildren,
    });
  }

  const doc = new Document({
    sections,
    title: docModel.title,
    creator: docModel.author || 'PDF to Word Multi-Tesseract Studio',
    description: `Documento convertido desde PDF [Modo: ${
      settings.mode === 'high_fidelity' ? 'Alta Fidelidad' : 'Alta Editabilidad'
    }].`,
  });

  return await Packer.toBlob(doc);
}

// Trigger browser download
export async function downloadDocxFile(
  docModel: DocumentModel,
  settingsOrThemeId: DocxExportSettings | string = DEFAULT_EXPORT_SETTINGS,
  customFilename?: string
): Promise<void> {
  const finalSettings: DocxExportSettings =
    typeof settingsOrThemeId === 'string'
      ? { ...DEFAULT_EXPORT_SETTINGS, themeId: settingsOrThemeId }
      : settingsOrThemeId;

  const blob = await exportToDocx(docModel, finalSettings);
  const finalFilename =
    customFilename ||
    (docModel.filename
      ? docModel.filename.replace(/\.pdf$/i, '.docx')
      : `${docModel.title || 'documento'}.docx`);
  saveAs(blob, finalFilename);
}
