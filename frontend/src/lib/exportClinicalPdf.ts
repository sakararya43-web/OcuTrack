/**
 * exportClinicalPdf.ts
 *
 * Captures the off-screen monochrome ClinicalHandoffTemplate DOM node with
 * html2canvas (2x scale) and slices cleanly into an A4 portrait jsPDF document
 * with numbered page footers.
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function formatFilenameDate(visitDate: string): string {
  const d = new Date(visitDate);
  if (Number.isNaN(d.getTime())) {
    return 'unknown';
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function sanitise(s: string): string {
  return s.replace(/[^A-Za-z0-9_-]/g, '_');
}

export async function exportClinicalSummaryPdf(
  element: HTMLElement,
  patientId: string,
  visitDate: string
): Promise<string> {
  const widthPx = element.scrollWidth || 794;
  const heightPx = element.scrollHeight || element.offsetHeight || 1123;

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
    windowWidth: widthPx,
    windowHeight: heightPx,
    width: widthPx,
    height: heightPx,
  });

  const A4_WIDTH_MM = 210;
  const A4_HEIGHT_MM = 297;
  const MARGIN_MM = 10;
  const FOOTER_RESERVE_MM = 8;

  const pdf = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
  });

  const usableWidthMm = A4_WIDTH_MM - 2 * MARGIN_MM; // 190 mm
  const usableHeightMm = A4_HEIGHT_MM - 2 * MARGIN_MM - FOOTER_RESERVE_MM; // 269 mm

  const canvasWidthPx = canvas.width;
  const canvasHeightPx = canvas.height;
  const pxPerMm = canvasWidthPx / usableWidthMm;
  const sliceHeightPx = Math.max(1, Math.floor(usableHeightMm * pxPerMm));
  const totalPages = Math.max(1, Math.ceil(canvasHeightPx / sliceHeightPx));

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) {
      pdf.addPage();
    }

    const sliceCanvas = document.createElement('canvas');
    const yStart = page * sliceHeightPx;
    const sliceActualHeight = Math.min(sliceHeightPx, canvasHeightPx - yStart);

    sliceCanvas.width = canvasWidthPx;
    sliceCanvas.height = sliceActualHeight;

    const ctx = sliceCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      ctx.drawImage(
        canvas,
        0,
        yStart,
        canvasWidthPx,
        sliceActualHeight,
        0,
        0,
        canvasWidthPx,
        sliceActualHeight
      );
      const imgData = sliceCanvas.toDataURL('image/png');
      const sliceHeightMm = sliceActualHeight / pxPerMm;
      pdf.addImage(imgData, 'PNG', MARGIN_MM, MARGIN_MM, usableWidthMm, sliceHeightMm);
    }

    pdf.setFont('courier', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(75, 85, 99);
    const footerY = A4_HEIGHT_MM - 7;
    pdf.text(`OcuTrack Clinical Handoff Summary - ${sanitise(patientId)}`, MARGIN_MM, footerY);
    pdf.text(`Page ${page + 1} of ${totalPages}`, A4_WIDTH_MM - MARGIN_MM, footerY, {
      align: 'right',
    });
  }

  const dateStr = formatFilenameDate(visitDate);
  const filename = `OcuTrack_Clinical_Summary_${sanitise(patientId)}_${dateStr}.pdf`;
  pdf.save(filename);
  return filename;
}
