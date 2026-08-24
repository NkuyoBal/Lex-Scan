import React, { useState } from 'react';
import {
  X,
  Download,
  FileCode,
  AlignLeft,
  ShieldCheck,
  Palette,
  Sparkles,
  Sliders,
  Table as TableIcon,
  Heading,
  Image as ImageIcon,
  BookOpen,
  Maximize2,
  CheckCircle2,
} from 'lucide-react';
import { DocumentModel, DocxExportSettings, ExportOptimizationMode } from '../types';
import {
  DOCX_THEMES,
  DEFAULT_EXPORT_SETTINGS,
  HIGH_EDITABILITY_PRESET,
  downloadDocxFile,
} from '../services/docxExportService';
import { saveAs } from 'file-saver';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentModel;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  document,
}) => {
  const [exportSettings, setExportSettings] = useState<DocxExportSettings>({
    ...DEFAULT_EXPORT_SETTINGS,
  });
  const [activeTab, setActiveTab] = useState<'mode' | 'tables' | 'headings' | 'images' | 'layout'>('mode');
  const [customAuthor, setCustomAuthor] = useState<string>(document.author || 'Usuario');
  const [customTitle, setCustomTitle] = useState<string>(document.title || 'Documento Convertido');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSelectMode = (mode: ExportOptimizationMode) => {
    if (mode === 'high_fidelity') {
      setExportSettings({
        ...DEFAULT_EXPORT_SETTINGS,
        themeId: exportSettings.themeId,
      });
    } else {
      setExportSettings({
        ...HIGH_EDITABILITY_PRESET,
        themeId: exportSettings.themeId,
      });
    }
  };

  const handleDownloadDocx = async () => {
    try {
      setIsExporting(true);
      const updatedDoc: DocumentModel = {
        ...document,
        title: customTitle,
        author: customAuthor,
      };
      await downloadDocxFile(updatedDoc, exportSettings);
      setIsExporting(false);
      onClose();
    } catch (err) {
      console.error('Error exporting to docx:', err);
      alert('Hubo un error al generar el archivo Word. Por favor intenta de nuevo.');
      setIsExporting(false);
    }
  };

  // Export as Clean Markdown
  const handleDownloadMarkdown = () => {
    let md = `# ${customTitle}\n\n`;
    if (customAuthor) md += `*Autor: ${customAuthor}*\n\n---\n\n`;

    document.pages.forEach((page, pIdx) => {
      if (document.pages.length > 1) {
        md += `\n<!-- Página ${pIdx + 1} -->\n\n`;
      }
      page.elements.forEach((el) => {
        switch (el.type) {
          case 'heading1':
            md += `# ${el.text}\n\n`;
            break;
          case 'heading2':
            md += `## ${el.text}\n\n`;
            break;
          case 'heading3':
            md += `### ${el.text}\n\n`;
            break;
          case 'paragraph':
            md += `${el.text}\n\n`;
            break;
          case 'callout':
            md += `> ${el.text}\n\n`;
            break;
          case 'bullet_list':
            el.listItems?.forEach((item) => {
              md += `* ${item}\n`;
            });
            md += '\n';
            break;
          case 'numbered_list':
            el.listItems?.forEach((item, i) => {
              md += `${i + 1}. ${item}\n`;
            });
            md += '\n';
            break;
          case 'table':
            if (el.tableData && el.tableData.headers) {
              md += `| ${el.tableData.headers.join(' | ')} |\n`;
              md += `| ${el.tableData.headers.map(() => '---').join(' | ')} |\n`;
              el.tableData.rows.forEach((r) => {
                md += `| ${r.join(' | ')} |\n`;
              });
              md += '\n';
            }
            break;
        }
      });
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    saveAs(blob, `${customTitle.replace(/\s+/g, '_')}.md`);
  };

  // Export as Plain Text
  const handleDownloadText = () => {
    let txt = `${customTitle.toUpperCase()}\n${'='.repeat(customTitle.length)}\n\n`;
    document.pages.forEach((page, pIdx) => {
      if (document.pages.length > 1) {
        txt += `\n--- PÁGINA ${pIdx + 1} ---\n\n`;
      }
      page.elements.forEach((el) => {
        if (el.text) {
          txt += `${el.text}\n\n`;
        } else if (el.tableData) {
          txt += el.tableData.headers.join('\t') + '\n';
          el.tableData.rows.forEach((r) => {
            txt += r.join('\t') + '\n';
          });
          txt += '\n';
        } else if (el.listItems) {
          el.listItems.forEach((item) => {
            txt += ` - ${item}\n`;
          });
          txt += '\n';
        }
      });
    });

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${customTitle.replace(/\s+/g, '_')}.txt`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-fade-in">
      <div
        id="export-modal-dialog"
        className="bg-[#E4E3E0] border-2 border-[#141414] w-full max-w-3xl shadow-[8px_8px_0px_#000000] overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b-2 border-[#141414] flex items-center justify-between bg-[#141414] text-white">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-[#E4E3E0] text-[#141414] font-mono font-bold">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-mono font-black tracking-wider uppercase flex items-center space-x-2">
                <span>EXPORT // ADVANCED_WORD_ENGINE</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-white text-[#141414] font-bold">
                  {exportSettings.mode === 'high_fidelity' ? 'FIDELITY_FOCUS' : 'EDITABILITY_FOCUS'}
                </span>
              </h2>
              <p className="text-[10px] text-[#E4E3E0]/70 font-mono">
                Microsoft Word .docx OpenXML generator with custom layout calibration
              </p>
            </div>
          </div>
          <button
            id="btn-close-export-modal"
            onClick={onClose}
            className="p-1 text-white hover:bg-white hover:text-black border border-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub Navigation Bar */}
        <div className="flex border-b-2 border-[#141414] bg-[#D6D5D1] font-mono text-[11px] overflow-x-auto">
          <button
            onClick={() => setActiveTab('mode')}
            className={`py-2 px-3 font-bold border-r-2 border-[#141414] flex items-center space-x-1.5 transition uppercase whitespace-nowrap ${
              activeTab === 'mode' ? 'bg-white text-[#141414]' : 'text-[#141414]/70 hover:bg-[#E4E3E0]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>01. MODO PRINCIPAL</span>
          </button>
          <button
            onClick={() => setActiveTab('tables')}
            className={`py-2 px-3 font-bold border-r-2 border-[#141414] flex items-center space-x-1.5 transition uppercase whitespace-nowrap ${
              activeTab === 'tables' ? 'bg-white text-[#141414]' : 'text-[#141414]/70 hover:bg-[#E4E3E0]'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>02. TABLAS</span>
          </button>
          <button
            onClick={() => setActiveTab('headings')}
            className={`py-2 px-3 font-bold border-r-2 border-[#141414] flex items-center space-x-1.5 transition uppercase whitespace-nowrap ${
              activeTab === 'headings' ? 'bg-white text-[#141414]' : 'text-[#141414]/70 hover:bg-[#E4E3E0]'
            }`}
          >
            <Heading className="w-3.5 h-3.5" />
            <span>03. ENCABEZADOS</span>
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`py-2 px-3 font-bold border-r-2 border-[#141414] flex items-center space-x-1.5 transition uppercase whitespace-nowrap ${
              activeTab === 'images' ? 'bg-white text-[#141414]' : 'text-[#141414]/70 hover:bg-[#E4E3E0]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>04. IMÁGENES</span>
          </button>
          <button
            onClick={() => setActiveTab('layout')}
            className={`py-2 px-3 font-bold flex items-center space-x-1.5 transition uppercase whitespace-nowrap ${
              activeTab === 'layout' ? 'bg-white text-[#141414]' : 'text-[#141414]/70 hover:bg-[#E4E3E0]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>05. FLUJO & FORMATO</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 bg-[#C8C7C3] font-mono text-xs text-[#141414] flex-1">
          {/* TAB 1: Core Mode Selection */}
          {activeTab === 'mode' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-[12px] uppercase mb-1">
                  Elige la Prioridad de Conversión a Word
                </h3>
                <p className="text-[10px] text-[#141414]/70 font-sans">
                  Selecciona entre máxima fidelidad visual respecto al PDF original o máxima facilidad para modificar texto en Microsoft Word.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* High Fidelity Card */}
                <div
                  onClick={() => handleSelectMode('high_fidelity')}
                  className={`p-4 border-2 transition cursor-pointer flex flex-col justify-between ${
                    exportSettings.mode === 'high_fidelity'
                      ? 'bg-[#141414] border-[#141414] text-white shadow-[4px_4px_0px_#555555]'
                      : 'bg-white border-[#141414] text-[#141414] hover:bg-[#E4E3E0]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black tracking-wider uppercase flex items-center space-x-1.5">
                        <Sparkles className="w-4 h-4" />
                        <span>ALTA FIDELIDAD</span>
                      </span>
                      {exportSettings.mode === 'high_fidelity' && (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <p className="text-[10px] font-sans opacity-85 leading-normal">
                      Replica la presentación visual del PDF: márgenes exactos, encabezados con paleta de color corporativo, tablas con sombreados y bordes elegantes, y saltos de página fieles.
                    </p>
                    <div className="pt-2 border-t border-current/20 space-y-1 text-[9px]">
                      <div>✓ Tablas estilizadas con fondo en cabecera</div>
                      <div>✓ Encabezados estilizados con tipografía corporativa</div>
                      <div>✓ Saltos de página por página de origen</div>
                      <div>✓ Cuadros de notas destacados (callouts)</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 text-[9px] font-mono font-bold uppercase opacity-75">
                    RECOMENDADO: INFORMES FINALES, FACTURAS, BALANCES
                  </div>
                </div>

                {/* High Editability Card */}
                <div
                  onClick={() => handleSelectMode('high_editability')}
                  className={`p-4 border-2 transition cursor-pointer flex flex-col justify-between ${
                    exportSettings.mode === 'high_editability'
                      ? 'bg-[#141414] border-[#141414] text-white shadow-[4px_4px_0px_#555555]'
                      : 'bg-white border-[#141414] text-[#141414] hover:bg-[#E4E3E0]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black tracking-wider uppercase flex items-center space-x-1.5">
                        <Sliders className="w-4 h-4" />
                        <span>ALTA EDITABILIDAD</span>
                      </span>
                      {exportSettings.mode === 'high_editability' && (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <p className="text-[10px] font-sans opacity-85 leading-normal">
                      Optimiza el documento para redacción y cambios rápidos en Word: flujo continuo sin saltos de página rígidos, tablas limpias autoajustables y estilos de encabezado nativos.
                    </p>
                    <div className="pt-2 border-t border-current/20 space-y-1 text-[9px]">
                      <div>✓ Tablas fluidas editables sin celdas bloqueadas</div>
                      <div>✓ Jerarquía nativa Word compatible con Tabla de Contenidos</div>
                      <div>✓ Flujo de texto continuo sin huecos en blanco</div>
                      <div>✓ Imágenes en línea fáciles de reacomodar</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 text-[9px] font-mono font-bold uppercase opacity-75">
                    RECOMENDADO: BORRADORES, CONTRATOS EN REVISIÓN, ARTÍCULOS
                  </div>
                </div>
              </div>

              {/* Theme Selector */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-[10px] font-bold uppercase flex items-center space-x-1.5">
                  <Palette className="w-3.5 h-3.5 text-[#141414]" />
                  <span>Estilo Tipográfico y Paleta Word:</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DOCX_THEMES.map((theme) => {
                    const isSelected = exportSettings.themeId === theme.id;
                    return (
                      <div
                        key={theme.id}
                        onClick={() => setExportSettings({ ...exportSettings, themeId: theme.id })}
                        className={`p-2.5 border-2 transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#141414] border-[#141414] text-white shadow-[2px_2px_0px_#555555]'
                            : 'bg-white border-[#141414] text-[#141414] hover:bg-[#E4E3E0]'
                        }`}
                      >
                        <div>
                          <div className="text-[11px] font-bold uppercase">{theme.name}</div>
                          <div className="text-[9px] opacity-70 mt-0.5">
                            Fuente: {theme.fontFamily} • #{theme.primaryColor}
                          </div>
                        </div>
                        <div
                          className={`w-4 h-4 border flex items-center justify-center font-bold text-[10px] ${
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
            </div>
          )}

          {/* TAB 2: Table Settings */}
          {activeTab === 'tables' && (
            <div className="space-y-3 font-mono text-xs text-[#141414]">
              <div>
                <h3 className="font-bold uppercase">Configuración de Tablas en Word</h3>
                <p className="text-[10px] text-[#141414]/70 font-sans">
                  Ajusta cómo se estructuran las columnas y bordes de las tablas detectadas por el OCR.
                </p>
              </div>

              {/* Table Style Options */}
              <div className="p-3 bg-white border-2 border-[#141414] shadow-[2px_2px_0px_#141414] space-y-2">
                <label className="font-bold text-[11px] uppercase block">Estilo Visual de Tablas:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'styled_borders', label: 'Bordes Corporativos + Color', desc: 'Encabezado con color primario y líneas sólidas' },
                    { id: 'plain_editable', label: 'Tabla Editable Pura', desc: 'Sin rellenos rígidos, ideal para modificar celdas' },
                    { id: 'clean_grid', label: 'Cuadrícula Simple', desc: 'Líneas delgadas y fondo blanco estándar' },
                    { id: 'minimal_stripes', label: 'Filas Cebradas Mínimas', desc: 'Fondo suave en filas alternas para lectura' },
                  ].map((st) => (
                    <div
                      key={st.id}
                      onClick={() => setExportSettings({ ...exportSettings, tableStyle: st.id as any })}
                      className={`p-2 border transition cursor-pointer ${
                        exportSettings.tableStyle === st.id
                          ? 'bg-[#141414] text-white border-black'
                          : 'bg-[#F4F3F0] text-[#141414] border-[#CCCCCC] hover:bg-[#E4E3E0]'
                      }`}
                    >
                      <div className="font-bold text-[10px] uppercase">{st.label}</div>
                      <div className="text-[9px] opacity-75">{st.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Table Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="p-3 bg-white border-2 border-[#141414] flex items-center justify-between cursor-pointer hover:bg-[#E4E3E0]">
                  <div>
                    <div className="font-bold text-[11px] uppercase">Repetir Encabezado de Tabla</div>
                    <div className="text-[9px] text-[#141414]/70">Repite título de columna si la tabla cruza varias páginas</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={exportSettings.repeatTableHeader}
                    onChange={(e) => setExportSettings({ ...exportSettings, repeatTableHeader: e.target.checked })}
                    className="w-4 h-4 accent-black cursor-pointer"
                  />
                </label>

                <label className="p-3 bg-white border-2 border-[#141414] flex items-center justify-between cursor-pointer hover:bg-[#E4E3E0]">
                  <div>
                    <div className="font-bold text-[11px] uppercase">Filas Alternas Sombreadas</div>
                    <div className="text-[9px] text-[#141414]/70">Aplica fondo suave a filas pares para lectura de balances</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={exportSettings.stripedRows}
                    onChange={(e) => setExportSettings({ ...exportSettings, stripedRows: e.target.checked })}
                    className="w-4 h-4 accent-black cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: Heading Settings */}
          {activeTab === 'headings' && (
            <div className="space-y-3 font-mono text-xs text-[#141414]">
              <div>
                <h3 className="font-bold uppercase">Configuración de Encabezados y Títulos</h3>
                <p className="text-[10px] text-[#141414]/70 font-sans">
                  Define cómo se asignan los niveles de título H1, H2, H3 y la compatibilidad con el panel de navegación de Word.
                </p>
              </div>

              <div className="space-y-2">
                <label className="p-3 bg-white border-2 border-[#141414] flex items-center justify-between cursor-pointer hover:bg-[#E4E3E0]">
                  <div>
                    <div className="font-bold text-[11px] uppercase">Numeración Automática de Jerarquía</div>
                    <div className="text-[9px] text-[#141414]/70">
                      Agrega prefijos numéricos limpios (ej. 1., 1.1, 1.1.1) para estructurar manuales y contratos
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={exportSettings.autoHeadingNumbering}
                    onChange={(e) => setExportSettings({ ...exportSettings, autoHeadingNumbering: e.target.checked })}
                    className="w-4 h-4 accent-black cursor-pointer"
                  />
                </label>

                <label className="p-3 bg-white border-2 border-[#141414] flex items-center justify-between cursor-pointer hover:bg-[#E4E3E0]">
                  <div>
                    <div className="font-bold text-[11px] uppercase">Evitar Títulos Huérfanos (Keep with next)</div>
                    <div className="text-[9px] text-[#141414]/70">
                      Mantiene los encabezados en la misma página que su párrafo correspondiente
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={exportSettings.keepHeadingsWithNext}
                    onChange={(e) => setExportSettings({ ...exportSettings, keepHeadingsWithNext: e.target.checked })}
                    className="w-4 h-4 accent-black cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 4: Image Settings */}
          {activeTab === 'images' && (
            <div className="space-y-3 font-mono text-xs text-[#141414]">
              <div>
                <h3 className="font-bold uppercase">Manejo de Imágenes y Gráficos</h3>
                <p className="text-[10px] text-[#141414]/70 font-sans">
                  Controla la incrustación de logotipos, diagramas y figuras extraídas del PDF original.
                </p>
              </div>

              <div className="space-y-2">
                <label className="p-3 bg-white border-2 border-[#141414] flex items-center justify-between cursor-pointer hover:bg-[#E4E3E0]">
                  <div>
                    <div className="font-bold text-[11px] uppercase">Incluir Imágenes en el Documento Word</div>
                    <div className="text-[9px] text-[#141414]/70">
                      Incrusta las imágenes vectoriales y de mapa de bits detectadas en el PDF
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={exportSettings.includeImages}
                    onChange={(e) => setExportSettings({ ...exportSettings, includeImages: e.target.checked })}
                    className="w-4 h-4 accent-black cursor-pointer"
                  />
                </label>

                <div className="p-3 bg-white border-2 border-[#141414] space-y-2">
                  <label className="font-bold text-[11px] uppercase block">Posicionamiento de Imágenes:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setExportSettings({ ...exportSettings, imagePlacement: 'centered_block' })}
                      className={`p-2 border font-bold text-[10px] uppercase transition ${
                        exportSettings.imagePlacement === 'centered_block'
                          ? 'bg-[#141414] text-white border-black'
                          : 'bg-[#F4F3F0] text-[#141414] border-[#CCCCCC]'
                      }`}
                    >
                      Centrado en Bloque (Alta Fidelidad)
                    </button>
                    <button
                      onClick={() => setExportSettings({ ...exportSettings, imagePlacement: 'inline_editable' })}
                      className={`p-2 border font-bold text-[10px] uppercase transition ${
                        exportSettings.imagePlacement === 'inline_editable'
                          ? 'bg-[#141414] text-white border-black'
                          : 'bg-[#F4F3F0] text-[#141414] border-[#CCCCCC]'
                      }`}
                    >
                      En Línea con Texto (Fácil Edición)
                    </button>
                  </div>
                </div>

                <label className="p-3 bg-white border-2 border-[#141414] flex items-center justify-between cursor-pointer hover:bg-[#E4E3E0]">
                  <div>
                    <div className="font-bold text-[11px] uppercase">Incluir Pies de Foto / Leyendas</div>
                    <div className="text-[9px] text-[#141414]/70">
                      Genera texto en cursiva editable debajo de cada ilustración
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={exportSettings.includeCaptions}
                    onChange={(e) => setExportSettings({ ...exportSettings, includeCaptions: e.target.checked })}
                    className="w-4 h-4 accent-black cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 5: Layout & Margins */}
          {activeTab === 'layout' && (
            <div className="space-y-3 font-mono text-xs text-[#141414]">
              <div>
                <h3 className="font-bold uppercase">Flujo de Página, Márgenes e Interlineado</h3>
                <p className="text-[10px] text-[#141414]/70 font-sans">
                  Ajusta la paginación global del documento OpenXML Word (.docx).
                </p>
              </div>

              {/* Page flow */}
              <div className="p-3 bg-white border-2 border-[#141414] space-y-2">
                <label className="font-bold text-[11px] uppercase block">Flujo de Páginas:</label>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => setExportSettings({ ...exportSettings, pageFlow: 'exact_page_breaks' })}
                    className={`p-2.5 border cursor-pointer ${
                      exportSettings.pageFlow === 'exact_page_breaks'
                        ? 'bg-[#141414] text-white border-black'
                        : 'bg-[#F4F3F0] text-[#141414] border-[#CCCCCC]'
                    }`}
                  >
                    <div className="font-bold text-[10px] uppercase">Saltos de Página Exactos</div>
                    <div className="text-[9px] opacity-75">Conserva la paginación 1:1 con el PDF original</div>
                  </div>
                  <div
                    onClick={() => setExportSettings({ ...exportSettings, pageFlow: 'continuous_flow' })}
                    className={`p-2.5 border cursor-pointer ${
                      exportSettings.pageFlow === 'continuous_flow'
                        ? 'bg-[#141414] text-white border-black'
                        : 'bg-[#F4F3F0] text-[#141414] border-[#CCCCCC]'
                    }`}
                  >
                    <div className="font-bold text-[10px] uppercase">Flujo Continuo Editable</div>
                    <div className="text-[9px] opacity-75">Sin saltos rígidos, evita espacios en blanco al redactar</div>
                  </div>
                </div>
              </div>

              {/* Margins and Line Spacing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-3 bg-white border-2 border-[#141414] space-y-1.5">
                  <label className="font-bold text-[10px] uppercase block">Márgenes del Documento:</label>
                  <select
                    value={exportSettings.margins}
                    onChange={(e) => setExportSettings({ ...exportSettings, margins: e.target.value as any })}
                    className="w-full bg-[#E4E3E0] border border-[#141414] p-1.5 font-bold text-xs"
                  >
                    <option value="standard">Estándar Normal (2.54 cm / 1 pulgada)</option>
                    <option value="narrow">Estrecho Compacto (1.27 cm / 0.5 pulgada)</option>
                    <option value="wide">Ancho Amplio (3.18 cm / 1.25 pulgadas)</option>
                  </select>
                </div>

                <div className="p-3 bg-white border-2 border-[#141414] space-y-1.5">
                  <label className="font-bold text-[10px] uppercase block">Interlineado de Párrafos:</label>
                  <select
                    value={exportSettings.lineSpacing}
                    onChange={(e) => setExportSettings({ ...exportSettings, lineSpacing: e.target.value as any })}
                    className="w-full bg-[#E4E3E0] border border-[#141414] p-1.5 font-bold text-xs"
                  >
                    <option value="1.15">1.15x (Estándar Moderno Word)</option>
                    <option value="single">1.0x (Sencillo Compacto)</option>
                    <option value="1.5">1.5x (Amplio Académico)</option>
                  </select>
                </div>
              </div>

              {/* Headers & Footers Toggle */}
              <label className="p-3 bg-white border-2 border-[#141414] flex items-center justify-between cursor-pointer hover:bg-[#E4E3E0]">
                <div>
                  <div className="font-bold text-[11px] uppercase">
                    Encabezado y Pie de Página con Numeración
                  </div>
                  <div className="text-[9px] text-[#141414]/70">
                    Inserta título del documento y "Página X de Y" en los márgenes de Word
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={exportSettings.includeHeadersFooters}
                  onChange={(e) => setExportSettings({ ...exportSettings, includeHeadersFooters: e.target.checked })}
                  className="w-4 h-4 accent-black cursor-pointer"
                />
              </label>
            </div>
          )}

          {/* Document metadata inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t-2 border-[#141414]">
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1">Título del Documento (.docx):</label>
              <input
                id="input-export-title"
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full bg-white border-2 border-[#141414] p-2 text-xs font-bold text-[#141414] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1">Autor / Organización:</label>
              <input
                id="input-export-author"
                type="text"
                value={customAuthor}
                onChange={(e) => setCustomAuthor(e.target.value)}
                className="w-full bg-white border-2 border-[#141414] p-2 text-xs font-bold text-[#141414] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Alternative Formats */}
          <div className="pt-2 border-t border-[#141414]/30 flex items-center justify-between flex-wrap gap-2">
            <div className="text-[10px] font-bold uppercase text-[#141414]/70">Formatos Adicionales:</div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownloadMarkdown}
                className="px-2.5 py-1 bg-white hover:bg-[#141414] text-[#141414] hover:text-white border border-[#141414] text-[10px] font-bold uppercase flex items-center space-x-1.5 transition cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>MARKDOWN (.MD)</span>
              </button>
              <button
                onClick={handleDownloadText}
                className="px-2.5 py-1 bg-white hover:bg-[#141414] text-[#141414] hover:text-white border border-[#141414] text-[10px] font-bold uppercase flex items-center space-x-1.5 transition cursor-pointer"
              >
                <AlignLeft className="w-3.5 h-3.5" />
                <span>TEXTO PLANO (.TXT)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t-2 border-[#141414] bg-[#D6D5D1] flex items-center justify-between font-mono">
          <button
            id="btn-cancel-export"
            onClick={onClose}
            className="px-3 py-1 bg-white hover:bg-[#E4E3E0] border border-[#141414] text-xs font-bold text-[#141414] uppercase transition cursor-pointer"
          >
            CANCELAR
          </button>
          <button
            id="btn-download-docx-confirm"
            onClick={handleDownloadDocx}
            disabled={isExporting}
            className="px-5 py-1.5 bg-[#141414] hover:bg-black text-xs font-bold text-white uppercase border border-[#141414] shadow-[3px_3px_0px_#555555] flex items-center space-x-2 transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'GENERANDO ARCHIVO WORD...' : 'EXPORTAR A WORD (.DOCX)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

