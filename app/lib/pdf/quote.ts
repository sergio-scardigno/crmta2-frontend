import type { CostBreakdown } from "../types/resources";

import autoTable, { RowInput } from "jspdf-autotable";

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

export interface GenerateQuotePdfParams {
  formData: FormData;
  result: CostBreakdown;
  computedTotals: ComputedTotals;
  adicionales: AdicionalRow[];
  notes?: string;
  cliente?: {
    clienteNombre?: string;
    clienteEmpresa?: string;
    clienteEmail?: string;
  };
  condiciones?: {
    validezDias?: number;
    plazoProduccionDias?: number;
    formaPago?: string;
    incluye?: string[];
    noIncluye?: string[];
    garantia?: string;
  };
  interno?: {
    margenSeguroFallosPct?: number;
    margenBeneficioPct?: number;
    versionCalculadora?: string;
    responsable?: string;
    notasInternas?: string;
  };
}

async function loadJsPDF(): Promise<any> {
  const jsPDFModule: any = await import("jspdf");
  return jsPDFModule?.jsPDF ?? jsPDFModule?.default?.jsPDF ?? jsPDFModule?.default ?? jsPDFModule;
}

function assertClient() {
  if (typeof window === "undefined") {
    throw new Error("La generación de PDF solo puede ejecutarse en el cliente");
  }
}

function buildPdfHelpers(
  doc: any,
  pageW: number,
  pageH: number,
  formData: FormData,
  computedTotals: ComputedTotals,
) {
  const M = 14;
  const CONTENT_W = pageW - M * 2;

  const fmtARS = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
  const fmtUSD = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

  const setText = (size: number, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
  };

  const wrapText = (text: string, maxW: number) => doc.splitTextToSize(text, maxW) as string[];

  const drawHeader = (title: string, subtitle?: string, badge?: string) => {
    doc.setFillColor(20, 24, 32);
    doc.rect(0, 0, pageW, 24, "F");

    setText(16, true);
    doc.setTextColor(255);
    doc.text(title, M, 14);

    if (subtitle) {
      setText(9, false);
      doc.setTextColor(200);
      doc.text(subtitle, M, 20);
    }

    if (badge) {
      const bw = doc.getTextWidth(badge) + 10;
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(pageW - M - bw, 7, bw, 9, 2, 2, "F");
      setText(9, true);
      doc.setTextColor(20, 24, 32);
      doc.text(badge, pageW - M - bw + 5, 13);
    }

    doc.setTextColor(20);
  };

  const drawSectionTitle = (y: number, t: string) => {
    doc.setFillColor(245, 246, 248);
    doc.roundedRect(M, y, CONTENT_W, 9, 2, 2, "F");
    setText(11, true);
    doc.setTextColor(20);
    doc.text(t, M + 3, y + 6.3);
    return y + 12;
  };

  const drawKV = (y: number, items: { k: string; v: string }[], cols: 2) => {
    const colW = CONTENT_W / cols;
    const rowH = 6;
    setText(9, true);
    doc.setTextColor(80);

    items.forEach((it, i) => {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const x = M + c * colW;
      const yy = y + r * rowH;

      setText(8, true);
      doc.setTextColor(110);
      doc.text(it.k, x, yy);

      setText(10, false);
      doc.setTextColor(20);
      const valLines = wrapText(it.v, colW - 2);
      doc.text(valLines, x, yy + 4.2);
    });

    const rows = Math.ceil(items.length / cols);
    return y + rows * rowH + 6;
  };

  const drawBigTotalsCard = (y: number) => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(230);
    doc.setLineWidth(0.5);
    doc.roundedRect(M, y, CONTENT_W, 28, 3, 3, "S");

    setText(10, true);
    doc.setTextColor(110);
    doc.text("TOTAL (ARS)", M + 6, y + 10);
    setText(18, true);
    doc.setTextColor(20);
    doc.text(fmtARS(computedTotals.precioFinalArs), M + 6, y + 20);

    if (computedTotals.precioFinalUsd !== null) {
      setText(10, true);
      doc.setTextColor(110);
      doc.text("TOTAL (USD)", M + CONTENT_W / 2 + 6, y + 10);
      setText(18, true);
      doc.setTextColor(20);
      doc.text(fmtUSD(computedTotals.precioFinalUsd), M + CONTENT_W / 2 + 6, y + 20);
    } else {
      setText(10, false);
      doc.setTextColor(110);
      doc.text("USD no calculado", M + CONTENT_W / 2 + 6, y + 16);
    }

    return y + 34;
  };

  const addFooter = (label?: string) => {
    setText(8, false);
    doc.setTextColor(120);
    const pageCount = doc.getNumberOfPages();
    const pageIndex = (doc as any).internal.getCurrentPageInfo().pageNumber;

    const left = label ? label : "";
    const right = `Página ${pageIndex} de ${pageCount}`;

    doc.text(left, M, pageH - 8);
    doc.text(right, pageW - M, pageH - 8, { align: "right" });
  };

  const stampCenterPageNumbers = () => {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      setText(8, false);
      doc.setTextColor(120);
      doc.text(`Página ${i} de ${totalPages}`, pageW / 2, pageH - 8, { align: "center" });
    }
  };

  return {
    M,
    CONTENT_W,
    fmtARS,
    fmtUSD,
    setText,
    wrapText,
    drawHeader,
    drawSectionTitle,
    drawKV,
    drawBigTotalsCard,
    addFooter,
    stampCenterPageNumbers,
  };
}

function drawClienteContent(
  doc: any,
  params: GenerateQuotePdfParams,
  h: ReturnType<typeof buildPdfHelpers>,
  fecha: string,
) {
  const { formData, computedTotals, adicionales, notes = "", cliente, condiciones } = params;

  h.drawHeader("Presupuesto 3D", "Impresión / Producción de piezas", "COPIA CLIENTE");

  let y = 30;

  y = h.drawSectionTitle(y, "Datos del trabajo");
  y = h.drawKV(
    y,
    [
      { k: "Proyecto", v: formData.nombre },
      { k: "Fecha", v: fecha },
      { k: "Unidades", v: String(formData.unidades) },
      { k: "Horas estimadas", v: String(formData.horas) },
      { k: "Cliente", v: cliente?.clienteNombre || "-" },
    ],
    2,
  );

  if (formData.descripcion?.trim()) {
    h.setText(9, true);
    doc.setTextColor(110);
    doc.text("Descripción", h.M, y);
    h.setText(10, false);
    doc.setTextColor(20);
    const descLines = h.wrapText(formData.descripcion, h.CONTENT_W);
    doc.text(descLines, h.M, y + 5);
    y += 5 + descLines.length * 5 + 3;
  }

  y = h.drawSectionTitle(y, "Resumen de precio");
  y = h.drawBigTotalsCard(y);

  if (computedTotals.unitarioFinalArs !== null || computedTotals.unitarioFinalUsd !== null) {
    doc.setDrawColor(230);
    doc.roundedRect(h.M, y, h.CONTENT_W, 16, 3, 3, "S");
    h.setText(10, true);
    doc.setTextColor(110);
    doc.text("Precio unitario (ARS)", h.M + 6, y + 7);

    h.setText(12, true);
    doc.setTextColor(20);
    const uArs =
      computedTotals.unitarioFinalArs !== null ? h.fmtARS(computedTotals.unitarioFinalArs) : "-";
    doc.text(uArs, h.M + 6, y + 13);

    y += 20;
  }

  if (adicionales.length > 0) {
    y = h.drawSectionTitle(y, "Adicionales");
    const rows: RowInput[] = adicionales.map((a) => {
      const factor = a.por_unidad ? formData.unidades : 1;
      const montoTotal = (a.monto ?? 0) * factor;

      const ars = a.moneda === "USD" ? montoTotal * formData.valorDolar : montoTotal;
      const usd = a.moneda === "USD" ? montoTotal : montoTotal / formData.valorDolar;

      return [a.concepto, a.por_unidad ? "Por unidad" : "Por trabajo", h.fmtARS(ars), h.fmtUSD(usd)];
    });

    autoTable(doc, {
      startY: y,
      margin: { left: h.M, right: h.M },
      head: [["Concepto", "Aplicación", "Total ARS", "Total USD"]],
      body: rows,
      styles: { font: "helvetica", fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [20, 24, 32], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 249, 251] },
      tableLineColor: 230,
      tableLineWidth: 0.3,
      columnStyles: {
        2: { halign: "right" },
        3: { halign: "right" },
      },
    });

    y = (doc as any).lastAutoTable.finalY + 6;
  }

  y = h.drawSectionTitle(y, "Condiciones");
  const validez = condiciones?.validezDias ?? 7;
  const plazo = condiciones?.plazoProduccionDias ?? 5;
  const formaPago = condiciones?.formaPago ?? "A acordar";
  const garantia = condiciones?.garantia ?? "Sujeto a material, tolerancias y uso acordados.";

  const condLines: string[] = [];
  condLines.push(`• Validez del presupuesto: ${validez} días.`);
  condLines.push(`• Plazo estimado de producción: ${plazo} días (desde aprobación y anticipo).`);
  condLines.push(`• Forma de pago: ${formaPago}.`);
  condLines.push(`• Garantía/alcance: ${garantia}`);
  if (notes.trim()) condLines.push(`• Notas: ${notes.trim()}`);

  h.setText(10, false);
  doc.setTextColor(20);
  const bullets = condLines.flatMap((t) => h.wrapText(t, h.CONTENT_W));
  doc.text(bullets, h.M, y);
  y += bullets.length * 5 + 4;

  const inc = condiciones?.incluye ?? [];
  const noInc = condiciones?.noIncluye ?? [];

  if (inc.length || noInc.length) {
    const boxH = 26;
    const colW = (h.CONTENT_W - 6) / 2;

    doc.setDrawColor(230);
    doc.roundedRect(h.M, y, colW, boxH, 3, 3, "S");
    doc.roundedRect(h.M + colW + 6, y, colW, boxH, 3, 3, "S");

    h.setText(10, true);
    doc.setTextColor(110);
    doc.text("Incluye", h.M + 5, y + 7);
    doc.text("No incluye", h.M + colW + 11, y + 7);

    h.setText(9, false);
    doc.setTextColor(20);

    const incLines = (inc.length ? inc : ["-"]).slice(0, 6).map((x) => `• ${x}`);
    const noIncLines = (noInc.length ? noInc : ["-"]).slice(0, 6).map((x) => `• ${x}`);

    doc.text(h.wrapText(incLines.join("\n"), colW - 10), h.M + 5, y + 12);
    doc.text(h.wrapText(noIncLines.join("\n"), colW - 10), h.M + colW + 11, y + 12);
  }

  h.addFooter("Documento para el cliente");
}

function drawInternoContent(
  doc: any,
  params: GenerateQuotePdfParams,
  h: ReturnType<typeof buildPdfHelpers>,
  fecha: string,
) {
  const { formData, result, computedTotals, adicionales, interno } = params;

  h.drawHeader("Presupuesto 3D", "Detalle interno de cálculo", "USO INTERNO");
  let y = 30;

  y = h.drawSectionTitle(y, "Datos base");
  y = h.drawKV(
    y,
    [
      { k: "Proyecto", v: formData.nombre },
      { k: "Fecha", v: fecha },
      { k: "Unidades", v: String(formData.unidades) },
      { k: "Horas impresión", v: String(formData.horas) },
      { k: "Versión", v: interno?.versionCalculadora ?? "-" },
      { k: "Responsable", v: interno?.responsable ?? "-" },
    ],
    2,
  );

  y = h.drawSectionTitle(y, "Desglose de costos (USD)");
  const usdRows: RowInput[] = [
    ["Máquinas", h.fmtUSD(result.costo_maquinas_usd)],
    ["Trabajadores", h.fmtUSD(result.costo_trabajadores_usd)],
    ["Materiales", h.fmtUSD(result.costo_materiales_usd)],
    ["Desperdicio", h.fmtUSD(result.costo_desperdicio_usd)],
    ["Gastos fijos (prorrateo)", h.fmtUSD(result.costo_gastos_fijos_usd)],
    ["Subtotal costos", h.fmtUSD(result.costo_total_usd)],
    ["Sugerido total (USD)", h.fmtUSD(result.costo_sugerido_total_usd)],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: h.M, right: h.M },
    head: [["Concepto", "Monto"]],
    body: usdRows,
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [20, 24, 32], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 249, 251] },
    tableLineColor: 230,
    tableLineWidth: 0.3,
    columnStyles: { 1: { halign: "right" } },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  y = h.drawSectionTitle(y, "Totales finales (ARS / USD)");
  const totalArsCalc = result.precio_calculado_ars ?? result.costo_sugerido_total_local;
  const totRows: RowInput[] = [
    ["Total ARS (calculado)", h.fmtARS(totalArsCalc)],
    ["Adicionales ARS", h.fmtARS(computedTotals.adicionalesTotalArs)],
    ["Total ARS (final)", h.fmtARS(computedTotals.precioFinalArs)],
    ["Total USD (final)", computedTotals.precioFinalUsd !== null ? h.fmtUSD(computedTotals.precioFinalUsd) : "-"],
    ["Unitario ARS", computedTotals.unitarioFinalArs !== null ? h.fmtARS(computedTotals.unitarioFinalArs) : "-"],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: h.M, right: h.M },
    head: [["Ítem", "Valor"]],
    body: totRows,
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [20, 24, 32], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 249, 251] },
    tableLineColor: 230,
    tableLineWidth: 0.3,
    columnStyles: { 1: { halign: "right" } },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  const msf = interno?.margenSeguroFallosPct;
  const mb = interno?.margenBeneficioPct;

  y = h.drawSectionTitle(y, "Parámetros / supuestos");
  const sup = [
    `• Margen seguro fallos: ${msf != null ? `${msf}%` : "-"}`,
    `• Margen beneficio: ${mb != null ? `${mb}%` : "-"}`,
    `• Nota: valores sujetos a tolerancias, orientación, material y calidad acordada.`,
  ];
  h.setText(10, false);
  doc.setTextColor(20);
  doc.text(sup.flatMap((t) => h.wrapText(t, h.CONTENT_W)), h.M, y);
  y += 18;

  if (adicionales.length > 0) {
    y = h.drawSectionTitle(y, "Adicionales (detalle interno)");
    const rows: RowInput[] = adicionales.map((a) => {
      const factor = a.por_unidad ? formData.unidades : 1;
      const total = (a.monto ?? 0) * factor;
      return [a.concepto, a.moneda, a.por_unidad ? "Sí" : "No", String(a.monto ?? 0), String(factor), String(total)];
    });

    autoTable(doc, {
      startY: y,
      margin: { left: h.M, right: h.M },
      head: [["Concepto", "Moneda", "x Unidad", "Monto", "Factor", "Total"]],
      body: rows,
      styles: { font: "helvetica", fontSize: 8.5, cellPadding: 2.2 },
      headStyles: { fillColor: [20, 24, 32], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 249, 251] },
      tableLineColor: 230,
      tableLineWidth: 0.3,
    });

    y = (doc as any).lastAutoTable.finalY + 6;
  }

  const notasInternas = interno?.notasInternas?.trim();
  if (notasInternas) {
    y = h.drawSectionTitle(y, "Notas internas");
    h.setText(10, false);
    doc.setTextColor(20);
    doc.text(h.wrapText(notasInternas, h.CONTENT_W), h.M, y);
  }

  h.addFooter("Documento interno");
}

function pdfBaseName(nombre: string) {
  return nombre.replace(/[^a-z0-9]/gi, "_");
}

function pdfDateSuffix() {
  return new Date().toISOString().split("T")[0];
}

/** PDF de una sola hoja para el cliente (COPIA CLIENTE). */
export async function generateClientQuotePdf(params: GenerateQuotePdfParams): Promise<void> {
  assertClient();
  const jsPDF = await loadJsPDF();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const h = buildPdfHelpers(doc, pageW, pageH, params.formData, params.computedTotals);
  const fecha = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });

  drawClienteContent(doc, params, h, fecha);
  h.stampCenterPageNumbers();

  const slug = pdfBaseName(params.formData.nombre);
  doc.save(`Presupuesto_${slug}_cliente_${pdfDateSuffix()}.pdf`);
}

/** PDF de uso interno (desglose y totales de cálculo). */
export async function generateInternalQuotePdf(params: GenerateQuotePdfParams): Promise<void> {
  assertClient();
  const jsPDF = await loadJsPDF();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const h = buildPdfHelpers(doc, pageW, pageH, params.formData, params.computedTotals);
  const fecha = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });

  drawInternoContent(doc, params, h, fecha);
  h.stampCenterPageNumbers();

  const slug = pdfBaseName(params.formData.nombre);
  doc.save(`Presupuesto_${slug}_interno_${pdfDateSuffix()}.pdf`);
}
