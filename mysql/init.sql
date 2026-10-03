SET NAMES 'utf8mb4';
ALTER DATABASE lms_school_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    grade_level INT NOT NULL,
    role ENUM('STUDENT', 'ADMIN') DEFAULT 'STUDENT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL,
    grade_level INT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lessons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    content TEXT NOT NULL,
    order_index INT DEFAULT 1,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enroll (user_id, course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO users (username, password, full_name, grade_level, role) VALUES
('admin', 'Admin@2026', 'Quản trị viên', 0, 'ADMIN'),
('hocsinh6@school.edu.vn', '123456', 'Nguyễn Văn An', 6, 'STUDENT'),
('hocsinh7@school.edu.vn', '123456', 'Trần Thị Bình', 7, 'STUDENT');

INSERT INTO courses (course_name, grade_level, description) VALUES
('Toán học 6', 6, 'Số học, Số tự nhiên và Hình học trực quan lớp 6'),
('Ngữ văn 6', 6, 'Văn bản văn học và kỹ năng thực hành tiếng Việt lớp 6'),
('Tiếng Anh 7', 7, 'Global Success Grade 7: Từ vựng và ngữ pháp'),
('Khoa học tự nhiên 7', 7, 'Nguyên tử, phân tử và trao đổi chất ở sinh vật'),
('Toán học 8', 8, 'Hằng đẳng thức đáng nhớ, tứ giác và tam giác đồng dạng'),
('Khoa học tự nhiên 9', 9, 'Hóa học vô cơ và Di truyền học lớp 9');

INSERT INTO lessons (course_id, title, content, order_index) VALUES
(1, 'Bài 1: Tập hợp các số tự nhiên', 'Lý thuyết về tập hợp N và các phép toán cơ bản.', 1),
(1, 'Bài 2: Các phép tính số tự nhiên', 'Thứ tự thực hiện phép tính trong biểu thức chứa dấu ngoặc.', 2),
(3, 'Unit 1: Hobbies', 'Từ vựng chủ đề sở thích và Thì hiện tại đơn.', 1);

INSERT INTO enrollments (user_id, course_id) VALUES (2, 1);
