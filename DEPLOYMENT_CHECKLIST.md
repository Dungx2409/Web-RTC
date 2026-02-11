# 📋 WebRTC Deployment Checklist

Sử dụng checklist này để theo dõi tiến trình deploy từng bước.

---

## ✅ BƯỚC 1: TURN Server (VPS)

### Chuẩn bị
- [ ] Đã mua/thuê VPS (DigitalOcean/Vultr/AWS/Linode)
- [ ] VPS có IP public
- [ ] Đã SSH vào VPS được

### Cài đặt Docker
- [ ] Update system: `sudo apt update && sudo apt upgrade -y`
- [ ] Cài Docker: `curl -fsSL https://get.docker.com | sh`
- [ ] Cài Docker Compose: `sudo apt install docker-compose -y`
- [ ] Test: `docker --version`

### Cấu hình TURN
- [ ] Clone repo hoặc copy file turn/ lên VPS
- [ ] Sửa `turnserver.conf` với IP public của VPS
- [ ] Đổi username/password mạnh hơn
- [ ] Lưu credentials: `____________________`

### Firewall
- [ ] Allow SSH: `sudo ufw allow 22/tcp`
- [ ] Allow TURN: `sudo ufw allow 3478/tcp 3478/udp 5349/tcp`
- [ ] Allow relay ports: `sudo ufw allow 49152:65535/udp`
- [ ] Enable firewall: `sudo ufw enable`

### Khởi động
- [ ] Run: `docker-compose up -d`
- [ ] Check logs: `docker logs webrtc-turn-server`
- [ ] Container running: `docker ps`

### Test TURN
- [ ] Test với Trickle ICE: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
- [ ] Thấy candidate type `relay` màu xanh lá ✅

**✅ Lưu thông tin:**
```
VPS_IP: ____________________
TURN_USERNAME: ____________________
TURN_PASSWORD: ____________________
```

---

## ✅ BƯỚC 2: Signaling Server (Render)

### Chuẩn bị
- [ ] Code đã push lên GitHub
- [ ] Đã có tài khoản Render.com

### Deploy
- [ ] Đăng nhập Render
- [ ] New Web Service
- [ ] Connect GitHub repo
- [ ] Root Directory: `server`
- [ ] Build: `npm install`
- [ ] Start: `npm start`
- [ ] Region: Singapore

### Environment Variables
- [ ] `PORT=10000`
- [ ] `NODE_ENV=production`

### Verify
- [ ] Deploy thành công (check logs)
- [ ] Service đang chạy
- [ ] Test URL: `curl https://your-app.onrender.com`

**✅ Lưu thông tin:**
```
SIGNALING_URL: wss://______________________.onrender.com
```

---

## ✅ BƯỚC 3: Frontend (Vercel)

### Chuẩn bị file .env.production
- [ ] Copy `.env.production.example` → `.env.production`
- [ ] Điền `VITE_SIGNALING_URL` từ Render
- [ ] Điền `VITE_TURN_*_URL` với VPS IP
- [ ] Điền `VITE_TURN_USERNAME` và `VITE_TURN_PASSWORD`

### Test local trước
- [ ] `cd frontend && npm run build`
- [ ] `npm run preview`
- [ ] Mở http://localhost:4173 test

### Push code
- [ ] `git add .`
- [ ] `git commit -m "Add production configs"`
- [ ] `git push origin main`

### Deploy Vercel
- [ ] Đăng nhập Vercel.com
- [ ] New Project
- [ ] Import GitHub repo
- [ ] Root Directory: `frontend`
- [ ] Framework: Vite
- [ ] Build: `npm run build`
- [ ] Output: `dist`

### Environment Variables (trên Vercel)
- [ ] `VITE_SIGNALING_URL`
- [ ] `VITE_TURN_UDP_URL`
- [ ] `VITE_TURN_TCP_URL`
- [ ] `VITE_TURN_TLS_URL`
- [ ] `VITE_TURN_USERNAME`
- [ ] `VITE_TURN_PASSWORD`
- [ ] `VITE_STUN_URL`
- [ ] `VITE_P2P_TIMEOUT`

### Deploy
- [ ] Click Deploy
- [ ] Đợi build xong (~2-3 phút)
- [ ] Deploy thành công ✅

**✅ Lưu thông tin:**
```
FRONTEND_URL: https://______________________.vercel.app
```

---

## ✅ BƯỚC 4: Testing

### Test cơ bản
- [ ] Mở frontend URL
- [ ] Console không có lỗi (F12)
- [ ] Tạo phòng thành công
- [ ] Join phòng từ tab/thiết bị khác

### Test P2P (cùng mạng)
- [ ] 2 thiết bị cùng WiFi
- [ ] Start call
- [ ] Video/audio hoạt động
- [ ] Stats Panel → Candidate type: `host` ✅

### Test TURN (khác mạng)
- [ ] 1 thiết bị WiFi, 1 thiết bị 4G
- [ ] Start call
- [ ] Video/audio hoạt động
- [ ] Stats Panel → Candidate type: `relay` ✅ (QUAN TRỌNG!)

### Test Group Call
- [ ] 3+ người cùng phòng
- [ ] Video grid hiển thị đúng
- [ ] Tất cả đều nghe/thấy nhau

---

## ✅ BƯỚC 5: Tối ưu (Optional)

### Custom Domain
- [ ] Mua domain
- [ ] Setup DNS cho frontend (Vercel)
- [ ] Setup DNS cho signaling (Render)
- [ ] Update `.env.production` với domain mới

### TURN TLS (HTTPS)
- [ ] Cài Let's Encrypt trên VPS
- [ ] Cấu hình SSL cert trong turnserver.conf
- [ ] Restart container

### Monitoring
- [ ] Setup UptimeRobot cho frontend
- [ ] Setup UptimeRobot cho signaling
- [ ] Config alerts (email/Slack)

---

## 🎉 HOÀN THÀNH!

### Final URLs
```
Frontend:    https://______________________________
Signaling:   wss://________________________________
TURN Server: turn:_____________:3478
```

### Credentials
```
TURN Username: ____________________
TURN Password: ____________________
```

### Next Steps
- [ ] Share link với team/bạn bè
- [ ] Monitor usage và logs
- [ ] Plan cho scaling (nếu nhiều users)

---

## 🆘 Troubleshooting

### Nếu gặp vấn đề:

1. **Không kết nối được signaling**
   - Check Render logs
   - Đợi 30-60s (free tier wake up)
   - Test: `curl https://your-app.onrender.com`

2. **ICE connection failed**
   - Check TURN server: `docker logs webrtc-turn-server`
   - Check firewall: `sudo ufw status`
   - Test TURN với Trickle ICE

3. **No relay candidate**
   - Kiểm tra credentials TURN
   - Kiểm tra IP trong turnserver.conf
   - Kiểm tra .env.production

4. **Video không hiển thị**
   - Cấp quyền camera/mic trong browser
   - Đảm bảo dùng HTTPS (không phải HTTP)
   - Test trên Chrome/Firefox mới nhất

### Debug Commands

**VPS (TURN):**
```bash
docker ps                              # Check container
docker logs webrtc-turn-server        # Check logs
sudo netstat -tuln | grep 3478        # Check ports
sudo ufw status                        # Check firewall
```

**Browser (Console):**
```javascript
// Check WebSocket connection
console.log('WS state:', signalingService.isReady());

// Check ICE candidates
// Xem trong Stats Panel
```

---

**📞 Cần hỗ trợ?**
- Xem [DEPLOYMENT.md](./DEPLOYMENT.md) để biết chi tiết
- Check logs và error messages
- Debug từng service một: TURN → Signaling → Frontend
