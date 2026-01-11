import type { CostBreakdown } from '../types/resources';

export interface AdicionalRow {
  concepto: string;
  moneda: "ARS" | "USD";
  monto: number | null;
  por_unidad: boolean;
}

interface FormData {
  nombre: string;
  descripcion?: string;
  horas: number;
  unidades: number;
  valorDolar: number;
}

interface ComputedTotals {
  precioFinalArs: number;
  precioFinalUsd: number | null;
  unitarioFinalArs: number | null;
  unitarioFinalUsd: number | null;
  adicionalesTotalArs: number;
  adicionalesTotalUsd: number;
}

interface GenerateQuotePdfParams {
  formData: FormData;
  result: CostBreakdown;
  computedTotals: ComputedTotals;
  adicionales: AdicionalRow[];
  notes?: string;
}

export async function generateQuotePdf({
  formData,
  result,
  computedTotals,
  adicionales,
  notes = "",
}: GenerateQuotePdfParams): Promise<void> {
  // Importación dinámica para compatibilidad con Next.js
  // Solo se ejecuta en el cliente
  if (typeof window === 'undefined') {
    throw new Error('generateQuotePdf solo puede ejecutarse en el cliente');
  }
  
  const jsPDFModule = await import('jspdf');
  // jsPDF v4 puede exportar de diferentes formas
  const jsPDF = (jsPDFModule.default && jsPDFModule.default.jsPDF) 
    ? jsPDFModule.default.jsPDF 
    : jsPDFModule.default 
    ? jsPDFModule.default 
    : jsPDFModule.jsPDF 
    ? jsPDFModule.jsPDF 
    : jsPDFModule;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = margin;

  // Función helper para agregar texto con wrap
  const addText = (text: string, fontSize: number, isBold = false, align: 'left' | 'center' | 'right' = 'left') => {
    doc.setFontSize(fontSize);
    if (isBold) {
      doc.setFont(undefined, 'bold');
    } else {
      doc.setFont(undefined, 'normal');
    }
    const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
    lines.forEach((line: string) => {
      if (yPos > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        yPos = margin;
      }
      doc.text(line, align === 'center' ? pageWidth / 2 : align === 'right' ? pageWidth - margin : margin, yPos, { align });
      yPos += fontSize * 0.5;
    });
    yPos += 5;
  };

  // Título
  addText('PRESUPUESTO DE IMPRESIÓN 3D', 18, true, 'center');
  yPos += 5;

  // Línea separadora
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Datos del trabajo
  addText('DATOS DEL TRABAJO', 14, true);
  addText(`Nombre: ${formData.nombre}`, 11);
  if (formData.descripcion) {
    addText(`Descripción: ${formData.descripcion}`, 11);
  }
  addText(`Fecha: ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`, 11);
  addText(`Horas de impresión: ${formData.horas}`, 11);
  addText(`Cantidad de unidades: ${formData.unidades}`, 11);
  addText(`Tipo de cambio USD/ARS: $${formData.valorDolar.toFixed(2)}`, 11);
  yPos += 5;

  // Línea separadora
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Desglose de costos
  addText('DESGLOSE DE COSTOS (USD)', 14, true);
  addText(`Máquinas: $${result.costo_maquinas_usd.toFixed(2)}`, 11);
  addText(`Trabajadores: $${result.costo_trabajadores_usd.toFixed(2)}`, 11);
  addText(`Materiales: $${result.costo_materiales_usd.toFixed(2)}`, 11);
  addText(`Desperdicio: $${result.costo_desperdicio_usd.toFixed(2)}`, 11);
  addText(`Gastos Fijos (prorrateo): $${result.costo_gastos_fijos_usd.toFixed(2)}`, 11);
  addText(`Subtotal Costos: $${result.costo_total_usd.toFixed(2)}`, 11, true);
  yPos += 5;

  // Línea separadora
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Precio final y conversión
  addText('PRECIO FINAL Y CONVERSIÓN', 14, true);
  addText(`Total USD (calculado): $${result.costo_sugerido_total_usd.toFixed(2)}`, 11);
  addText(`Total ARS (calculado): $${(result.precio_calculado_ars ?? result.costo_sugerido_total_local).toFixed(2)}`, 11);
  
  if (computedTotals.adicionalesTotalArs > 0) {
    addText(`Adicionales: +$${computedTotals.adicionalesTotalArs.toFixed(2)} ARS ($${computedTotals.adicionalesTotalUsd.toFixed(2)} USD)`, 11);
  }
  
  addText(`Total ARS (final): $${computedTotals.precioFinalArs.toFixed(2)}`, 12, true);
  if (computedTotals.precioFinalUsd !== null) {
    addText(`Total USD (final): $${computedTotals.precioFinalUsd.toFixed(2)}`, 12, true);
  }
  yPos += 5;

  // Precio unitario
  if (computedTotals.unitarioFinalArs !== null || computedTotals.unitarioFinalUsd !== null) {
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;
    addText('PRECIO UNITARIO', 14, true);
    if (computedTotals.unitarioFinalArs !== null) {
      addText(`Unitario ARS (final): $${computedTotals.unitarioFinalArs.toFixed(2)}`, 11);
    }
    if (computedTotals.unitarioFinalUsd !== null) {
      addText(`Unitario USD (final): $${computedTotals.unitarioFinalUsd.toFixed(2)}`, 11);
    }
    yPos += 5;
  }

  // Adicionales detallados
  if (adicionales.length > 0) {
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;
    addText('ADICIONALES APLICADOS', 14, true);
    adicionales.forEach((adicional) => {
      const factor = adicional.por_unidad ? formData.unidades : 1;
      const montoTotal = (adicional.monto ?? 0) * factor;
      const montoTotalArs = adicional.moneda === "USD" 
        ? montoTotal * formData.valorDolar 
        : montoTotal;
      const montoTotalUsd = adicional.moneda === "USD"
        ? montoTotal
        : montoTotal / formData.valorDolar;
      
      addText(
        `${adicional.concepto} (${adicional.por_unidad ? "por unidad" : "por trabajo"}): $${montoTotalArs.toFixed(2)} ARS ($${montoTotalUsd.toFixed(2)} USD)`,
        10
      );
    });
    yPos += 5;
  }

  // Notas/Condiciones
  if (notes.trim()) {
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;
    addText('NOTAS / CONDICIONES', 14, true);
    addText(notes, 10);
  }

  // Pie de página
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Descargar el PDF
  const fileName = `Presupuesto_${formData.nombre.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
