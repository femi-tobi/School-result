import React, { useState, useEffect } from 'react';
import axios from 'axios';

const NAV_ITEMS = [
  { key: 'students', label: 'Add/Edit Students' },
  { key: 'upload', label: 'Upload Result' },
  { key: 'subjects', label: 'Manage Subjects' },
  { key: 'sessions', label: 'Manage Sessions/Terms' },
  { key: 'classes', label: 'Manage Classes' },
  { key: 'history', label: 'View Result History' },
  { key: 'manageTeachers', label: 'Manage Teachers' },
];

export default function AdminDashboard() {
  const [csvFile, setCsvFile] = useState(null);
  const [form, setForm] = useState({
    student_id: '234567',
    subject: 'Samuel John',
    score: '76',
    grade: 'A',
    term: '2nd Term',
    session: '2024/25',
    class: '',
  });
  const [message, setMessage] = useState('');
  const [activePanel, setActivePanel] = useState('upload');
  const [classes, setClasses] = useState([]);
  const [newClass, setNewClass] = useState('');
  const [classMsg, setClassMsg] = useState('');

  // Add/Edit Students state
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [studentForm, setStudentForm] = useState({ fullname: '', student_id: '', password: '', editId: null });
  const [studentMsg, setStudentMsg] = useState('');

  // Manage Teachers state
  const [teachers, setTeachers] = useState([]);
  const [teacherForm, setTeacherForm] = useState({ fullname: '', email: '', password: '', editId: null });
  const [teacherMsg, setTeacherMsg] = useState('');
  const [assignClasses, setAssignClasses] = useState([]);
  const [assignTeacherId, setAssignTeacherId] = useState(null);

  // Manage Subjects state
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState('');
  const [subjectMsg, setSubjectMsg] = useState('');

  // Manage Sessions/Terms state
  const [sessions, setSessions] = useState([]);
  const [newSession, setNewSession] = useState('');
  const [sessionMsg, setSessionMsg] = useState('');

  // View Result History state
  const [results, setResults] = useState([]);
  const [historyFilters, setHistoryFilters] = useState({ student_id: '', class: '', term: '', session: '' });

  // Fetch classes on mount
  useEffect(() => {
    axios.get('http://localhost:5000/api/classes')
      .then(res => setClasses(res.data))
      .catch(err => setClasses([]));
  }, []);

  // Fetch students when selectedClass changes
  useEffect(() => {
    if (selectedClass) {
      axios.get(`http://localhost:5000/api/admin/students?class=${selectedClass}`)
        .then(res => setStudents(res.data))
        .catch(() => setStudents([]));
    } else {
      setStudents([]);
    }
  }, [selectedClass]);

  // Fetch teachers on mount or after changes
  useEffect(() => {
    if (activePanel === 'manageTeachers') {
      axios.get('http://localhost:5000/api/admin/teachers')
        .then(res => setTeachers(res.data))
        .catch(() => setTeachers([]));
    }
  }, [activePanel]);

  // Fetch subjects on mount or when panel is active
  useEffect(() => {
    if (activePanel === 'subjects') {
      axios.get('http://localhost:5000/api/subjects')
        .then(res => setSubjects(res.data))
        .catch(() => setSubjects([]));
    }
  }, [activePanel]);

  // Fetch sessions on mount or when panel is active
  useEffect(() => {
    if (activePanel === 'sessions') {
      axios.get('http://localhost:5000/api/sessions')
        .then(res => setSessions(res.data))
        .catch(() => setSessions([]));
    }
  }, [activePanel]);

  // Fetch results for history panel
  useEffect(() => {
    if (activePanel === 'history') {
      let url = 'http://localhost:5000/api/results?';
      const params = [];
      if (historyFilters.student_id) params.push(`student_id=${historyFilters.student_id}`);
      if (historyFilters.class) params.push(`class=${historyFilters.class}`);
      if (historyFilters.term) params.push(`term=${historyFilters.term}`);
      if (historyFilters.session) params.push(`session=${historyFilters.session}`);
      url += params.join('&');
      axios.get(url)
        .then(res => setResults(res.data))
        .catch(() => setResults([]));
    }
  }, [activePanel, historyFilters]);

  // Handlers for Upload Result
  const handleUpload = async () => {
    if (!csvFile || !form.class) {
      alert('Please select a class and choose a file.');
      return;
    }
    const formData = new FormData();
    formData.append('file', csvFile);
    formData.append('class', form.class);
    try {
      await axios.post('http://localhost:5000/api/results/upload', formData);
      alert('Results uploaded!');
    } catch (err) {
      let msg = 'Error uploading CSV.';
      if (err.response && err.response.data && err.response.data.message) {
        msg = err.response.data.message;
      } else if (err.message) {
        msg = err.message;
      }
      alert(msg);
      console.error(err);
    }
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!form.class) {
      setMessage('Please select a class.');
      return;
    }
    try {
      await axios.post('http://localhost:5000/api/results/manual', form);
      setMessage('Result added!');
      setForm({ ...form, subject: '', score: '', grade: '' });
    } catch (err) {
      let msg = 'Error adding result.';
      if (err.response && err.response.data && err.response.data.message) {
        msg = err.response.data.message;
      } else if (err.message) {
        msg = err.message;
      }
      setMessage(msg);
      console.error(err);
    }
  };

  // Manage Classes
  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!newClass.trim()) return;
    try {
      await axios.post('http://localhost:5000/api/classes', { name: newClass });
      setClasses([...classes, { name: newClass }]);
      setClassMsg('Class added!');
      setNewClass('');
    } catch (err) {
      setClassMsg('Error adding class.');
    }
  };

  const handleDeleteClass = async (name) => {
    try {
      // Find class id
      const cls = classes.find(c => c.name === name);
      if (!cls || !cls.id) return;
      await axios.delete(`http://localhost:5000/api/classes/${cls.id}`);
      setClasses(classes.filter(c => c.name !== name));
    } catch (err) {
      setClassMsg('Error deleting class.');
    }
  };

  // Add/Edit Students handlers
  const handleStudentFormChange = (e) => {
    setStudentForm({ ...studentForm, [e.target.name]: e.target.value });
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!selectedClass || !studentForm.fullname || !studentForm.student_id || !studentForm.password) {
      setStudentMsg('All fields are required.');
      return;
    }
    try {
      await axios.post('http://localhost:5000/api/admin/students', {
        fullname: studentForm.fullname,
        student_id: studentForm.student_id,
        class: selectedClass,
        password: studentForm.password,
      });
      setStudentMsg('Student added!');
      setStudentForm({ fullname: '', student_id: '', password: '', editId: null });
      // Refresh student list
      const res = await axios.get(`http://localhost:5000/api/admin/students?class=${selectedClass}`);
      setStudents(res.data);
    } catch (err) {
      setStudentMsg('Error adding student. Student ID must be unique.');
    }
  };

  const handleEditStudent = (student) => {
    setStudentForm({ fullname: student.fullname, student_id: student.student_id, password: '', editId: student.id });
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!studentForm.editId || !studentForm.fullname) return;
    try {
      await axios.put(`http://localhost:5000/api/admin/students/${studentForm.editId}`, {
        fullname: studentForm.fullname,
        class: selectedClass,
        password: studentForm.password || undefined, // Only send if not blank
      });
      setStudentMsg('Student updated!');
      setStudentForm({ fullname: '', student_id: '', password: '', editId: null });
      // Refresh student list
      const res = await axios.get(`http://localhost:5000/api/admin/students?class=${selectedClass}`);
      setStudents(res.data);
    } catch (err) {
      setStudentMsg('Error updating student.');
    }
  };

  // Manage Teachers handlers
  const handleTeacherFormChange = (e) => {
    setTeacherForm({ ...teacherForm, [e.target.name]: e.target.value });
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    if (!teacherForm.fullname || !teacherForm.email || (!teacherForm.editId && !teacherForm.password)) {
      setTeacherMsg('All fields are required.');
      return;
    }
    try {
      if (teacherForm.editId) {
        await axios.put(`http://localhost:5000/api/admin/teachers/${teacherForm.editId}`, {
          fullname: teacherForm.fullname,
          email: teacherForm.email,
          password: teacherForm.password || undefined,
        });
        setTeacherMsg('Teacher updated!');
      } else {
        await axios.post('http://localhost:5000/api/admin/teachers', {
          fullname: teacherForm.fullname,
          email: teacherForm.email,
          password: teacherForm.password,
        });
        setTeacherMsg('Teacher added!');
      }
      setTeacherForm({ fullname: '', email: '', password: '', editId: null });
      const res = await axios.get('http://localhost:5000/api/admin/teachers');
      setTeachers(res.data);
    } catch (err) {
      setTeacherMsg('Error adding/updating teacher. Email must be unique.');
    }
  };

  const handleEditTeacher = (teacher) => {
    setTeacherForm({ fullname: teacher.fullname, email: teacher.email, password: '', editId: teacher.id });
  };

  const handleDeleteTeacher = async (id) => {
    if (!window.confirm('Are you sure you want to delete this teacher?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/teachers/${id}`);
      setTeacherMsg('Teacher deleted!');
      const res = await axios.get('http://localhost:5000/api/admin/teachers');
      setTeachers(res.data);
    } catch (err) {
      setTeacherMsg('Error deleting teacher.');
    }
  };

  // Assign classes to teacher
  const handleAssignClasses = (teacher) => {
    setAssignTeacherId(teacher.id);
    axios.get(`http://localhost:5000/api/admin/teachers/${teacher.id}/classes`)
      .then(res => setAssignClasses(res.data.map(c => c.id)))
      .catch(() => setAssignClasses([]));
  };

  const handleClassCheckbox = (classId) => {
    setAssignClasses(prev => prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]);
  };

  const handleSaveAssignedClasses = async () => {
    try {
      await axios.post(`http://localhost:5000/api/admin/teachers/${assignTeacherId}/classes`, { classIds: assignClasses });
      setTeacherMsg('Classes assigned!');
      setAssignTeacherId(null);
    } catch (err) {
      setTeacherMsg('Error assigning classes.');
    }
  };

  // Manage Subjects handlers
  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.trim()) return;
    try {
      await axios.post('http://localhost:5000/api/subjects', { name: newSubject });
      const res = await axios.get('http://localhost:5000/api/subjects');
      setSubjects(res.data);
      setSubjectMsg('Subject added!');
      setNewSubject('');
    } catch (err) {
      setSubjectMsg('Error adding subject.');
    }
  };

  const handleDeleteSubject = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/subjects/${id}`);
      const res = await axios.get('http://localhost:5000/api/subjects');
      setSubjects(res.data);
    } catch (err) {
      setSubjectMsg('Error deleting subject.');
    }
  };

  // Manage Sessions/Terms handlers
  const handleAddSession = async (e) => {
    e.preventDefault();
    if (!newSession.trim()) return;
    try {
      await axios.post('http://localhost:5000/api/sessions', { name: newSession });
      setSessions([...sessions, { name: newSession }]);
      setSessionMsg('Session added!');
      setNewSession('');
    } catch (err) {
      setSessionMsg('Error adding session.');
    }
  };

  const handleDeleteSession = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/sessions/${id}`);
      setSessions(sessions.filter(s => s.id !== id));
    } catch (err) {
      setSessionMsg('Error deleting session.');
    }
  };

  const handleHistoryFilterChange = (e) => {
    setHistoryFilters({ ...historyFilters, [e.target.name]: e.target.value });
  };

  // Dummy panels for demonstration
  const renderPanel = () => {
    switch (activePanel) {
      case 'students':
        return (
          <div className="bg-white rounded shadow p-6 max-w-2xl">
            <h3 className="font-bold mb-2 text-green-700">Add/Edit Students</h3>
            <div className="mb-4 flex gap-2 items-center">
              <label className="font-semibold">Class:</label>
              <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="border p-2 rounded">
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            {selectedClass && (
              <>
                <form onSubmit={studentForm.editId ? handleUpdateStudent : handleAddStudent} className="flex gap-2 mb-4 flex-wrap">
                  <input type="text" name="fullname" value={studentForm.fullname} onChange={handleStudentFormChange} placeholder="Full Name" className="border p-2 rounded w-48" required />
                  <input type="text" name="student_id" value={studentForm.student_id} onChange={handleStudentFormChange} placeholder="Student ID" className="border p-2 rounded w-32" required disabled={!!studentForm.editId} />
                  {studentForm.editId ? (
                    <input
                      type="password"
                      name="password"
                      value={studentForm.password}
                      onChange={handleStudentFormChange}
                      placeholder="New Password (leave blank to keep current)"
                      className="border p-2 rounded w-32"
                    />
                  ) : (
                    <input type="password" name="password" value={studentForm.password} onChange={handleStudentFormChange} placeholder="Password" className="border p-2 rounded w-32" required />
                  )}
                  <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold">{studentForm.editId ? 'Update' : 'Add'}</button>
                  {studentMsg && <span className="text-green-700 ml-2">{studentMsg}</span>}
                </form>
                <table className="min-w-full bg-green-50 rounded">
                  <thead className="bg-green-200">
                    <tr>
                      <th className="py-2 px-4 text-left text-green-900">Full Name</th>
                      <th className="py-2 px-4 text-left text-green-900">Student ID</th>
                      <th className="py-2 px-4 text-left text-green-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s.id} className="border-b">
                        <td className="py-2 px-4">{s.fullname}</td>
                        <td className="py-2 px-4">{s.student_id}</td>
                        <td className="py-2 px-4">
                          <button className="text-blue-600 hover:underline mr-2" onClick={() => handleEditStudent(s)}>Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        );
      case 'upload':
        return (
          <>
            <div className="bg-white rounded shadow p-6 mb-8 max-w-xl">
              <h3 className="font-bold mb-2 text-green-700">Upload Result for JSS2B - 2nd Term 2024/25</h3>
              <div className="flex items-center gap-2 mb-4">
                <select name="class" value={form.class} onChange={handleFormChange} className="border p-2 rounded w-48" required>
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
                <input type="file" accept=".csv" onChange={e => setCsvFile(e.target.files[0])} className="border p-2 rounded w-full" />
                <button className="bg-green-600 hover:bg-green-700 text-white p-2 rounded" onClick={handleUpload}>Upload CSV</button>
              </div>
            </div>
            <div className="bg-white rounded shadow p-6 max-w-xl">
              <h3 className="font-bold mb-2 text-green-700">Add Dummy Result (Manual Entry)</h3>
              <form onSubmit={handleFormSubmit} className="space-y-3">
                <select name="class" value={form.class} onChange={handleFormChange} className="border p-2 rounded w-full" required>
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
                <input type="text" name="student_id" value={form.student_id} readOnly className="w-full p-2 border rounded bg-gray-100" />
                <input type="text" name="subject" value={form.subject} onChange={handleFormChange} placeholder="Subject" className="w-full p-2 border rounded" required />
                <input type="number" name="score" value={form.score} onChange={handleFormChange} placeholder="Score" className="w-full p-2 border rounded" required />
                <input type="text" name="grade" value={form.grade} onChange={handleFormChange} placeholder="Grade (A/B/C/D/F)" className="w-full p-2 border rounded" required />
                <input type="text" name="term" value={form.term} onChange={handleFormChange} placeholder="Term" className="w-full p-2 border rounded" />
                <input type="text" name="session" value={form.session} onChange={handleFormChange} placeholder="Session" className="w-full p-2 border rounded" />
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold">Add Result</button>
              </form>
              {message && <div className="mt-2 text-sm text-green-700">{message}</div>}
            </div>
          </>
        );
      case 'subjects':
        return (
          <div className="bg-white rounded shadow p-6 max-w-xl">
            <h3 className="font-bold mb-2 text-green-700">Manage Subjects</h3>
            <form onSubmit={handleAddSubject} className="flex gap-2 mb-4">
              <input type="text" value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="New subject name" className="border p-2 rounded w-full" />
              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold">Add</button>
            </form>
            {subjectMsg && <div className="mb-2 text-green-700">{subjectMsg}</div>}
            <ul className="divide-y">
              {subjects.map(s => (
                <li key={s.id} className="flex items-center justify-between py-2">
                  <span>{s.name}</span>
                  <button className="text-red-600 hover:underline" onClick={() => handleDeleteSubject(s.id)}>Delete</button>
                </li>
              ))}
            </ul>
          </div>
        );
      case 'sessions':
        return (
          <div className="bg-white rounded shadow p-6 max-w-xl">
            <h3 className="font-bold mb-2 text-green-700">Manage Sessions/Terms</h3>
            <form onSubmit={handleAddSession} className="flex gap-2 mb-4">
              <input type="text" value={newSession} onChange={e => setNewSession(e.target.value)} placeholder="New session name" className="border p-2 rounded w-full" />
              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold">Add</button>
            </form>
            {sessionMsg && <div className="mb-2 text-green-700">{sessionMsg}</div>}
            <ul className="divide-y">
              {sessions.map(s => (
                <li key={s.id} className="flex items-center justify-between py-2">
                  <span>{s.name}</span>
                  <button className="text-red-600 hover:underline" onClick={() => handleDeleteSession(s.id)}>Delete</button>
                </li>
              ))}
            </ul>
          </div>
        );
      case 'classes':
        return (
          <div className="bg-white rounded shadow p-6 max-w-xl">
            <h3 className="font-bold mb-2 text-green-700">Manage Classes</h3>
            <form onSubmit={handleAddClass} className="flex gap-2 mb-4">
              <input type="text" value={newClass} onChange={e => setNewClass(e.target.value)} placeholder="New class name" className="border p-2 rounded w-full" />
              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold">Add</button>
            </form>
            {classMsg && <div className="mb-2 text-green-700">{classMsg}</div>}
            <ul className="divide-y">
              {classes.map(c => (
                <li key={c.name} className="flex items-center justify-between py-2">
                  <span>{c.name}</span>
                  <button className="text-red-600 hover:underline" onClick={() => handleDeleteClass(c.name)}>Delete</button>
                </li>
              ))}
            </ul>
          </div>
        );
      case 'history':
        return (
          <div className="bg-white rounded shadow p-6 max-w-xl">
            <h3 className="font-bold mb-2 text-green-700">View Result History</h3>
            <div className="flex gap-2 mb-4">
              <input type="text" name="student_id" value={historyFilters.student_id} onChange={handleHistoryFilterChange} placeholder="Student ID" className="border p-2 rounded w-32" />
              <input type="text" name="class" value={historyFilters.class} onChange={handleHistoryFilterChange} placeholder="Class" className="border p-2 rounded w-24" />
              <input type="text" name="term" value={historyFilters.term} onChange={handleHistoryFilterChange} placeholder="Term" className="border p-2 rounded w-24" />
              <input type="text" name="session" value={historyFilters.session} onChange={handleHistoryFilterChange} placeholder="Session" className="border p-2 rounded w-24" />
            </div>
            <table className="min-w-full bg-green-50 rounded">
              <thead className="bg-green-200">
                <tr>
                  <th className="py-2 px-4 text-left text-green-900">Student ID</th>
                  <th className="py-2 px-4 text-left text-green-900">Class</th>
                  <th className="py-2 px-4 text-left text-green-900">Subject</th>
                  <th className="py-2 px-4 text-left text-green-900">Score</th>
                  <th className="py-2 px-4 text-left text-green-900">Grade</th>
                  <th className="py-2 px-4 text-left text-green-900">Term</th>
                  <th className="py-2 px-4 text-left text-green-900">Session</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => (
                  <tr key={r.id} className="border-b">
                    <td className="py-2 px-4">{r.student_id}</td>
                    <td className="py-2 px-4">{r.class}</td>
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
        );
      case 'manageTeachers':
        return (
          <div className="bg-white rounded shadow p-6 max-w-2xl">
            <h3 className="font-bold mb-2 text-green-700">Manage Teachers</h3>
            <form onSubmit={handleAddTeacher} className="flex gap-2 mb-4 flex-wrap">
              <input type="text" name="fullname" value={teacherForm.fullname} onChange={handleTeacherFormChange} placeholder="Full Name" className="border p-2 rounded w-48" required />
              <input type="email" name="email" value={teacherForm.email} onChange={handleTeacherFormChange} placeholder="Email" className="border p-2 rounded w-48" required />
              <input type="password" name="password" value={teacherForm.password} onChange={handleTeacherFormChange} placeholder={teacherForm.editId ? 'New Password (optional)' : 'Password'} className="border p-2 rounded w-48" required={!teacherForm.editId} />
              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold">{teacherForm.editId ? 'Update' : 'Add'}</button>
              {teacherMsg && <span className="text-green-700 ml-2">{teacherMsg}</span>}
            </form>
            <table className="min-w-full bg-green-50 rounded mb-4">
              <thead className="bg-green-200">
                <tr>
                  <th className="py-2 px-4 text-left text-green-900">Full Name</th>
                  <th className="py-2 px-4 text-left text-green-900">Email</th>
                  <th className="py-2 px-4 text-left text-green-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map(t => (
                  <tr key={t.id} className="border-b">
                    <td className="py-2 px-4">{t.fullname}</td>
                    <td className="py-2 px-4">{t.email}</td>
                    <td className="py-2 px-4">
                      <button className="text-blue-600 hover:underline mr-2" onClick={() => handleEditTeacher(t)}>Edit</button>
                      <button className="text-green-600 hover:underline mr-2" onClick={() => handleAssignClasses(t)}>Assign Classes</button>
                      <button className="text-red-600 hover:underline" onClick={() => handleDeleteTeacher(t.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {assignTeacherId && (
              <div className="mb-4 p-4 border rounded bg-green-50">
                <h4 className="font-bold mb-2">Assign Classes</h4>
                <div className="flex flex-wrap gap-4 mb-2">
                  {classes.map(c => (
                    <label key={c.id} className="flex items-center gap-2">
                      <input type="checkbox" checked={assignClasses.includes(c.id)} onChange={() => handleClassCheckbox(c.id)} />
                      {c.name}
                    </label>
                  ))}
                </div>
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold" onClick={handleSaveAssignedClasses}>Save</button>
                <button className="ml-2 text-red-600 hover:underline" onClick={() => setAssignTeacherId(null)}>Cancel</button>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-green-50">
      {/* Sidebar */}
      <nav className="w-64 bg-green-700 text-white min-h-screen p-6 flex flex-col justify-between shadow-lg">
        <div>
          <div className="mb-8 flex items-center gap-2">
            <div className="bg-white text-green-700 rounded-full w-10 h-10 flex items-center justify-center font-bold text-xl border-2 border-green-300">B</div>
            <span className="text-2xl font-extrabold tracking-wide">Bosol Schools</span>
          </div>
          <ul className="space-y-4">
            {NAV_ITEMS.map(item => (
              <li
                key={item.key}
                className={`font-semibold cursor-pointer px-2 py-1 rounded ${activePanel === item.key ? 'bg-green-900 text-green-200' : 'hover:text-green-200'}`}
                onClick={() => setActivePanel(item.key)}
              >
                {item.label}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <button className="w-full bg-green-600 hover:bg-green-800 py-2 rounded text-white font-semibold mt-8" onClick={() => { localStorage.clear(); window.location = '/'; }}>Logout</button>
        </div>
      </nav>
      {/* Main Content */}
      <main className="flex-1 p-10">
        <h2 className="text-3xl font-extrabold text-green-800 mb-6 flex items-center gap-2">
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold text-lg">Admin</span>
          Dashboard
        </h2>
        {renderPanel()}
      </main>
    </div>
  );
} 