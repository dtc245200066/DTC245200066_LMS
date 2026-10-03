# Sử dụng base image Alpine chính thức siêu nhẹ và bảo mật
FROM node:20-alpine

# HARDENING: Tạo người dùng hệ thống thông thường không có quyền root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Thiết lập thư mục làm việc bên trong thư mục cá nhân của user
WORKDIR /home/appuser/app

# Sao chép file cấu hình phụ thuộc trước để tối ưu hóa Docker Layer Cache
COPY package.json ./

# Cài đặt chỉ các gói production cần thiết
RUN npm install --only=production

# Sao chép toàn bộ mã nguồn ứng dụng vào container
COPY . .

# HARDENING: Chuyển toàn bộ quyền sở hữu thư mục cho appuser
RUN chown -R appuser:appgroup /home/appuser/app

# HARDENING: Chuyển ngữ cảnh thực thi sang non-root user
USER appuser

# Khai báo cổng ứng dụng
EXPOSE 3000

# Lệnh khởi chạy tiến trình ứng dụng
CMD ["node", "server.js"]
