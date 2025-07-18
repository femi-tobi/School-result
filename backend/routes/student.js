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
  // Generate PDF
  const doc = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  doc.pipe(res);
  doc.fontSize(18).text(`Result Sheet for ${student.fullname}`, { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Session: ${session}  Term: ${term}`);
  doc.moveDown();
  results.forEach(r => {
    doc.text(`${r.subject}: ${r.score} (${r.grade})`);
  });
  doc.end();
});

export default router; 