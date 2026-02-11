# 🚀 Deploy WebRTC lên Render (Hoàn toàn Miễn Phí)

Hướng dẫn deploy đơn giản chỉ với **Render.com** và **Free TURN server**.

**💰 Chi phí: $0/tháng** (hoàn toàn miễn phí)

---

## 📋 Chuẩn bị

### Yêu cầu
- [x] Tài khoản GitHub (free)
- [x] Tài khoản Render.com (free)
- [x] Code đã push lên GitHub

**Thời gian:** ~15-20 phút

---

## BƯỚC 1: Tạo tài khoản Free TURN Server

### Option 1: OpenRelay (Khuyến nghị - Không cần đăng ký)

**OpenRelay** cung cấp free TURN servers công khai:

```env
TURN Servers:
- turn:openrelay.metered.ca:80
- turn:openrelay.metered.ca:443
- turn:openrelay.metered.ca:443?transport=tcp

Username: openrelayproject
Password: openrelayproject
```

**✅ Ưu điểm:**
- Hoàn toàn miễn phí
- Không cần đăng ký
- Limited rate nhưng đủ cho demo/testing
- Sử dụng ngay lập tức

**⚠️ Hạn chế:**
- Shared với nhiều người
- Có thể chậm giờ cao điểm
- Không guarantee uptime
- Bandwidth giới hạn

---

### Option 2: Metered.ca (Có Free Tier - Cần đăng ký)

**Bước đăng ký:**

1. Truy cập: https://www.metered.ca/
2. Click **"Sign Up Free"**
3. Xác nhận email
4. Vào Dashboard → **TURN servers**
5. Lấy credentials:

```env
TURN Servers: Hiển thị trong dashboard
Username: Your generated username
Password: Your generated password
```

**✅ Ưu điểm:**
- Free tier: 50GB/tháng
- Credentials riêng
- Tốc độ ổn định hơn
- Dashboard theo dõi usage

**📊 Free Tier Details:**
- 50GB bandwidth/tháng
- Unlimited concurrent users
- Global TURN servers

---

### Option 3: Twilio STUN/TURN (Có Free Trial)

1. Đăng ký: https://www.twilio.com/console
2. Tạo API Key
3. Generate TURN credentials qua API

**Free Trial:** $15 credit

---

## BƯỚC 2: Cập nhật Environment Variables

### 2.1. Tạo file .env.production

```bash
cd frontend
cp .env.production.example .env.production
```

### 2.2. Sửa nội dung với Free TURN

**Nếu dùng OpenRelay (không cần đăng ký):**

```env
# Signaling Server URL (sẽ có sau bước 3)
VITE_SIGNALING_URL=wss://webrtc-signaling-YOUR_APP.onrender.com

# STUN Server (Google - Free)
VITE_STUN_URL=stun:stun.l.google.com:19302

# Free TURN Server - OpenRelay
VITE_TURN_UDP_URL=turn:openrelay.metered.ca:80?transport=udp
VITE_TURN_TCP_URL=turn:openrelay.metered.ca:80?transport=tcp
VITE_TURN_TLS_URL=turn:openrelay.metered.ca:443?transport=tcp
VITE_TURN_USERNAME=openrelayproject
VITE_TURN_PASSWORD=openrelayproject

# Timeout
VITE_P2P_TIMEOUT=10000
```

**Nếu dùng Metered.ca (có tài khoản):**

```env
# Signaling Server URL (sẽ có sau bước 3)
VITE_SIGNALING_URL=wss://webrtc-signaling-YOUR_APP.onrender.com

# STUN Server
VITE_STUN_URL=stun:stun.l.google.com:19302

# Metered.ca TURN (lấy từ dashboard)
VITE_TURN_UDP_URL=turn:a.relay.metered.ca:80?transport=udp
VITE_TURN_TCP_URL=turn:a.relay.metered.ca:80?transport=tcp
VITE_TURN_TLS_URL=turn:a.relay.metered.ca:443?transport=tcp
VITE_TURN_USERNAME=your_username_from_dashboard
VITE_TURN_PASSWORD=your_password_from_dashboard

VITE_P2P_TIMEOUT=10000
```

**💡 Lưu ý:** Chưa có Signaling URL, sẽ cập nhật sau bước 3!

---

## BƯỚC 3: Deploy lên Render

### 3.1. Push code lên GitHub

```bash
# Ở thư mục gốc dự án
git add .
git commit -m "Prepare for Render deployment with free TURN"
git push origin main
```

### 3.2. Deploy Signaling Server

1. Đăng nhập https://render.com
2. Click **"New +"** → **"Web Service"**
3. Click **"Connect GitHub"** → Chọn repository
4. Cấu hình:

**Service 1: Signaling Server**

| Field | Value |
|-------|-------|
| **Name** | `webrtc-signaling` (hoặc tên bạn muốn) |
| **Region** | Singapore |
| **Branch** | `main` |
| **Root Directory** | `server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

5. **Environment Variables:**
   ```
   PORT=10000
   NODE_ENV=production
   ```

6. Click **"Create Web Service"**

7. **Đợi deploy xong** (~2-3 phút)

8. **Lấy URL:** Copy URL dạng `https://webrtc-signaling-xxxx.onrender.com`

---

### 3.3. Deploy Frontend

1. Trong Render Dashboard, click **"New +"** → **"Web Service"** lần nữa
2. Connect cùng GitHub repo
3. Cấu hình:

**Service 2: Frontend**

| Field | Value |
|-------|-------|
| **Name** | `webrtc-frontend` (hoặc tên bạn muốn) |
| **Region** | Singapore |
| **Branch** | `main` |
| **Root Directory** | `frontend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run preview -- --host 0.0.0.0 --port $PORT` |
| **Instance Type** | `Free` |

4. **Environment Variables** (QUAN TRỌNG):

Thêm từng biến một:

```
VITE_SIGNALING_URL=wss://webrtc-signaling-xxxx.onrender.com
VITE_STUN_URL=stun:stun.l.google.com:19302
VITE_TURN_UDP_URL=turn:openrelay.metered.ca:80?transport=udp
VITE_TURN_TCP_URL=turn:openrelay.metered.ca:80?transport=tcp
VITE_TURN_TLS_URL=turn:openrelay.metered.ca:443?transport=tcp
VITE_TURN_USERNAME=openrelayproject
VITE_TURN_PASSWORD=openrelayproject
VITE_P2P_TIMEOUT=10000
```

**Thay thế:**
- `webrtc-signaling-xxxx.onrender.com` → URL từ bước 3.2
- Credentials TURN nếu dùng Metered.ca

5. Click **"Create Web Service"**

6. **Đợi deploy xong** (~3-4 phút)

7. **Lấy Frontend URL:** `https://webrtc-frontend-xxxx.onrender.com`

---

## BƯỚC 4: Test hoạt động

### 4.1. Truy cập ứng dụng

Mở browser: `https://webrtc-frontend-xxxx.onrender.com`

**⏰ Lưu ý:** Lần đầu có thể chậm 30-60s (Render free tier wake up)

### 4.2. Test P2P (Cùng mạng)

1. Mở 2 tabs trên cùng một máy
2. Tab 1: Tạo phòng
3. Tab 2: Join phòng với Room ID
4. Start call
5. **Kiểm tra:** Video/audio hoạt động

**Stats Panel → Candidate Type:** `host` ✅

### 4.3. Test TURN (Khác mạng - QUAN TRỌNG)

1. Thiết bị 1: WiFi
2. Thiết bị 2: 4G/5G (hoặc mạng khác)
3. Cả 2 join cùng phòng
4. Start call

**Stats Panel → Candidate Type:** `relay` ✅ (nghĩa là đi qua TURN)

### 4.4. Kiểm tra Console (F12)

**✅ Kết nối thành công:**
```
🔌 Connecting to signaling server: wss://...
✅ Connected to signaling server
🔌 Creating peer connection to Bob
🧊 ICE state [Bob]: connected
📊 Candidate type for Bob: relay
```

**❌ Nếu có lỗi:**
- `WebSocket failed` → Đợi 30-60s (Render wake up)
- `ICE failed` → Check TURN credentials
- `No relay candidate` → TURN không hoạt động

---

## BƯỚC 5: Test Free TURN Server

Để chắc chắn TURN hoạt động:

1. Mở: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
2. Xóa tất cả ICE servers
3. Thêm TURN của bạn:

**OpenRelay:**
```
STUN/TURN URI: turn:openrelay.metered.ca:80
Username: openrelayproject
Credential: openrelayproject
```

4. Click **"Gather candidates"**
5. **Kết quả mong đợi:** Thấy dòng màu xanh lá với type `relay`

---

## 🎉 Hoàn thành!

### URLs của bạn:

```
📱 Frontend:  https://webrtc-frontend-xxxx.onrender.com
🔌 Signaling: wss://webrtc-signaling-xxxx.onrender.com
🌐 TURN:      turn:openrelay.metered.ca:80
```

### Credentials:

```
TURN Username: openrelayproject
TURN Password: openrelayproject
```

---

## 💡 Tối ưu và Nâng cấp

### Free Tier Limitations

**Render Free:**
- ✅ 750 hours/tháng (đủ cho 1 service 24/7)
- ⚠️ Sleep sau 15 phút không dùng
- ⚠️ Lần đầu kết nối chậm 30-60s
- ⚠️ Bandwidth giới hạn

**OpenRelay TURN:**
- ⚠️ Shared, có thể chậm
- ⚠️ Không guarantee uptime
- ⚠️ Rate limiting

### Khi nào cần nâng cấp?

**Nâng cấp Render ($7/tháng):**
- Không sleep
- Tốc độ nhanh hơn
- Phù hợp production nhỏ

**Nâng cấp TURN ($5-10/tháng):**
- Metered.ca Starter: $4.99/tháng (250GB)
- Twilio: Pay as you go
- Hoặc tự host trên VPS ($5/tháng)

### Giữ Render không sleep (miễn phí)

Dùng cron job ping mỗi 10 phút:

**Cách 1: Cron-job.org (free)**
1. Đăng ký: https://cron-job.org
2. Tạo job ping: `https://webrtc-signaling-xxxx.onrender.com`
3. Interval: Every 10 minutes

**Cách 2: UptimeRobot (free)**
1. Đăng ký: https://uptimerobot.com
2. Add monitor cho cả frontend + signaling
3. Interval: 5 minutes

---

## 🔧 Troubleshooting

### 1. "WebSocket connection failed"

**Nguyên nhân:** Render đang wake up từ sleep

**Giải pháp:**
- Đợi 30-60 giây và thử lại
- Hoặc ping server trước: `curl https://webrtc-signaling-xxxx.onrender.com`

---

### 2. "ICE connection failed" / No video

**Kiểm tra:**
1. Mở Console (F12)
2. Xem logs WebRTC
3. Check Stats Panel

**Nếu không thấy `relay` candidate:**
- Kiểm tra TURN credentials
- Test TURN với Trickle ICE
- Thử đổi sang Metered.ca (có free tier tốt hơn)

---

### 3. Free TURN quá chậm

**Giải pháp:**

**Option A: Nâng cấp Metered.ca**
- Free: 50GB/tháng
- Paid: $4.99/tháng (250GB)
- https://www.metered.ca/pricing

**Option B: Twilio**
- Free trial: $15 credit
- Pay-as-you-go sau đó
- https://www.twilio.com/stun-turn

**Option C: Tự host TURN (cần VPS)**
- Xem [DEPLOYMENT_VPS.md](./DEPLOYMENT_VPS.md)
- Chi phí: $5-6/tháng VPS

---

### 4. Frontend build failed trên Render

**Lỗi thường gặp:** Missing environment variables

**Giải pháp:**
1. Vào Render Dashboard → Service → Environment
2. Kiểm tra tất cả biến `VITE_*` đã add đúng
3. Click **"Manual Deploy"** để redeploy

---

### 5. Render free tier hết giờ

**Render Free:** 750 hours/tháng

**Tính toán:**
- 1 service 24/7 = 720 hours/tháng ✅
- 2 services 24/7 = 1440 hours/tháng ❌

**Giải pháp:**
- Chỉ chạy khi cần (sleep khi không dùng)
- Hoặc upgrade lên Starter ($7/tháng cho cả 2 services)

---

## 📊 So sánh Free TURN Providers

| Provider | Free Tier | Đăng ký | Bandwidth | Tốc độ | Uptime |
|----------|-----------|---------|-----------|--------|--------|
| **OpenRelay** | ✅ Unlimited | ❌ Không cần | Limited | ⭐⭐⭐ | ⭐⭐⭐ |
| **Metered.ca** | 50GB/tháng | ✅ Cần | 50GB | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Twilio** | $15 credit | ✅ Cần | Pay-as-go | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Xirsys** | 500MB/tháng | ✅ Cần | 500MB | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

**Khuyến nghị:**
- **Demo/Testing:** OpenRelay (không cần đăng ký)
- **Small Production:** Metered.ca Free (50GB đủ cho 10-20 users/tháng)
- **Professional:** Twilio hoặc tự host

---

## 📝 Tóm tắt chi phí

### Hoàn toàn miễn phí ($0/tháng):

- ✅ Render Free (750h/tháng)
- ✅ OpenRelay TURN (free, shared)
- ✅ GitHub (free)

**Tổng: $0/tháng** 🎉

### Nâng cấp tối thiểu ($12/tháng):

- Render Starter: $7/tháng (cả 2 services)
- Metered.ca: $4.99/tháng (250GB TURN)

**Tổng: ~$12/tháng**

---

## 🚀 Next Steps

Sau khi deploy thành công:

1. **Share link** với bạn bè test
2. **Monitor usage:**
   - Render: Dashboard → Metrics
   - Metered.ca: Dashboard → Usage
3. **Setup monitoring:**
   - UptimeRobot: Ping mỗi 5 phút
   - Email alert khi down
4. **Cải thiện:**
   - Thêm screen sharing
   - Recording
   - Chat

---

## 📚 Tài liệu thêm

- [Render Docs](https://render.com/docs)
- [Metered.ca Docs](https://www.metered.ca/docs)
- [WebRTC Samples](https://webrtc.github.io/samples/)

---

**✅ Chúc mừng! Bạn đã có WebRTC app chạy production 100% miễn phí!** 🎉

Có thắc mắc? Xem phần Troubleshooting ở trên.
