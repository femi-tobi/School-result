import express from 'express';
import { openDb } from '../db.js';
import PDFDocument from 'pdfkit';

const router = express.Router();

router.get('/:student_id/result', async (req, res) => {
  const { student_id } = req.params;
  const { term, session } = req.query;
  const db = await openDb();
  const results = await db.all(
    'SELECT * FROM results WHERE student_id = ? AND term = ? AND session = ? AND approved = 1',
    [student_id, term, session]
  );
  res.json(results);
});

router.get('/:student_id/result/pdf', async (req, res) => {
  const { student_id } = req.params;
  const { term, session } = req.query;
  const db = await openDb();
  const results = await db.all(
    'SELECT * FROM results WHERE student_id = ? AND term = ? AND session = ?',
    [student_id, term, session]
  );
  const student = await db.get('SELECT * FROM students WHERE student_id = ?', [student_id]);

  // School logo path (user provided)
  const logoPath = 'backend/images.jpg';

  // Generate PDF
  const doc = new PDFDocument({ margin: 30, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  doc.pipe(res);

  // HEADER SECTION
  // Draw school logo
  try { doc.image(logoPath, 40, 30, { width: 60 }); } catch {}
  const pageWidth = doc.page.width;
  // School name
  doc.fontSize(20).font('Helvetica-Bold').text("BOSOL GOD'S WILL GROUP OF SCHOOLS.", 0, 30, { align: 'center', width: pageWidth });
  // Address and contact
  doc.fontSize(10).font('Helvetica').text('46-50, AMOKE ALASELA STREET, ABORI, IVANA-IPAJA, LAGOS STATE', 0, 55, { align: 'center', width: pageWidth });
  doc.text('Web: www.bosolschools.com  Email: bosolschools1998@gmail.com / bosolschools@yahoo.com  Tel.: 08033280761, 08023056947', 0, 68, { align: 'center', width: pageWidth });
  // Session title
  doc.fontSize(13).font('Helvetica-Bold').text('END OF FIRST TERM E-DOSSIER SLIP FOR 2024/2025 ACADEMIC SESSION', 0, 85, { align: 'center', width: pageWidth });
  // Draw border below session title
  doc.moveTo(40, 105).lineTo(pageWidth - 40, 105).stroke();

  // STUDENT INFO SECTION
  // Row 1: Name, Sex, Age, Passport
  let infoY = 110;
  doc.fontSize(11).font('Helvetica-Bold');
  doc.rect(40, infoY, pageWidth - 80, 20).stroke();
  doc.text('NAME:', 45, infoY + 5, { continued: true }).font('Helvetica').text(student.fullname, { continued: true });
  doc.font('Helvetica-Bold').text('   SEX:', { continued: true }).font('Helvetica').text('Female', { continued: true }); // Placeholder
  doc.font('Helvetica-Bold').text('   AGE:', { continued: true }).font('Helvetica').text('11years', { continued: true }); // Placeholder
  // Draw PASSPORT box at far right
  const passportBoxX = pageWidth - 80 - 50;
  const passportBoxY = infoY + 2;
  doc.rect(passportBoxX, passportBoxY, 40, 50).stroke();
  doc.font('Helvetica-Bold').fontSize(9).text('PASSPORT', passportBoxX, passportBoxY + 52, { width: 40, align: 'center' });
  // If student.photo exists, draw image inside box
  if (student.photo) {
    try {
      doc.image(student.photo, passportBoxX + 2, passportBoxY + 2, { width: 36, height: 46 });
    } catch {}
  }
  // Row 2: Class, Term, Session
  infoY += 20;
  doc.font('Helvetica-Bold').rect(40, infoY, pageWidth - 80, 20).stroke();
  doc.text('CLASS:', 45, infoY + 5, { continued: true }).font('Helvetica').text(student.class, { continued: true });
  doc.font('Helvetica-Bold').text('   TERM:', { continued: true }).font('Helvetica').text(term, { continued: true });
  doc.font('Helvetica-Bold').text('   SESSION:', { continued: true }).font('Helvetica').text(session);
  // Row 3: Summary stats
  infoY += 20;
  doc.font('Helvetica-Bold').rect(40, infoY, pageWidth - 80, 20).stroke();
  doc.text("TERM'S AVERAGE:", 45, infoY + 5, { continued: true }).font('Helvetica').text('66.60', { continued: true });
  doc.font('Helvetica-Bold').text('   CUMULATIVE GRADE:', { continued: true }).font('Helvetica').text('B3 (Good)', { continued: true });
  doc.font('Helvetica-Bold').text('   HIGHEST CLASS AVG:', { continued: true }).font('Helvetica').text('82.50', { continued: true });
  doc.font('Helvetica-Bold').text('   LOWEST CLASS AVG:', { continued: true }).font('Helvetica').text('52.75', { continued: true });
  doc.font('Helvetica-Bold').text('   CLASS AVG:', { continued: true }).font('Helvetica').text('66.59', { continued: true });
  doc.font('Helvetica-Bold').text('   SESSION:', { continued: true }).font('Helvetica').text('2024/2025');
  // Move doc.y to below info section
  doc.y = infoY + 30;

// === MAIN RESULT TABLE ===
const margin = 30;
const colWidths = [
  60, // SUBJECTS
  35, // CA1
  35, // CA2
  35, // CA3
  35, // CA Total
  35, // Exam
  35, // Total
  35, // Grade
  45, // Remark
  60, // Prev Term 1
  50, // Prev Term 2
  60  // Cumulative
];
const colX = [margin];
for (let i = 0; i < colWidths.length; i++) {
  colX.push(colX[i] + colWidths[i]);
}
const rowHeight = 20; // Normal row height for data rows
const headerRowHeight = 44; // Taller header row
const tableStartY = doc.y + 10;

// Draw header grid lines (using headerRowHeight)
for (let i = 0; i < colX.length; i++) {
  doc.moveTo(colX[i], tableStartY).lineTo(colX[i], tableStartY + headerRowHeight * 2).stroke();
}
for (let r = 0; r <= 2; r++) {
  doc.moveTo(colX[0], tableStartY + r * headerRowHeight).lineTo(colX[colX.length - 1], tableStartY + r * headerRowHeight).stroke();
}

// Draw the rest of the table (data rows) using normal rowHeight, starting immediately after the header
const numRows = results.length;
const dataStartY = tableStartY + headerRowHeight * 2;
for (let i = 0; i < colX.length; i++) {
  doc.moveTo(colX[i], dataStartY).lineTo(colX[i], dataStartY + rowHeight * numRows).stroke();
}
for (let r = 0; r <= numRows; r++) {
  doc.moveTo(colX[0], dataStartY + r * rowHeight).lineTo(colX[colX.length - 1], dataStartY + r * rowHeight).stroke();
}

// Vertical 'SUBJECTS' header (centered in header area)
doc.save();
doc.font('Helvetica-Bold').fontSize(11);
doc.rotate(-90, { origin: [colX[0] + colWidths[0] / 2, tableStartY + headerRowHeight + 10] });
doc.text('SUBJECTS', colX[0] + colWidths[0] / 4, tableStartY + headerRowHeight + 10, { align: 'center', width: colWidths[0] });
doc.restore();

// Grouped headers (centered in header area)
const groupHeaderY = tableStartY;
doc.font('Helvetica-Bold').fontSize(9);
doc.text('SUMMARY OF CONTINUOUS\nASSESSMENT TEST', colX[1], groupHeaderY, { width: colX[5] - colX[1], align: 'center' });
doc.text('SUMMARY OF TERMS WORK', colX[5], groupHeaderY, { width: colX[9] - colX[5], align: 'center' });
doc.text('PREVIOUS TERMS SUMMARIES', colX[9], groupHeaderY, { width: colX[12] - colX[9], align: 'center' });

// Second header row for CA columns
const caHeaderY = tableStartY + headerRowHeight;
doc.font('Helvetica-Bold').fontSize(8);
doc.text('1ST C.A.', colX[1], caHeaderY, { width: colX[2] - colX[1], align: 'center' });
doc.font('Helvetica').fontSize(7);
doc.text('Obtainable = 20%', colX[1], caHeaderY + 10, { width: colX[2] - colX[1], align: 'center' });
doc.font('Helvetica-Bold').fontSize(8);
doc.text('2ND C.A.', colX[2], caHeaderY, { width: colX[3] - colX[2], align: 'center' });
doc.font('Helvetica').fontSize(7);
doc.text('Obtainable = 10%', colX[2], caHeaderY + 10, { width: colX[3] - colX[2], align: 'center' });
doc.font('Helvetica-Bold').fontSize(8);
doc.text('3RD C.A.', colX[3], caHeaderY, { width: colX[4] - colX[3], align: 'center' });
doc.font('Helvetica').fontSize(7);
doc.text('Obtainable = 10%', colX[3], caHeaderY + 10, { width: colX[4] - colX[3], align: 'center' });
doc.font('Helvetica-Bold').fontSize(8);
doc.text('TOTAL', colX[4], caHeaderY, { width: colX[5] - colX[4], align: 'center' });
doc.font('Helvetica').fontSize(7);
doc.text('first, second & third', colX[4], caHeaderY + 10, { width: colX[5] - colX[4], align: 'center' });
// Rotated header for 'Exams summary'
doc.save();
doc.font('Helvetica-Bold').fontSize(10);
doc.rotate(-90, { origin: [colX[5] + colWidths[2] / 2, tableStartY + headerRowHeight + 10] });
doc.text('Exams\nsummary', colX[5] + colWidths[4] / 2, tableStartY + headerRowHeight + 10, { width: 60, align: 'center' });
doc.restore();
// Horizontal headers for the rest (centered in header area)
doc.font('Helvetica-Bold').fontSize(8);
doc.text('100+', colX[6], tableStartY + headerRowHeight + 10, { width: colX[7] - colX[6], align: 'center' });
doc.text('Percent', colX[6], tableStartY + headerRowHeight + 18, { width: colX[7] - colX[6], align: 'center' });
doc.text('GRADE SCORE', colX[7], tableStartY + headerRowHeight + 8, { width: colX[8] - colX[7], align: 'center' });
doc.text('GRADE REMARKS', colX[8], tableStartY + headerRowHeight + 8, { width: colX[9] - colX[8], align: 'center' });
// Vertical headers for 'PREVIOUS TERMS SUMMARIES'
const prevHeaders = ['FIRST TERM\nSUMMARY', 'SECOND TERM\nSUMMARY', 'CUMULATIVE\nAVERAGE'];
for (let i = 9; i <= 11; i++) {
  doc.save();
  doc.font('Helvetica-Bold').fontSize(8);
  doc.rotate(-90, { origin: [colX[i] + colWidths[i] / 2, tableStartY + headerRowHeight + 10] });
  doc.text(prevHeaders[i - 9], colX[i] + colWidths[i] / 2, tableStartY + headerRowHeight + 10, { width: 60, align: 'center' });
  doc.restore();
}
  // Fill in subject rows
  let rowY = dataStartY; // Start from the first data row
  doc.font('Helvetica').fontSize(9);
  results.forEach((r, idx) => {
    doc.text(r.subject, colX[0], rowY + 5, { width: colX[1] - colX[0], align: 'center' });
    // Fill CA1, CA2, CA3, Total, Exam, Total, Grade, Remark (dynamic)
    doc.text(r.ca1 ?? '', colX[1], rowY + 5, { width: colX[2] - colX[1], align: 'center' });
    doc.text(r.ca2 ?? '', colX[2], rowY + 5, { width: colX[3] - colX[2], align: 'center' });
    doc.text(r.ca3 ?? '', colX[3], rowY + 5, { width: colX[4] - colX[3], align: 'center' });
    const caTotal = (Number(r.ca1) || 0) + (Number(r.ca2) || 0) + (Number(r.ca3) || 0);
    doc.text(caTotal, colX[4], rowY + 5, { width: colX[5] - colX[4], align: 'center' });
    doc.text(r.score ?? '', colX[5], rowY + 5, { width: colX[6] - colX[5], align: 'center' });
    const total = caTotal + (Number(r.score) || 0);
    doc.text(total, colX[6], rowY + 5, { width: colX[7] - colX[6], align: 'center' });
    doc.text(r.grade ?? '', colX[7], rowY + 5, { width: colX[8] - colX[7], align: 'center' });
    doc.text(r.remark ?? '', colX[8], rowY + 5, { width: colX[9] - colX[8], align: 'center' });
    rowY += rowHeight;
  });
  // Draw 'Previous Terms Summaries' table to the right
  const prevX = colX[9];
  const prevY = dataStartY; // Start from the first data row
  // doc.font('Helvetica-Bold').fontSize(8);
  // doc.text('FIRST TERM', prevX, prevY, { width: colX[10] - prevX, align: 'center' });
  // doc.text('SECOND TERM', prevX, prevY + rowHeight, { width: colX[10] - prevX, align: 'center' });
  // doc.text('CUMULATIVE AVERAGE', prevX, prevY + rowHeight * 2, { width: colX[10] - prevX, align: 'center' });
  // Draw grid for previous terms
  for (let r = 0; r < 3; r++) {
    doc.moveTo(prevX, prevY + r * rowHeight).lineTo(colX[11], prevY + r * rowHeight).stroke();
    doc.moveTo(prevX, prevY + (r + 1) * rowHeight).lineTo(colX[11], prevY + (r + 1) * rowHeight).stroke();
  }
  for (let i = 9; i <= 11; i++) {
    doc.moveTo(colX[i], prevY).lineTo(colX[i], prevY + rowHeight * 3).stroke();
  }

  // === GRAND TOTAL ROW ===
  const grandTotalY = rowY + 10;
  doc.font('Helvetica-Bold').fontSize(14);
  doc.rect(colX[0], grandTotalY, colX[9] - colX[0], 30).stroke();
  doc.text('Grand Total=', colX[0] + 10, grandTotalY + 7, { continued: true });
  doc.font('Helvetica-Bold').fillColor('black').text(` ${results.reduce((sum, r) => sum + Number(r.score), 0)}`, { align: 'center' });
  doc.font('Helvetica').fillColor('black');

  // === PROMOTIONAL STATUS & REMARKS SECTION ===
  let remarksY = grandTotalY + 40;
  const remarksWidth = pageWidth - 180 - colX[0]; // 180 = grading table width + margin
  const remarksYStart = grandTotalY + 30;

// Promotional Status
doc.font('Helvetica-Bold').rect(colX[0], remarksY, remarksWidth, 20).stroke();
doc.fontSize(10).text('Promotional Status:', colX[0] + 5, remarksY + 5, { continued: true })
   .font('Helvetica').text('Passed');

// Class Teacher's Remark
remarksY += 20;
const classRemark = "OLUMATOVIN you have a very good result, you have really done well. Please brace up more for a richer performance next term. See you at the top.";
doc.font('Helvetica-Bold').fontSize(9).text("Class Teacher's Remark:", colX[0] + 5, remarksY + 7);

const remarkX = colX[0] + 140;
const remarkY = remarksY + 7;
const remarkWidth = remarksWidth - 145;
doc.font('Helvetica').fontSize(9);
const classRemarkHeight = doc.heightOfString(classRemark, { width: remarkWidth, align: 'left' });
const boxHeight = Math.max(30, classRemarkHeight + 14); // 14 for padding
doc.rect(colX[0], remarksY, remarksWidth, boxHeight).stroke();
doc.text(classRemark, remarkX, remarkY, { width: remarkWidth, align: 'left' });

// Head Teacher's Remark
remarksY += boxHeight;
const headRemark = "Commendable result indeed, you have very large room to perform better. OLUMATOVIN MORE! MORE!";
doc.font('Helvetica-Bold').fontSize(9).text("Head Teacher's Remark:", colX[0] + 5, remarksY + 7);
const headRemarkHeight = doc.heightOfString(headRemark, { width: remarkWidth, align: 'left' });
const headBoxHeight = Math.max(30, headRemarkHeight + 14);
doc.rect(colX[0], remarksY, remarksWidth, headBoxHeight).stroke();
doc.font('Helvetica').fontSize(9).text(headRemark, remarkX, remarksY + 7, { width: remarkWidth, align: 'left' });

 // === KEY TO GRADING TABLE (bottom right) ===
const gradingKey = [
  ['A1', '75%-100%'],
  ['B2', '70%-74.9%'],
  ['B3', '65%-69.9%'],
  ['C6', '60%-64.9%'],
  ['D7', '55%-59.9%'],
  ['E8', '50%-54.9%'],
  ['F9', '0%-49.9%']
];

// Position the table to the right of the main content but within page bounds
// const keyTableX = Math.min(colX[9] + 10, pageWidth - 150); // Ensure it stays within page width
// const keyTableY = grandTotalY + 10;
const keyTableX = colX[0] + remarksWidth + 20; // 20px margin between remarks and grading
const keyTableY = remarksYStart;
const keyColWidths = [40, 80];

doc.font('Helvetica-Bold').fontSize(10).text('KEY TO GRADING', keyTableX, keyTableY, { width: keyColWidths[0] + keyColWidths[1], align: 'center' });

// Draw header
const keyHeaderY = keyTableY + 18;
doc.font('Helvetica-Bold').fontSize(10);
doc.text('Grade', keyTableX, keyHeaderY, { width: keyColWidths[0], align: 'center' });
doc.text('Range', keyTableX + keyColWidths[0], keyHeaderY, { width: keyColWidths[1], align: 'center' });

// Draw header box
doc.rect(keyTableX, keyHeaderY - 3, keyColWidths[0] + keyColWidths[1], 18).stroke();

// Draw rows
let keyY = keyHeaderY + 15;
doc.font('Helvetica').fontSize(10);
gradingKey.forEach(row => {
  doc.rect(keyTableX, keyY, keyColWidths[0], 18).stroke();
  doc.rect(keyTableX + keyColWidths[0], keyY, keyColWidths[1], 18).stroke();
  doc.text(row[0], keyTableX, keyY + 3, { width: keyColWidths[0], align: 'center' });
  doc.text(row[1], keyTableX + keyColWidths[0], keyY + 3, { width: keyColWidths[1], align: 'center' });
  keyY += 18;
});

  doc.end();
});

export default router; 