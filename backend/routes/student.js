import express from 'express';
import { openDb } from '../db.js';
import PDFDocument from 'pdfkit';

const router = express.Router();

router.get('/:student_id/result', async (req, res) => {
  const { student_id } = req.params;
  const { term, session } = req.query;
  const db = await openDb();
  const results = await db.all(
    'SELECT * FROM results WHERE student_id = ? AND term = ? AND session = ?',
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
  // Define columns (x positions) - first column is for SUBJECTS header and subject names
  const colX = [40, 120, 160, 200, 240, 280, 330, 380, 440, 500, 560, 620];
  const rowHeight = 20;
  const tableStartY = doc.y + 10;
  // Draw vertical 'SUBJECTS' header in the first column
  doc.save();
  doc.font('Helvetica-Bold').fontSize(13);
  doc.rotate(-90, { origin: [colX[0] + 30, tableStartY + 120] });
  doc.text('SUBJECTS', colX[0] + 30, tableStartY + 120, { align: 'center', width: 80 });
  doc.restore();
  // Draw summary headers (spanning columns)
  doc.font('Helvetica-Bold').fontSize(10);
  doc.text('SUMMARY OF CONTINUOUS', colX[1], tableStartY, { width: colX[6] - colX[1], align: 'center' });
  doc.text('SUMMARY OF TERMS WORK', colX[6], tableStartY, { width: colX[9] - colX[6], align: 'center' });
  doc.text('PREVIOUS TERMS SUMMARIES', colX[9], tableStartY, { width: colX[11] - colX[9], align: 'center' });
  // Draw rotated headers for CA1, CA2, CA3, etc.
  const headerLabels = ['FIRST SUMMARY TEST (1st CA)', 'SECOND SUMMARY (2nd CA)', 'THIRD SUMMARY (3rd CA)', 'TOTAL MARK (1st + 2nd + 3rd)', 'EXAM', 'TOTAL', 'GRADE', 'GRADED REMARKS'];
  for (let i = 1; i <= 8; i++) {
    if (i <= 4) {
      // Rotated header
      doc.save();
      doc.font('Helvetica-Bold').fontSize(8);
      doc.rotate(-60, { origin: [colX[i] + 10, tableStartY + rowHeight + 5] });
      doc.text(headerLabels[i - 1], colX[i] + 10, tableStartY + rowHeight + 5, { width: 60, align: 'left' });
      doc.restore();
    } else {
      // Horizontal header
      doc.font('Helvetica-Bold').fontSize(8);
      doc.text(headerLabels[i - 1], colX[i], tableStartY + rowHeight, { width: colX[i + 1] - colX[i], align: 'center' });
    }
  }
  // Draw grid lines for main table
  const numRows = results.length + 2; // +2 for headers
  for (let i = 0; i < colX.length; i++) {
    doc.moveTo(colX[i], tableStartY).lineTo(colX[i], tableStartY + rowHeight * (numRows + 1)).stroke();
  }
  for (let r = 0; r <= numRows + 1; r++) {
    doc.moveTo(colX[0], tableStartY + r * rowHeight).lineTo(colX[colX.length - 1], tableStartY + r * rowHeight).stroke();
  }
  // Fill in subject rows
  let rowY = tableStartY + rowHeight * 2;
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
  const prevY = tableStartY + rowHeight * 2;
  doc.font('Helvetica-Bold').fontSize(8);
  doc.text('FIRST TERM', prevX, prevY, { width: colX[10] - prevX, align: 'center' });
  doc.text('SECOND TERM', prevX, prevY + rowHeight, { width: colX[10] - prevX, align: 'center' });
  doc.text('CUMULATIVE AVERAGE', prevX, prevY + rowHeight * 2, { width: colX[10] - prevX, align: 'center' });
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
  const remarksWidth = colX[9] - colX[0];
  // Promotional Status
  doc.font('Helvetica-Bold').rect(colX[0], remarksY, remarksWidth, 20).stroke();
  doc.text('Promotional Status:', colX[0] + 5, remarksY + 5, { continued: true }).font('Helvetica').text('Passed');
  // Class Teacher's Remark
  remarksY += 20;
  doc.font('Helvetica-Bold').rect(colX[0], remarksY, remarksWidth, 30).stroke();
  doc.text("Class Teacher's Remark:", colX[0] + 5, remarksY + 5, { continued: true }).font('Helvetica').text('OLUMATOVIN you have a very good result, you have really done well. Please brace up more for a richer performance next term. See you at the top.');
  // Head Teacher's Remark
  remarksY += 30;
  doc.font('Helvetica-Bold').rect(colX[0], remarksY, remarksWidth, 30).stroke();
  doc.text("Head Teacher's Remark:", colX[0] + 5, remarksY + 5, { continued: true }).font('Helvetica').text('Commendable result indeed, you have very large room to perform better. OLUMATOVIN MORE! MORE!');

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
  const keyTableX = colX[9] + 10;
  const keyTableY = grandTotalY + 10;
  const keyColWidths = [40, 80];
  doc.font('Helvetica-Bold').fontSize(11).text('KEY TO GRADING', keyTableX, keyTableY, { width: keyColWidths[0] + keyColWidths[1], align: 'center' });
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