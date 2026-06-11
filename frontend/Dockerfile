# Giai đoạn 1: Build ứng dụng React với Node.js
FROM node:18-alpine AS builder

WORKDIR /app

# Sao chép package.json và package-lock.json để cài đặt dependencies
COPY package*.json ./

RUN npm ci

# Sao chép toàn bộ mã nguồn frontend
COPY . .

# Biên dịch ứng dụng React (Vite build) tạo ra thư mục dist
RUN npm run build

# Giai đoạn 2: Phục vụ ứng dụng tĩnh bằng Nginx
FROM nginx:alpine

# Sao chép tài nguyên tĩnh đã biên dịch từ Giai đoạn 1 vào thư mục phục vụ của Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Sao chép cấu hình Nginx tùy chỉnh để hỗ trợ React Router định tuyến phía client (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Mở cổng 80 cho Nginx
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
