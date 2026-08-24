import React from 'react';
import { FileText, Download, Sliders, UploadCloud, Globe2, BookOpen, Cpu, ShieldCheck } from 'lucide-react';
import { TesseractEngineConfig } from '../types';
import { SUPPORTED_LANGUAGES } from '../services/languageRegistry';

interface NavbarProps {
  config: TesseractEngineConfig;
  onOpenConfig: () => void;
  onOpenUpload: () => void;
  onOpenExport: () => void;
  onLoadSample: (sampleId: 'financial' | 'legal' | 'scientific') => void;
  hasDocument: boolean;
  isProcessing: boolean;
  confidenceScore?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  config,
  onOpenConfig,
  onOpenUpload,
  onOpenExport,
  onLoadSample,
  hasDocument,
  isProcessing,
  confidenceScore,
}) => {
  const selectedLangObjs = SUPPORTED_LANGUAGES.filter((l) => config.selectedLanguages.includes(l.code));

  return (
    <header id="main-header" className="sticky top-0 z-40 bg-[#141414] text-[#E4E3E0] border-b-2 border-[#141414] shadow-xs">
      <div className="w-full px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand & App Title */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#E4E3E0] text-[#141414] flex items-center justify-center font-mono font-black text-sm border border-white">
            DOC
          </div>
          <div className="flex items-center space-x-3">
            <span className="font-mono font-bold text-sm sm:text-base tracking-tight text-white">
              LEX-SCAN // OCR.CORE.v5
            </span>
            <div className="hidden sm:block h-4 w-[1px] bg-[#E4E3E0] opacity-30"></div>
            <span className="hidden md:inline text-[10px] uppercase font-mono tracking-widest text-[#E4E3E0]/80">
              STATUS: {isProcessing ? 'PROCESSING QUEUE' : 'OPTIMAL'}
            </span>
          </div>
        </div>

        {/* Center: Multi-Language Tesseract Badge */}
        <div className="hidden lg:flex items-center space-x-2 bg-[#222222] px-3 py-1 border border-[#444444] font-mono text-xs">
          <Globe2 className="w-3.5 h-3.5 text-[#E4E3E0]" />
          <span className="text-[10px] uppercase font-bold text-[#E4E3E0]/70">
            ENGINES ({config.selectedLanguages.length}/5):
          </span>
          <div className="flex items-center space-x-1">
            {selectedLangObjs.map((lang) => (
              <span
                key={lang.code}
                className="text-[10px] px-1.5 py-0.5 bg-[#141414] text-white border border-[#555555] font-mono font-bold"
                title={`${lang.name} (${lang.nativeName})`}
              >
                {lang.code.toUpperCase()}
              </span>
            ))}
          </div>
          <button
            id="btn-quick-config"
            onClick={onOpenConfig}
            className="text-[10px] text-white bg-[#333333] hover:bg-white hover:text-[#141414] px-1.5 py-0.5 ml-1 border border-[#555555] uppercase font-bold transition cursor-pointer"
          >
            EDIT
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          {/* Sample Selector Dropdown */}
          <div className="relative group hidden md:block">
            <button
              id="btn-sample-dropdown"
              className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-[#222222] hover:bg-white hover:text-[#141414] text-xs font-mono font-bold text-[#E4E3E0] border border-[#555555] transition cursor-pointer uppercase"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>SAMPLES</span>
            </button>
            <div className="absolute right-0 mt-1 w-60 bg-[#141414] border-2 border-[#E4E3E0] shadow-[4px_4px_0px_#000000] py-1 hidden group-hover:block z-50">
              <button
                id="btn-load-sample-financial"
                onClick={() => onLoadSample('financial')}
                className="w-full text-left px-3 py-2 text-xs text-[#E4E3E0] hover:bg-white hover:text-[#141414] border-b border-[#333333] transition"
              >
                <div className="font-mono font-bold uppercase text-[11px]">01_FINANCIAL_REPORT.PDF</div>
                <div className="text-[9px] opacity-70 font-mono">Multi-table balance sheet + charts</div>
              </button>
              <button
                id="btn-load-sample-legal"
                onClick={() => onLoadSample('legal')}
                className="w-full text-left px-3 py-2 text-xs text-[#E4E3E0] hover:bg-white hover:text-[#141414] border-b border-[#333333] transition"
              >
                <div className="font-mono font-bold uppercase text-[11px]">02_LEGAL_CONTRACT.PDF</div>
                <div className="text-[9px] opacity-70 font-mono">Polyglot clauses + fee schedules</div>
              </button>
              <button
                id="btn-load-sample-scientific"
                onClick={() => onLoadSample('scientific')}
                className="w-full text-left px-3 py-2 text-xs text-[#E4E3E0] hover:bg-white hover:text-[#141414] transition"
              >
                <div className="font-mono font-bold uppercase text-[11px]">03_SCIENTIFIC_PAPER.PDF</div>
                <div className="text-[9px] opacity-70 font-mono">Formulas + multilingual tables</div>
              </button>
            </div>
          </div>

          {/* Config Button */}
          <button
            id="btn-tesseract-settings"
            onClick={onOpenConfig}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-[#222222] hover:bg-white hover:text-[#141414] text-xs font-mono font-bold text-[#E4E3E0] border border-[#555555] transition cursor-pointer uppercase"
            title="Configure Tesseract engines (up to 5 languages)"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CONFIG</span>
          </button>

          {/* Upload Button */}
          <button
            id="btn-upload-pdf-nav"
            onClick={onOpenUpload}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#E4E3E0] text-[#141414] hover:bg-white text-xs font-mono font-black border border-white transition cursor-pointer uppercase"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>UPLOAD_PDF</span>
          </button>

          {/* Export to Word Button */}
          <button
            id="btn-export-docx-main"
            onClick={onOpenExport}
            disabled={!hasDocument || isProcessing}
            className={`flex items-center space-x-2 px-3.5 py-1.5 text-xs font-mono font-black uppercase transition cursor-pointer border ${
              !hasDocument || isProcessing
                ? 'bg-[#333333] text-[#777777] border-[#444444] cursor-not-allowed opacity-50'
                : 'bg-white text-[#141414] hover:bg-[#E4E3E0] border-white shadow-[2px_2px_0px_#555555]'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT_DOCX</span>
          </button>
        </div>
      </div>
    </header>
  );
};
