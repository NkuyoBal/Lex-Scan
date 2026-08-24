import React, { useState } from 'react';
import {
  DocumentElement,
  DocumentModel,
  ElementType,
  TableData,
} from '../types';
import {
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  Table as TableIcon,
  List as ListIcon,
  Quote,
  Edit3,
  Columns,
  Wand2,
  Sparkles,
  CheckCheck,
  Split,
  CaseSensitive,
  AlertTriangle,
  RotateCcw,
  Layers,
  Copy,
  Hash,
} from 'lucide-react';
import { autoFixElementOcrErrors, fixTableOcrErrors, sanitizeOcrText } from '../services/tesseractService';

interface DocumentEditorProps {
  document: DocumentModel;
  currentPageIndex: number;
  onUpdateElements: (elements: DocumentElement[]) => void;
  onUpdateDocumentTitle: (title: string) => void;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  document,
  currentPageIndex,
  onUpdateElements,
  onUpdateDocumentTitle,
}) => {
  const currentPage = document.pages[currentPageIndex] || document.pages[0];
  const elements = currentPage ? currentPage.elements : [];

  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  const [filterLowConfidence, setFilterLowConfidence] = useState<boolean>(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  // Update a single element
  const handleUpdateElement = (id: string, updates: Partial<DocumentElement>) => {
    const newElements = elements.map((el) => (el.id === id ? { ...el, ...updates } : el));
    onUpdateElements(newElements);
  };

  // Auto-Fix All Elements on Current Page
  const handleAutoFixAllPage = () => {
    const fixedElements = elements.map((el) => autoFixElementOcrErrors(el));
    onUpdateElements(fixedElements);
    showToast('✓ AUTO-CORRECCIÓN COMPLETADA: Tildes, puntuación, tablas y espacios corregidos.');
  };

  // Auto-Fix Single Element
  const handleAutoFixSingleElement = (id: string) => {
    const el = elements.find((e) => e.id === id);
    if (!el) return;
    const fixed = autoFixElementOcrErrors(el);
    handleUpdateElement(id, fixed);
    showToast('✓ Elemento corregido');
  };

  // Convert Heading or Text to Title Case
  const handleConvertToTitleCase = (id: string) => {
    const el = elements.find((e) => e.id === id);
    if (!el || !el.text) return;
    const titleCased = el.text
      .toLowerCase()
      .split(' ')
      .map((w) => (w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
      .join(' ');
    handleUpdateElement(id, { text: titleCased });
    showToast('✓ Título convertido a formato mayúsculas/minúsculas');
  };

  // Delete element
  const handleDeleteElement = (id: string) => {
    const newElements = elements.filter((el) => el.id !== id);
    onUpdateElements(newElements);
  };

  // Duplicate element
  const handleDuplicateElement = (id: string) => {
    const el = elements.find((e) => e.id === id);
    if (!el) return;
    const newId = `el-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const duplicate: DocumentElement = JSON.parse(JSON.stringify(el));
    duplicate.id = newId;
    const index = elements.findIndex((e) => e.id === id);
    const newElements = [...elements];
    newElements.splice(index + 1, 0, duplicate);
    onUpdateElements(newElements);
    setActiveElementId(newId);
  };

  // Move element
  const handleMoveElement = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === elements.length - 1)
    ) {
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newElements = [...elements];
    const temp = newElements[index];
    newElements[index] = newElements[targetIndex];
    newElements[targetIndex] = temp;
    onUpdateElements(newElements);
  };

  // Add new element
  const handleAddElement = (type: ElementType) => {
    const newId = `el-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    let newElement: DocumentElement;

    switch (type) {
      case 'heading1':
        newElement = { id: newId, type: 'heading1', text: 'TÍTULO PRINCIPAL', bold: true, confidence: 100 };
        break;
      case 'heading2':
        newElement = { id: newId, type: 'heading2', text: 'Subtítulo de Sección', bold: true, confidence: 100 };
        break;
      case 'heading3':
        newElement = { id: newId, type: 'heading3', text: 'Encabezado de Nivel 3', bold: true, confidence: 100 };
        break;
      case 'table':
        newElement = {
          id: newId,
          type: 'table',
          confidence: 100,
          tableData: {
            headers: ['Concepto / Descripción', 'Cantidad', 'Importe'],
            rows: [
              ['Servicio Profesional', '1', '$1,250.00'],
              ['Honorarios Técnicos', '2', '$850.00'],
            ],
            hasHeaderRow: true,
          },
        };
        break;
      case 'bullet_list':
        newElement = {
          id: newId,
          type: 'bullet_list',
          confidence: 100,
          listItems: ['Primer elemento de la lista', 'Segundo elemento', 'Tercer elemento'],
        };
        break;
      case 'callout':
        newElement = {
          id: newId,
          type: 'callout',
          confidence: 100,
          text: 'Nota importante: Este bloque será renderizado como cuadro destacado en el archivo Word .docx.',
          italic: true,
        };
        break;
      case 'paragraph':
      default:
        newElement = {
          id: newId,
          type: 'paragraph',
          confidence: 100,
          text: 'Escribe aquí el contenido del párrafo. Puedes ajustar la alineación, aplicar negrita, cursiva y exportar directamente a formato Word (.docx).',
          alignment: 'justify',
        };
        break;
    }

    onUpdateElements([...elements, newElement]);
    setActiveElementId(newId);
  };

  // Table cell updater
  const handleTableCellChange = (
    elId: string,
    isHeader: boolean,
    rowIndex: number,
    colIndex: number,
    value: string
  ) => {
    const el = elements.find((e) => e.id === elId);
    if (!el || !el.tableData) return;

    const newTableData: TableData = {
      ...el.tableData,
      headers: [...el.tableData.headers],
      rows: el.tableData.rows.map((row) => [...row]),
    };

    if (isHeader) {
      newTableData.headers[colIndex] = value;
    } else {
      if (newTableData.rows[rowIndex]) {
        newTableData.rows[rowIndex][colIndex] = value;
      }
    }

    handleUpdateElement(elId, { tableData: newTableData });
  };

  // Clean Table OCR Artifacts
  const handleCleanTableArtifacts = (elId: string) => {
    const el = elements.find((e) => e.id === elId);
    if (!el || !el.tableData) return;
    const fixed = fixTableOcrErrors(el.tableData);
    handleUpdateElement(elId, { tableData: fixed });
    showToast('✓ Tabla optimizada: números y espacios limpios.');
  };

  // Promote first row to headers
  const handlePromoteFirstRowToHeader = (elId: string) => {
    const el = elements.find((e) => e.id === elId);
    if (!el || !el.tableData || el.tableData.rows.length === 0) return;
    const firstRow = el.tableData.rows[0];
    const remainingRows = el.tableData.rows.slice(1);
    const newTableData: TableData = {
      ...el.tableData,
      headers: firstRow,
      rows: remainingRows.length > 0 ? remainingRows : [new Array(firstRow.length).fill('')],
      hasHeaderRow: true,
    };
    handleUpdateElement(elId, { tableData: newTableData });
    showToast('✓ Primera fila promovida a encabezado');
  };

  // Add Row to Table
  const handleAddTableRow = (elId: string) => {
    const el = elements.find((e) => e.id === elId);
    if (!el || !el.tableData) return;
    const colCount = el.tableData.headers.length || 3;
    const newRow = new Array(colCount).fill('');
    const newTableData: TableData = {
      ...el.tableData,
      rows: [...el.tableData.rows, newRow],
    };
    handleUpdateElement(elId, { tableData: newTableData });
  };

  // Remove Row from Table
  const handleDeleteTableRow = (elId: string, rowIndex: number) => {
    const el = elements.find((e) => e.id === elId);
    if (!el || !el.tableData || el.tableData.rows.length <= 1) return;
    const newRows = el.tableData.rows.filter((_, idx) => idx !== rowIndex);
    const newTableData: TableData = {
      ...el.tableData,
      rows: newRows,
    };
    handleUpdateElement(elId, { tableData: newTableData });
  };

  // Add Column to Table
  const handleAddTableColumn = (elId: string) => {
    const el = elements.find((e) => e.id === elId);
    if (!el || !el.tableData) return;
    const colNumber = el.tableData.headers.length + 1;
    const newHeaders = [...el.tableData.headers, `Columna ${colNumber}`];
    const newRows = el.tableData.rows.map((row) => [...row, '']);
    const newTableData: TableData = {
      ...el.tableData,
      headers: newHeaders,
      rows: newRows,
    };
    handleUpdateElement(elId, { tableData: newTableData });
  };

  // Delete Column from Table
  const handleDeleteTableColumn = (elId: string, colIndex: number) => {
    const el = elements.find((e) => e.id === elId);
    if (!el || !el.tableData || el.tableData.headers.length <= 1) return;
    const newHeaders = el.tableData.headers.filter((_, idx) => idx !== colIndex);
    const newRows = el.tableData.rows.map((row) => row.filter((_, idx) => idx !== colIndex));
    const newTableData: TableData = {
      ...el.tableData,
      headers: newHeaders,
      rows: newRows,
    };
    handleUpdateElement(elId, { tableData: newTableData });
  };

  // List item change
  const handleListItemChange = (elId: string, index: number, value: string) => {
    const el = elements.find((e) => e.id === elId);
    if (!el || !el.listItems) return;
    const newItems = [...el.listItems];
    newItems[index] = value;
    handleUpdateElement(elId, { listItems: newItems });
  };

  const handleAddListItem = (elId: string) => {
    const el = elements.find((e) => e.id === elId);
    if (!el || !el.listItems) return;
    handleUpdateElement(elId, { listItems: [...el.listItems, 'Nuevo elemento'] });
  };

  const handleDeleteListItem = (elId: string, index: number) => {
    const el = elements.find((e) => e.id === elId);
    if (!el || !el.listItems || el.listItems.length <= 1) return;
    handleUpdateElement(elId, { listItems: el.listItems.filter((_, idx) => idx !== index) });
  };

  // Split a multi-line paragraph into separate paragraph blocks (exact line-by-line)
  const handleSplitParagraphLines = (elId: string) => {
    const elIndex = elements.findIndex((e) => e.id === elId);
    if (elIndex === -1) return;
    const el = elements[elIndex];
    if (!el.text || !el.text.includes('\n')) return;

    const lines = el.text.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length <= 1) return;

    const newElements: DocumentElement[] = lines.map((line) => ({
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: 'paragraph',
      text: line,
      bold: el.bold,
      italic: el.italic,
      alignment: el.alignment || 'left',
      confidence: el.confidence || 93,
    }));

    const updated = [...elements];
    updated.splice(elIndex, 1, ...newElements);
    onUpdateElements(updated);
    showToast(`✓ Párrafo dividido en ${lines.length} renglones individuales`);
  };

  // Merge soft-break lines inside a single paragraph into continuous text
  const handleMergeParagraphLines = (elId: string) => {
    const el = elements.find((e) => e.id === elId);
    if (!el || !el.text || !el.text.includes('\n')) return;
    const mergedText = el.text.replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').trim();
    handleUpdateElement(elId, { text: mergedText });
    showToast('✓ Renglones unidos en párrafo continuo');
  };

  // Split all multi-line paragraphs on page into line-by-line blocks
  const handleSplitAllPageParagraphs = () => {
    let splitCount = 0;
    const newElements: DocumentElement[] = [];

    elements.forEach((el) => {
      if (el.type === 'paragraph' && el.text && el.text.includes('\n')) {
        const lines = el.text.split('\n').filter((l) => l.trim().length > 0);
        if (lines.length > 1) {
          splitCount += lines.length;
          lines.forEach((line) => {
            newElements.push({
              id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              type: 'paragraph',
              text: line,
              bold: el.bold,
              italic: el.italic,
              alignment: el.alignment || 'left',
              confidence: el.confidence || 93,
            });
          });
          return;
        }
      }
      newElements.push(el);
    });

    if (splitCount > 0) {
      onUpdateElements(newElements);
      showToast(`✓ Documento formateado renglón por renglón (${splitCount} líneas generadas)`);
    } else {
      showToast('ℹ Todos los párrafos ya se encuentran separados línea por línea.');
    }
  };

  // Merge consecutive single-line paragraphs into fluid blocks
  const handleMergeAllPageParagraphs = () => {
    const newElements: DocumentElement[] = [];
    let currentP: DocumentElement | null = null;
    let mergedCount = 0;

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      if (el.type === 'paragraph' && el.text) {
        if (!currentP) {
          currentP = { ...el, text: el.text.replace(/\n+/g, ' ').trim() };
        } else {
          // Join with current
          currentP.text = `${currentP.text} ${el.text.replace(/\n+/g, ' ').trim()}`;
          mergedCount++;
        }
      } else {
        if (currentP) {
          newElements.push(currentP);
          currentP = null;
        }
        newElements.push(el);
      }
    }
    if (currentP) {
      newElements.push(currentP);
    }

    if (mergedCount > 0) {
      onUpdateElements(newElements);
      showToast(`✓ Renglones unificados en párrafos fluidos (${mergedCount} fusiones)`);
    } else {
      showToast('ℹ No hay párrafos consecutivos para unir.');
    }
  };

  const filteredElements = filterLowConfidence
    ? elements.filter((el) => (el.confidence || 100) < 90)
    : elements;

  return (
    <div className="bg-[#E4E3E0] border-2 border-[#141414] flex flex-col h-full shadow-[4px_4px_0px_#141414] overflow-hidden">
      {/* Top Title & Smart OCR Correction Bar */}
      <div className="px-4 py-2 border-b-2 border-[#141414] bg-[#D6D5D1] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
          <span className="text-xs font-mono font-black text-[#141414] uppercase tracking-wider flex items-center space-x-1.5">
            <Edit3 className="w-3.5 h-3.5 text-[#141414]" />
            <span>02 // OCR_PREVIEW_&_CORRECTION_STUDIO</span>
          </span>
          <input
            id="input-document-title"
            type="text"
            value={document.title}
            onChange={(e) => onUpdateDocumentTitle(e.target.value)}
            className="text-xs font-mono font-bold bg-white border border-[#141414] px-2 py-1 text-[#141414] focus:outline-hidden focus:ring-1 focus:ring-black w-60 shadow-[1px_1px_0px_#141414]"
            title="Edit Document Title"
          />
        </div>

        {/* Global OCR Correction Tools */}
        <div className="flex items-center space-x-1.5 font-mono text-[11px]">
          <button
            onClick={handleSplitAllPageParagraphs}
            className="px-2 py-1 bg-white hover:bg-[#141414] text-[#141414] hover:text-white border border-[#141414] font-bold uppercase transition cursor-pointer flex items-center space-x-1"
            title="Separar todos los renglones en bloques de línea individuales"
          >
            <Split className="w-3.5 h-3.5" />
            <span>DIVIDIR EN LÍNEAS</span>
          </button>
          <button
            onClick={handleMergeAllPageParagraphs}
            className="px-2 py-1 bg-white hover:bg-[#141414] text-[#141414] hover:text-white border border-[#141414] font-bold uppercase transition cursor-pointer flex items-center space-x-1"
            title="Unir renglones consecutivos en párrafos fluidos"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>UNIR PÁRRAFOS</span>
          </button>
          <button
            onClick={handleAutoFixAllPage}
            className="px-2.5 py-1 bg-[#141414] text-white hover:bg-black border border-[#141414] font-bold uppercase transition cursor-pointer flex items-center space-x-1 shadow-[2px_2px_0px_#666666]"
            title="Auto-corregir errores comunes de OCR en toda la página"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>AUTO-CORREGIR TODO</span>
          </button>
          <button
            onClick={() => setFilterLowConfidence(!filterLowConfidence)}
            className={`px-2 py-1 border border-[#141414] font-bold uppercase transition cursor-pointer flex items-center space-x-1 ${
              filterLowConfidence
                ? 'bg-amber-400 text-black shadow-[2px_2px_0px_#141414]'
                : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
            }`}
            title="Filtrar bloques que requieren revisión de OCR"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{filterLowConfidence ? 'MOSTRAR TODOS' : 'REVISAR DUDOSOS'}</span>
          </button>
        </div>
      </div>

      {/* Quick Add Elements Sub-Bar */}
      <div className="px-4 py-1.5 border-b border-[#141414] bg-[#ECEBE7] flex items-center justify-between flex-wrap gap-1 font-mono text-[10px]">
        <div className="flex items-center space-x-1">
          <span className="font-bold text-[#141414]/70 mr-1 uppercase">Insertar:</span>
          <button
            id="btn-add-h1"
            onClick={() => handleAddElement('heading1')}
            className="px-1.5 py-0.5 bg-white hover:bg-[#141414] text-[#141414] hover:text-white border border-[#141414] font-bold uppercase cursor-pointer flex items-center space-x-0.5"
          >
            <Heading1 className="w-3 h-3" />
            <span>H1</span>
          </button>
          <button
            id="btn-add-h2"
            onClick={() => handleAddElement('heading2')}
            className="px-1.5 py-0.5 bg-white hover:bg-[#141414] text-[#141414] hover:text-white border border-[#141414] font-bold uppercase cursor-pointer flex items-center space-x-0.5"
          >
            <Heading2 className="w-3 h-3" />
            <span>H2</span>
          </button>
          <button
            id="btn-add-paragraph"
            onClick={() => handleAddElement('paragraph')}
            className="px-1.5 py-0.5 bg-white hover:bg-[#141414] text-[#141414] hover:text-white border border-[#141414] font-bold uppercase cursor-pointer flex items-center space-x-0.5"
          >
            <Pilcrow className="w-3 h-3" />
            <span>PÁRRAFO</span>
          </button>
          <button
            id="btn-add-table"
            onClick={() => handleAddElement('table')}
            className="px-1.5 py-0.5 bg-[#141414] text-white hover:bg-black border border-[#141414] font-bold uppercase cursor-pointer flex items-center space-x-0.5 shadow-[1px_1px_0px_#888888]"
          >
            <TableIcon className="w-3 h-3" />
            <span>+TABLA</span>
          </button>
          <button
            id="btn-add-list"
            onClick={() => handleAddElement('bullet_list')}
            className="px-1.5 py-0.5 bg-white hover:bg-[#141414] text-[#141414] hover:text-white border border-[#141414] font-bold uppercase cursor-pointer flex items-center space-x-0.5"
          >
            <ListIcon className="w-3 h-3" />
            <span>LISTA</span>
          </button>
          <button
            id="btn-add-callout"
            onClick={() => handleAddElement('callout')}
            className="px-1.5 py-0.5 bg-white hover:bg-[#141414] text-[#141414] hover:text-white border border-[#141414] font-bold uppercase cursor-pointer flex items-center space-x-0.5"
          >
            <Quote className="w-3 h-3" />
            <span>NOTA</span>
          </button>
        </div>

        <div className="text-[9px] text-[#141414]/70">
          Elementos en página: <strong className="text-[#141414]">{elements.length}</strong>
        </div>
      </div>

      {/* Notification Banner */}
      {notificationMsg && (
        <div className="bg-[#141414] text-white font-mono text-[10px] py-1 px-4 border-b border-white flex items-center justify-between animate-fade-in">
          <span>{notificationMsg}</span>
          <button onClick={() => setNotificationMsg(null)} className="text-white hover:underline">
            ✕
          </button>
        </div>
      )}

      {/* Editor Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#C8C7C3]">
        {filteredElements.length === 0 ? (
          <div className="text-center py-12 text-[#141414] font-mono space-y-3">
            <p className="text-xs font-bold uppercase">
              {filterLowConfidence
                ? 'NO_HAY_BLOQUES_DUDOSOS_TODOS_SUPERAN_EL_90%_DE_CONFIANZA'
                : 'NO_ELEMENTOS_DETECTADOS_EN_ESTA_PÁGINA'}
            </p>
            <button
              onClick={() => handleAddElement('paragraph')}
              className="px-3 py-1.5 bg-[#141414] text-white text-xs font-mono font-bold uppercase shadow-[2px_2px_0px_#555555] cursor-pointer"
            >
              + AGREGAR PRIMER PÁRRAFO
            </button>
          </div>
        ) : (
          filteredElements.map((el, index) => {
            const isEditing = activeElementId === el.id;
            const confidence = el.confidence || 92;
            const isLowConfidence = confidence < 85;

            return (
              <div
                key={el.id}
                id={`doc-element-${el.id}`}
                onClick={() => setActiveElementId(el.id)}
                className={`p-4 border-2 border-[#141414] bg-white transition-all relative ${
                  isEditing
                    ? 'shadow-[6px_6px_0px_#141414] ring-2 ring-black'
                    : 'shadow-[3px_3px_0px_#141414] hover:shadow-[5px_5px_0px_#141414]'
                } ${isLowConfidence ? 'border-amber-500' : ''}`}
              >
                {/* Element Header, Type Selector, OCR Confidence & Fast Fix Controls */}
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#141414] flex-wrap gap-2">
                  <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 uppercase font-bold bg-[#141414] text-white">
                      {el.type === 'heading1'
                        ? 'H1'
                        : el.type === 'heading2'
                        ? 'H2'
                        : el.type === 'heading3'
                        ? 'H3'
                        : el.type === 'table'
                        ? 'TABLA'
                        : el.type === 'bullet_list'
                        ? 'LISTA'
                        : el.type === 'numbered_list'
                        ? 'NUMERADA'
                        : el.type === 'callout'
                        ? 'DESTACADO'
                        : el.type === 'image'
                        ? 'IMAGEN'
                        : 'PÁRRAFO'}
                    </span>

                    {/* OCR Confidence Badge */}
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 border ${
                        confidence >= 90
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                          : confidence >= 80
                          ? 'bg-amber-100 text-amber-900 border-amber-400'
                          : 'bg-rose-100 text-rose-900 border-rose-400'
                      }`}
                      title={`Confianza del reconocimiento Tesseract: ${confidence}%`}
                    >
                      OCR: {confidence}%
                    </span>

                    {/* Change Type Dropdown */}
                    <select
                      value={el.type}
                      onChange={(e) => handleUpdateElement(el.id, { type: e.target.value as ElementType })}
                      className="text-[10px] font-mono font-bold bg-[#E4E3E0] border border-[#141414] px-1 py-0.5 text-[#141414] focus:outline-hidden"
                    >
                      <option value="heading1">Encabezado 1 (H1)</option>
                      <option value="heading2">Encabezado 2 (H2)</option>
                      <option value="heading3">Encabezado 3 (H3)</option>
                      <option value="paragraph">Párrafo Estándar</option>
                      <option value="callout">Cuadro de Nota</option>
                      <option value="table">Tabla de Datos</option>
                      <option value="bullet_list">Lista con Viñetas</option>
                      <option value="numbered_list">Lista Numerada</option>
                    </select>

                    {/* Quick OCR Fix for this element */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAutoFixSingleElement(el.id);
                      }}
                      className="px-1.5 py-0.5 bg-[#E4E3E0] hover:bg-[#141414] text-[#141414] hover:text-white border border-[#141414] text-[9px] font-mono font-bold uppercase transition flex items-center space-x-1"
                      title="Corregir tildes, signos dobles y caracteres"
                    >
                      <Wand2 className="w-2.5 h-2.5" />
                      <span>CORREGIR OCR</span>
                    </button>

                    {/* Title Case converter for headings */}
                    {el.type.startsWith('heading') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConvertToTitleCase(el.id);
                        }}
                        className="px-1.5 py-0.5 bg-white hover:bg-[#141414] text-[#141414] hover:text-white border border-[#141414] text-[9px] font-mono font-bold uppercase transition flex items-center space-x-1"
                        title="Convertir MAYÚSCULAS a formato Título"
                      >
                        <CaseSensitive className="w-3 h-3" />
                        <span>Aa</span>
                      </button>
                    )}

                    {/* Paragraph line tools */}
                    {el.type === 'paragraph' && el.text && (
                      <>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-[#E4E3E0] border border-[#141414] text-[#141414]">
                          {el.text.split('\n').length} {el.text.split('\n').length === 1 ? 'LÍNEA' : 'LÍNEAS'}
                        </span>
                        {el.text.includes('\n') && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSplitParagraphLines(el.id);
                              }}
                              className="px-1.5 py-0.5 bg-white hover:bg-[#141414] text-[#141414] hover:text-white border border-[#141414] text-[9px] font-mono font-bold uppercase transition flex items-center space-x-1"
                              title="Dividir este párrafo en renglones independientes"
                            >
                              <Split className="w-2.5 h-2.5" />
                              <span>DIVIDIR LÍNEAS</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMergeParagraphLines(el.id);
                              }}
                              className="px-1.5 py-0.5 bg-white hover:bg-[#141414] text-[#141414] hover:text-white border border-[#141414] text-[9px] font-mono font-bold uppercase transition flex items-center space-x-1"
                              title="Unir saltos de línea de este párrafo en texto continuo"
                            >
                              <Layers className="w-2.5 h-2.5" />
                              <span>UNIR</span>
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>

                  {/* Formatting & Reorder Toolbar */}
                  <div className="flex items-center space-x-1">
                    {/* Bold / Italic */}
                    {(el.type === 'paragraph' || el.type.startsWith('heading') || el.type === 'callout') && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateElement(el.id, { bold: !el.bold });
                          }}
                          className={`p-1 border border-[#141414] text-xs font-bold ${
                            el.bold ? 'bg-[#141414] text-white' : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
                          }`}
                          title="Negrita"
                        >
                          <Bold className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateElement(el.id, { italic: !el.italic });
                          }}
                          className={`p-1 border border-[#141414] text-xs font-bold ${
                            el.italic ? 'bg-[#141414] text-white' : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
                          }`}
                          title="Cursiva"
                        >
                          <Italic className="w-3 h-3" />
                        </button>
                      </>
                    )}

                    {/* Alignment */}
                    {(el.type === 'paragraph' || el.type.startsWith('heading')) && (
                      <div className="flex items-center space-x-0.5 border-l border-[#141414] pl-1 ml-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateElement(el.id, { alignment: 'left' });
                          }}
                          className={`p-1 border border-[#141414] text-xs ${
                            el.alignment === 'left' || !el.alignment ? 'bg-[#141414] text-white' : 'bg-white text-[#141414]'
                          }`}
                          title="Alinear Izquierda"
                        >
                          <AlignLeft className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateElement(el.id, { alignment: 'center' });
                          }}
                          className={`p-1 border border-[#141414] text-xs ${
                            el.alignment === 'center' ? 'bg-[#141414] text-white' : 'bg-white text-[#141414]'
                          }`}
                          title="Centrar"
                        >
                          <AlignCenter className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateElement(el.id, { alignment: 'right' });
                          }}
                          className={`p-1 border border-[#141414] text-xs ${
                            el.alignment === 'right' ? 'bg-[#141414] text-white' : 'bg-white text-[#141414]'
                          }`}
                          title="Alinear Derecha"
                        >
                          <AlignRight className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateElement(el.id, { alignment: 'justify' });
                          }}
                          className={`p-1 border border-[#141414] text-xs ${
                            el.alignment === 'justify' ? 'bg-[#141414] text-white' : 'bg-white text-[#141414]'
                          }`}
                          title="Justificar"
                        >
                          <AlignJustify className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Duplicate */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateElement(el.id);
                      }}
                      className="p-1 border border-[#141414] bg-white text-[#141414] hover:bg-[#E4E3E0]"
                      title="Duplicar elemento"
                    >
                      <Copy className="w-3 h-3" />
                    </button>

                    {/* Move Up / Down */}
                    <div className="flex items-center space-x-0.5 border-l border-[#141414] pl-1 ml-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveElement(index, 'up');
                        }}
                        disabled={index === 0}
                        className="p-1 border border-[#141414] bg-white text-[#141414] hover:bg-[#E4E3E0] disabled:opacity-30"
                        title="Mover arriba"
                      >
                        <MoveUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveElement(index, 'down');
                        }}
                        disabled={index === elements.length - 1}
                        className="p-1 border border-[#141414] bg-white text-[#141414] hover:bg-[#E4E3E0] disabled:opacity-30"
                        title="Mover abajo"
                      >
                        <MoveDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteElement(el.id);
                        }}
                        className="p-1 border border-[#141414] bg-[#141414] text-white hover:bg-red-700 cursor-pointer"
                        title="Eliminar elemento"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Element Content Rendering */}
                {el.type === 'heading1' && (
                  <input
                    type="text"
                    value={el.text || ''}
                    onChange={(e) => handleUpdateElement(el.id, { text: e.target.value })}
                    className={`w-full bg-[#F5F4F0] border-2 border-[#141414] p-2 text-base sm:text-lg font-black text-[#141414] font-mono focus:outline-hidden focus:bg-white ${
                      el.alignment === 'center'
                        ? 'text-center'
                        : el.alignment === 'right'
                        ? 'text-right'
                        : 'text-left'
                    }`}
                    placeholder="Título principal del documento..."
                  />
                )}

                {el.type === 'heading2' && (
                  <input
                    type="text"
                    value={el.text || ''}
                    onChange={(e) => handleUpdateElement(el.id, { text: e.target.value })}
                    className={`w-full bg-[#F5F4F0] border-2 border-[#141414] p-2 text-sm sm:text-base font-bold text-[#141414] focus:outline-hidden focus:bg-white ${
                      el.alignment === 'center'
                        ? 'text-center'
                        : el.alignment === 'right'
                        ? 'text-right'
                        : 'text-left'
                    }`}
                    placeholder="Subtítulo de sección..."
                  />
                )}

                {el.type === 'heading3' && (
                  <input
                    type="text"
                    value={el.text || ''}
                    onChange={(e) => handleUpdateElement(el.id, { text: e.target.value })}
                    className="w-full bg-[#F5F4F0] border border-[#141414] p-1.5 text-xs sm:text-sm font-bold text-[#141414] focus:outline-hidden focus:bg-white"
                    placeholder="Encabezado nivel 3..."
                  />
                )}

                {el.type === 'paragraph' && (
                  <textarea
                    rows={Math.max(2, (el.text || '').split('\n').length)}
                    value={el.text || ''}
                    onChange={(e) => handleUpdateElement(el.id, { text: e.target.value })}
                    className={`w-full bg-[#F5F4F0] border border-[#141414] p-3 text-xs text-[#141414] font-mono leading-relaxed focus:outline-hidden focus:bg-white resize-y ${
                      el.bold ? 'font-bold' : ''
                    } ${el.italic ? 'italic' : ''} ${
                      el.alignment === 'center'
                        ? 'text-center'
                        : el.alignment === 'right'
                        ? 'text-right'
                        : el.alignment === 'justify'
                        ? 'text-justify'
                        : 'text-left'
                    }`}
                    placeholder="Texto de párrafo extraído línea por línea..."
                  />
                )}

                {el.type === 'callout' && (
                  <div className="p-3 bg-[#E4E3E0] border-2 border-[#141414] shadow-[2px_2px_0px_#141414]">
                    <textarea
                      rows={2}
                      value={el.text || ''}
                      onChange={(e) => handleUpdateElement(el.id, { text: e.target.value })}
                      className="w-full bg-transparent border-none text-xs text-[#141414] font-serif italic focus:outline-hidden resize-none"
                      placeholder="Texto de cuadro destacado / nota..."
                    />
                  </div>
                )}

                {/* Table Interactive Grid & Repair Studio */}
                {el.type === 'table' && el.tableData && (
                  <div className="space-y-3">
                    {/* Table Special Toolbar */}
                    <div className="flex items-center justify-between flex-wrap gap-1.5 bg-[#EAE9E5] p-2 border border-[#141414] font-mono text-[10px]">
                      <div className="flex items-center space-x-1">
                        <span className="font-bold uppercase text-[#141414]/80">Herramientas de Tabla:</span>
                        <button
                          onClick={() => handleCleanTableArtifacts(el.id)}
                          className="px-2 py-0.5 bg-white hover:bg-[#141414] text-[#141414] hover:text-white border border-[#141414] font-bold uppercase transition flex items-center space-x-1 cursor-pointer"
                          title="Limpia pipes, espacios y números con formato erróneo"
                        >
                          <Wand2 className="w-2.5 h-2.5" />
                          <span>LIMPIAR CELDAS</span>
                        </button>
                        <button
                          onClick={() => handlePromoteFirstRowToHeader(el.id)}
                          className="px-2 py-0.5 bg-white hover:bg-[#141414] text-[#141414] hover:text-white border border-[#141414] font-bold uppercase transition flex items-center space-x-1 cursor-pointer"
                          title="Convierte la primera fila en el encabezado oficial de la tabla"
                        >
                          <Layers className="w-2.5 h-2.5" />
                          <span>PROMOVER 1ª FILA A ENCABEZADO</span>
                        </button>
                      </div>

                      <div className="text-[#141414]/70">
                        {el.tableData.headers.length} Cols × {el.tableData.rows.length} Filas
                      </div>
                    </div>

                    <div className="overflow-x-auto border-2 border-[#141414]">
                      <table className="w-full text-xs text-left border-collapse">
                        {/* Table Header */}
                        <thead>
                          <tr className="bg-[#141414] text-white border-b-2 border-[#141414]">
                            {el.tableData.headers.map((h, colIdx) => (
                              <th key={colIdx} className="p-2 border-r border-[#444444] relative group min-w-32">
                                <div className="flex items-center justify-between">
                                  <input
                                    type="text"
                                    value={h}
                                    onChange={(e) =>
                                      handleTableCellChange(el.id, true, 0, colIdx, e.target.value)
                                    }
                                    className="w-full bg-transparent font-mono font-bold text-xs text-white focus:outline-hidden focus:bg-[#333333] px-1"
                                    placeholder={`Encabezado ${colIdx + 1}`}
                                  />
                                  {el.tableData!.headers.length > 1 && (
                                    <button
                                      onClick={() => handleDeleteTableColumn(el.id, colIdx)}
                                      className="text-red-400 hover:text-white ml-1 opacity-0 group-hover:opacity-100 transition p-0.5"
                                      title="Eliminar Columna"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </th>
                            ))}
                            <th className="p-1 w-10 text-center bg-[#222222]">
                              <button
                                onClick={() => handleAddTableColumn(el.id)}
                                className="p-1 text-white hover:bg-white hover:text-black transition cursor-pointer"
                                title="Agregar Columna"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </th>
                          </tr>
                        </thead>

                        {/* Table Rows */}
                        <tbody>
                          {el.tableData.rows.map((row, rowIdx) => (
                            <tr
                              key={rowIdx}
                              className={`border-b border-[#141414] ${
                                rowIdx % 2 === 0 ? 'bg-white' : 'bg-[#F4F3F0]'
                              }`}
                            >
                              {row.map((cell, colIdx) => (
                                <td key={colIdx} className="p-2 border-r border-[#141414]">
                                  <input
                                    type="text"
                                    value={cell}
                                    onChange={(e) =>
                                      handleTableCellChange(el.id, false, rowIdx, colIdx, e.target.value)
                                    }
                                    className="w-full bg-transparent text-xs text-[#141414] font-mono focus:outline-hidden focus:bg-[#E4E3E0] px-1"
                                  />
                                </td>
                              ))}
                              <td className="p-1 text-center">
                                {el.tableData!.rows.length > 1 && (
                                  <button
                                    onClick={() => handleDeleteTableRow(el.id, rowIdx)}
                                    className="p-1 text-[#141414] hover:text-red-600 transition cursor-pointer"
                                    title="Eliminar Fila"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Table Actions */}
                    <div className="flex items-center space-x-2 font-mono text-[11px]">
                      <button
                        onClick={() => handleAddTableRow(el.id)}
                        className="px-2.5 py-1 font-bold bg-white hover:bg-[#141414] text-[#141414] hover:text-white border border-[#141414] flex items-center space-x-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ AGREGAR FILA</span>
                      </button>
                      <button
                        onClick={() => handleAddTableColumn(el.id)}
                        className="px-2.5 py-1 font-bold bg-white hover:bg-[#141414] text-[#141414] hover:text-white border border-[#141414] flex items-center space-x-1 cursor-pointer"
                      >
                        <Columns className="w-3 h-3" />
                        <span>+ AGREGAR COLUMNA</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* List Items Editor */}
                {(el.type === 'bullet_list' || el.type === 'numbered_list') && el.listItems && (
                  <div className="space-y-2">
                    {el.listItems.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex items-center space-x-2 font-mono">
                        <span className="text-xs font-bold text-[#141414] min-w-4 text-center">
                          {el.type === 'bullet_list' ? '■' : `${itemIdx + 1}.`}
                        </span>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleListItemChange(el.id, itemIdx, e.target.value)}
                          className="flex-1 bg-[#F5F4F0] border border-[#141414] px-2.5 py-1 text-xs text-[#141414] focus:outline-hidden focus:bg-white"
                        />
                        {el.listItems!.length > 1 && (
                          <button
                            onClick={() => handleDeleteListItem(el.id, itemIdx)}
                            className="p-1 text-[#141414] hover:text-red-600 transition cursor-pointer"
                            title="Eliminar elemento"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => handleAddListItem(el.id)}
                      className="text-[11px] font-mono font-bold text-[#141414] hover:underline flex items-center space-x-1 pt-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ AGREGAR ELEMENTO A LA LISTA</span>
                    </button>
                  </div>
                )}

                {/* Image Element */}
                {el.type === 'image' && (
                  <div className="space-y-2">
                    {el.imageDataUrl ? (
                      <div className="p-2 bg-[#E4E3E0] border-2 border-[#141414] inline-block shadow-[2px_2px_0px_#141414]">
                        <img
                          src={el.imageDataUrl}
                          alt={el.imageCaption || 'Gráfico extraído'}
                          className="max-h-48 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="p-4 bg-[#E4E3E0] border-2 border-dashed border-[#141414] text-center text-[#141414] font-mono text-xs">
                        [IMAGEN_O_GRÁFICO_EXTRAÍDO_DEL_PDF]
                      </div>
                    )}
                    <input
                      type="text"
                      value={el.imageCaption || ''}
                      onChange={(e) => handleUpdateElement(el.id, { imageCaption: e.target.value })}
                      className="w-full bg-[#F5F4F0] border border-[#141414] px-2.5 py-1 text-xs text-[#141414] font-mono italic focus:outline-hidden"
                      placeholder="Pie de foto / Leyenda de la ilustración..."
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
