import type { CostBreakdown } from "../types/resources";

// ✅ autoTable (recomendado para tablas lindas)
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

interface GenerateQuotePdfParams {
  formData: FormData;
  result: CostBreakdown;
  computedTotals: ComputedTotals;
  adicionales: AdicionalRow[];
  notes?: string;

  // ✅ extras opcionales (para que sea más “presupuesto real”)
  cliente?: {
    clienteNombre?: string;
    clienteEmpresa?: string;
    clienteEmail?: string;
  };
  condiciones?: {
    validezDias?: number; // ej 7
    plazoProduccionDias?: number; // ej 3-7
    formaPago?: string; // ej "50% anticipo + 50% entrega"
    incluye?: string[]; // bullets
    noIncluye?: string[]; // bullets
    garantia?: string; // ej "Calidad de impresión según material acordado"
  };
  interno?: {
    margenSeguroFallosPct?: number;
    margenBeneficioPct?: number;
    versionCalculadora?: string;
    responsable?: string;
    notasInternas?: string;
  };
}

export async function generateQuotePdf({
  formData,
  result,
  computedTotals,
  adicionales,
  notes = "",
  cliente,
  condiciones,
  interno,
}: GenerateQuotePdfParams): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("generateQuotePdf solo puede ejecutarse en el cliente");
  }

  const jsPDFModule: any = await import("jspdf");
  const jsPDF =
    jsPDFModule?.jsPDF ?? jsPDFModule?.default?.jsPDF ?? jsPDFModule?.default ?? jsPDFModule;

  // A4, mm
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const M = 14; // margen
  const CONTENT_W = pageW - M * 2;

  // ===== Helpers visuales =====
  const fmtARS = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
  const fmtUSD = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

  const setText = (size: number, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
  };

  const line = (y: number) => {
    doc.setDrawColor(220);
    doc.setLineWidth(0.4);
    doc.line(M, y, pageW - M, y);
  };

  const wrapText = (text: string, maxW: number) => doc.splitTextToSize(text, maxW) as string[];

  const drawHeader = (title: string, subtitle?: string, badge?: string) => {
    // banda superior
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

    // reset
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

    // Total ARS
    setText(10, true);
    doc.setTextColor(110);
    doc.text("TOTAL (ARS)", M + 6, y + 10);
    setText(18, true);
    doc.setTextColor(20);
    doc.text(fmtARS(computedTotals.precioFinalArs), M + 6, y + 20);

    // Total USD
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

  const today = new Date();
  const fecha = today.toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });

  // ======================================================
  // HOJA 1 — CLIENTE
  // ======================================================
  drawHeader("Presupuesto 3D", "Impresión / Producción de piezas", "COPIA CLIENTE");

  let y = 30;

  y = drawSectionTitle(y, "Datos del trabajo");
  y = drawKV(
    y,
    [
      { k: "Proyecto", v: formData.nombre },
      { k: "Fecha", v: fecha },
      { k: "Unidades", v: String(formData.unidades) },
      { k: "Horas estimadas", v: String(formData.horas) },
      { k: "Tipo de cambio", v: `${fmtARS(formData.valorDolar)} por USD` },
      { k: "Cliente", v: cliente?.clienteNombre || "-" },
    ],
    2
  );

  if (formData.descripcion?.trim()) {
    setText(9, true);
    doc.setTextColor(110);
    doc.text("Descripción", M, y);
    setText(10, false);
    doc.setTextColor(20);
    const descLines = wrapText(formData.descripcion, CONTENT_W);
    doc.text(descLines, M, y + 5);
    y += 5 + descLines.length * 5 + 3;
  }

  y = drawSectionTitle(y, "Resumen de precio");
  y = drawBigTotalsCard(y);

  // Unitario (si aplica)
  if (computedTotals.unitarioFinalArs !== null || computedTotals.unitarioFinalUsd !== null) {
    doc.setDrawColor(230);
    doc.roundedRect(M, y, CONTENT_W, 16, 3, 3, "S");
    setText(10, true);
    doc.setTextColor(110);
    doc.text("Precio unitario", M + 6, y + 7);

    setText(12, true);
    doc.setTextColor(20);
    const uArs = computedTotals.unitarioFinalArs !== null ? fmtARS(computedTotals.unitarioFinalArs) : "-";
    const uUsd = computedTotals.unitarioFinalUsd !== null ? fmtUSD(computedTotals.unitarioFinalUsd) : "-";
    doc.text(`${uArs}  |  ${uUsd}`, M + 6, y + 13);

    y += 20;
  }

  // Adicionales tabla
  if (adicionales.length > 0) {
    y = drawSectionTitle(y, "Adicionales");
    const rows: RowInput[] = adicionales.map((a) => {
      const factor = a.por_unidad ? formData.unidades : 1;
      const montoTotal = (a.monto ?? 0) * factor;

      const ars = a.moneda === "USD" ? montoTotal * formData.valorDolar : montoTotal;
      const usd = a.moneda === "USD" ? montoTotal : montoTotal / formData.valorDolar;

      return [
        a.concepto,
        a.por_unidad ? "Por unidad" : "Por trabajo",
        fmtARS(ars),
        fmtUSD(usd),
      ];
    });

    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
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

  // Condiciones / notas para cliente
  y = drawSectionTitle(y, "Condiciones");
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

  // bullets
  setText(10, false);
  doc.setTextColor(20);
  const bullets = condLines.flatMap((t) => wrapText(t, CONTENT_W));
  doc.text(bullets, M, y);
  y += bullets.length * 5 + 4;

  // Incluye / No incluye (opcional)
  const inc = condiciones?.incluye ?? [];
  const noInc = condiciones?.noIncluye ?? [];

  if (inc.length || noInc.length) {
    const boxH = 26;
    const colW = (CONTENT_W - 6) / 2;

    // cajas
    doc.setDrawColor(230);
    doc.roundedRect(M, y, colW, boxH, 3, 3, "S");
    doc.roundedRect(M + colW + 6, y, colW, boxH, 3, 3, "S");

    setText(10, true);
    doc.setTextColor(110);
    doc.text("Incluye", M + 5, y + 7);
    doc.text("No incluye", M + colW + 11, y + 7);

    setText(9, false);
    doc.setTextColor(20);

    const incLines = (inc.length ? inc : ["-"]).slice(0, 6).map((x) => `• ${x}`);
    const noIncLines = (noInc.length ? noInc : ["-"]).slice(0, 6).map((x) => `• ${x}`);

    doc.text(wrapText(incLines.join("\n"), colW - 10), M + 5, y + 12);
    doc.text(wrapText(noIncLines.join("\n"), colW - 10), M + colW + 11, y + 12);

    y += boxH + 4;
  }

  addFooter("Documento para el cliente");

  // ======================================================
  // HOJA 2 — INTERNO
  // ======================================================
  doc.addPage();
  drawHeader("Presupuesto 3D", "Detalle interno de cálculo", "USO INTERNO");
  y = 30;

  y = drawSectionTitle(y, "Datos base");
  y = drawKV(
    y,
    [
      { k: "Proyecto", v: formData.nombre },
      { k: "Fecha", v: fecha },
      { k: "Unidades", v: String(formData.unidades) },
      { k: "Horas impresión", v: String(formData.horas) },
      { k: "USD/ARS", v: `${formData.valorDolar.toFixed(2)}` },
      { k: "Versión", v: interno?.versionCalculadora ?? "-" },
      { k: "Responsable", v: interno?.responsable ?? "-" },
    ],
    2
  );

  y = drawSectionTitle(y, "Desglose de costos (USD)");
  const usdRows: RowInput[] = [
    ["Máquinas", fmtUSD(result.costo_maquinas_usd)],
    ["Trabajadores", fmtUSD(result.costo_trabajadores_usd)],
    ["Materiales", fmtUSD(result.costo_materiales_usd)],
    ["Desperdicio", fmtUSD(result.costo_desperdicio_usd)],
    ["Gastos fijos (prorrateo)", fmtUSD(result.costo_gastos_fijos_usd)],
    ["Subtotal costos", fmtUSD(result.costo_total_usd)],
    ["Sugerido total (USD)", fmtUSD(result.costo_sugerido_total_usd)],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
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

  y = drawSectionTitle(y, "Totales finales (ARS / USD)");
  const totalArsCalc = (result.precio_calculado_ars ?? result.costo_sugerido_total_local);
  const totRows: RowInput[] = [
    ["Total ARS (calculado)", fmtARS(totalArsCalc)],
    ["Adicionales ARS", fmtARS(computedTotals.adicionalesTotalArs)],
    ["Total ARS (final)", fmtARS(computedTotals.precioFinalArs)],
    ["Total USD (final)", computedTotals.precioFinalUsd !== null ? fmtUSD(computedTotals.precioFinalUsd) : "-"],
    ["Unitario ARS", computedTotals.unitarioFinalArs !== null ? fmtARS(computedTotals.unitarioFinalArs) : "-"],
    ["Unitario USD", computedTotals.unitarioFinalUsd !== null ? fmtUSD(computedTotals.unitarioFinalUsd) : "-"],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
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

  // Variables internas
  const msf = interno?.margenSeguroFallosPct;
  const mb = interno?.margenBeneficioPct;

  y = drawSectionTitle(y, "Parámetros / supuestos");
  const sup = [
    `• Margen seguro fallos: ${msf != null ? `${msf}%` : "-"}`,
    `• Margen beneficio: ${mb != null ? `${mb}%` : "-"}`,
    `• Nota: valores sujetos a tolerancias, orientación, material y calidad acordada.`,
  ];
  setText(10, false);
  doc.setTextColor(20);
  doc.text(sup.flatMap((t) => wrapText(t, CONTENT_W)), M, y);
  y += 18;

  // Adicionales internos (detalle)
  if (adicionales.length > 0) {
    y = drawSectionTitle(y, "Adicionales (detalle interno)");
    const rows: RowInput[] = adicionales.map((a) => {
      const factor = a.por_unidad ? formData.unidades : 1;
      const total = (a.monto ?? 0) * factor;
      return [
        a.concepto,
        a.moneda,
        a.por_unidad ? "Sí" : "No",
        String(a.monto ?? 0),
        String(factor),
        String(total),
      ];
    });

    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
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

  // Notas internas (opcional)
  const notasInternas = interno?.notasInternas?.trim();
  if (notasInternas) {
    y = drawSectionTitle(y, "Notas internas");
    setText(10, false);
    doc.setTextColor(20);
    doc.text(wrapText(notasInternas, CONTENT_W), M, y);
  }

  addFooter("Documento interno");

  // Numeración final correcta (por si autoTable agregó salto)
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    setText(8, false);
    doc.setTextColor(120);
    doc.text(`Página ${i} de ${totalPages}`, pageW / 2, pageH - 8, { align: "center" });
  }

  const fileName = `Presupuesto_${formData.nombre.replace(/[^a-z0-9]/gi, "_")}_${new Date()
    .toISOString()
    .split("T")[0]}.pdf`;

  doc.save(fileName);
}
