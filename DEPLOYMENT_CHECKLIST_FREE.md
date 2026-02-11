# ✅ Checklist Deploy Miễn Phí (Render + Free TURN)

Deploy WebRTC app hoàn toàn miễn phí với Render.com và OpenRelay TURN.

**⏱️ Thời gian:** 15-20 phút  
**💰 Chi phí:** $0/tháng

---

## 📋 Chuẩn bị

- [ ] Có tài khoản GitHub
- [ ] Có tài khoản Render.com (đăng ký free)
- [ ] Code đã test local thành công
- [ ] Đã đọc [DEPLOYMENT_RENDER_FREE.md](./DEPLOYMENT_RENDER_FREE.md)

---

## BƯỚC 1: Chọn Free TURN Server

### Option A: OpenRelay (Không cần đăng ký - Khuyến nghị)

- [ ] Sử dụng credentials mặc định:
  ```
  Server: turn:openrelay.metered.ca:80
  Username: openrelayproject
  Password: openrelayproject
  ```
- [ ] ✅ Không cần làm gì thêm!

### Option B: Metered.ca (Có Free Tier 50GB)

- [ ] Truy cập https://www.metered.ca/
- [ ] Đăng ký tài khoản free
- [ ] Xác nhận email
- [ ] Vào Dashboard → Copy credentials:
  ```
  TURN Servers: ________________
  Username: ________________
  Password: ________________
  ```

---

## BƯỚC 2: Push Code lên GitHub

- [ ] Mở terminal ở thư mục dự án
- [ ] Kiểm tra file [render.yaml](render.yaml) đã có
- [ ] Push code:
  ```bash
  git add .
  git commit -m "Prepare for Render deployment"
  git push origin main
  ```
- [ ] Verify trên GitHub: Code đã up

---

## BƯỚC 3: Deploy Signaling Server lên Render

- [ ] Đăng nhập https://render.com
- [ ] Click **"New +"** → **"Web Service"**
- [ ] Click **"Connect GitHub"**
- [ ] Chọn repository: `YOUR_USERNAME/Web-RTC`
- [ ] Allow access

### Cấu hình Service 1: Signaling

- [ ] **Name:** `webrtc-signaling` (hoặc tên bạn muốn)
- [ ] **Region:** Singapore
- [ ] **Branch:** `main`
- [ ] **Root Directory:** `server`
- [ ] **Runtime:** Node
- [ ] **Build Command:** `npm install`
- [ ] **Start Command:** `npm start`
- [ ] **Instance Type:** Free

### Environment Variables:

- [ ] `PORT` = `10000`
- [ ] `NODE_ENV` = `production`

- [ ] Click **"Create Web Service"**
- [ ] Đợi deploy xong (~2-3 phút)
- [ ] Check logs: Không có lỗi
- [ ] **Copy URL:** `https://webrtc-signaling-________.onrender.com`

**✅ Lưu URL này để dùng ở bước tiếp theo!**

---

## BƯỚC 4: Deploy Frontend lên Render

- [ ] Trong Render Dashboard, click **"New +"** → **"Web Service"** lần nữa
- [ ] Connect cùng GitHub repo
- [ ] Chọn repository: `YOUR_USERNAME/Web-RTC`

### Cấu hình Service 2: Frontend

- [ ] **Name:** `webrtc-frontend` (hoặc tên bạn muốn)
- [ ] **Region:** Singapore
- [ ] **Branch:** `main`
- [ ] **Root Directory:** `frontend`
- [ ] **Runtime:** Node
- [ ] **Build Command:** `npm install && npm run build`
- [ ] **Start Command:** `npm run preview -- --host 0.0.0.0 --port $PORT`
- [ ] **Instance Type:** Free

### Environment Variables (QUAN TRỌNG):

**Thay `webrtc-signaling-xxx` bằng URL thực từ bước 3!**

- [ ] `VITE_SIGNALING_URL` = `wss://webrtc-signaling-xxx.onrender.com`
- [ ] `VITE_STUN_URL` = `stun:stun.l.google.com:19302`

**Nếu dùng OpenRelay (không cần đăng ký):**
- [ ] `VITE_TURN_UDP_URL` = `turn:openrelay.metered.ca:80?transport=udp`
- [ ] `VITE_TURN_TCP_URL` = `turn:openrelay.metered.ca:80?transport=tcp`
- [ ] `VITE_TURN_TLS_URL` = `turn:openrelay.metered.ca:443?transport=tcp`
- [ ] `VITE_TURN_USERNAME` = `openrelayproject`
- [ ] `VITE_TURN_PASSWORD` = `openrelayproject`

**Nếu dùng Metered.ca (có đăng ký):**
- [ ] `VITE_TURN_UDP_URL` = URL từ dashboard
- [ ] `VITE_TURN_TCP_URL` = URL từ dashboard
- [ ] `VITE_TURN_TLS_URL` = URL từ dashboard
- [ ] `VITE_TURN_USERNAME` = username từ dashboard
- [ ] `VITE_TURN_PASSWORD` = password từ dashboard

**Timeout:**
- [ ] `VITE_P2P_TIMEOUT` = `10000`

- [ ] Click **"Create Web Service"**
- [ ] Đợi deploy xong (~3-5 phút)
- [ ] Check logs: Build successful
- [ ] **Copy Frontend URL:** `https://webrtc-frontend-________.onrender.com`

---

## BƯỚC 5: Test Free TURN Server

Trước khi test app, verify TURN hoạt động:

- [ ] Mở https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
- [ ] Xóa tất cả ICE servers có sẵn
- [ ] Add TURN server:
  ```
  URI: turn:openrelay.metered.ca:80
  Username: openrelayproject
  Credential: openrelayproject
  ```
- [ ] Click **"Gather candidates"**
- [ ] **Kiểm tra:** Thấy dòng màu xanh lá type `relay` ✅

**Nếu không thấy `relay`:**
- [ ] Thử lại 1-2 lần (đôi khi hơi chậm)
- [ ] Hoặc đổi sang Metered.ca (đăng ký free)

---

## BƯỚC 6: Test Ứng dụng

### 6.1. Test cơ bản

- [ ] Mở frontend URL: `https://webrtc-frontend-xxx.onrender.com`
- [ ] ⏰ Lần đầu có thể chậm 30-60s (Render wake up)
- [ ] Mở Console (F12) - Không có lỗi
- [ ] Nhập tên → Create Room
- [ ] Room được tạo thành công

### 6.2. Test P2P (Cùng mạng)

- [ ] Mở tab thứ 2 trên cùng máy
- [ ] Tab 2: Join room với Room ID
- [ ] Tab 1: Click **"Start Call"**
- [ ] Video/audio hiển thị trên cả 2 tabs
- [ ] Mở **Stats Panel** → Check:
  - [ ] Connection State: `connected`
  - [ ] ICE State: `connected`
  - [ ] **Candidate Type:** `host` (P2P trực tiếp)

### 6.3. Test TURN (Khác mạng - QUAN TRỌNG!)

**Setup:**
- [ ] Thiết bị 1: Laptop/PC với WiFi
- [ ] Thiết bị 2: Điện thoại với 4G/5G (TẮT WiFi)

**Test:**
- [ ] Thiết bị 1: Create room
- [ ] Thiết bị 2: Join room với Room ID
- [ ] Thiết bị 1: Start call
- [ ] ⏰ Đợi 10-15 giây (kết nối qua TURN chậm hơn)
- [ ] Video/audio hoạt động trên cả 2 thiết bị
- [ ] Mở **Stats Panel** trên 1 trong 2 thiết bị:
  - [ ] Connection State: `connected`
  - [ ] ICE State: `connected` 
  - [ ] **Candidate Type:** `relay` ✅ (ĐI QUA TURN)

**✅ Nếu thấy `relay` → TURN hoạt động perfect!**

**❌ Nếu `host` hoặc `srflx`:**
- [ ] Credentials TURN có đúng không?
- [ ] Test lại với Trickle ICE (bước 5)

### 6.4. Test Group Call (3+ người)

- [ ] 3 thiết bị/tabs join cùng phòng
- [ ] Start call
- [ ] Video grid hiển thị tất cả mọi người
- [ ] 1 người leave → Others vẫn kết nối
- [ ] End call → Tất cả disconnect

---

## BƯỚC 7: Kiểm tra Console Logs

Mở Console (F12) trên browser, kiểm tra logs:

**✅ Logs thành công:**
```
🔌 Connecting to signaling server: wss://...
✅ Connected to signaling server
📨 Received: roomCreated
🔌 Creating peer connection to Bob
🧊 ICE state [Bob]: checking
🧊 ICE state [Bob]: connected
📊 Candidate type for Bob: relay
✅ All working!
```

**❌ Có lỗi:**
- [ ] Note lại error message
- [ ] Xem phần Troubleshooting trong [DEPLOYMENT_RENDER_FREE.md](./DEPLOYMENT_RENDER_FREE.md)

---

## BƯỚC 8: Giữ Render không Sleep (Optional)

Render free tier sleep sau 15 phút không dùng.

### Option A: UptimeRobot (Khuyến nghị)

- [ ] Đăng ký https://uptimerobot.com (free)
- [ ] Add monitor:
  - [ ] URL: `https://webrtc-signaling-xxx.onrender.com`
  - [ ] Interval: 5 minutes
- [ ] Add monitor frontend:
  - [ ] URL: `https://webrtc-frontend-xxx.onrender.com`
  - [ ] Interval: 5 minutes
- [ ] Setup email alerts

### Option B: Cron-job.org

- [ ] Đăng ký https://cron-job.org (free)
- [ ] Create cron job ping signaling và frontend
- [ ] Interval: 10 minutes

---

## 🎉 HOÀN THÀNH!

### URLs của bạn:

```
📱 Frontend:  https://webrtc-frontend-____________.onrender.com
🔌 Signaling: wss://webrtc-signaling-____________.onrender.com
🌐 TURN:      turn:openrelay.metered.ca:80
```

### Credentials TURN:

```
Username: openrelayproject (hoặc của Metered.ca)
Password: openrelayproject (hoặc của Metered.ca)
```

---

## 📊 Summary

- [x] Deploy signaling server
- [x] Deploy frontend
- [x] Configure free TURN
- [x] Test P2P
- [x] Test TURN relay ✅
- [x] Setup monitoring (optional)

**💰 Total cost: $0/tháng**

---

## 🆘 Troubleshooting Quick Links

**Gặp vấn đề?** Xem chi tiết trong [DEPLOYMENT_RENDER_FREE.md](./DEPLOYMENT_RENDER_FREE.md):

1. **WebSocket failed** → Bước 5 (Troubleshooting #1)
2. **ICE failed / No video** → Bước 5 (Troubleshooting #2)
3. **TURN quá chậm** → Bước 5 (Troubleshooting #3)
4. **Build failed** → Bước 5 (Troubleshooting #4)

---

## 🚀 Next Steps

- [ ] Share link với bạn bè
- [ ] Monitor usage trên Render Dashboard
- [ ] Nâng cấp nếu cần (Render Starter $7/tháng)
- [ ] Thêm features: screen share, chat, recording

---

**✅ Chúc mừng! App của bạn đã chạy production miễn phí!** 🎉
