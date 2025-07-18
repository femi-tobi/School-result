import express from 'express';
import { openDb } from '../db.js';
const router = express.Router();

router.get('/', async (req, res) => {
  const db = await openDb();
  const classes = await db.all('SELECT * FROM classes');
  res.json(classes);
});

router.post('/', async (req, res) => {
  const { name } = req.body;
  const db = await openDb();
  await db.run('INSERT INTO classes (name) VALUES (?)', [name]);
  res.json({ message: 'Class added' });
});

export default router; 