import { DocumentModel, DocumentPage, DocumentElement } from '../types';

// Generate a synthetic canvas for sample documents
export function generateSampleCanvas(sampleId: 'financial' | 'legal' | 'scientific'): { canvas: HTMLCanvasElement; dataUrl: string } {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1600;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { canvas, dataUrl: '' };

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (sampleId === 'financial') {
    // Header Banner
    ctx.fillStyle = '#1E3A8A';
    ctx.fillRect(80, 80, 1040, 8);

    // Company logo badge
    ctx.fillStyle = '#3B82F6';
    ctx.beginPath();
    ctx.roundRect(80, 110, 60, 60, 12);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('⚡', 95, 150);

    // Title
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 38px sans-serif';
    ctx.fillText('INFORME TRIMESTRAL DE RENDIMIENTO FINANCIERO', 160, 145);
    ctx.fillStyle = '#64748B';
    ctx.font = '18px sans-serif';
    ctx.fillText('División Global de Operaciones • Ejercicio Fiscal 2025-2026', 160, 175);

    // Divider
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 200);
    ctx.lineTo(1120, 200);
    ctx.stroke();

    // Section 1: Executive Summary
    ctx.fillStyle = '#1E3A8A';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('1. RESUMEN EJECUTIVO / EXECUTIVE SUMMARY', 80, 250);

    ctx.fillStyle = '#334155';
    ctx.font = '20px sans-serif';
    const text1 =
      'Durante el último periodo consolidado, la organización experimentó un crecimiento sostenido del 18.4% impulsado por la expansión en mercados europeos y latinoamericanos. Se mantuvieron rigurosos estándares de control de costes y eficiencia operativa.';
    wrapText(ctx, text1, 80, 290, 1040, 30);

    // Section 2: Table
    ctx.fillStyle = '#1E3A8A';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('2. BALANCE GENERAL CONSOLIDADO (EUR / USD)', 80, 410);

    // Draw Table
    const tableTop = 440;
    const rowHeight = 46;
    const colWidths = [340, 220, 220, 260];
    const headers = ['Categoría Financiera', 'Q1 2025 (€)', 'Q2 2025 (€)', 'Variación Interanual'];
    const rows = [
      ['Ingresos Netos de Operación', '1,450,200.00', '1,820,950.00', '+ 25.56 %'],
      ['Costos Directos de Venta', '620,100.00', '680,400.00', '+ 9.72 %'],
      ['Margen Bruto de Utilidad', '830,100.00', '1,140,550.00', '+ 37.40 %'],
      ['Gastos de Investigación & I+D', '180,500.00', '210,000.00', '+ 16.34 %'],
      ['EBITDA Normalizado', '420,800.00', '590,300.00', '+ 40.28 %'],
      ['Beneficio Neto del Ejercicio', '315,600.00', '442,100.00', '+ 40.08 %'],
    ];

    // Table Header Background
    ctx.fillStyle = '#1E3A8A';
    ctx.beginPath();
    ctx.roundRect(80, tableTop, 1040, rowHeight, [6, 6, 0, 0]);
    ctx.fill();

    // Table Header Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px sans-serif';
    let xOffset = 80;
    headers.forEach((h, idx) => {
      ctx.fillText(h, xOffset + 16, tableTop + 30);
      xOffset += colWidths[idx];
    });

    // Table Rows
    rows.forEach((row, rIdx) => {
      const y = tableTop + rowHeight + rIdx * rowHeight;
      ctx.fillStyle = rIdx % 2 === 0 ? '#F8FAFC' : '#FFFFFF';
      ctx.fillRect(80, y, 1040, rowHeight);

      // Border bottom
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(80, y + rowHeight);
      ctx.lineTo(1120, y + rowHeight);
      ctx.stroke();

      let cellX = 80;
      row.forEach((cell, cIdx) => {
        ctx.fillStyle = cIdx === 3 ? '#059669' : '#1E293B';
        ctx.font = cIdx === 0 ? '500 18px sans-serif' : '18px monospace';
        ctx.fillText(cell, cellX + 16, y + 30);
        cellX += colWidths[cIdx];
      });
    });

    // Table outer border
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(80, tableTop, 1040, rowHeight * (rows.length + 1));

    // Section 3: Key Initiatives (Bullet List)
    const listTop = tableTop + rowHeight * (rows.length + 1) + 60;
    ctx.fillStyle = '#1E3A8A';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('3. HITOS ESTRATÉGICOS Y PRÓXIMOS PASOS', 80, listTop);

    const bullets = [
      'Implementación de la infraestructura de automatización basada en modelos multilingües.',
      'Apertura del nuevo centro de distribución en Frankfurt (Alemania) y Lyon (Francia).',
      'Certificación internacional ISO 27001 de seguridad de la información y soberanía de datos.',
      'Reducción de la huella de carbono operacional en un 32% respecto al periodo anterior.',
    ];

    ctx.fillStyle = '#334155';
    ctx.font = '19px sans-serif';
    bullets.forEach((bullet, bIdx) => {
      const bY = listTop + 40 + bIdx * 38;
      ctx.fillStyle = '#3B82F6';
      ctx.beginPath();
      ctx.arc(95, bY - 6, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#334155';
      ctx.fillText(bullet, 115, bY);
    });

    // Section 4: Callout / Verification Note
    const calloutY = listTop + 40 + bullets.length * 38 + 40;
    ctx.fillStyle = '#EFF6FF';
    ctx.beginPath();
    ctx.roundRect(80, calloutY, 1040, 90, 8);
    ctx.fill();
    ctx.fillStyle = '#2563EB';
    ctx.fillRect(80, calloutY, 8, 90);

    ctx.fillStyle = '#1E40AF';
    ctx.font = 'italic 18px sans-serif';
    ctx.fillText(
      'Nota de Auditoría Externa: Todas las cifras han sido verificadas conforme a las Normas Internacionales de Información Financiera (NIIF / IFRS). Documento firmado digitalmente.',
      105,
      calloutY + 52
    );

    // Footer
    ctx.fillStyle = '#94A3B8';
    ctx.font = '15px sans-serif';
    ctx.fillText('Página 1 de 1 • Confidencial Corporativo • Generado con Multi-Tesseract Studio', 80, 1530);
  } else if (sampleId === 'legal') {
    // Legal Contract
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 36px serif';
    ctx.fillText('CONTRATO MARCO DE PRESTACIÓN DE SERVICIOS', 180, 140);
    ctx.fillStyle = '#475569';
    ctx.font = 'italic 20px serif';
    ctx.fillText('International Master Services Agreement (Pacta Sunt Servanda)', 240, 180);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, 210);
    ctx.lineTo(1100, 210);
    ctx.stroke();

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 22px serif';
    ctx.fillText('CLÁUSULA PRIMERA: OBJETO DEL CONTRATO (GEGENSTAND DES VERTRAGES)', 100, 265);

    ctx.fillStyle = '#1E293B';
    ctx.font = '19px serif';
    const textLegal =
      'El presente contrato establece las bases jurídicas y técnicas bajo las cuales el PROVEEDOR suministrará servicios de transformación digital, procesamiento de documentos estructurados y consultoría especializada al CLIENTE.';
    wrapText(ctx, textLegal, 100, 305, 1000, 32);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 22px serif';
    ctx.fillText('CLÁUSULA SEGUNDA: TARIFAS Y HONORARIOS PROFESIONALES', 100, 420);

    // Table
    const tableTop = 450;
    const rowHeight = 44;
    const headers = ['Servicio / Módulo', 'Nivel de Servicio (SLA)', 'Precio Unitario', 'Moneda'];
    const rows = [
      ['Extracción OCR Multi-idioma', '99.95 % Disponibilidad', '0.045 / pág', 'EUR (€)'],
      ['Maquetación Word Docx Pro', 'Tiempo Real (< 2 seg)', '0.020 / pág', 'EUR (€)'],
      ['Soporte Dedicado 24/7', 'Respuesta < 15 min', '450.00 / mes', 'EUR (€)'],
    ];

    ctx.fillStyle = '#334155';
    ctx.fillRect(100, tableTop, 1000, rowHeight);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px serif';
    ctx.fillText('Servicio / Módulo', 120, tableTop + 28);
    ctx.fillText('Nivel de Servicio (SLA)', 440, tableTop + 28);
    ctx.fillText('Precio Unitario', 740, tableTop + 28);
    ctx.fillText('Moneda', 960, tableTop + 28);

    rows.forEach((r, idx) => {
      const y = tableTop + rowHeight + idx * rowHeight;
      ctx.fillStyle = idx % 2 === 0 ? '#F8FAFC' : '#FFFFFF';
      ctx.fillRect(100, y, 1000, rowHeight);
      ctx.strokeStyle = '#E2E8F0';
      ctx.strokeRect(100, y, 1000, rowHeight);

      ctx.fillStyle = '#0F172A';
      ctx.font = '18px serif';
      ctx.fillText(r[0], 120, y + 28);
      ctx.fillText(r[1], 440, y + 28);
      ctx.fillText(r[2], 740, y + 28);
      ctx.fillText(r[3], 960, y + 28);
    });

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 22px serif';
    ctx.fillText('CLÁUSULA TERCERA: JURISDICCIÓN Y LEY APLICABLE', 100, 680);

    ctx.fillStyle = '#1E293B';
    ctx.font = '19px serif';
    const textLegal2 =
      'Para cualquier controversia derivada del cumplimiento o interpretación del presente acuerdo, las partes se someten expresamente a la jurisdicción de los tribunales de Madrid (España) y Ginebra (Suiza).';
    wrapText(ctx, textLegal2, 100, 720, 1000, 32);

    // Signature placeholders
    const sigY = 900;
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(150, sigY + 80);
    ctx.lineTo(450, sigY + 80);
    ctx.moveTo(650, sigY + 80);
    ctx.lineTo(950, sigY + 80);
    ctx.stroke();

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 18px serif';
    ctx.fillText('POR EL PROVEEDOR', 220, sigY + 115);
    ctx.fillText('POR EL CLIENTE', 730, sigY + 115);
  } else {
    // Scientific Document
    ctx.fillStyle = '#064E3B';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('RECONOCIMIENTO MULTILINGÜE Y EXTRACCIÓN DE TABLAS', 100, 140);
    ctx.fillStyle = '#059669';
    ctx.font = '18px sans-serif';
    ctx.fillText('Journal of Computational Document Analysis • Vol. 14, pp. 112–128', 100, 175);

    ctx.fillStyle = '#064E3B';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('1. Abstract / Resumen Científico', 100, 240);

    ctx.fillStyle = '#334155';
    ctx.font = '20px sans-serif';
    const absText =
      'Este estudio evalúa la precisión del reconocimiento óptico de caracteres (OCR) al ensamblar hasta 5 modelos de pesos neuronales Tesseract LSTM en paralelo con post-procesamiento de geometría espacial para la conservación fiel de tablas complejas.';
    wrapText(ctx, absText, 100, 280, 1000, 32);

    ctx.fillStyle = '#064E3B';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('2. Formulación Matemática de Fusión (Ensemble Model)', 100, 420);

    // Math formula box
    ctx.fillStyle = '#ECFDF5';
    ctx.beginPath();
    ctx.roundRect(100, 450, 1000, 80, 8);
    ctx.fill();
    ctx.strokeStyle = '#A7F3D0';
    ctx.strokeRect(100, 450, 1000, 80);

    ctx.fillStyle = '#065F46';
    ctx.font = 'italic bold 22px serif';
    ctx.fillText('P(w_i | I) = ∑_{k=1}^{K} α_k ⋅ Softmax( W_k ⊗ Φ(I) ) + λ ⋅ LayoutScore(BBox)', 200, 498);

    ctx.fillStyle = '#064E3B';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('3. Resultados Experimentales de Precisión', 100, 580);

    // Table
    const tableTop = 610;
    const rowHeight = 44;
    const headers = ['Configuración de Motor', 'Idioma Principal', 'Precisión Caracteres', 'F1-Score Tablas'];
    const rows = [
      ['Single Engine (Tesseract 1)', 'Español (spa)', '93.2 %', '88.4 %'],
      ['Dual Ensemble (spa + eng)', 'Bilingüe', '97.6 %', '94.8 %'],
      ['Multi-Tesseract (spa+eng+fra+deu+equ)', 'Políglota + Math', '99.4 %', '98.9 %'],
    ];

    ctx.fillStyle = '#065F46';
    ctx.fillRect(100, tableTop, 1000, rowHeight);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('Configuración de Motor', 120, tableTop + 28);
    ctx.fillText('Idioma Principal', 450, tableTop + 28);
    ctx.fillText('Precisión Caracteres', 700, tableTop + 28);
    ctx.fillText('F1-Score Tablas', 920, tableTop + 28);

    rows.forEach((r, idx) => {
      const y = tableTop + rowHeight + idx * rowHeight;
      ctx.fillStyle = idx === 2 ? '#D1FAE5' : idx % 2 === 0 ? '#F8FAFC' : '#FFFFFF';
      ctx.fillRect(100, y, 1000, rowHeight);
      ctx.strokeStyle = '#CBD5E1';
      ctx.strokeRect(100, y, 1000, rowHeight);

      ctx.fillStyle = idx === 2 ? '#065F46' : '#0F172A';
      ctx.font = idx === 2 ? 'bold 18px sans-serif' : '18px sans-serif';
      ctx.fillText(r[0], 120, y + 28);
      ctx.fillText(r[1], 450, y + 28);
      ctx.fillText(r[2], 700, y + 28);
      ctx.fillText(r[3], 920, y + 28);
    });
  }

  return {
    canvas,
    dataUrl: canvas.toDataURL('image/png'),
  };
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
}

// Built-in initial sample document models ready to edit/export
export function getInitialSampleDocument(): DocumentModel {
  const { dataUrl } = generateSampleCanvas('financial');

  const page1Elements: DocumentElement[] = [
    {
      id: 'hd-1',
      type: 'heading1',
      text: 'INFORME TRIMESTRAL DE RENDIMIENTO FINANCIERO',
      bold: true,
      alignment: 'center',
    },
    {
      id: 'p-sub',
      type: 'paragraph',
      text: 'División Global de Operaciones • Ejercicio Fiscal 2025-2026',
      alignment: 'center',
      italic: true,
    },
    {
      id: 'hd-2',
      type: 'heading2',
      text: '1. Resumen Ejecutivo (Executive Summary)',
      bold: true,
    },
    {
      id: 'p-1',
      type: 'paragraph',
      text: 'Durante el último periodo consolidado, la organización experimentó un crecimiento sostenido del 18.4% impulsado por la expansión en mercados europeos y latinoamericanos. Se mantuvieron rigurosos estándares de control de costes y eficiencia operativa.',
      alignment: 'justify',
    },
    {
      id: 'hd-3',
      type: 'heading2',
      text: '2. Balance General Consolidado (EUR / USD)',
      bold: true,
    },
    {
      id: 'tbl-1',
      type: 'table',
      tableData: {
        headers: ['Categoría Financiera', 'Q1 2025 (€)', 'Q2 2025 (€)', 'Variación Interanual'],
        rows: [
          ['Ingresos Netos de Operación', '1,450,200.00', '1,820,950.00', '+ 25.56 %'],
          ['Costos Directos de Venta', '620,100.00', '680,400.00', '+ 9.72 %'],
          ['Margen Bruto de Utilidad', '830,100.00', '1,140,550.00', '+ 37.40 %'],
          ['Gastos de Investigación & I+D', '180,500.00', '210,000.00', '+ 16.34 %'],
          ['EBITDA Normalizado', '420,800.00', '590,300.00', '+ 40.28 %'],
          ['Beneficio Neto del Ejercicio', '315,600.00', '442,100.00', '+ 40.08 %'],
        ],
        hasHeaderRow: true,
      },
    },
    {
      id: 'hd-4',
      type: 'heading2',
      text: '3. Hitos Estratégicos y Próximos Pasos',
      bold: true,
    },
    {
      id: 'list-1',
      type: 'bullet_list',
      listItems: [
        'Implementación de la infraestructura de automatización basada en modelos multilingües.',
        'Apertura del nuevo centro de distribución en Frankfurt (Alemania) y Lyon (Francia).',
        'Certificación internacional ISO 27001 de seguridad de la información y soberanía de datos.',
        'Reducción de la huella de carbono operacional en un 32% respecto al periodo anterior.',
      ],
    },
    {
      id: 'callout-1',
      type: 'callout',
      text: 'Nota de Auditoría Externa: Todas las cifras han sido verificadas conforme a las Normas Internacionales de Información Financiera (NIIF / IFRS). Documento firmado digitalmente.',
      italic: true,
    },
  ];

  return {
    title: 'Informe Trimestral de Rendimiento Financiero',
    filename: 'informe_financiero_trimestral.pdf',
    pageCount: 1,
    currentPageIndex: 0,
    author: 'Dirección Financiera',
    createdAt: new Date().toLocaleDateString('es-ES'),
    pages: [
      {
        pageNumber: 1,
        width: 1200,
        height: 1600,
        elements: page1Elements,
        pageImageBase64: dataUrl,
        status: 'done',
        confidenceScore: 98.6,
        recognizedLanguages: ['spa', 'eng'],
      },
    ],
  };
}
