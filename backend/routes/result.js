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
          'INSERT INTO results (student_id, subject, score, grade, term, session) VALUES (?, ?, ?, ?, ?, ?)',
          [row.student_id, row.subject, row.score, row.grade, row.term, row.session]
        );
      }
      fs.unlinkSync(req.file.path);
      res.json({ message: 'Results uploaded' });
    });
});

router.post('/manual', async (req, res) => {
  const { student_id, subject, score, grade, term, session } = req.body;
  const db = await openDb();
  await db.run(
    'INSERT INTO results (student_id, subject, score, grade, term, session) VALUES (?, ?, ?, ?, ?, ?)',
    [student_id, subject, score, grade, term, session]
  );
  res.json({ message: 'Result added' });
});

export default router; 