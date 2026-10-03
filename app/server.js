const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware tiếp nhận dữ liệu JSON
app.use(express.json());

// 1. Khởi tạo Connection Pool với bảng mã utf8mb4 chống lỗi font tiếng Việt
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'database',
    user: process.env.DB_USER || 'lms_user',
    password: process.env.DB_PASSWORD || 'Lms_Stud3nt_S3curePass#2026',
    database: process.env.DB_NAME || 'lms_school_db',
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 2. Trả về giao diện chính của hệ thống LMS
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// 3. API lấy danh sách môn học (Dùng const query)
app.get('/api/courses', (req, res) => {
    const query = 'SELECT id, course_name, grade_level, description FROM courses ORDER BY grade_level ASC, id ASC';
    pool.query(query, (err, rows) => {
        if (err) {
            console.error('[DATABASE ERROR] Không thể lấy danh sách môn học:', err.message);
            return res.status(500).json({ error: 'Lỗi truy vấn cơ sở dữ liệu' });
        }
        res.json(rows);
    });
});

// 4. API lấy chi tiết bài giảng của một môn (Dùng const query)
app.get('/api/courses/:id/lessons', (req, res) => {
    const courseId = req.params.id;
    const query = 'SELECT id, title, content, order_index FROM lessons WHERE course_id = ? ORDER BY order_index ASC';
    pool.query(query, [courseId], (err, rows) => {
        if (err) {
            console.error(`[DATABASE ERROR] Không thể lấy bài học cho course_id ${courseId}:`, err.message);
            return res.status(500).json({ error: 'Lỗi khi tải bài học' });
        }
        res.json(rows);
    });
});

// 5. API đăng ký môn học (Dùng const query và bắt trùng lặp)
app.post('/api/enroll', (req, res) => {
    const { userId, courseId } = req.body;
    if (!userId || !courseId) {
        return res.status(400).json({ message: 'Thiếu thông tin học sinh hoặc môn học!' });
    }

    const query = 'INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)';
    pool.query(query, [userId, courseId], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: 'Học sinh đã đăng ký môn học này rồi!' });
            }
            console.error('[DATABASE ERROR] Lỗi khi ghi danh môn học:', err.message);
            return res.status(500).json({ error: 'Lỗi hệ thống khi đăng ký môn học' });
        }
        console.log(`[ENROLL SUCCESS] User ID ${userId} đã đăng ký thành công Môn ID ${courseId}`);
        res.json({ message: 'Đăng ký môn học thành công vào CSDL!' });
    });
});

// 6. Endpoint Health Check phục vụ giám sát
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Khởi động Web Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LMS APP RUNNING] Máy chủ ứng dụng LMS đang lắng nghe tại cổng ${PORT}`);
});
