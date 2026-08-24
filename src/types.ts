export type ElementType =
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'paragraph'
  | 'table'
  | 'bullet_list'
  | 'numbered_list'
  | 'image'
  | 'callout';

export interface TableData {
  headers: string[];
  rows: string[][];
  colWidths?: number[];
  hasHeaderRow?: boolean;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DocumentElement {
  id: string;
  type: ElementType;
  text?: string;
  bold?: boolean;
  italic?: boolean;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  tableData?: TableData;
  listItems?: string[];
  imageDataUrl?: string;
  imageCaption?: string;
  imageWidth?: number;
  imageHeight?: number;
  confidence?: number;
  bbox?: BoundingBox;
  languageDetected?: string;
}

export interface DocumentPage {
  pageNumber: number;
  width: number;
  height: number;
  elements: DocumentElement[];
  pageImageBase64?: string;
  status: 'idle' | 'processing' | 'done' | 'error';
  confidenceScore: number;
  recognizedLanguages: string[];
}

export interface DocumentModel {
  title: string;
  filename: string;
  pageCount: number;
  currentPageIndex: number;
  pages: DocumentPage[];
  author?: string;
  createdAt: string;
}

export interface TesseractLanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  category: 'common' | 'european' | 'asian' | 'african' | 'other' | 'special';
  description: string;
}

export interface TesseractEngineConfig {
  selectedLanguages: string[]; // up to 5 language codes combined
  oem: number; // OCR Engine Mode (1 = LSTM default)
  psm: number; // Page Segmentation Mode (3 = Fully automatic, 6 = Uniform block of text, etc.)
  binarize: boolean;
  contrastBoost: number; // 0 to 100
  grayscale: boolean;
  denoise: boolean;
  sharpen: boolean;
  detectTables: boolean;
  detectImages: boolean;
  detectHeadings: boolean;
  useAiRefinement: boolean;
  preserveLineBreaks: boolean; // Strictly preserve exact line-by-line format from OCR
}

export interface OcrProgressStatus {
  stage: 'idle' | 'rendering_pdf' | 'preprocessing' | 'running_tesseract' | 'analyzing_layout' | 'structuring_tables' | 'finalizing';
  progress: number; // 0 to 100
  message: string;
  currentLanguage?: string;
  engineCount?: number;
}

export interface DocxStyleTheme {
  id: string;
  name: string;
  fontFamily: string;
  primaryColor: string;
  secondaryColor: string;
  heading1Size: number;
  bodySize: number;
  tableHeaderBg: string;
  tableAltRowBg: string;
  tableBorderColor: string;
}

export type ExportOptimizationMode = 'high_fidelity' | 'high_editability';

export interface DocxExportSettings {
  mode: ExportOptimizationMode;
  themeId: string;
  // Table handling
  tableStyle: 'styled_borders' | 'clean_grid' | 'minimal_stripes' | 'plain_editable';
  tableAutoFit: boolean;
  repeatTableHeader: boolean;
  stripedRows: boolean;
  // Heading handling
  headingStyle: 'colored_styled' | 'standard_native' | 'numbered_hierarchy';
  autoHeadingNumbering: boolean;
  keepHeadingsWithNext: boolean;
  // Image handling
  includeImages: boolean;
  imagePlacement: 'centered_block' | 'inline_editable';
  includeCaptions: boolean;
  // Layout & Flow
  pageFlow: 'exact_page_breaks' | 'continuous_flow';
  margins: 'standard' | 'narrow' | 'wide';
  includeHeadersFooters: boolean;
  lineSpacing: 'single' | '1.15' | '1.5';
  preserveLineBreaks: boolean; // Strictly preserve exact line-by-line format in Word .docx
  lineBreakMode?: 'soft_breaks' | 'paragraph_lines'; // Soft breaks (w:br) or individual paragraph lines
}

export interface LanguagePreset {
  id: string;
  name: string;
  description: string;
  languages: string[]; // up to 5 codes
  badge: string;
}
