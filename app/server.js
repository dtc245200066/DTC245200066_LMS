const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'views')));
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'lms_secret_key_dtc2026_super_secure';

const db = mysql.createPool({
    host: process.env.DB_HOST || 'lms_mysql',
    user: process.env.DB_USER || 'lms_user',
    password: process.env.DB_PASSWORD || 'Lms_Stud3nt_S3curePass#2026',
    database: process.env.DB_NAME || 'lms_school_db',
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Middleware xác thực token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập để truy cập.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.log(`[${new Date().toISOString()}] [AUTH REJECTED] Token không hợp lệ hoặc đã hết hạn.`);
            return res.status(403).json({ success: false, message: 'Phiên làm việc hết hạn hoặc không hợp lệ.' });
        }
        req.user = user;
        next();
    });
}

// Middleware phân quyền
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        const userRole = (req.user?.role || '').toUpperCase();
        const validRoles = allowedRoles.map(r => r.toUpperCase());

        if (!req.user || !validRoles.includes(userRole)) {
            console.log(`[${new Date().toISOString()}] [ACCESS DENIED] User ID ${req.user?.id} (${req.user?.role}) bị từ chối quyền [${allowedRoles.join(', ')}]`);
            return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện thao tác này.' });
        }
        next();
    };
}

// 0. Route Health Check (Khôi phục cho Docker & Prometheus)
app.get('/health', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.status(200).json({ status: 'UP', timestamp: new Date().toISOString(), database: 'CONNECTED' });
    } catch (err) {
        res.status(503).json({ status: 'DOWN', database: 'DISCONNECTED', error: err.message });
    }
});

// 1. API Đăng nhập với cơ chế so khớp linh hoạt bcrypt/plaintext
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập tài khoản và mật khẩu.' });
    }

    try {
        const [rows] = await db.query(
            'SELECT id, username, password, full_name, role, grade_level FROM users WHERE username = ?',
            [username]
        );

        if (rows.length === 0) {
            console.log(`[${new Date().toISOString()}] [AUTH FAILED] Người dùng "${username}" không tồn tại.`);
            return res.status(401).json({ success: false, message: 'Tài khoản hoặc mật khẩu không chính xác.' });
        }

        const user = rows[0];
        let isMatch = false;

        // Kiểm tra xem mật khẩu trong DB đã băm bcrypt chưa
        if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
            isMatch = await bcrypt.compare(password, user.password);
        } else {
            // Nếu còn là plaintext cũ thì so sánh trực tiếp
            isMatch = (user.password === password);
            // Tự động nâng cấp mã hóa lên bcrypt cho các lần đăng nhập sau
            if (isMatch) {
                const hashedPassword = await bcrypt.hash(password, 10);
                await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
            }
        }

        if (!isMatch) {
            console.log(`[${new Date().toISOString()}] [AUTH FAILED] Sai mật khẩu cho tài khoản "${username}".`);
            return res.status(401).json({ success: false, message: 'Tài khoản hoặc mật khẩu không chính xác.' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, full_name: user.full_name, role: user.role, grade_level: user.grade_level },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log(`[${new Date().toISOString()}] [AUTH SUCCESS] User ID ${user.id} (${user.username}) đăng nhập vai trò [${user.role}]`);

        return res.json({
            success: true,
            message: 'Đăng nhập thành công!',
            token,
            user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role, grade_level: user.grade_level }
        });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] [AUTH ERROR]`, error);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ.' });
    }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
    res.json({ success: true, user: req.user });
});

// 2. API Môn học & Đăng ký
app.get('/api/courses', async (req, res) => {
    try {
        const [courses] = await db.query('SELECT * FROM courses ORDER BY grade_level ASC, id ASC');
        res.json({ success: true, data: courses });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy môn học.' });
    }
});

app.get('/api/my-enrollments', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT course_id FROM enrollments WHERE user_id = ?', [req.user.id]);
        res.json({ success: true, enrolledCourseIds: rows.map(r => r.course_id) });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.post('/api/enroll', authenticateToken, async (req, res) => {
    const { course_id } = req.body;
    const user_id = req.user.id;

    try {
        const [courseRows] = await db.query('SELECT id, course_name, grade_level FROM courses WHERE id = ?', [course_id]);
        if (courseRows.length === 0) return res.status(404).json({ success: false, message: 'Môn học không tồn tại.' });
        const course = courseRows[0];

        if (req.user.role === 'STUDENT' && req.user.grade_level && Number(req.user.grade_level) !== Number(course.grade_level)) {
            console.log(`[${new Date().toISOString()}] [ENROLL DENIED] HS ID ${user_id} lớp ${req.user.grade_level} đăng ký trái khối ${course.grade_level}`);
            return res.status(400).json({
                success: false,
                message: `Bạn đang ở Khối ${req.user.grade_level}, không thể đăng ký môn của Khối ${course.grade_level}!`
            });
        }

        const [existing] = await db.query('SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?', [user_id, course_id]);
        if (existing.length > 0) return res.status(400).json({ success: false, message: 'Đã đăng ký môn học này rồi!' });

        await db.query('INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)', [user_id, course_id]);
        console.log(`[${new Date().toISOString()}] [ENROLL SUCCESS] User ID ${user_id} đăng ký thành công môn ${course_id}`);
        return res.json({ success: true, message: 'Đăng ký thành công!' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
});

// 3. API Bài giảng
app.get('/api/courses/:courseId/lessons', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, course_id, title, content, video_url, order_index, created_at FROM lessons WHERE course_id = ? ORDER BY order_index ASC, id ASC',
            [req.params.courseId]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy bài giảng.' });
    }
});

app.post('/api/courses/:courseId/lessons', authenticateToken, requireRole('TEACHER'), async (req, res) => {
    const { title, content, video_url, order_index } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO lessons (course_id, title, content, video_url, order_index) VALUES (?, ?, ?, ?, ?)',
            [req.params.courseId, title, content, video_url || null, order_index || 1]
        );
        console.log(`[${new Date().toISOString()}] [LESSON CREATED] Giáo viên ID ${req.user.id} thêm bài giảng "${title}" cho môn ID ${req.params.courseId}`);
        res.status(201).json({ success: true, message: 'Thêm bài giảng thành công!', lesson_id: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lưu bài giảng.' });
    }
});

// 4. API Thống kê & Báo cáo
app.get('/api/stats/overview', authenticateToken, async (req, res) => {
    try {
        const [studentCount] = await db.query("SELECT COUNT(*) AS total FROM users WHERE role = 'STUDENT'");
        const [teacherCount] = await db.query("SELECT COUNT(*) AS total FROM users WHERE role = 'TEACHER'");
        const [courseCount] = await db.query("SELECT COUNT(*) AS total FROM courses");
        const [lessonCount] = await db.query("SELECT COUNT(*) AS total FROM lessons");
        const [enrollmentCount] = await db.query("SELECT COUNT(*) AS total FROM enrollments");

        res.json({
            success: true,
            data: {
                totalStudents: studentCount[0].total,
                totalTeachers: teacherCount[0].total,
                totalCourses: courseCount[0].total,
                totalLessons: lessonCount[0].total,
                totalEnrollments: enrollmentCount[0].total
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi thống kê tổng quan.' });
    }
});

app.get('/api/stats/reports', authenticateToken, async (req, res) => {
    try {
        const [reports] = await db.query(`
            SELECT 
                c.id AS course_id,
                c.course_name,
                c.grade_level,
                COUNT(DISTINCT l.id) AS total_lessons,
                COUNT(DISTINCT e.user_id) AS total_enrolled_students
            FROM courses c
            LEFT JOIN lessons l ON c.id = l.course_id
            LEFT JOIN enrollments e ON c.id = e.course_id
            GROUP BY c.id, c.course_name, c.grade_level
            ORDER BY c.grade_level ASC, c.id ASC
        `);
        res.json({ success: true, data: reports });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi tổng hợp báo cáo.' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`[${new Date().toISOString()}] [LMS APP RUNNING] Máy chủ LMS đang lắng nghe tại cổng ${PORT}`);
});
