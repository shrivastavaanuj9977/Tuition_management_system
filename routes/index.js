var express = require('express');
var router = express.Router();
const db = require('../config/db'); // adjust path according to your folder

/* GET home page. */
router.get('/', function(req, res, next) {
  // Redirect homepage to the dashboard (Image 2 interface)
  res.redirect('/dashboard');
});

router.get('/students', async (req, res) => {
    try {
        // Fetch all students
        const [rows] = await db.query('SELECT id, name, class, phone FROM students');
        
        // Render the view and pass students data
        res.render('student_list', { students: rows });
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});


router.get('/students/add', function(req, res, next) {
  res.render('student-form');
});

router.post('/students/add', async (req, res) => {
    // Destructure all form fields from the request body
    const { name, father, mother, dob, gender, class: className, phone, email, address } = req.body;

    try {
        // Insert into MySQL table 'students' (make sure your table has matching columns)
        const sql = `
            INSERT INTO students 
            (name, father, mother, dob, gender, class, phone, email, address)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await db.query(sql, [name, father, mother, dob, gender, className, phone, email, address]);

        // Redirect or send a response
        // res.send("Student added successfully!");
        res.redirect('/students');
    } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
    }
});

router.get('/students/delete/:id', async (req, res) => {
    const id = req.params.id;
    try {
        await db.query("DELETE FROM students WHERE id = ?", [id]);
        res.redirect('/students');
    } catch (err) {
        console.log(err);
        res.status(500).send('Delete failed');
    }
});

router.get('/students/edit/:id', async (req, res) => {
    const id = req.params.id;

    const [rows] = await db.query("SELECT * FROM students WHERE id = ?", [id]);
    res.render('student_edit', { student: rows[0] });
});


router.post('/students/edit/:id', async (req, res) => {
    const id = req.params.id;
    const { name, class: cls, phone } = req.body;

    await db.query(
        "UPDATE students SET name=?, class=?, phone=? WHERE id=?",
        [name, cls, phone, id]
    );

    res.redirect('/students');
});


router.get('/attendance/mark', async (req, res) => {
    const [students] = await db.query("SELECT * FROM students");
    res.render("attendance_mark", { students });
});

router.post('/attendance/save', async (req, res) => {
    const { student_id, status } = req.body;

    await db.query(
        "INSERT INTO attendance (student_id, date, status) VALUES (?, CURDATE(), ?)",
        [student_id, status]
    );

    res.redirect('/attendance/mark');
});

router.get('/marks/add/:id', (req, res) => {
  res.render('add_marks', { studentId: req.params.id });
});

router.post('/marks/save', async (req, res) => {
  const { student_id, subject, marks, exam } = req.body;

  await db.query(
    "INSERT INTO marks (student_id, subject, marks, exam) VALUES (?, ?, ?, ?)",
    [student_id, subject, marks, exam]
  );

  res.redirect('/students');
});

router.get('/dashboard', async (req, res) => {
    try {
        const [[{ totalStudents }]] = await db.query("SELECT COUNT(*) AS totalStudents FROM students");

        const [[{ pendingFees }]] = await db.query(
          "SELECT COUNT(*) AS pendingFees FROM fees WHERE status = 'Pending'"
        );

        const [[{ presentToday }]] = await db.query(
          "SELECT COUNT(*) AS presentToday FROM attendance WHERE date = CURDATE() AND status='Present'"
        );

        const [[{ totalTeachers }]] = await db.query(
          "SELECT COUNT(*) AS totalTeachers FROM teachers"
        );

        const [[{ totalCourses }]] = await db.query(
          "SELECT COUNT(*) AS totalCourses FROM courses"
        );

        const [[{ totalPayments }]] = await db.query(
          "SELECT COUNT(*) AS totalPayments FROM fees WHERE status = 'Paid'"
        );

        const [[{ absentToday }]] = await db.query(
          "SELECT COUNT(*) AS absentToday FROM attendance WHERE date = CURDATE() AND status='Absent'"
        );

        const [recentAttendance] = await db.query(
          "SELECT s.name, a.date, a.status FROM attendance a JOIN students s ON a.student_id = s.id WHERE a.date = CURDATE() ORDER BY a.date DESC LIMIT 5"
        );

        console.log('Recent Attendance Data:', recentAttendance); // Debug log

        res.render("dashboard", {
            totalStudents,
            pendingFees,
            presentToday,
            totalTeachers,
            totalCourses,
            totalPayments,
            absentToday,
            recentAttendance
        });
    } catch (err) {
        console.error(err);
        res.render("dashboard", {
            totalStudents: 0,
            pendingFees: 0,
            presentToday: 0,
            totalTeachers: 0,
            totalCourses: 0,
            totalPayments: 0,
            absentToday: 0,
            recentAttendance: []
        });
    }
});


router.get('/students/search', async (req, res) => {
  const { query } = req.query;

  try {
    const [rows] = await db.query(
      "SELECT id, name, class, phone, email FROM students WHERE name LIKE ? OR class LIKE ?",
      [`%${query}%`, `%${query}%`]
    );

    res.render("student_list", { students: rows, query: query });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

// TEACHER ROUTES

router.get('/teachers', async (req, res) => {
  try {
    const [teachers] = await db.query('SELECT * FROM teachers');
    res.render('teacher_list', { teachers });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

router.get('/teachers/add', (req, res) => {
  // Provide an explicit `teacher` value so the template can safely check `teacher ? ...`
  res.render('teacher-form', { teacher: null });
});

router.post('/teachers/add', async (req, res) => {
  const {name, email, phone, dob, gender, qualification, specialization, experience, address, bio} = req.body;

  try {
    const sql = `
      INSERT INTO teachers 
      (name, email, phone, dob, gender, qualification, specialization, experience, address, bio)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await db.query(sql, [name, email, phone, dob, gender, qualification, specialization, experience, address, bio]);
    res.redirect('/teachers');
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

router.get('/teachers/edit/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const [rows] = await db.query('SELECT * FROM teachers WHERE id = ?', [id]);
    res.render('teacher-form', { teacher: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

router.post('/teachers/edit/:id', async (req, res) => {
  const id = req.params.id;
  const { name, email, phone, dob, gender, qualification, specialization, experience, address, bio } = req.body;

  try {
    const sql = `
      UPDATE teachers 
      SET name=?, email=?, phone=?, dob=?, gender=?, qualification=?, specialization=?, experience=?, address=?, bio=?
      WHERE id=?
    `;
    await db.query(sql, [name, email, phone, dob, gender, qualification, specialization, experience, address, bio, id]);
    res.redirect('/teachers');
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

router.get('/teachers/delete/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await db.query('DELETE FROM teachers WHERE id = ?', [id]);
    res.redirect('/teachers');
  } catch (err) {
    console.error(err);
    res.status(500).send('Delete failed');
  }
});

// COURSE ROUTES

router.get('/courses', async (req, res) => {
  try {
    const [courses] = await db.query(
      `SELECT c.id, c.course_name, c.course_code, c.teacher_id, t.name as teacher_name, 
              c.duration, c.fee, c.status, c.start_date 
       FROM courses c 
       LEFT JOIN teachers t ON c.teacher_id = t.id`
    );
    res.render('course_list', { courses });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

router.get('/courses/add', async (req, res) => {
  try {
    const [teachers] = await db.query('SELECT id, name FROM teachers');
    res.render('course-form', { course: null, teachers });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

router.post('/courses/add', async (req, res) => {
  const { course_name, course_code, teacher_id, duration, fee, max_students, status, start_date, description } = req.body;

  try {
    const sql = `
      INSERT INTO courses 
      (course_name, course_code, teacher_id, duration, fee, max_students, status, start_date, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await db.query(sql, [course_name, course_code, teacher_id, duration, fee, max_students, status, start_date, description]);
    res.redirect('/courses');
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

router.get('/courses/edit/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const [courses] = await db.query('SELECT * FROM courses WHERE id = ?', [id]);
    const [teachers] = await db.query('SELECT id, name FROM teachers');
    res.render('course-form', { course: courses[0], teachers });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

router.post('/courses/edit/:id', async (req, res) => {
  const id = req.params.id;
  const { course_name, course_code, teacher_id, duration, fee, max_students, status, start_date, description } = req.body;

  try {
    const sql = `
      UPDATE courses 
      SET course_name=?, course_code=?, teacher_id=?, duration=?, fee=?, max_students=?, status=?, start_date=?, description=?
      WHERE id=?
    `;
    await db.query(sql, [course_name, course_code, teacher_id, duration, fee, max_students, status, start_date, description, id]);
    res.redirect('/courses');
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

router.get('/courses/delete/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await db.query('DELETE FROM courses WHERE id = ?', [id]);
    res.redirect('/courses');
  } catch (err) {
    console.error(err);
    res.status(500).send('Delete failed');
  }
});

// REPORTS ROUTES
router.get('/reports/student', async (req, res) => {
  try {
    const { class: filterClass, gender: filterGender, sortBy = 'name' } = req.query;

    // Build query based on filters
    let query = 'SELECT * FROM students WHERE 1=1';
    let params = [];

    if (filterClass) {
      query += ' AND class = ?';
      params.push(filterClass);
    }

    if (filterGender) {
      query += ' AND gender = ?';
      params.push(filterGender);
    }

    // Sort by specified column
    const validSortColumns = ['name', 'class', 'phone', 'id'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'name';
    query += ` ORDER BY ${sortColumn} ASC`;

    const [students] = await db.query(query, params);

    // Get overall statistics
    const [[{ totalStudents }]] = await db.query('SELECT COUNT(*) AS totalStudents FROM students');
    const [[{ maleCount }]] = await db.query("SELECT COUNT(*) AS maleCount FROM students WHERE gender = 'Male'");
    const [[{ femaleCount }]] = await db.query("SELECT COUNT(*) AS femaleCount FROM students WHERE gender = 'Female'");
    const [[{ uniqueClasses }]] = await db.query('SELECT COUNT(DISTINCT class) AS uniqueClasses FROM students');

    res.render('student_report', {
      students,
      totalStudents: totalStudents || 0,
      maleCount: maleCount || 0,
      femaleCount: femaleCount || 0,
      uniqueClasses: uniqueClasses || 0,
      filterClass: filterClass || '',
      filterGender: filterGender || '',
      sortBy: sortBy
    });
  } catch (err) {
    console.error(err);
    res.render('student_report', {
      students: [],
      totalStudents: 0,
      maleCount: 0,
      femaleCount: 0,
      uniqueClasses: 0,
      filterClass: '',
      filterGender: '',
      sortBy: 'name'
    });
  }
});

// PAYMENT REPORT
router.get('/reports/payment', async (req, res) => {
  try {
    const { status: filterStatus, method: filterMethod, sortBy = 'date' } = req.query;

    // Build query based on filters
    let query = `
      SELECT f.id, f.student_id, s.name as student_name, f.amount, f.payment_date, 
             f.status, f.payment_method, f.reference_no, f.notes
      FROM fees f
      LEFT JOIN students s ON f.student_id = s.id
      WHERE 1=1
    `;
    let params = [];

    if (filterStatus) {
      query += ' AND f.status = ?';
      params.push(filterStatus);
    }

    if (filterMethod) {
      query += ' AND f.payment_method = ?';
      params.push(filterMethod);
    }

    // Sort by specified column
    let sortColumn = 'f.payment_date DESC';
    if (sortBy === 'amount') {
      sortColumn = 'f.amount DESC';
    } else if (sortBy === 'student') {
      sortColumn = 's.name ASC';
    } else if (sortBy === 'id') {
      sortColumn = 'f.id DESC';
    }

    query += ` ORDER BY ${sortColumn}`;

    const [payments] = await db.query(query, params);

    // Get overall statistics
    const [[{ totalPayments }]] = await db.query('SELECT COUNT(*) AS totalPayments FROM fees');
    const [[{ paidCount }]] = await db.query("SELECT COUNT(*) AS paidCount FROM fees WHERE status = 'Paid'");
    const [[{ pendingCount }]] = await db.query("SELECT COUNT(*) AS pendingCount FROM fees WHERE status = 'Pending'");
    const [[{ totalRevenue }]] = await db.query("SELECT SUM(amount) AS totalRevenue FROM fees WHERE status = 'Paid'");

    res.render('payment_report', {
      payments,
      totalPayments: totalPayments || 0,
      paidCount: paidCount || 0,
      pendingCount: pendingCount || 0,
      totalRevenue: (totalRevenue && totalRevenue.totalRevenue) ? parseFloat(totalRevenue.totalRevenue).toFixed(2) : '0.00',
      filterStatus: filterStatus || '',
      filterMethod: filterMethod || '',
      sortBy: sortBy
    });
  } catch (err) {
    console.error(err);
    res.render('payment_report', {
      payments: [],
      totalPayments: 0,
      paidCount: 0,
      pendingCount: 0,
      totalRevenue: '0.00',
      filterStatus: '',
      filterMethod: '',
      sortBy: 'date'
    });
  }
});

// TEACHER REPORT
router.get('/reports/teacher', async (req, res) => {
  try {
    const { specialization: filterSpecialization, qualification: filterQualification, sortBy = 'name' } = req.query;

    // Build query based on filters
    let query = 'SELECT * FROM teachers WHERE 1=1';
    let params = [];

    if (filterSpecialization) {
      query += ' AND specialization LIKE ?';
      params.push(`%${filterSpecialization}%`);
    }

    if (filterQualification) {
      query += ' AND qualification LIKE ?';
      params.push(`%${filterQualification}%`);
    }

    // Sort by specified column
    const validSortColumns = ['name', 'experience', 'id'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'name';
    if (sortColumn === 'experience') {
      query += ' ORDER BY experience DESC';
    } else {
      query += ` ORDER BY ${sortColumn} ASC`;
    }

    const [teachers] = await db.query(query, params);

    // Get overall statistics
    const [[{ totalTeachers }]] = await db.query('SELECT COUNT(*) AS totalTeachers FROM teachers');
    const [[{ avgExp }]] = await db.query('SELECT AVG(experience) AS avgExp FROM teachers');

    res.render('teacher_report', {
      teachers,
      totalTeachers: totalTeachers || 0,
      averageExperience: avgExp ? Math.round(avgExp) : 0,
      filterSpecialization: filterSpecialization || '',
      filterQualification: filterQualification || '',
      sortBy: sortBy
    });
  } catch (err) {
    console.error(err);
    res.render('teacher_report', {
      teachers: [],
      totalTeachers: 0,
      averageExperience: 0,
      filterSpecialization: '',
      filterQualification: '',
      sortBy: 'name'
    });
  }
});

// COURSE REPORT
router.get('/reports/course', async (req, res) => {
  try {
    const { status: filterStatus, sortBy = 'name' } = req.query;

    // Build query based on filters
    let query = `
      SELECT c.id, c.course_name, c.course_code, c.teacher_id, t.name as teacher_name, 
             c.duration, c.fee, c.max_students, c.status, c.start_date
      FROM courses c
      LEFT JOIN teachers t ON c.teacher_id = t.id
      WHERE 1=1
    `;
    let params = [];

    if (filterStatus) {
      query += ' AND c.status = ?';
      params.push(filterStatus);
    }

    // Sort by specified column
    let sortColumn = 'c.course_name ASC';
    if (sortBy === 'fee') {
      sortColumn = 'c.fee DESC';
    } else if (sortBy === 'duration') {
      sortColumn = 'c.duration ASC';
    } else if (sortBy === 'id') {
      sortColumn = 'c.id DESC';
    }

    query += ` ORDER BY ${sortColumn}`;

    const [courses] = await db.query(query, params);

    // Get overall statistics
    const [[{ totalCourses }]] = await db.query('SELECT COUNT(*) AS totalCourses FROM courses');
    const [[{ activeCourses }]] = await db.query("SELECT COUNT(*) AS activeCourses FROM courses WHERE status = 'Active'");
    const [[{ avgFee }]] = await db.query('SELECT AVG(fee) AS avgFee FROM courses');

    res.render('course_report', {
      courses,
      totalCourses: totalCourses || 0,
      activeCourses: activeCourses || 0,
      averageFee: avgFee ? parseFloat(avgFee).toFixed(2) : '0.00',
      filterStatus: filterStatus || '',
      sortBy: sortBy
    });
  } catch (err) {
    console.error(err);
    res.render('course_report', {
      courses: [],
      totalCourses: 0,
      activeCourses: 0,
      averageFee: '0.00',
      filterStatus: '',
      sortBy: 'name'
    });
  }
});

module.exports = router;
