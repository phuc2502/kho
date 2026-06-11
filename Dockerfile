# Sử dụng official Node.js image làm base image
FROM node:18-alpine

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Sao chép package.json và package-lock.json của backend vào thư mục làm việc
COPY backend/package*.json ./

# Cài đặt dependencies cho backend (Production only)
RUN npm ci --only=production

# Sao chép toàn bộ mã nguồn backend vào container
COPY backend/ .

# Thiết lập biến môi trường mặc định
ENV NODE_ENV=production
ENV PORT=4000

# Mở cổng 4000
EXPOSE 4000

# Khởi chạy server Node.js
CMD ["node", "server.js"]
