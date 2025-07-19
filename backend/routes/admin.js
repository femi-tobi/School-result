import express from 'express';
import bcrypt from 'bcrypt';
import { openDb } from '../db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const photoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join('backend', 'uploads', 'photos');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
  }
});
const upload = multer({ storage: photoStorage });

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

// Update POST /students to accept photo upload
router.post('/students', upload.single('photo'), async (req, res) => {
  const { fullname, student_id, class: className, password } = req.body;
  const db = await openDb();
  const hashed = await bcrypt.hash(password, 10);
  let photoPath = null;
  if (req.file) {
    photoPath = req.file.path.replace(/\\/g, '/');
  }
  try {
    await db.run(
      'INSERT INTO students (fullname, student_id, class, password, photo) VALUES (?, ?, ?, ?, ?)',
      [fullname, student_id, className, hashed, photoPath]
    );
    res.json({ message: 'Student added' });
  } catch (e) {
    res.status(400).json({ message: 'Student ID must be unique' });
  }
});

// Update PUT /students/:id to accept photo upload
router.put('/students/:id', upload.single('photo'), async (req, res) => {
  const { fullname, class: className, password } = req.body;
  const { id } = req.params;
  const db = await openDb();
  let photoPath = null;
  if (req.file) {
    photoPath = req.file.path.replace(/\\/g, '/');
  }
  if (password) {
    const hashed = await bcrypt.hash(password, 10);
    if (photoPath) {
      await db.run('UPDATE students SET fullname = ?, class = ?, password = ?, photo = ? WHERE id = ?', [fullname, className, hashed, photoPath, id]);
    } else {
      await db.run('UPDATE students SET fullname = ?, class = ?, password = ? WHERE id = ?', [fullname, className, hashed, id]);
    }
  } else {
    if (photoPath) {
      await db.run('UPDATE students SET fullname = ?, class = ?, photo = ? WHERE id = ?', [fullname, className, photoPath, id]);
    } else {
      await db.run('UPDATE students SET fullname = ?, class = ? WHERE id = ?', [fullname, className, id]);
    }
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