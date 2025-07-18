import express from 'express';
import { openDb } from '../db.js';
const router = express.Router();

router.get('/', async (req, res) => {
  const db = await openDb();
  const subjects = await db.all('SELECT * FROM subjects');
  res.json(subjects);
});

router.post('/', async (req, res) => {
  const { name } = req.body;
  const db = await openDb();
  await db.run('INSERT INTO subjects (name) VALUES (?)', [name]);
  res.json({ message: 'Subject added' });
});

export default router; 