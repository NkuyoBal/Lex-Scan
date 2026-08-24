import React, { useRef, useState } from 'react';
import { UploadCloud, BookOpen, RefreshCw, Layers, Cpu, ArrowRight } from 'lucide-react';
import { OcrProgressStatus, TesseractEngineConfig } from '../types';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  onLoadSample: (sampleId: 'financial' | 'legal' | 'scientific') => void;
  isProcessing: boolean;
  ocrProgress: OcrProgressStatus | null;
  config: TesseractEngineConfig;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFileSelect,
  onLoadSample,
  isProcessing,
  ocrProgress,
  config,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        onFileSelect(file);
      } else {
        alert('Por favor selecciona un archivo en formato PDF.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Upload Box */}
      <div
        id="pdf-drop-zone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed border-[#141414] p-8 sm:p-10 text-center transition cursor-pointer overflow-hidden ${
          isDragOver
            ? 'bg-[#D6D5D1] shadow-[6px_6px_0px_#141414]'
            : isProcessing
            ? 'bg-[#E4E3E0] cursor-wait shadow-[4px_4px_0px_#141414]'
            : 'bg-[#E4E3E0] hover:bg-[#D6D5D1] shadow-[4px_4px_0px_#141414]'
        }`}
      >
        <input
          id="file-input-pdf"
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="hidden"
          disabled={isProcessing}
        />

        {isProcessing ? (
          <div className="py-4 space-y-3 max-w-md mx-auto font-mono">
            <div className="w-12 h-12 bg-[#141414] text-white flex items-center justify-center mx-auto shadow-[3px_3px_0px_#888888]">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>

            <div>
              <h3 className="text-xs font-black text-[#141414] uppercase tracking-wider">
                {ocrProgress?.message || 'RUNNING_TESSERACT_OCR_PIPELINE...'}
              </h3>
              <p className="text-[10px] text-[#141414]/70 mt-1">
                LSTM STACK: {config.selectedLanguages.map((l) => l.toUpperCase()).join(' + ')}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-white border-2 border-[#141414] h-4 overflow-hidden shadow-[2px_2px_0px_#141414]">
              <div
                className="bg-[#141414] h-full transition-all duration-300"
                style={{ width: `${ocrProgress?.progress || 10}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-[#141414] font-bold">
              <span>STAGE: {ocrProgress?.stage || 'INITIALIZING'}</span>
              <span>{ocrProgress?.progress || 10}% COMPLETED</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-12 h-12 bg-[#141414] text-white flex items-center justify-center mx-auto shadow-[3px_3px_0px_#888888]">
              <UploadCloud className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-xs sm:text-sm font-mono font-black text-[#141414] uppercase tracking-wider">
                DROP PDF SOURCE FILE HERE OR CLICK TO BROWSE
              </h3>
              <p className="text-[10px] text-[#141414]/70 mt-0.5 font-mono">
                Accepts scanned documents, digital native PDFs, complex multi-column forms & invoices
              </p>
            </div>

            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white border border-[#141414] font-mono text-[10px] font-bold text-[#141414] shadow-[2px_2px_0px_#141414]">
              <Layers className="w-3 h-3 text-[#141414]" />
              <span>ACTIVE ENGINES: {config.selectedLanguages.map((l) => l.toUpperCase()).join(' + ')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Instant Test Samples */}
      <div className="space-y-2">
        <div className="flex items-center justify-between font-mono">
          <span className="text-[11px] font-bold text-[#141414] uppercase flex items-center space-x-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#141414]" />
            <span>PRE-LOADED VERIFICATION DATASETS:</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div
            id="sample-card-financial"
            onClick={() => !isProcessing && onLoadSample('financial')}
            className="p-3.5 bg-white border-2 border-[#141414] shadow-[3px_3px_0px_#141414] hover:shadow-[5px_5px_0px_#141414] transition cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <span className="text-xl">📊</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-[#141414] text-white font-mono font-bold">
                01 // TABLES + LOGO
              </span>
            </div>
            <h4 className="text-xs font-mono font-black text-[#141414] mt-2 group-hover:underline uppercase">
              Financial Quarterly Audit
            </h4>
            <p className="text-[10px] text-[#141414]/70 mt-1 font-mono line-clamp-2">
              Balance sheets with currency symbols, percentage deltas, and structured tables. (ES/EN)
            </p>
          </div>

          <div
            id="sample-card-legal"
            onClick={() => !isProcessing && onLoadSample('legal')}
            className="p-3.5 bg-white border-2 border-[#141414] shadow-[3px_3px_0px_#141414] hover:shadow-[5px_5px_0px_#141414] transition cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <span className="text-xl">⚖️</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-[#141414] text-white font-mono font-bold">
                02 // POLYGLOT LEGAL
              </span>
            </div>
            <h4 className="text-xs font-mono font-black text-[#141414] mt-2 group-hover:underline uppercase">
              Cross-Border Master Agreement
            </h4>
            <p className="text-[10px] text-[#141414]/70 mt-1 font-mono line-clamp-2">
              Numbered hierarchy clauses, fee structures, and Latin/German terminology models.
            </p>
          </div>

          <div
            id="sample-card-scientific"
            onClick={() => !isProcessing && onLoadSample('scientific')}
            className="p-3.5 bg-white border-2 border-[#141414] shadow-[3px_3px_0px_#141414] hover:shadow-[5px_5px_0px_#141414] transition cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <span className="text-xl">📐</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-[#141414] text-white font-mono font-bold">
                03 // MATH + FORMULAS
              </span>
            </div>
            <h4 className="text-xs font-mono font-black text-[#141414] mt-2 group-hover:underline uppercase">
              Scientific Paper & Math Symbols
            </h4>
            <p className="text-[10px] text-[#141414]/70 mt-1 font-mono line-clamp-2">
              Calculus notation equations, scientific benchmarks, and dual-language abstract.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
