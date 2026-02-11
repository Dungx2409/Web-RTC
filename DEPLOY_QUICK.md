# 🎯 DEPLOY NHANH - 3 BƯỚC ĐƠN GIẢN

**Deploy WebRTC lên Render.com hoàn toàn miễn phí trong 15 phút!**

---

## 🚀 Bước 1: Push lên GitHub (2 phút)

```bash
git add .
git commit -m "Deploy to Render"
git push origin main
```

---

## 🚀 Bước 2: Deploy lên Render (5 phút)

1. Đăng nhập https://render.com
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub repo: `YOUR_USERNAME/Web-RTC`
4. Render sẽ **tự động detect** file `render.yaml`
5. Click **"Apply"** → Render deploy **2 services cùng lúc**:
   - ✅ Backend (Signaling Server)
   - ✅ Frontend (React App)

**⏰ Đợi 5-7 phút** → Deploy xong!

---

## 🚀 Bước 3: Cập nhật Signaling URL (3 phút)

Sau khi deploy xong:

1. **Copy URL Backend:** `https://webrtc-signaling-xxx.onrender.com`
2. Vào **webrtc-frontend** service trên Render
3. Click **Environment** → Edit `VITE_SIGNALING_URL`
4. Paste URL: `wss://webrtc-signaling-xxx.onrender.com` (thêm `wss://`)
5. Click **"Save Changes"**
6. Render tự động redeploy frontend

**⏰ Đợi 2-3 phút** → Done!

---

## ✅ Hoàn thành!

**Frontend URL:** `https://webrtc-frontend-xxx.onrender.com`

### Test ngay:
1. Mở URL trên 2 thiết bị
2. Tạo phòng và join
3. Start call
4. **Kiểm tra Stats Panel:**
   - Cùng mạng → Candidate: `host`
   - Khác mạng → Candidate: `relay` ✅

---

## 🌐 Free TURN Server

Đã include sẵn **OpenRelay** (free, không cần đăng ký):
```
Server: turn:openrelay.metered.ca:80
Username: openrelayproject
Password: openrelayproject
```

**Không cần làm gì thêm!** Đã config sẵn trong `render.yaml`

---

## 💡 Chi tiết đầy đủ

Muốn hiểu rõ hơn? Đọc:
- **[DEPLOYMENT_RENDER_FREE.md](./DEPLOYMENT_RENDER_FREE.md)** - Hướng dẫn chi tiết
- **[DEPLOYMENT_CHECKLIST_FREE.md](./DEPLOYMENT_CHECKLIST_FREE.md)** - Checklist step-by-step

---

## 🆘 Lỗi thường gặp

### 1. "Cannot connect to signaling"
**Fix:** Đợi 30-60s (Render wake up lần đầu)

### 2. "Frontend build failed"
**Fix:** 
- Check Environment Variables trong Render
- Đảm bảo có đủ tất cả biến `VITE_*`

### 3. "No relay candidate"
**Fix:**
- Test TURN: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
- Hoặc đổi sang Metered.ca free tier

---

## 💰 Chi phí

**$0/tháng** - Hoàn toàn miễn phí với:
- ✅ Render Free (750h/tháng)
- ✅ OpenRelay TURN (free, shared)

**Nâng cấp nếu cần:**
- Render Starter: $7/tháng (no sleep, faster)
- Metered.ca: $4.99/tháng (250GB TURN)

---

**🎉 Chúc mừng! 15 phút là xong!**
