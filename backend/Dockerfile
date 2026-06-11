# Sử dụng official Node.js image làm base image
FROM node:18-alpine

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Sao chép package.json và package-lock.json để cài đặt dependencies trước (tận dụng cache Docker)
COPY package*.json ./

# Cài đặt các dependencies cần thiết cho môi trường Production
RUN npm ci --only=production

# Sao chép toàn bộ mã nguồn backend vào container
COPY . .

# Thiết lập biến môi trường mặc định
ENV NODE_ENV=production
ENV PORT=4000

# Mở cổng 4000
EXPOSE 4000

# Khởi chạy server Node.js
CMD ["node", "server.js"]
