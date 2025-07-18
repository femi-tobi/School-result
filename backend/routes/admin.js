import express from 'express';
import bcrypt from 'bcrypt';
import { openDb } from '../db.js';

const router = express.Router();

// Get students by class
router.get('/students', async (req, res) => {
  const { class: className } = req.query;
  const db = await openDb();
  let students;
  if (className) {
    students = await db.all('SELECT * FROM students WHERE class = ?', [className]);
  } else {
    students = await db.all('SELECT * FROM students');
  }
  res.json(students);
});

router.post('/students', async (req, res) => {
  const { fullname, student_id, class: className, password } = req.body;
  const db = await openDb();
  const hashed = await bcrypt.hash(password, 10);
  try {
    await db.run(
      'INSERT INTO students (fullname, student_id, class, password) VALUES (?, ?, ?, ?)',
      [fullname, student_id, className, hashed]
    );
    res.json({ message: 'Student added' });
  } catch (e) {
    res.status(400).json({ message: 'Student ID must be unique' });
  }
});

router.put('/students/:id', async (req, res) => {
  const { fullname, class: className, password } = req.body;
  const { id } = req.params;
  const db = await openDb();
  if (password) {
    const hashed = await bcrypt.hash(password, 10);
    await db.run('UPDATE students SET fullname = ?, class = ?, password = ? WHERE id = ?', [fullname, className, hashed, id]);
  } else {
    await db.run('UPDATE students SET fullname = ?, class = ? WHERE id = ?', [fullname, className, id]);
  }
  res.json({ message: 'Student updated' });
});

router.delete('/students/:id', async (req, res) => {
  const { id } = req.params;
  const db = await openDb();
  await db.run('DELETE FROM students WHERE id = ?', [id]);
  res.json({ message: 'Student deleted' });
});

export default router; 