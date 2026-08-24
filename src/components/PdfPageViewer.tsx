import React, { useState } from 'react';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Eye, RefreshCw, Layers, ShieldCheck } from 'lucide-react';
import { DocumentModel } from '../types';

interface PdfPageViewerProps {
  document: DocumentModel;
  currentPageIndex: number;
  onPageChange: (index: number) => void;
  onReProcessPage: () => void;
  isProcessing: boolean;
}

export const PdfPageViewer: React.FC<PdfPageViewerProps> = ({
  document,
  currentPageIndex,
  onPageChange,
  onReProcessPage,
  isProcessing,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showOverlays, setShowOverlays] = useState<boolean>(true);

  const currentPage = document.pages[currentPageIndex] || document.pages[0];

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 20, 200));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 20, 50));

  return (
    <div className="bg-[#E4E3E0] border-2 border-[#141414] overflow-hidden flex flex-col h-full shadow-[4px_4px_0px_#141414]">
      {/* Top Toolbar */}
      <div className="px-3 py-2 border-b-2 border-[#141414] bg-[#D6D5D1] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono font-black text-[#141414] uppercase tracking-wider flex items-center space-x-1.5">
            <Eye className="w-3.5 h-3.5 text-[#141414]" />
            <span>01 // ORIGINAL_PDF_SOURCE</span>
          </span>
          {currentPage && (
            <span className="text-[10px] px-1.5 py-0.5 bg-[#141414] text-[#E4E3E0] font-mono font-bold flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3 text-[#E4E3E0]" />
              <span>{currentPage.confidenceScore.toFixed(1)}%</span>
            </span>
          )}
        </div>

        {/* Page Navigation & Zoom */}
        <div className="flex items-center space-x-1.5 font-mono text-xs">
          {/* Overlays toggle */}
          <button
            id="btn-toggle-overlays"
            onClick={() => setShowOverlays(!showOverlays)}
            className={`px-2 py-1 text-[11px] font-bold border border-[#141414] flex items-center space-x-1 transition cursor-pointer uppercase ${
              showOverlays
                ? 'bg-[#141414] text-white'
                : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
            }`}
            title="Toggle structure bounding overlays"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">OVERLAYS</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-white border border-[#141414]">
            <button
              id="btn-zoom-out"
              onClick={handleZoomOut}
              className="px-1.5 py-1 text-[#141414] hover:bg-[#E4E3E0] transition"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1.5 text-[#141414] font-bold min-w-8 text-center border-x border-[#141414]">
              {zoomLevel}%
            </span>
            <button
              id="btn-zoom-in"
              onClick={handleZoomIn}
              className="px-1.5 py-1 text-[#141414] hover:bg-[#E4E3E0] transition"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Page Carousel Buttons */}
          {document.pages.length > 1 && (
            <div className="flex items-center bg-white border border-[#141414]">
              <button
                id="btn-prev-page"
                onClick={() => onPageChange(Math.max(0, currentPageIndex - 1))}
                disabled={currentPageIndex === 0}
                className="px-1.5 py-1 text-[#141414] hover:bg-[#E4E3E0] disabled:opacity-30 transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono px-1.5 text-[#141414] font-bold border-x border-[#141414]">
                {currentPageIndex + 1}/{document.pages.length}
              </span>
              <button
                id="btn-next-page"
                onClick={() => onPageChange(Math.min(document.pages.length - 1, currentPageIndex + 1))}
                disabled={currentPageIndex === document.pages.length - 1}
                className="px-1.5 py-1 text-[#141414] hover:bg-[#E4E3E0] disabled:opacity-30 transition"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Reprocess Button */}
          <button
            id="btn-reprocess-page"
            onClick={onReProcessPage}
            disabled={isProcessing}
            className="p-1 bg-white hover:bg-[#141414] text-[#141414] hover:text-white border border-[#141414] transition disabled:opacity-30 cursor-pointer"
            title="Re-run Tesseract OCR"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Canvas / Image Display */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[#C8C7C3]">
        <div
          className="relative transition-transform origin-top shadow-[6px_6px_0px_#141414] border-2 border-[#141414] bg-white"
          style={{ transform: `scale(${zoomLevel / 100})` }}
        >
          {currentPage && currentPage.pageImageBase64 ? (
            <div className="relative">
              <img
                src={currentPage.pageImageBase64}
                alt={`Página ${currentPage.pageNumber}`}
                className="max-w-full h-auto block select-none"
              />

              {/* Detected Element Bounding Overlays */}
              {showOverlays && (
                <div className="absolute inset-0 pointer-events-none">
                  {currentPage.elements.map((el, idx) => {
                    if (el.type === 'table') {
                      return (
                        <div
                          key={el.id}
                          className="absolute border-2 border-[#141414] bg-black/10 pointer-events-auto"
                          style={{
                            left: '5%',
                            right: '5%',
                            top: `${25 + idx * 12}%`,
                            height: '18%',
                          }}
                          title="Detected Table (Structured for Word)"
                        >
                          <span className="absolute -top-3 left-2 text-[9px] bg-[#141414] text-white px-1.5 py-0.2 font-mono font-bold uppercase shadow-xs">
                            TABLE [{el.tableData?.rows.length || 0} ROWS]
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="w-[500px] h-[700px] flex items-center justify-center text-[#141414] font-mono text-xs">
              NO_IMAGE_AVAILABLE
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
