# Hướng dẫn Deploy WebRTC lên Production

Hướng dẫn chi tiết từng bước để deploy WebRTC Meet lên production với:
- **Frontend**: Vercel (hoặc Netlify)
- **Signaling Server**: Render
- **TURN Server**: VPS (DigitalOcean/AWS/Linode)

---

## 📋 Chuẩn bị

### Yêu cầu
- [ ] Tài khoản GitHub
- [ ] Tài khoản Vercel (hoặc Netlify)
- [ ] Tài khoản Render
- [ ] VPS với IP public (cho TURN server)
- [ ] Domain (tùy chọn, nhưng khuyến nghị)

### Checklist trước khi bắt đầu
- [ ] Code đã push lên GitHub
- [ ] Đã test local thành công
- [ ] Có SSH access vào VPS

---

## BƯỚC 1: Deploy TURN Server (Bắt buộc làm đầu tiên)

TURN server cần IP public và phải deploy trước để lấy IP cho config.

### 1.1. Chọn VPS Provider

**Khuyến nghị:**
- **DigitalOcean**: $6/tháng (1GB RAM) - Dễ dùng
- **Vultr**: $5/tháng - Tốc độ tốt
- **AWS Lightsail**: $3.5/tháng - Rẻ nhất
- **Linode**: $5/tháng - Ổn định

**Yêu cầu tối thiểu:**
- 1GB RAM
- 1 CPU core
- Ubuntu 22.04 LTS
- IP public

### 1.2. Kết nối VPS qua SSH

```bash
ssh root@YOUR_VPS_IP
```

### 1.3. Cài đặt Docker trên VPS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Cài đặt Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Cài đặt Docker Compose
sudo apt install docker-compose -y

# Kiểm tra
docker --version
docker-compose --version
```

### 1.4. Clone dự án hoặc copy file TURN

**Cách 1: Clone toàn bộ repo (khuyến nghị)**
```bash
cd /opt
git clone https://github.com/YOUR_USERNAME/Web-RTC.git
cd Web-RTC/turn
```

**Cách 2: Tạo thư mục và copy file thủ công**
```bash
mkdir -p /opt/turn-server
cd /opt/turn-server

# Tạo file docker-compose.yml
nano docker-compose.yml
# (Copy nội dung từ turn/docker-compose.yml)

# Tạo file turnserver.conf
nano turnserver.conf
# (Copy nội dung từ turn/turnserver.conf)
```

### 1.5. Sửa file turnserver.conf với IP public

```bash
nano turnserver.conf
```

**Tìm và sửa dòng sau:**
```conf
# Thay YOUR_PUBLIC_IP bằng IP thực của VPS
external-ip=YOUR_VPS_IP

# Ví dụ:
external-ip=165.232.123.45
```

**Đổi credentials (khuyến nghị):**
```conf
# Thay vì webrtc:webrtc123, dùng password mạnh hơn
user=myuser:MySecureP@ssw0rd123
```

### 1.6. Cấu hình Firewall

```bash
# Cho phép SSH
sudo ufw allow 22/tcp

# Cho phép TURN ports
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp
sudo ufw allow 5349/tcp
sudo ufw allow 49152:65535/udp

# Bật firewall
sudo ufw enable

# Kiểm tra
sudo ufw status
```

### 1.7. Khởi động TURN Server

```bash
cd /opt/Web-RTC/turn  # hoặc /opt/turn-server

# Chạy container
docker-compose up -d

# Kiểm tra logs
docker logs webrtc-turn-server

# Kiểm tra container đang chạy
docker ps
```

### 1.8. Test TURN Server

**Cách 1: Dùng Trickle ICE (khuyến nghị)**
1. Mở browser: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
2. Xóa tất cả ICE servers có sẵn
3. Thêm TURN server của bạn:
   ```
   URLs: turn:YOUR_VPS_IP:3478
   Username: myuser
   Credential: MySecureP@ssw0rd123
   ```
4. Click **"Gather candidates"**
5. **Kết quả mong đợi**: Phải thấy candidate type `relay` (màu xanh lá)

**Cách 2: Test từ command line (trên VPS)**
```bash
# Cài đặt turn-client
apt-get install -y coturn-utils

# Test
turnutils_uclient -u myuser -w MySecureP@ssw0rd123 YOUR_VPS_IP
```

**✅ LƯU LẠI THÔNG TIN SAU:**
```
TURN_SERVER_IP: _______________
TURN_USERNAME: _______________
TURN_PASSWORD: _______________
```

---

## BƯỚC 2: Deploy Signaling Server lên Render

### 2.1. Tạo file cấu hình cho Render

Tạo file `render.yaml` ở thư mục gốc dự án:

```bash
cd /home/npt102/VSC/webRTC/Web-RTC
```

File này được tạo tự động trong bước tiếp theo.

### 2.2. Push code lên GitHub

```bash
git add .
git commit -m "Add deployment configs"
git push origin main
```

### 2.3. Tạo Web Service trên Render

1. Đăng nhập https://render.com
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub repository: `YOUR_USERNAME/Web-RTC`
4. Cấu hình:

   | Field | Value |
   |-------|-------|
   | **Name** | `webrtc-signaling-server` |
   | **Region** | Singapore (gần VN nhất) |
   | **Branch** | `main` |
   | **Root Directory** | `server` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Instance Type** | Free (hoặc Starter $7/tháng) |

5. **Environment Variables** (Click "Advanced" → "Add Environment Variable"):
   ```
   PORT=10000
   NODE_ENV=production
   ```

6. Click **"Create Web Service"**

### 2.4. Đợi deploy xong

- Render sẽ tự động build và deploy
- Thời gian: ~2-5 phút
- Kiểm tra logs để đảm bảo không có lỗi

### 2.5. Lấy URL signaling server

Sau khi deploy thành công, bạn sẽ có URL dạng:
```
https://webrtc-signaling-server.onrender.com
```

**✅ LƯU LẠI:**
```
SIGNALING_URL: wss://webrtc-signaling-server.onrender.com
```

**Lưu ý:** Render free tier sẽ sleep sau 15 phút không dùng, lần đầu kết nối sẽ chậm 30-60s.

### 2.6. Test Signaling Server

```bash
# Test HTTP endpoint
curl https://webrtc-signaling-server.onrender.com

# Hoặc mở browser
```

---

## BƯỚC 3: Deploy Frontend lên Vercel

### 3.1. Tạo file .env.production cho frontend

```bash
cd frontend
```

Tạo file `.env.production` với nội dung:

```env
# Signaling Server (từ Render)
VITE_SIGNALING_URL=wss://webrtc-signaling-server.onrender.com

# TURN Server (từ VPS của bạn)
VITE_TURN_UDP_URL=turn:YOUR_VPS_IP:3478?transport=udp
VITE_TURN_TCP_URL=turn:YOUR_VPS_IP:3478?transport=tcp
VITE_TURN_TLS_URL=turns:YOUR_VPS_IP:5349?transport=tcp
VITE_TURN_USERNAME=myuser
VITE_TURN_PASSWORD=MySecureP@ssw0rd123

# STUN Server (public)
VITE_STUN_URL=stun:stun.l.google.com:19302

# Timeouts
VITE_P2P_TIMEOUT=10000
```

**Thay thế:**
- `YOUR_VPS_IP` → IP thực của VPS (bước 1)
- `myuser`, `MySecureP@ssw0rd123` → credentials đã đặt (bước 1.5)

### 3.2. Build test local trước

```bash
npm run build
npm run preview
```

Mở http://localhost:4173 để test.

### 3.3. Push code lên GitHub

```bash
cd ..  # Quay về thư mục gốc
git add .
git commit -m "Add production configs"
git push origin main
```

### 3.4. Deploy lên Vercel

**Cách 1: Từ Vercel Dashboard (khuyến nghị cho người mới)**

1. Đăng nhập https://vercel.com
2. Click **"Add New..."** → **"Project"**
3. Import GitHub repository: `YOUR_USERNAME/Web-RTC`
4. Cấu hình:

   | Field | Value |
   |-------|-------|
   | **Framework Preset** | `Vite` |
   | **Root Directory** | `frontend` |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `dist` |

5. **Environment Variables** (Click "Configure Project"):
   
   Add từng biến một (copy từ `.env.production`):
   ```
   VITE_SIGNALING_URL=wss://webrtc-signaling-server.onrender.com
   VITE_TURN_UDP_URL=turn:YOUR_VPS_IP:3478?transport=udp
   VITE_TURN_TCP_URL=turn:YOUR_VPS_IP:3478?transport=tcp
   VITE_TURN_TLS_URL=turns:YOUR_VPS_IP:5349?transport=tcp
   VITE_TURN_USERNAME=myuser
   VITE_TURN_PASSWORD=MySecureP@ssw0rd123
   VITE_STUN_URL=stun:stun.l.google.com:19302
   VITE_P2P_TIMEOUT=10000
   ```

6. Click **"Deploy"**

**Cách 2: Từ CLI**

```bash
# Cài đặt Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod

# Làm theo hướng dẫn trên terminal
```

### 3.5. Lấy URL Production

Sau khi deploy xong, bạn sẽ có URL dạng:
```
https://webrtc-meet-xxxx.vercel.app
```

**✅ LƯU LẠI:**
```
FRONTEND_URL: https://webrtc-meet-xxxx.vercel.app
```

---

## BƯỚC 4: Test toàn bộ hệ thống

### 4.1. Test cơ bản

1. Mở URL frontend: `https://webrtc-meet-xxxx.vercel.app`
2. Mở Console (F12) để xem logs
3. Nhập tên và tạo phòng
4. Mở tab/thiết bị khác, join phòng
5. Start call

### 4.2. Kiểm tra kết nối

Mở Stats Panel trong call, kiểm tra:

**Scenario 1: Cùng mạng WiFi**
- ✅ Candidate Type: `host`
- ✅ Connection State: `connected`
- ⏱️ Connection Time: < 3s

**Scenario 2: Khác mạng (4G vs WiFi)**
- ✅ Candidate Type: `relay` (quan trọng!)
- ✅ Connection State: `connected` (có thể mất ~10s)
- ⚠️ RTT cao hơn (~100-200ms)

### 4.3. Các lỗi thường gặp

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| `WebSocket connection failed` | Signaling server chưa sẵn sàng | Đợi Render wake up (30-60s) |
| `ICE failed` | TURN server không hoạt động | Kiểm tra firewall VPS, test lại TURN |
| `No relay candidate` | Sai credentials TURN | Kiểm tra username/password |
| `Camera permission denied` | Browser chặn | Cấp quyền trong browser settings |
| `Mixed content` | HTTP/HTTPS không khớp | Đảm bảo tất cả dùng HTTPS/WSS |

### 4.4. Debug với Browser Console

Mở Console (F12), xem logs:

```
✅ Kết nối thành công:
🔌 Connecting to signaling server: wss://...
✅ Connected to signaling server
🔌 Creating peer connection to Bob
🧊 ICE state [Bob]: connected
📊 Candidate type for Bob: relay

❌ Kết nối thất bại:
❌ WebSocket error
❌ ICE connection failed
```

---

## BƯỚC 5: Tối ưu và bảo mật

### 5.1. Custom Domain (Tùy chọn)

**Cho Frontend (Vercel):**
1. Vào project settings → Domains
2. Thêm domain: `meet.yourdomain.com`
3. Cấu hình DNS theo hướng dẫn

**Cho Signaling (Render):**
1. Vào service settings → Custom Domain
2. Thêm: `signal.yourdomain.com`

**Cập nhật frontend .env:**
```env
VITE_SIGNALING_URL=wss://signal.yourdomain.com
```

### 5.2. Bảo mật TURN Server

**1. Dùng TLS (TURNS):**
```bash
# Trên VPS, cài Let's Encrypt
sudo apt install certbot -y
sudo certbot certonly --standalone -d turn.yourdomain.com

# Sửa turnserver.conf
cert=/etc/letsencrypt/live/turn.yourdomain.com/cert.pem
pkey=/etc/letsencrypt/live/turn.yourdomain.com/privkey.pem
```

**2. Giới hạn rate limit:**
Thêm vào `turnserver.conf`:
```conf
max-bps=1000000
bps-capacity=2000000
```

**3. Đổi password thường xuyên**

### 5.3. Monitoring

**Render (Signaling):**
- Xem logs: Dashboard → Logs
- Alerts: Settings → Notifications

**VPS (TURN):**
```bash
# Xem logs TURN
docker logs -f webrtc-turn-server

# Monitor resource
htop
```

**Uptime Monitoring (free):**
- UptimeRobot: https://uptimerobot.com
- Monitor cả frontend + signaling server

### 5.4. Backup và Rollback

**GitHub:**
- Mỗi lần sửa code, commit với message rõ ràng
- Vercel/Render tự động deploy từ GitHub

**Rollback:**
- Vercel: Dashboard → Deployments → chọn version cũ → Promote
- Render: Dashboard → Events → Redeploy từ commit cũ

---

## BƯỚC 6: Chi phí và Scaling

### Chi phí ước tính (USD/tháng)

| Service | Free Tier | Paid |
|---------|-----------|------|
| **Vercel** | ✅ Unlimited (Free) | $20/team |
| **Render** | ✅ 750h/tháng (Free) | $7 (Starter) |
| **VPS (TURN)** | ❌ | $5-6 |
| **Total** | **$5-6/tháng** | $32-33/tháng |

**Lưu ý Free Tier:**
- Render free sleep sau 15 phút → lần đầu kết nối chậm
- Chỉ phù hợp cho demo/testing
- Production nên dùng paid ($7)

### Scaling

**Khi nào cần scale:**
- > 50 users đồng thời
- > 10 phòng cùng lúc
- TURN bandwidth cao (> 500GB/tháng)

**Giải pháp:**
1. **SFU Server** (thay mesh topology) → giảm tải client
2. **Multiple TURN servers** → load balancing
3. **CDN** cho frontend
4. **Render Instance tăng RAM** → $7 → $25

---

## Tóm tắt URLs & Credentials

Điền vào sau khi hoàn thành:

```
==========================================
      🎉 WebRTC Deployment Info 🎉
==========================================

📱 FRONTEND
URL: https://_____________________.vercel.app

🔌 SIGNALING SERVER  
URL: wss://_____________________.onrender.com

🌐 TURN SERVER
IP: ___________________
Port: 3478 (UDP/TCP), 5349 (TLS)
Username: ___________________
Password: ___________________

==========================================
```

---

## Troubleshooting Common Issues

### 1. Render Free Tier quá chậm

**Giải pháp:**
- Upgrade lên Starter ($7/tháng)
- Hoặc dùng cron job ping mỗi 10 phút:
  ```bash
  */10 * * * * curl https://YOUR-APP.onrender.com
  ```

### 2. TURN không hoạt động qua 4G

**Kiểm tra:**
```bash
# Trên VPS
sudo ufw status
sudo netstat -tuln | grep 3478

# Test từ điện thoại
# Dùng Trickle ICE test (xem bước 1.8)
```

### 3. Video không hiển thị

**Nguyên nhân:**
- HTTPS/HTTP mixed content
- Camera permission denied
- Codec không support

**Giải pháp:**
- Đảm bảo frontend dùng HTTPS
- Cấp quyền camera trong browser
- Test trên Chrome/Firefox mới nhất

### 4. Connection State = "failed"

```javascript
// Kiểm tra ICE candidates trong console
// Phải thấy ít nhất 1 loại:
- host candidate (LAN)
- srflx candidate (public IP qua STUN)  
- relay candidate (qua TURN)
```

Nếu không có `relay`, kiểm tra lại TURN config.

---

## Tài nguyên tham khảo

- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Coturn Wiki](https://github.com/coturn/coturn/wiki)
- [WebRTC Trickle ICE Test](https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/)

---

**✅ Hoàn thành!** Giờ bạn đã có WebRTC app chạy production với đầy đủ P2P + TURN fallback.

**Tiếp theo:**
- Thêm tính năng screen sharing
- Implement SFU cho large groups
- Thêm recording
- Mobile responsive optimization
