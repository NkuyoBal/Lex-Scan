import React from 'react';
import { ShieldCheck, Table, Heading, AlignLeft, Globe, Cpu, Award } from 'lucide-react';
import { DocumentModel, TesseractEngineConfig } from '../types';

interface ConfidenceMetricsProps {
  document: DocumentModel;
  config: TesseractEngineConfig;
  currentPageIndex: number;
}

export const ConfidenceMetrics: React.FC<ConfidenceMetricsProps> = ({
  document,
  config,
  currentPageIndex,
}) => {
  const currentPage = document.pages[currentPageIndex] || document.pages[0];
  const elements = currentPage ? currentPage.elements : [];

  const tableCount = elements.filter((e) => e.type === 'table').length;
  const headingCount = elements.filter((e) => e.type.startsWith('heading')).length;
  const paragraphCount = elements.filter((e) => e.type === 'paragraph').length;

  let totalWords = 0;
  let totalChars = 0;

  elements.forEach((el) => {
    if (el.text) {
      const words = el.text.trim().split(/\s+/).filter(Boolean);
      totalWords += words.length;
      totalChars += el.text.length;
    }
    if (el.tableData) {
      el.tableData.headers.forEach((h) => {
        totalWords += h.split(/\s+/).filter(Boolean).length;
        totalChars += h.length;
      });
      el.tableData.rows.forEach((r) => {
        r.forEach((c) => {
          totalWords += c.split(/\s+/).filter(Boolean).length;
          totalChars += c.length;
        });
      });
    }
    if (el.listItems) {
      el.listItems.forEach((it) => {
        totalWords += it.split(/\s+/).filter(Boolean).length;
        totalChars += it.length;
      });
    }
  });

  const confidence = currentPage ? currentPage.confidenceScore : 98.5;

  return (
    <div className="bg-[#D6D5D1] border-2 border-[#141414] p-3 flex items-center justify-between flex-wrap gap-3 font-mono text-xs text-[#141414] shadow-[4px_4px_0px_#141414]">
      {/* Precision / Accuracy Badge */}
      <div className="flex items-center space-x-3">
        <div className="w-7 h-7 bg-[#141414] text-[#E4E3E0] flex items-center justify-center font-bold">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <div className="font-mono font-black text-xs flex items-center space-x-2">
            <span>PRECISION_AVG: {confidence.toFixed(2)}%</span>
            <span className="text-[9px] px-1.5 py-0.2 bg-[#141414] text-[#E4E3E0] font-bold uppercase">
              HIGH_FIDELITY
            </span>
          </div>
          <p className="text-[10px] text-[#141414]/70 font-sans mt-0.5">
            Tesseract Multi-Engine LSTM Assembly Pipeline
          </p>
        </div>
      </div>

      {/* Stats Badges */}
      <div className="flex items-center space-x-2 text-xs">
        <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1 border border-[#141414] font-bold">
          <Table className="w-3.5 h-3.5 text-[#141414]" />
          <span>{tableCount} TABLES</span>
        </div>

        <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1 border border-[#141414] font-bold">
          <Heading className="w-3.5 h-3.5 text-[#141414]" />
          <span>{headingCount} HEADINGS</span>
        </div>

        <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1 border border-[#141414] font-bold">
          <AlignLeft className="w-3.5 h-3.5 text-[#141414]" />
          <span>{totalWords} WORDS</span>
        </div>

        <div className="hidden sm:flex items-center space-x-1.5 bg-white px-2.5 py-1 border border-[#141414] font-bold">
          <Globe className="w-3.5 h-3.5 text-[#141414]" />
          <span>{config.selectedLanguages.length} LIBS</span>
        </div>
      </div>
    </div>
  );
};
