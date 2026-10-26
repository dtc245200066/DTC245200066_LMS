CREATE DATABASE IF NOT EXISTS lms_school_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lms_school_db;

-- 1. Bảng người dùng
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('STUDENT', 'TEACHER', 'ADMIN') DEFAULT 'STUDENT',
    grade_level INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng môn học
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL,
    grade_level INT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng bài giảng (Đã đồng bộ đầy đủ video_url và created_at)
CREATE TABLE IF NOT EXISTS lessons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    content TEXT NOT NULL,
    video_url VARCHAR(255) NULL,
    order_index INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng ghi danh / đăng ký học
CREATE TABLE IF NOT EXISTS enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_course (user_id, course_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DỮ LIỆU KHỞI TẠO MẪU
INSERT INTO users (username, password, full_name, role, grade_level) VALUES
('admin', '123456', 'Quản trị viên Hệ thống', 'ADMIN', NULL),
('gv_toan', '123456', 'Thầy Vũ Văn Toán', 'TEACHER', NULL),
('gv_van', '123456', 'Cô Nguyễn Thị Văn', 'TEACHER', NULL),
('hs_an', '123456', 'Nguyễn Văn An', 'STUDENT', 6),
('hs_binh', '123456', 'Trần Thị Bình', 'STUDENT', 7)
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO courses (id, course_name, grade_level, description) VALUES
(1, 'Toán học 6', 6, 'Số học, Số tự nhiên và Hình học trực quan lớp 6.'),
(2, 'Ngữ văn 6', 6, 'Khám phá thế giới qua các câu chuyện và thơ ca.'),
(3, 'Tiếng Anh 7', 7, 'Global Success Grade 7: Từ vựng và ngữ pháp trọng điểm.'),
(4, 'Khoa học tự nhiên 7', 7, 'Nguyên tử, phân tử và các định luật vật lý cơ bản.'),
(5, 'Toán học 8', 8, 'Hằng đẳng thức đáng nhớ và Định lý Pythagore.'),
(6, 'Khoa học tự nhiên 9', 9, 'Hóa học đại cương và Di truyền học lớp 9.')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO lessons (id, course_id, title, content, video_url, order_index) VALUES
(1, 1, 'Bài 1: Tập hợp các số tự nhiên', 'Khái niệm tập hợp, phần tử thuộc và không thuộc tập hợp, cách biểu diễn tập hợp số tự nhiên N.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 1),
(2, 1, 'Bài 2: Các phép tính cộng trừ nhân chia', 'Thứ tự thực hiện phép tính trong tập hợp số tự nhiên và ứng dụng vào giải toán thực tế.', NULL, 2),
(3, 3, 'Unit 1: Hobbies - Grammar Focus', 'Thì hiện tại đơn diễn tả sở thích và thói quen hàng ngày kèm từ vựng mở rộng.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 1)
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO enrollments (user_id, course_id) VALUES
(4, 1) -- hs_an đăng ký Toán 6
ON DUPLICATE KEY UPDATE id=id;
