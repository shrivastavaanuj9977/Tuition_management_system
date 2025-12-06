var express = require('express');
var router = express.Router();
const db = require('../config/db');


router.get('/', async (req, res) => {
  try {
    // Fetch all payments with student names
    const [payments] = await db.query(`
      SELECT f.id, f.student_id, s.name as student_name, f.amount, f.payment_date, 
             f.status, f.payment_method, f.reference_no, f.notes
      FROM fees f
      LEFT JOIN students s ON f.student_id = s.id
      ORDER BY f.payment_date DESC
    `);

    // Get payment statistics
    const [[{ paidCount }]] = await db.query(
      "SELECT COUNT(*) AS paidCount FROM fees WHERE status = 'Paid'"
    );
    
    const [[{ pendingCount }]] = await db.query(
      "SELECT COUNT(*) AS pendingCount FROM fees WHERE status = 'Pending'"
    );
    
    const [[{ totalRevenue }]] = await db.query(
      "SELECT SUM(amount) AS totalRevenue FROM fees WHERE status = 'Paid'"
    );

    res.render('payment_list', { 
      payments, 
      paidCount: paidCount || 0,
      pendingCount: pendingCount || 0,
      totalRevenue: totalRevenue || 0
    });
  } catch (err) {
    console.error(err);
    res.render('payment_list', { 
      payments: [], 
      paidCount: 0,
      pendingCount: 0,
      totalRevenue: 0
    });
  }
});

router.get('/all', async (req, res) => {
    try {
        const [payments] = await db.query(`
          SELECT f.id, f.student_id, s.name as student_name, f.amount, f.payment_date, 
                 f.status, f.payment_method, f.reference_no, f.notes
          FROM fees f
          LEFT JOIN students s ON f.student_id = s.id
          ORDER BY f.payment_date DESC
        `);

        const [[{ paidCount }]] = await db.query(
          "SELECT COUNT(*) AS paidCount FROM fees WHERE status = 'Paid'"
        );
        
        const [[{ pendingCount }]] = await db.query(
          "SELECT COUNT(*) AS pendingCount FROM fees WHERE status = 'Pending'"
        );
        
        const [[{ totalRevenue }]] = await db.query(
          "SELECT SUM(amount) AS totalRevenue FROM fees WHERE status = 'Paid'"
        );

        res.render('payment_list', { 
          payments, 
          paidCount: paidCount || 0,
          pendingCount: pendingCount || 0,
          totalRevenue: totalRevenue || 0
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
    }
});

router.get('/add', async (req, res) => {
  try {
    // Fetch all students for the dropdown
    const [students] = await db.query('SELECT id, name FROM students ORDER BY name');
    res.render('payment-form', { payment: null, students });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

router.post('/add', async (req, res) => {
  const { student_id, amount, payment_date, status, payment_method, reference_no, notes } = req.body;

  try {
    const sql = `
      INSERT INTO fees (student_id, amount, payment_date, status, payment_method, reference_no, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await db.query(sql, [student_id, amount, payment_date, status, payment_method, reference_no || null, notes || null]);
    res.redirect('/fees');
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

router.get('/edit/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const [payment] = await db.query('SELECT * FROM fees WHERE id = ?', [id]);
    const [students] = await db.query('SELECT id, name FROM students ORDER BY name');
    
    if (payment.length === 0) {
      return res.status(404).send('Payment not found');
    }

    res.render('payment-form', { payment: payment[0], students });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

router.post('/edit/:id', async (req, res) => {
  const id = req.params.id;
  const { student_id, amount, payment_date, status, payment_method, reference_no, notes } = req.body;

  try {
    const sql = `
      UPDATE fees 
      SET student_id=?, amount=?, payment_date=?, status=?, payment_method=?, reference_no=?, notes=?
      WHERE id=?
    `;
    await db.query(sql, [student_id, amount, payment_date, status, payment_method, reference_no || null, notes || null, id]);
    res.redirect('/fees');
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

router.get('/delete/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await db.query('DELETE FROM fees WHERE id = ?', [id]);
    res.redirect('/fees');
  } catch (err) {
    console.error(err);
    res.status(500).send('Delete failed');
  }
});

router.get('/search', async (req, res) => {
  const { query } = req.query;

  try {
    const [payments] = await db.query(`
      SELECT f.id, f.student_id, s.name as student_name, f.amount, f.payment_date, 
             f.status, f.payment_method, f.reference_no, f.notes
      FROM fees f
      LEFT JOIN students s ON f.student_id = s.id
      WHERE s.name LIKE ? OR f.reference_no LIKE ?
      ORDER BY f.payment_date DESC
    `, [`%${query}%`, `%${query}%`]);

    // Get payment statistics
    const [[{ paidCount }]] = await db.query(
      "SELECT COUNT(*) AS paidCount FROM fees WHERE status = 'Paid'"
    );
    
    const [[{ pendingCount }]] = await db.query(
      "SELECT COUNT(*) AS pendingCount FROM fees WHERE status = 'Pending'"
    );
    
    const [[{ totalRevenue }]] = await db.query(
      "SELECT SUM(amount) AS totalRevenue FROM fees WHERE status = 'Paid'"
    );

    res.render('payment_list', { 
      payments, 
      query,
      paidCount: paidCount || 0,
      pendingCount: pendingCount || 0,
      totalRevenue: totalRevenue || 0
    });
  } catch (err) {
    console.error(err);
    res.render('payment_list', { 
      payments: [], 
      query,
      paidCount: 0,
      pendingCount: 0,
      totalRevenue: 0
    });
  }
});

module.exports = router;
