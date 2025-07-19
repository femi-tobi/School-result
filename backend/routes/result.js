import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import { openDb } from '../db.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('file'), async (req, res) => {
  const fileRows = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (row) => fileRows.push(row))
    .on('end', async () => {
      const db = await openDb();
      for (const row of fileRows) {
        await db.run(
          'INSERT INTO results (student_id, subject, ca1, ca2, ca3, score, grade, term, session) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [row.student_id, row.subject, row.ca1 || 0, row.ca2 || 0, row.ca3 || 0, row.score, row.grade, row.term, row.session]
        );
      }
      fs.unlinkSync(req.file.path);
      res.json({ message: 'Results uploaded' });
    });
});

router.post('/manual', async (req, res) => {
  const { student_id, subject, ca1 = 0, ca2 = 0, ca3 = 0, score, grade, term, session } = req.body;
  const db = await openDb();
  await db.run(
    'INSERT INTO results (student_id, subject, ca1, ca2, ca3, score, grade, term, session) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [student_id, subject, ca1, ca2, ca3, score, grade, term, session]
  );
  res.json({ message: 'Result added' });
});

// Fetch results by class
router.get('/', async (req, res) => {
  const { class: className } = req.query;
  const db = await openDb();
  let results;
  if (className) {
    results = await db.all('SELECT * FROM results WHERE class = ?', [className]);
  } else {
    results = await db.all('SELECT * FROM results');
  }
  res.json(results);
});

export default router; 