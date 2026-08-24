import React, { useState } from 'react';
import { X, Check, Globe, Layers, Table as TableIcon, Heading, ShieldCheck, Sliders, Image as ImageIcon, Sparkles, Zap, AlignLeft } from 'lucide-react';
import { TesseractEngineConfig } from '../types';
import { SUPPORTED_LANGUAGES, MULTI_ENGINE_PRESETS } from '../services/languageRegistry';

interface TesseractConfigPanelProps {
  config: TesseractEngineConfig;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newConfig: TesseractEngineConfig) => void;
  onReProcessCurrentPage?: () => void;
}

export const TesseractConfigPanel: React.FC<TesseractConfigPanelProps> = ({
  config,
  isOpen,
  onClose,
  onSave,
}) => {
  const [localConfig, setLocalConfig] = useState<TesseractEngineConfig>({ ...config });
  const [activeTab, setActiveTab] = useState<'languages' | 'preprocessing' | 'layout'>('languages');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen) return null;

  const toggleLanguage = (code: string) => {
    const current = [...localConfig.selectedLanguages];
    if (current.includes(code)) {
      if (current.length > 1) {
        setLocalConfig({
          ...localConfig,
          selectedLanguages: current.filter((c) => c !== code),
        });
      }
    } else {
      if (current.length < 5) {
        setLocalConfig({
          ...localConfig,
          selectedLanguages: [...current, code],
        });
      }
    }
  };

  const applyPreset = (langCodes: string[]) => {
    setLocalConfig({
      ...localConfig,
      selectedLanguages: langCodes.slice(0, 5),
    });
  };

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  const filteredLanguages = SUPPORTED_LANGUAGES.filter((l) => {
    const matchesCategory = selectedCategory === 'all' || l.category === selectedCategory;
    const matchesSearch =
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-fade-in">
      <div
        id="tesseract-config-modal"
        className="bg-[#E4E3E0] border-2 border-[#141414] w-full max-w-3xl shadow-[8px_8px_0px_#000000] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b-2 border-[#141414] flex items-center justify-between bg-[#141414] text-white">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-[#E4E3E0] text-[#141414] font-mono font-bold">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-mono font-black tracking-wider uppercase flex items-center space-x-2">
                <span>CONFIG // TESSERACT_OCR_PIPELINE</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-white text-[#141414] font-bold">
                  MULTI-ENGINE (MAX 5)
                </span>
              </h2>
              <p className="text-[10px] text-[#E4E3E0]/70 font-mono">
                Concurrent LSTM neural training sets assembly configuration
              </p>
            </div>
          </div>
          <button
            id="btn-close-tesseract-config"
            onClick={onClose}
            className="p-1 text-white hover:bg-white hover:text-black border border-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b-2 border-[#141414] bg-[#D6D5D1] font-mono text-xs">
          <button
            id="tab-languages"
            onClick={() => setActiveTab('languages')}
            className={`py-2.5 px-4 font-bold border-r-2 border-[#141414] flex items-center space-x-2 transition uppercase ${
              activeTab === 'languages'
                ? 'bg-white text-[#141414] shadow-xs'
                : 'text-[#141414]/70 hover:bg-[#E4E3E0]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>01. LANGUAGES ({localConfig.selectedLanguages.length}/5)</span>
          </button>
          <button
            id="tab-preprocessing"
            onClick={() => setActiveTab('preprocessing')}
            className={`py-2.5 px-4 font-bold border-r-2 border-[#141414] flex items-center space-x-2 transition uppercase ${
              activeTab === 'preprocessing'
                ? 'bg-white text-[#141414] shadow-xs'
                : 'text-[#141414]/70 hover:bg-[#E4E3E0]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>02. PRE-FILTERS</span>
          </button>
          <button
            id="tab-layout"
            onClick={() => setActiveTab('layout')}
            className={`py-2.5 px-4 font-bold flex items-center space-x-2 transition uppercase ${
              activeTab === 'layout'
                ? 'bg-white text-[#141414] shadow-xs'
                : 'text-[#141414]/70 hover:bg-[#E4E3E0]'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>03. STRUCTURE</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 bg-[#C8C7C3]">
          {activeTab === 'languages' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-[#141414] uppercase">
                    Select 1 to 5 Tesseract Traineddata Libraries
                  </h3>
                  <p className="text-[10px] text-[#141414]/70">
                    Selected models combine into a single multilingual neural OCR stream.
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-[#141414] text-white font-bold">
                  {localConfig.selectedLanguages.length} / 5 ACTIVE
                </span>
              </div>

              {/* Active selected chips */}
              <div className="flex flex-wrap gap-1.5 p-2.5 bg-white border-2 border-[#141414] shadow-[2px_2px_0px_#141414]">
                <span className="text-[10px] font-bold text-[#141414] uppercase flex items-center pr-1">Active:</span>
                {localConfig.selectedLanguages.map((code) => {
                  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
                  if (!lang) return null;
                  return (
                    <span
                      key={code}
                      className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#141414] text-white text-[10px] font-bold border border-black"
                    >
                      <span>{lang.name} [{lang.code.toUpperCase()}]</span>
                      <button
                        onClick={() => toggleLanguage(code)}
                        disabled={localConfig.selectedLanguages.length <= 1}
                        className="hover:text-red-400 ml-1 cursor-pointer disabled:opacity-30"
                        title="Remove Language"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>

              {/* Presets Quick Selector */}
              <div className="space-y-1.5 bg-[#EAE9E5] p-2.5 border-2 border-[#141414]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#141414] uppercase flex items-center space-x-1">
                    <Zap className="w-3 h-3 text-[#141414]" />
                    <span>Quick Multi-Engine Presets:</span>
                  </span>
                  <span className="text-[9px] text-[#141414]/70">Click to apply 1-5 engine clusters</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {MULTI_ENGINE_PRESETS.map((preset) => {
                    const isCurrent =
                      preset.languages.length === localConfig.selectedLanguages.length &&
                      preset.languages.every((l) => localConfig.selectedLanguages.includes(l));
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyPreset(preset.languages)}
                        className={`px-2 py-1 text-[10px] font-mono font-bold border border-[#141414] transition cursor-pointer flex items-center space-x-1 ${
                          isCurrent
                            ? 'bg-[#141414] text-white shadow-[1px_1px_0px_#555555]'
                            : 'bg-white text-[#141414] hover:bg-[#D6D5D1]'
                        }`}
                        title={preset.description}
                      >
                        <span>{preset.name}</span>
                        <span className="text-[8px] px-1 py-0.2 bg-white/20 border border-current font-normal">
                          {preset.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category Filter Pills & Search */}
              <div className="space-y-2">
                <div className="flex items-center space-x-1 overflow-x-auto pb-0.5 text-[10px]">
                  <span className="font-bold text-[#141414]/70 uppercase mr-1">Region:</span>
                  {[
                    { id: 'all', label: 'ALL REGIONS' },
                    { id: 'african', label: 'AFRICAN (YORÙBÁ 🇳🇬)' },
                    { id: 'common', label: 'COMMON (ES / EN)' },
                    { id: 'european', label: 'EUROPEAN' },
                    { id: 'asian', label: 'ASIAN & CJK' },
                    { id: 'special', label: 'MATH / LATIN' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-2 py-0.5 border border-[#141414] font-bold uppercase transition cursor-pointer whitespace-nowrap ${
                        selectedCategory === cat.id
                          ? 'bg-[#141414] text-white shadow-[1px_1px_0px_#555555]'
                          : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <input
                  id="input-search-languages"
                  type="text"
                  placeholder="FILTER LANGUAGES (YORUBA, SPANISH, ENGLISH, FRENCH, GERMAN, MATH)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border-2 border-[#141414] px-3 py-1.5 text-xs text-[#141414] placeholder-[#141414]/40 font-mono font-bold focus:outline-hidden"
                />
              </div>

              {/* Language Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {filteredLanguages.map((lang) => {
                  const isSelected = localConfig.selectedLanguages.includes(lang.code);
                  const isMax = localConfig.selectedLanguages.length >= 5 && !isSelected;

                  return (
                    <div
                      key={lang.code}
                      onClick={() => !isMax && toggleLanguage(lang.code)}
                      className={`p-2.5 border-2 transition cursor-pointer flex items-start justify-between ${
                        isSelected
                          ? 'bg-[#141414] border-[#141414] text-white shadow-[2px_2px_0px_#555555]'
                          : isMax
                          ? 'bg-[#E4E3E0] border-[#999999] text-[#777777] opacity-50 cursor-not-allowed'
                          : 'bg-white border-[#141414] text-[#141414] hover:bg-[#E4E3E0]'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        <span className="text-xl">{lang.flag}</span>
                        <div>
                          <div className="text-[11px] font-bold flex items-center space-x-1">
                            <span>{lang.name}</span>
                            <span className="text-[9px] opacity-70">({lang.nativeName})</span>
                          </div>
                          <p className="text-[9px] opacity-80 mt-0.5 line-clamp-1">{lang.description}</p>
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 flex items-center justify-center border font-bold text-[10px] ${
                          isSelected ? 'bg-white text-black border-white' : 'border-[#141414]'
                        }`}
                      >
                        {isSelected ? '✓' : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'preprocessing' && (
            <div className="space-y-3 font-mono text-xs text-[#141414]">
              <div>
                <h3 className="font-bold uppercase">Image Preprocessing Filters</h3>
                <p className="text-[10px] text-[#141414]/70 font-sans">
                  Optimize pixel contrast and noise suppression prior to feeding into Tesseract LSTM engine.
                </p>
              </div>

              {/* Contrast Boost Slider */}
              <div className="p-3 bg-white border-2 border-[#141414] shadow-[2px_2px_0px_#141414] space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-[11px] uppercase">
                    Adaptive Contrast Boost: +{localConfig.contrastBoost}%
                  </label>
                  <span className="text-[10px] text-[#141414]/70">Optimal: 25% - 40%</span>
                </div>
                <input
                  id="slider-contrast-boost"
                  type="range"
                  min="0"
                  max="100"
                  value={localConfig.contrastBoost}
                  onChange={(e) => setLocalConfig({ ...localConfig, contrastBoost: parseInt(e.target.value, 10) })}
                  className="w-full h-2 bg-[#E4E3E0] border border-[#141414] appearance-none cursor-pointer accent-black"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="p-3 bg-white border-2 border-[#141414] flex items-center justify-between cursor-pointer hover:bg-[#E4E3E0]">
                  <div>
                    <div className="font-bold text-[11px] uppercase">Binarization (Otsu)</div>
                    <div className="text-[9px] text-[#141414]/70">High-contrast black/white mask</div>
                  </div>
                  <input
                    id="checkbox-binarize"
                    type="checkbox"
                    checked={localConfig.binarize}
                    onChange={(e) => setLocalConfig({ ...localConfig, binarize: e.target.checked })}
                    className="w-4 h-4 accent-black cursor-pointer"
                  />
                </label>

                <label className="p-3 bg-white border-2 border-[#141414] flex items-center justify-between cursor-pointer hover:bg-[#E4E3E0]">
                  <div>
                    <div className="font-bold text-[11px] uppercase">Grayscale (Luminance)</div>
                    <div className="text-[9px] text-[#141414]/70">Color artifact strip</div>
                  </div>
                  <input
                    id="checkbox-grayscale"
                    type="checkbox"
                    checked={localConfig.grayscale}
                    onChange={(e) => setLocalConfig({ ...localConfig, grayscale: e.target.checked })}
                    className="w-4 h-4 accent-black cursor-pointer"
                  />
                </label>

                <label className="p-3 bg-white border-2 border-[#141414] flex items-center justify-between cursor-pointer hover:bg-[#E4E3E0]">
                  <div>
                    <div className="font-bold text-[11px] uppercase">Sharpening (3x3 Kernel)</div>
                    <div className="text-[9px] text-[#141414]/70">Fine typography edge boost</div>
                  </div>
                  <input
                    id="checkbox-sharpen"
                    type="checkbox"
                    checked={localConfig.sharpen}
                    onChange={(e) => setLocalConfig({ ...localConfig, sharpen: e.target.checked })}
                    className="w-4 h-4 accent-black cursor-pointer"
                  />
                </label>

                <label className="p-3 bg-white border-2 border-[#141414] flex items-center justify-between cursor-pointer hover:bg-[#E4E3E0]">
                  <div>
                    <div className="font-bold text-[11px] uppercase">Noise Reduction (Denoise)</div>
                    <div className="text-[9px] text-[#141414]/70">Clear scanner grain and speckles</div>
                  </div>
                  <input
                    id="checkbox-denoise"
                    type="checkbox"
                    checked={localConfig.denoise}
                    onChange={(e) => setLocalConfig({ ...localConfig, denoise: e.target.checked })}
                    className="w-4 h-4 accent-black cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'layout' && (
            <div className="space-y-3 font-mono text-xs text-[#141414]">
              <div>
                <h3 className="font-bold uppercase">Structure & Layout Segmentation</h3>
                <p className="text-[10px] text-[#141414]/70 font-sans">
                  Configure classification of tables, headings, and images for Word (.docx) native hierarchy.
                </p>
              </div>

              <div className="space-y-2">
                <label className="p-3 bg-white border-2 border-[#141414] flex items-center justify-between cursor-pointer hover:bg-[#E4E3E0]">
                  <div className="flex items-center space-x-2">
                    <AlignLeft className="w-4 h-4 text-[#141414]" />
                    <div>
                      <div className="font-bold text-[11px] uppercase">Respetar Formato Línea por Línea (Line-by-Line)</div>
                      <div className="text-[9px] text-[#141414]/70 font-sans">
                        Conserva los saltos de línea exactos de cada renglón detectado por el OCR
                      </div>
                    </div>
                  </div>
                  <input
                    id="checkbox-preserve-line-breaks"
                    type="checkbox"
                    checked={localConfig.preserveLineBreaks ?? true}
                    onChange={(e) => setLocalConfig({ ...localConfig, preserveLineBreaks: e.target.checked })}
                    className="w-4 h-4 accent-black cursor-pointer"
                  />
                </label>

                <label className="p-3 bg-white border-2 border-[#141414] flex items-center justify-between cursor-pointer hover:bg-[#E4E3E0]">
                  <div className="flex items-center space-x-2">
                    <TableIcon className="w-4 h-4 text-[#141414]" />
                    <div>
                      <div className="font-bold text-[11px] uppercase">Auto Table Reconstruction</div>
                      <div className="text-[9px] text-[#141414]/70 font-sans">
                        Detect column alignments and generate native Word tables with styled borders
                      </div>
                    </div>
                  </div>
                  <input
                    id="checkbox-detect-tables"
                    type="checkbox"
                    checked={localConfig.detectTables}
                    onChange={(e) => setLocalConfig({ ...localConfig, detectTables: e.target.checked })}
                    className="w-4 h-4 accent-black cursor-pointer"
                  />
                </label>

                <label className="p-3 bg-white border-2 border-[#141414] flex items-center justify-between cursor-pointer hover:bg-[#E4E3E0]">
                  <div className="flex items-center space-x-2">
                    <Heading className="w-4 h-4 text-[#141414]" />
                    <div>
                      <div className="font-bold text-[11px] uppercase">Heading Hierarchy Detection (H1, H2, H3)</div>
                      <div className="text-[9px] text-[#141414]/70 font-sans">
                        Applies standard Word heading styles to populate native Table of Contents
                      </div>
                    </div>
                  </div>
                  <input
                    id="checkbox-detect-headings"
                    type="checkbox"
                    checked={localConfig.detectHeadings}
                    onChange={(e) => setLocalConfig({ ...localConfig, detectHeadings: e.target.checked })}
                    className="w-4 h-4 accent-black cursor-pointer"
                  />
                </label>

                <label className="p-3 bg-white border-2 border-[#141414] flex items-center justify-between cursor-pointer hover:bg-[#E4E3E0]">
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="w-4 h-4 text-[#141414]" />
                    <div>
                      <div className="font-bold text-[11px] uppercase">Image Extraction & Embedded Placement</div>
                      <div className="text-[9px] text-[#141414]/70 font-sans">
                        Embed logos and document figures in exact page positions
                      </div>
                    </div>
                  </div>
                  <input
                    id="checkbox-detect-images"
                    type="checkbox"
                    checked={localConfig.detectImages}
                    onChange={(e) => setLocalConfig({ ...localConfig, detectImages: e.target.checked })}
                    className="w-4 h-4 accent-black cursor-pointer"
                  />
                </label>

                <label className="p-3 bg-white border-2 border-[#141414] flex items-center justify-between cursor-pointer hover:bg-[#E4E3E0]">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-[#141414]" />
                    <div>
                      <div className="font-bold text-[11px] uppercase">AI Layout & Cell Refinement (Server-side)</div>
                      <div className="text-[9px] text-[#141414]/70 font-sans">
                        Fix skewed grid lines and complex multiline cell alignments
                      </div>
                    </div>
                  </div>
                  <input
                    id="checkbox-use-ai"
                    type="checkbox"
                    checked={localConfig.useAiRefinement}
                    onChange={(e) => setLocalConfig({ ...localConfig, useAiRefinement: e.target.checked })}
                    className="w-4 h-4 accent-black cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 border-t-2 border-[#141414] bg-[#D6D5D1] flex items-center justify-between font-mono">
          <div className="text-[10px] text-[#141414] font-bold flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#141414]" />
            <span>READY_FOR_HIGH_FIDELITY_CONVERSION</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="btn-cancel-tesseract-config"
              onClick={onClose}
              className="px-3 py-1 bg-white hover:bg-[#E4E3E0] border border-[#141414] text-xs font-bold text-[#141414] uppercase transition cursor-pointer"
            >
              CANCEL
            </button>
            <button
              id="btn-save-tesseract-config"
              onClick={handleSave}
              className="px-4 py-1 bg-[#141414] hover:bg-black text-xs font-bold text-white uppercase border border-[#141414] shadow-[2px_2px_0px_#555555] transition cursor-pointer"
            >
              SAVE_CONFIG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
