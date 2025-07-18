import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from 'react-modal';

export default function TeacherDashboard() {
  const [teacher, setTeacher] = useState({});
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [results, setResults] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [message, setMessage] = useState('');
  const [students, setStudents] = useState([]);
  const [subject, setSubject] = useState('');
  const [term, setTerm] = useState('');
  const [session, setSession] = useState('');
  const [resultInputs, setResultInputs] = useState({}); // { student_id: { score, grade } }
  const [resultMsg, setResultMsg] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [caScores, setCaScores] = useState({});
  const [examScores, setExamScores] = useState({});
  const [selectedSubjects, setSelectedSubjects] = useState({});
  const [manualGrades, setManualGrades] = useState({});
  const [saveMsg, setSaveMsg] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStudent, setModalStudent] = useState(null);
  const [studentResults, setStudentResults] = useState([]);
  const [modalSubject, setModalSubject] = useState('');
  const [modalCA, setModalCA] = useState('');
  const [modalExam, setModalExam] = useState('');
  const [modalGrade, setModalGrade] = useState('');
  const [modalMsg, setModalMsg] = useState('');
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newModalSubject, setNewModalSubject] = useState('');
  const [addSubjectMsg, setAddSubjectMsg] = useState('');
  const [lastAddedSubject, setLastAddedSubject] = useState('');

  useEffect(() => {
    const teacherData = localStorage.getItem('teacher');
    if (!teacherData) return;
    const teacherObj = JSON.parse(teacherData);
    setTeacher(teacherObj);
    // Fetch assigned classes
    axios.get(`http://localhost:5000/api/admin/teachers/${teacherObj.id}/classes`)
      .then(res => setClasses(res.data))
      .catch(() => setClasses([]));
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    // Fetch results for selected class
    axios.get(`http://localhost:5000/api/results?class=${selectedClass}`)
      .then(res => setResults(res.data))
      .catch(() => setResults([]));
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass || !teacher.id) return;
    axios.get(`http://localhost:5000/api/admin/teachers/${teacher.id}/students`)
      .then(res => {
        // Filter students for the selected class
        setStudents(res.data.filter(s => s.class === selectedClass));
      })
      .catch(() => setStudents([]));
  }, [selectedClass, teacher.id]);

  // Fetch results for selected class, subject, term, session
  useEffect(() => {
    if (!selectedClass || !subject || !term || !session) return;
    axios.get(`http://localhost:5000/api/results?class=${selectedClass}&subject=${subject}&term=${term}&session=${session}`)
      .then(res => {
        // Map results by student_id for quick lookup
        const map = {};
        res.data.forEach(r => { map[r.student_id] = r; });
        setResultInputs(students.reduce((acc, s) => {
          acc[s.student_id] = map[s.student_id] ? { score: map[s.student_id].score, grade: map[s.student_id].grade } : { score: '', grade: '' };
          return acc;
        }, {}));
      })
      .catch(() => setResultInputs({}));
  }, [selectedClass, subject, term, session, students]);

  // Fetch subjects on mount
  useEffect(() => {
    axios.get('http://localhost:5000/api/subjects')
      .then(res => setSubjects(res.data))
      .catch(() => setSubjects([]));
  }, []);

  // Handle input change for result form
  const handleResultInputChange = (student_id, field, value) => {
    setResultInputs(prev => ({
      ...prev,
      [student_id]: {
        ...prev[student_id],
        [field]: value
      }
    }));
  };

  // Handle submit for a student's result
  const handleResultSubmit = async (student_id) => {
    if (!subject || !term || !session) {
      setResultMsg('Please select subject, term, and session.');
      return;
    }
    const { score, grade } = resultInputs[student_id] || {};
    if (!score || !grade) {
      setResultMsg('Score and grade are required.');
      return;
    }
    try {
      await axios.post('http://localhost:5000/api/results/manual', {
        student_id,
        subject,
        score,
        grade,
        term,
        session,
        class: selectedClass
      });
      setResultMsg('Result saved!');
    } catch (err) {
      setResultMsg('Error saving result.');
    }
  };

  const handleUpload = async () => {
    if (!csvFile || !selectedClass) {
      setMessage('Please select a class and choose a file.');
      return;
    }
    const formData = new FormData();
    formData.append('file', csvFile);
    formData.append('class', selectedClass);
    try {
      await axios.post('http://localhost:5000/api/results/upload', formData);
      setMessage('Results uploaded!');
      // Refresh results
      const res = await axios.get(`http://localhost:5000/api/results?class=${selectedClass}`);
      setResults(res.data);
    } catch (err) {
      setMessage('Error uploading results.');
    }
  };

  const openStudentModal = async (student) => {
    setModalStudent(student);
    setModalOpen(true);
    // Fetch results for this student for the current class/term/session
    try {
      const res = await axios.get(`http://localhost:5000/api/results?student_id=${student.student_id}&class=${selectedClass}&term=${term}&session=${session}`);
      setStudentResults(res.data);
    } catch {
      setStudentResults([]);
    }
    setModalSubject('');
    setModalCA('');
    setModalExam('');
    setModalGrade('');
    setModalMsg('');
  };
  const closeStudentModal = () => {
    setModalOpen(false);
    setModalStudent(null);
    setStudentResults([]);
    setModalSubject('');
    setModalCA('');
    setModalExam('');
    setModalGrade('');
    setModalMsg('');
  };
  const handleAddStudentResult = async () => {
    if (!modalSubject || !modalCA || !modalExam || !modalGrade) {
      setModalMsg('All fields are required.');
      return;
    }
    // Prevent duplicate subject for this student/session/class/term
    if (studentResults.some(r => r.subject === modalSubject)) {
      setModalMsg('This subject already has a result for this student in this session/term/class.');
      return;
    }
    const total = Number(modalCA) + Number(modalExam);
    try {
      await axios.post('http://localhost:5000/api/results/manual', {
        student_id: modalStudent.student_id,
        subject: modalSubject,
        score: total,
        grade: modalGrade,
        term,
        session,
        class: selectedClass
      });
      // Refresh results
      const res = await axios.get(`http://localhost:5000/api/results?student_id=${modalStudent.student_id}&class=${selectedClass}&term=${term}&session=${session}`);
      setStudentResults(res.data);
      setLastAddedSubject(modalSubject);
      setModalMsg('Result added!');
    } catch {
      setModalMsg('Error adding result.');
    }
  };
  const handleAddAnotherSubject = () => {
    setModalSubject('');
    setModalCA('');
    setModalExam('');
    setModalGrade('');
    setModalMsg('');
    setLastAddedSubject('');
  };

  const handleAddModalSubject = async () => {
    if (!newModalSubject.trim()) return;
    try {
      await axios.post('http://localhost:5000/api/subjects', { name: newModalSubject });
      const res = await axios.get('http://localhost:5000/api/subjects');
      setSubjects(res.data);
      setModalSubject(newModalSubject);
      setShowAddSubject(false);
      setNewModalSubject('');
      setAddSubjectMsg('Subject added!');
    } catch {
      setAddSubjectMsg('Error adding subject.');
    }
  };

  const TERMS = ['1st Term', '2nd Term', '3rd Term'];
  const SESSIONS = ['2023/24', '2024/25', '2025/26'];

  return (
    <div className="min-h-screen bg-green-50">
      <header className="bg-green-700 text-white flex items-center justify-between px-8 py-4 shadow">
        <div className="flex items-center gap-4">
          <div className="bg-white text-green-700 rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold border-2 border-green-300">
            {teacher.fullname ? teacher.fullname.split(' ').map(n => n[0]).join('').toUpperCase() : ''}
          </div>
          <div>
            <div className="font-bold text-lg">Welcome, {teacher.fullname}</div>
            <div className="text-sm text-green-200">Bosol Schools Teacher</div>
          </div>
        </div>
        <button className="bg-green-600 hover:bg-green-800 px-4 py-2 rounded text-white font-semibold" onClick={() => { localStorage.clear(); window.location = '/teacher-login'; }}>Logout</button>
      </header>
      <main className="max-w-3xl mx-auto mt-8 p-4">
        <div className="mb-6">
          <label className="font-semibold text-green-800">Select Class:</label>
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="p-2 rounded border-green-300 border focus:outline-none ml-2">
            <option value="">-- Select --</option>
            {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        {selectedClass && (
          <>
            <div className="bg-white rounded shadow p-6 mb-8">
              <h3 className="font-bold mb-2 text-green-700">Students in {selectedClass}</h3>
              <div className="flex gap-4 mb-4">
                <select value={term} onChange={e => setTerm(e.target.value)} className="border p-2 rounded w-32">
                  <option value="">Select Term</option>
                  {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={session} onChange={e => setSession(e.target.value)} className="border p-2 rounded w-32">
                  <option value="">Select Session</option>
                  {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <table className="min-w-full">
                <thead className="bg-green-200">
                  <tr>
                    <th className="py-2 px-4 text-left text-green-900">Full Name</th>
                    <th className="py-2 px-4 text-left text-green-900">CA Score</th>
                    <th className="py-2 px-4 text-left text-green-900">Exam Score</th>
                    <th className="py-2 px-4 text-left text-green-900">Total</th>
                    <th className="py-2 px-4 text-left text-green-900">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => {
                    const ca = caScores[s.student_id] || '';
                    const exam = examScores[s.student_id] || '';
                    const total = ca && exam ? Number(ca) + Number(exam) : '';
                    return (
                      <tr key={s.id}>
                        <td className="py-2 px-4">{s.fullname}</td>
                        <td className="py-2 px-4">
                          <input
                            type="number"
                            value={ca}
                            onChange={e => setCaScores(prev => ({ ...prev, [s.student_id]: e.target.value }))}
                            className="border p-1 rounded w-20"
                          />
                        </td>
                        <td className="py-2 px-4">
                          <input
                            type="number"
                            value={exam}
                            onChange={e => setExamScores(prev => ({ ...prev, [s.student_id]: e.target.value }))}
                            className="border p-1 rounded w-20"
                          />
                        </td>
                        <td className="py-2 px-4">
                          <input
                            type="number"
                            value={total}
                            readOnly
                            className="border p-1 rounded w-20 bg-gray-100"
                          />
                        </td>
                        <td className="py-2 px-4">
                          <button className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded" onClick={() => openStudentModal(s)}>View/Add Results</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <Modal
                isOpen={modalOpen}
                onRequestClose={closeStudentModal}
                contentLabel="Student Results Modal"
                ariaHideApp={false}
                className="bg-white rounded shadow p-6 max-w-lg mx-auto mt-20 outline-none"
                overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center"
              >
                <h3 className="font-bold mb-2 text-green-700">Results for {modalStudent?.fullname}</h3>
                <div className="mb-4">
                  <table className="min-w-full mb-2">
                    <thead className="bg-green-200">
                      <tr>
                        <th className="py-2 px-4 text-left text-green-900">Subject</th>
                        <th className="py-2 px-4 text-left text-green-900">Score</th>
                        <th className="py-2 px-4 text-left text-green-900">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentResults.map(r => (
                        <tr key={r.id}>
                          <td className="py-2 px-4">{r.subject}</td>
                          <td className="py-2 px-4">{r.score}</td>
                          <td className="py-2 px-4">{r.grade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mb-4 flex gap-2 flex-wrap">
                  <select value={modalSubject} onChange={e => setModalSubject(e.target.value)} className="border p-2 rounded w-32">
                    <option value="">Select Subject</option>
                    {subjects.map(sub => (
                      <option key={sub.id + '-' + sub.name} value={sub.name}>{sub.name}</option>
                    ))}
                  </select>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded" onClick={() => setShowAddSubject(v => !v)}>+ Add Subject</button>
                  {showAddSubject && (
                    <>
                      <input type="text" value={newModalSubject} onChange={e => setNewModalSubject(e.target.value)} placeholder="New subject name" className="border p-2 rounded w-32" />
                      <button className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded" onClick={handleAddModalSubject}>Save</button>
                      {addSubjectMsg && <span className="text-green-700 ml-2">{addSubjectMsg}</span>}
                    </>
                  )}
                  <input type="number" value={modalCA} onChange={e => setModalCA(e.target.value)} placeholder="CA Score" className="border p-2 rounded w-24" />
                  <input type="number" value={modalExam} onChange={e => setModalExam(e.target.value)} placeholder="Exam Score" className="border p-2 rounded w-24" />
                  <input type="number" value={modalCA && modalExam ? Number(modalCA) + Number(modalExam) : ''} readOnly placeholder="Total" className="border p-2 rounded w-24 bg-gray-100" />
                  <input type="text" value={modalGrade} onChange={e => setModalGrade(e.target.value)} placeholder="Grade" className="border p-2 rounded w-16" />
                  <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded" onClick={handleAddStudentResult} disabled={!!lastAddedSubject}>Save</button>
                  {lastAddedSubject && (
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded" onClick={handleAddAnotherSubject}>Add Another Subject</button>
                  )}
                </div>
                {modalMsg && <div className="text-green-700 mb-2">{modalMsg}</div>}
                <button className="mt-2 text-red-600 hover:underline" onClick={closeStudentModal}>Close</button>
              </Modal>
            </div>
            <div className="bg-white rounded shadow p-6">
              <h3 className="font-bold mb-2 text-green-700">Upload Result for {selectedClass}</h3>
              <div className="flex items-center gap-2 mb-4">
                <input type="file" accept=".csv" onChange={e => setCsvFile(e.target.files[0])} className="border p-2 rounded w-full" />
                <button className="bg-green-600 hover:bg-green-700 text-white p-2 rounded" onClick={handleUpload}>Upload CSV</button>
              </div>
              {message && <div className="text-green-700 mb-2">{message}</div>}
            </div>
            <div className="bg-white rounded shadow p-6">
              <h3 className="font-bold mb-2 text-green-700">Results for {selectedClass}</h3>
              <table className="min-w-full">
                <thead className="bg-green-200">
                  <tr>
                    <th className="py-2 px-4 text-left text-green-900">Student ID</th>
                    <th className="py-2 px-4 text-left text-green-900">Subject</th>
                    <th className="py-2 px-4 text-left text-green-900">Score</th>
                    <th className="py-2 px-4 text-left text-green-900">Grade</th>
                    <th className="py-2 px-4 text-left text-green-900">Term</th>
                    <th className="py-2 px-4 text-left text-green-900">Session</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={r.id || i} className={i % 2 === 0 ? 'bg-green-50' : ''}>
                      <td className="py-2 px-4">{r.student_id}</td>
                      <td className="py-2 px-4">{r.subject}</td>
                      <td className="py-2 px-4">{r.score}</td>
                      <td className="py-2 px-4">{r.grade}</td>
                      <td className="py-2 px-4">{r.term}</td>
                      <td className="py-2 px-4">{r.session}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
} 