# HỆ THỐNG QUẢN LÝ HỌC TẬP THCS (LMS THCS PORTAL)
**Mã Sinh Viên:** DTC245200066  
**Công nghệ triển khai:** Docker Compose, Node.js (Express), MySQL 8.0, NGINX SSL (TLS 1.2/1.3), Prometheus, Grafana, Loki, Promtail.

---

## 1. Giới Thiệu Dự Án
Hệ thống LMS THCS Portal là nền tảng quản trị học tập và giảng dạy trực tuyến dành riêng cho học sinh và giáo viên cấp Trung học Cơ sở (Khối 6 đến Khối 9). Toàn bộ hệ thống được container hóa và điều phối bằng Docker Compose, đáp ứng các tiêu chuẩn bảo mật Hardening, phân tách mạng nội bộ và tích hợp hệ thống giám sát - ghi log tập trung.

---

## 2. Danh Sách Cổng Dịch Vụ & Địa Chỉ Truy Cập

| Dịch vụ | Giao thức / Cổng | URL truy cập | Ghi chú |
| :--- | :--- | :--- | :--- |
| **Cổng LMS Portal** | HTTPS (443) | `https://localhost` | Giao diện học tập và giảng dạy chính |
| **phpMyAdmin** | HTTPS (443 / Subpath) | `https://localhost/pma/` | Quản trị CSDL MySQL trực quan |
| **Grafana Monitoring** | HTTP (3001) | `http://localhost:3001` | Dashboard giám sát Host & Loki Logs |
| **Prometheus** | HTTP (9090) | `http://localhost:9090` | Thu thập chỉ số hệ thống (Metrics) |
| **cAdvisor** | HTTP (8080) | `http://localhost:8080` | Giám sát chi tiết metrics từng container Docker |
| **Loki** | HTTP (3100) | `http://localhost:3100` | Máy chủ lưu trữ log tập trung |

> **Lưu ý:** Khi truy cập qua trình duyệt với chứng chỉ tự ký (Self-signed Certificate), hãy chọn **Nâng cao (Advanced)** -> **Tiếp tục truy cập (Proceed to localhost)**.

---

## 3. Danh Sách Tài Khoản Kiểm Thử

| Vai trò (Role) | Tên đăng nhập | Mật khẩu mặc định | Quyền hạn và phạm vi sử dụng |
| :--- | :--- | :--- | :--- |
| **Giáo viên (TEACHER)** | `gv_toan` | `123456` | Thêm bài giảng mới, chèn link video YouTube, xem Báo cáo thống kê đào tạo |
| **Giáo viên (TEACHER)** | `gv_van` | `123456` | Quản lý bài giảng và theo dõi lớp học |
| **Học sinh Khối 6 (STUDENT)** | `hs_an` | `123456` | Đăng ký môn học Khối 6, xem bài giảng dạng Accordion, xem video bài giảng |
| **Học sinh Khối 7 (STUDENT)** | `hs_binh` | `123456` | Đăng ký môn Khối 7, bị chặn khi đăng ký các môn trái khối (Khối 6, 8, 9) |
| **Quản trị viên (ADMIN)** | `admin` | `123456` | Quản trị toàn bộ cơ sở dữ liệu và hạ tầng hệ thống |

*Hệ thống tự động nâng cấp mã hóa mật khẩu sang chuẩn **bcryptjs** ngay sau lần đăng nhập đầu tiên.*

---

## 4. Hướng Dẫn Khởi Chạy Hệ Thống

### Bước 1: Khởi tạo file cấu hình môi trường
```bash
cp .env.example .env
```

### Bước 2: Tạo chứng chỉ SSL tự ký cho NGINX (nếu chưa có)
```bash
mkdir -p nginx/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/certs/key.pem \
  -out nginx/certs/cert.pem \
  -subj "/C=VN/ST=ThaiNguyen/L=ThaiNguyen/O=ICTU/CN=localhost"
```

### Bước 3: Khởi động toàn bộ hệ thống bằng Docker Compose
```bash
# Xây dựng và khởi chạy các container ở chế độ chạy ngầm
docker compose up -d --build
```

### Bước 4: Kiểm tra trạng thái hoạt động
```bash
# Xem danh sách container đang chạy
docker compose ps

# Kiểm tra Endpoint Health Check của ứng dụng
curl -k https://localhost/health
```

---

## 5. Kiến Trúc Bảo Mật & Hardening

* **Network Isolation:** Tách biệt `frontend-network` (tiếp nhận lưu lượng web/proxy) và `backend-network` (CSDL MySQL được cô lập hoàn toàn, không mở cổng 3306 ra ngoài host).
* **Non-Root Container:** Ứng dụng Node.js chạy với tài khoản `appuser` (UID/GID phi đặc quyền).
* **Bảo mật NGINX:**
  * Bắt buộc chuyển hướng HTTP (80) sang HTTPS (443).
  * Kích hoạt giao thức an toàn TLSv1.2, TLSv1.3.
  * Tích hợp đầy đủ các Security Headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: no-referrer-when-downgrade`.
  * Thiết lập đầy đủ các header ủy quyền ngược: `Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`.

---

## 6. Hướng Dẫn Truy Vấn LogQL (Grafana Loki)

Để truy vấn log tập trung, truy cập Grafana tại `http://localhost:3001` -> chọn mục **Explore** (biểu tượng La bàn) -> chọn datasource **Loki** và sử dụng các câu truy vấn LogQL mẫu sau:

1. **Xem toàn bộ nhật ký ứng dụng LMS Web:**
   ```logql
   {container="lms_web_app"}
   ```

2. **Lọc các sự kiện đăng nhập thành công của giáo viên / học sinh:**
   ```logql
   {container="lms_web_app"} |= "AUTH SUCCESS"
   ```

3. **Lọc các lần đăng nhập thất bại / sai mật khẩu:**
   ```logql
   {container="lms_web_app"} |= "AUTH FAILED"
   ```

4. **Theo dõi các lượt học sinh đăng ký môn học trực tuyến:**
   ```logql
   {container="lms_web_app"} |= "ENROLL"
   ```

5. **Giám sát lưu lượng truy cập qua Nginx Reverse Proxy:**
   ```logql
   {container="lms_nginx"}
   ```