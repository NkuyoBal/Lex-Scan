import React, { useState, useEffect } from 'react';
import {
  DocumentModel,
  DocumentPage,
  DocumentElement,
  TesseractEngineConfig,
  OcrProgressStatus,
} from './types';
import { DEFAULT_TESSERACT_CONFIG } from './services/languageRegistry';
import { getInitialSampleDocument, generateSampleCanvas } from './services/samplePdfs';
import { runMultiTesseractOcr } from './services/tesseractService';
import { loadPdfDocument, renderPdfPage, reconstructDigitalElements } from './services/pdfService';
import { Navbar } from './components/Navbar';
import { TesseractConfigPanel } from './components/TesseractConfigPanel';
import { FileUploadZone } from './components/FileUploadZone';
import { PdfPageViewer } from './components/PdfPageViewer';
import { DocumentEditor } from './components/DocumentEditor';
import { ExportModal } from './components/ExportModal';
import { ConfidenceMetrics } from './components/ConfidenceMetrics';
import {
  Columns,
  Maximize2,
  Minimize2,
  Sparkles,
  UploadCloud,
  Download,
  Sliders,
  CheckCircle2,
  FileText,
} from 'lucide-react';

export default function App() {
  // Main State
  const [document, setDocument] = useState<DocumentModel>(() => getInitialSampleDocument());
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [config, setConfig] = useState<TesseractEngineConfig>(DEFAULT_TESSERACT_CONFIG);

  // Modal / UI States
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'split' | 'pdf' | 'editor'>('split');

  // OCR Processing States
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [ocrProgress, setOcrProgress] = useState<OcrProgressStatus | null>(null);

  // Handle PDF file uploaded by user
  const handlePdfUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      setOcrProgress({
        stage: 'rendering_pdf',
        progress: 10,
        message: 'Cargando y renderizando páginas del PDF...',
        engineCount: config.selectedLanguages.length,
      });

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await loadPdfDocument(arrayBuffer);
      const pageCount = pdfDoc.numPages;

      const newPages: DocumentPage[] = [];

      // Process first page (or all up to 10 for performance)
      const maxPagesToProcess = Math.min(pageCount, 5);

      for (let pNum = 1; pNum <= maxPagesToProcess; pNum++) {
        setOcrProgress({
          stage: 'rendering_pdf',
          progress: Math.round((pNum / maxPagesToProcess) * 25),
          message: `Renderizando página ${pNum} de ${pageCount} en alta resolución...`,
          engineCount: config.selectedLanguages.length,
        });

        const rendered = await renderPdfPage(pdfDoc, pNum, 2.0);

        // Try Digital text extraction first if available
        let extractedElements: DocumentElement[] = [];
        let confidenceScore = 95;

        if (rendered.digitalTextBlocks && rendered.digitalTextBlocks.length > 5) {
          extractedElements = reconstructDigitalElements(
            rendered.digitalTextBlocks,
            rendered.width,
            rendered.height
          );
          confidenceScore = 99.2;
        }

        // If scanned page or few text blocks, run Tesseract Multi-Language OCR
        if (extractedElements.length === 0) {
          const ocrResult = await runMultiTesseractOcr(
            rendered.canvas,
            config,
            (prog) => setOcrProgress(prog)
          );
          extractedElements = ocrResult.elements;
          confidenceScore = ocrResult.confidence;
        }

        // Optional AI Refinement via Server API if enabled
        if (config.useAiRefinement && extractedElements.length > 0) {
          try {
            setOcrProgress({
              stage: 'analyzing_layout',
              progress: 90,
              message: 'Refinando estructura de tablas mediante IA...',
            });

            const res = await fetch('/api/ocr/enhance-structure', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageBase64: rendered.dataUrl,
                ocrRawText: extractedElements.map((e) => e.text || '').join('\n'),
                languageCombination: config.selectedLanguages.join('+'),
              }),
            });

            const data = await res.json();
            if (data.success && data.enhanced && data.enhanced.elements) {
              const aiElements: DocumentElement[] = data.enhanced.elements.map(
                (item: any, idx: number) => ({
                  id: `ai-${Date.now()}-${idx}`,
                  type: item.type || 'paragraph',
                  text: item.text,
                  bold: item.bold,
                  italic: item.italic,
                  alignment: item.alignment || 'justify',
                  tableData: item.tableData,
                  listItems: item.listItems,
                })
              );
              if (aiElements.length > 0) {
                extractedElements = aiElements;
              }
            }
          } catch (e) {
            console.warn('AI structure refinement fallback to local Tesseract parser:', e);
          }
        }

        newPages.push({
          pageNumber: pNum,
          width: rendered.width,
          height: rendered.height,
          elements: extractedElements,
          pageImageBase64: rendered.dataUrl,
          status: 'done',
          confidenceScore,
          recognizedLanguages: config.selectedLanguages,
        });
      }

      const newDoc: DocumentModel = {
        title: file.name.replace(/\.pdf$/i, ''),
        filename: file.name,
        pageCount,
        currentPageIndex: 0,
        author: 'PDF to Word Multi-Tesseract',
        createdAt: new Date().toLocaleDateString('es-ES'),
        pages: newPages,
      };

      setDocument(newDoc);
      setCurrentPageIndex(0);
      setIsProcessing(false);
      setIsUploadOpen(false);
      setOcrProgress(null);
    } catch (err: any) {
      console.error('Error processing PDF:', err);
      alert(`Error al procesar el archivo PDF: ${err.message || 'Formato no soportado'}`);
      setIsProcessing(false);
      setOcrProgress(null);
    }
  };

  // Load sample documents
  const handleLoadSample = async (sampleId: 'financial' | 'legal' | 'scientific') => {
    setIsProcessing(true);
    setOcrProgress({
      stage: 'running_tesseract',
      progress: 40,
      message: `Cargando plantilla de ejemplo "${sampleId}" con tablas y multi-idioma...`,
      engineCount: config.selectedLanguages.length,
    });

    setTimeout(async () => {
      const { canvas, dataUrl } = generateSampleCanvas(sampleId);

      // Run OCR layout analysis
      const ocrResult = await runMultiTesseractOcr(
        canvas,
        config,
        (prog) => setOcrProgress(prog)
      );

      let sampleTitle = 'Informe Financiero Trimestral';
      if (sampleId === 'legal') sampleTitle = 'Contrato Marco de Servicios Internacional';
      if (sampleId === 'scientific') sampleTitle = 'Reconocimiento Multilingüe y Tablas';

      const sampleDoc: DocumentModel = {
        title: sampleTitle,
        filename: `${sampleId}_documento.pdf`,
        pageCount: 1,
        currentPageIndex: 0,
        author: 'División Corporativa',
        createdAt: new Date().toLocaleDateString('es-ES'),
        pages: [
          {
            pageNumber: 1,
            width: canvas.width,
            height: canvas.height,
            elements: ocrResult.elements.length > 0 ? ocrResult.elements : getInitialSampleDocument().pages[0].elements,
            pageImageBase64: dataUrl,
            status: 'done',
            confidenceScore: ocrResult.confidence || 98.4,
            recognizedLanguages: config.selectedLanguages,
          },
        ],
      };

      setDocument(sampleDoc);
      setCurrentPageIndex(0);
      setIsProcessing(false);
      setOcrProgress(null);
    }, 300);
  };

  // Re-process current page with current Tesseract configuration
  const handleReProcessCurrentPage = async () => {
    const currentPage = document.pages[currentPageIndex];
    if (!currentPage || !currentPage.pageImageBase64) return;

    try {
      setIsProcessing(true);
      const img = new Image();
      img.src = currentPage.pageImageBase64;
      await new Promise((resolve) => (img.onload = resolve));

      const canvas = window.document.createElement('canvas');
      canvas.width = img.width || 1200;
      canvas.height = img.height || 1600;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(img, 0, 0);

      const ocrResult = await runMultiTesseractOcr(
        canvas,
        config,
        (prog) => setOcrProgress(prog)
      );

      const updatedPages = [...document.pages];
      updatedPages[currentPageIndex] = {
        ...currentPage,
        elements: ocrResult.elements,
        confidenceScore: ocrResult.confidence,
        recognizedLanguages: config.selectedLanguages,
      };

      setDocument({ ...document, pages: updatedPages });
      setIsProcessing(false);
      setOcrProgress(null);
    } catch (err) {
      console.error('Error reprocessing page:', err);
      setIsProcessing(false);
      setOcrProgress(null);
    }
  };

  // Update elements on current page
  const handleUpdateCurrentPageElements = (newElements: DocumentElement[]) => {
    const updatedPages = [...document.pages];
    if (updatedPages[currentPageIndex]) {
      updatedPages[currentPageIndex] = {
        ...updatedPages[currentPageIndex],
        elements: newElements,
      };
      setDocument({ ...document, pages: updatedPages });
    }
  };

  // Update document title
  const handleUpdateDocumentTitle = (newTitle: string) => {
    setDocument({ ...document, title: newTitle });
  };

  return (
    <div className="min-h-screen bg-[#141414] text-[#E4E3E0] flex flex-col font-sans selection:bg-[#E4E3E0] selection:text-[#141414]">
      {/* Top Navigation */}
      <Navbar
        config={config}
        onOpenConfig={() => setIsConfigOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onLoadSample={handleLoadSample}
        hasDocument={document.pages.length > 0}
        isProcessing={isProcessing}
        confidenceScore={document.pages[currentPageIndex]?.confidenceScore}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-5 lg:px-6 py-3 flex flex-col space-y-3">
        {/* Document Stats & Quick Controls Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2.5">
          <ConfidenceMetrics
            document={document}
            config={config}
            currentPageIndex={currentPageIndex}
          />

          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#E4E3E0] border-2 border-[#141414] shadow-[3px_3px_0px_#000000] p-0.5">
            <button
              id="view-mode-split"
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 text-[11px] font-mono font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-[#141414] text-white'
                  : 'text-[#141414] hover:bg-[#D6D5D1]'
              }`}
              title="Split View (Original PDF + Word Editor)"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>SPLIT_VIEW</span>
            </button>
            <button
              id="view-mode-editor"
              onClick={() => setViewMode('editor')}
              className={`px-2.5 py-1 text-[11px] font-mono font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                viewMode === 'editor'
                  ? 'bg-[#141414] text-white'
                  : 'text-[#141414] hover:bg-[#D6D5D1]'
              }`}
              title="Word Editor Only"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>EDITOR_ONLY</span>
            </button>
            <button
              id="view-mode-pdf"
              onClick={() => setViewMode('pdf')}
              className={`px-2.5 py-1 text-[11px] font-mono font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                viewMode === 'pdf'
                  ? 'bg-[#141414] text-white'
                  : 'text-[#141414] hover:bg-[#D6D5D1]'
              }`}
              title="Original PDF Only"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>PDF_ONLY</span>
            </button>
          </div>
        </div>

        {/* Studio Workspace: Split or Single View */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[680px]">
          {/* Left Column: PDF Page Viewer */}
          {(viewMode === 'split' || viewMode === 'pdf') && (
            <div
              className={`h-[720px] transition-all ${
                viewMode === 'split' ? 'lg:col-span-5' : 'lg:col-span-12'
              }`}
            >
              <PdfPageViewer
                document={document}
                currentPageIndex={currentPageIndex}
                onPageChange={(idx) => setCurrentPageIndex(idx)}
                onReProcessPage={handleReProcessCurrentPage}
                isProcessing={isProcessing}
              />
            </div>
          )}

          {/* Right Column: High-Fidelity Word Structured Editor */}
          {(viewMode === 'split' || viewMode === 'editor') && (
            <div
              className={`h-[720px] transition-all ${
                viewMode === 'split' ? 'lg:col-span-7' : 'lg:col-span-12'
              }`}
            >
              <DocumentEditor
                document={document}
                currentPageIndex={currentPageIndex}
                onUpdateElements={handleUpdateCurrentPageElements}
                onUpdateDocumentTitle={handleUpdateDocumentTitle}
              />
            </div>
          )}
        </div>
      </main>

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-fade-in">
          <div className="bg-[#E4E3E0] border-2 border-[#141414] w-full max-w-2xl shadow-[8px_8px_0px_#000000] p-6 relative">
            <button
              onClick={() => setIsUploadOpen(false)}
              className="absolute top-3.5 right-3.5 p-1 bg-[#141414] text-white hover:bg-black font-mono text-xs border border-[#141414] transition cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-sm font-mono font-black text-[#141414] uppercase tracking-wider mb-0.5">
              UPLOAD // INGEST_PDF_SOURCE
            </h3>
            <p className="text-[10px] text-[#141414]/70 font-mono mb-4">
              Direct pipeline ingestion with automated table segmentation and multi-engine OCR synthesis.
            </p>

            <FileUploadZone
              onFileSelect={handlePdfUpload}
              onLoadSample={handleLoadSample}
              isProcessing={isProcessing}
              ocrProgress={ocrProgress}
              config={config}
            />
          </div>
        </div>
      )}

      {/* Tesseract Config Modal */}
      <TesseractConfigPanel
        config={config}
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onSave={(newCfg) => {
          setConfig(newCfg);
        }}
        onReProcessCurrentPage={handleReProcessCurrentPage}
      />

      {/* Export to Word Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        document={document}
      />
    </div>
  );
}
