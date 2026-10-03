# Hệ Thống Quản Trị Học Trực Tuyến (LMS) - Trường THCS
**Sinh viên thực hiện:** DTC245200066

## Giới thiệu
Hệ thống LMS phục vụ học sinh THCS (Khối 6-9) tra cứu môn học, bài giảng và đăng ký học trực tuyến, triển khai hoàn toàn bằng Docker Compose.

## Kiến trúc Giai đoạn 1
- **Web LMS:** Node.js (Express), Non-root container
- **Database:** MySQL 8.0 & công cụ phpMyAdmin
- **Cổng vào & Bảo mật:** Nginx Reverse Proxy (HTTPS tự ký, Security Headers)
- **Hardening:** Network Isolation (frontend-network / backend-network), mật khẩu an toàn qua `.env`

## Hướng dẫn chạy hệ thống
1. Tạo file môi trường:
   ```bash
   cp .env.example .env

