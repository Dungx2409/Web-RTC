# 📦 Các file đã được tạo cho Deployment

Dự án có 2 phương án deploy:

## 🎯 Phương án 1: HOÀN TOÀN MIỄN PHÍ (Khuyến nghị)

**💰 Chi phí: $0/tháng**

Deploy trên **Render.com** với **Free TURN server**.

### 📄 File hướng dẫn:

1. **[DEPLOY_QUICK.md](./DEPLOY_QUICK.md)** ⚡ - Deploy trong 15 phút (3 bước đơn giản)
2. **[DEPLOYMENT_RENDER_FREE.md](./DEPLOYMENT_RENDER_FREE.md)** ⭐ - Hướng dẫn chi tiết đầy đủ
3. **[DEPLOYMENT_CHECKLIST_FREE.md](./DEPLOYMENT_CHECKLIST_FREE.md)** - Checklist theo dõi

### ⚙️ File config:

4. **[render.yaml](./render.yaml)** - Config deploy 2 services (frontend + backend) cùng lúc
5. **[frontend/.env.production.example](./frontend/.env.production.example)** - Template với free TURN

### 🚀 Bắt đầu từ đây:

```bash
# Đọc file này trước (chỉ 3 bước!)
cat DEPLOY_QUICK.md

# Hoặc muốn chi tiết:
cat DEPLOYMENT_RENDER_FREE.md
```

---

## 🏢 Phương án 2: CÓ VPS (TURN riêng)

---

## 📄 File Documentation

### 1. **DEPLOYMENT.md** ⭐ (Quan trọng nhất)
Hướng dẫn chi tiết từng bước để deploy:
- Bước 1: Setup TURN Server trên VPS
- Bước 2: Deploy Signaling Server lên Render
- Bước 3: Deploy Frontend lên Vercel
- Bước 4-6: Testing, tối ưu, monitoring

👉 **Đọc file này đầu tiên!**

### 2. **DEPLOYMENT_CHECKLIST.md**
Checklist để tick từng bước khi deploy:
- [ ] TURN Server setup
- [ ] Signaling Server deploy
- [ ] Frontend deploy
- [ ] Testing các scenarios

👉 **In ra hoặc mở song song khi thực hiện deploy**

### 3. **QUICK_START.md**
Quick reference cho các lệnh deploy:
- One-liner scripts
- Useful commands
- Cost summary
- Post-deployment tasks

👉 **Tham khảo nhanh khi cần**

---

## ⚙️ File Configuration

### 4. **render.yaml**
Config tự động cho Render deployment:
- Service type: Web
- Runtime: Node.js
- Build/start commands
- Environment variables

👉 Render sẽ tự động detect file này khi deploy

### 5. **frontend/vercel.json**
Config cho Vercel deployment:
- Framework: Vite
- Build command
- Environment variables schema

👉 Vercel sẽ tự động detect file này

### 6. **frontend/.env.production.example**
Template cho production environment variables:
- Copy thành `.env.production`
- Điền thông tin TURN/Signaling URLs
- Chứa ví dụ rõ ràng

👉 **QUAN TRỌNG**: File này chứa tất cả env vars cần thiết

### 7. **frontend/.env.example** (đã có sẵn)
Template cho local development

### 8. **turn/setup.sh** ⭐
Script tự động cài TURN server:
- Cài Docker
- Setup turnserver
- Config firewall
- Start container

👉 Chạy trên VPS: `bash setup.sh`

### 9. **frontend/.gitignore** (đã cập nhật)
Đảm bảo không commit:
- `.env.production` (chứa credentials)
- `dist/` build files
- `.vercel/` config

---

## 🚀 Flow Deploy (Tóm tắt)

```
┌─────────────────────────────────────────────────────────────┐
│                     DEPLOYMENT FLOW                         │
└─────────────────────────────────────────────────────────────┘

1️⃣  Setup TURN Server (VPS)
    ├─ SSH vào VPS
    ├─ Chạy: bash turn/setup.sh
    ├─ Lấy IP và credentials
    └─ Test với Trickle ICE
    
    ✅ Output: TURN_IP, USERNAME, PASSWORD

2️⃣  Deploy Signaling Server (Render)
    ├─ Push code lên GitHub
    ├─ Import repo vào Render
    ├─ Render auto-detect render.yaml
    └─ Deploy
    
    ✅ Output: wss://YOUR-APP.onrender.com

3️⃣  Cấu hình Frontend .env.production
    ├─ Copy .env.production.example → .env.production
    ├─ Điền SIGNALING_URL từ bước 2
    ├─ Điền TURN info từ bước 1
    └─ Commit & push (KHÔNG commit .env.production)
    
    ✅ File: .env.production (local only)

4️⃣  Deploy Frontend (Vercel)
    ├─ Import repo vào Vercel
    ├─ Root Directory: frontend
    ├─ Add Environment Variables (copy từ .env.production)
    └─ Deploy
    
    ✅ Output: https://YOUR-APP.vercel.app

5️⃣  Testing Complete Flow
    ├─ Test P2P (cùng mạng)
    ├─ Test TURN (khác mạng) ⭐
    └─ Check Stats Panel cho candidate type
    
    ✅ Candidate type = "relay" khi qua TURN
```

---

## 📋 Checklist nhanh

Trước khi deploy, đảm bảo:

- [ ] Đã đọc **DEPLOYMENT.md**
- [ ] Đã có tài khoản: GitHub, Render, Vercel
- [ ] Đã có VPS với IP public (cho TURN)
- [ ] Đã clone repo về local
- [ ] Đã test local thành công

---

## 💡 Tips

### Thứ tự deploy quan trọng!

```
TURN Server → Signaling Server → Frontend
     ↓              ↓                ↓
   Lấy IP     Lấy WSS URL      Dùng cả 2 URLs
```

**LÝ DO:** Frontend cần URLs của cả TURN và Signaling để build.

### Environment Variables

**KHÔNG BAO GIỜ commit:**
- `.env.production` (chứa password thật)
- `.env` (local)

**CÓ THỂ commit:**
- `.env.example` (chỉ template)
- `.env.production.example` (chỉ template)

### Free Tier Limitations

**Render Free:**
- Sleep sau 15 phút không dùng
- Lần đầu kết nối chậm 30-60s
- ⚠️ Không phù hợp production thực sự

**Giải pháp:**
- Upgrade lên Starter ($7/tháng)
- Hoặc cron job ping mỗi 10 phút

---

## 🔗 Links hữu ích

### Test Tools
- **Trickle ICE Test**: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
  → Test TURN server có hoạt động không

### Hosting Platforms
- **Render**: https://render.com (Signaling Server)
- **Vercel**: https://vercel.com (Frontend)
- **DigitalOcean**: https://digitalocean.com (VPS cho TURN)
- **Vultr**: https://vultr.com (Alternative VPS)

### Monitoring
- **UptimeRobot**: https://uptimerobot.com (Free uptime monitoring)
- **Vercel Analytics**: Built-in với Vercel

---

## 🆘 Cần trợ giúp?

### Nếu gặp lỗi:

1. **TURN không hoạt động**
   - Xem [DEPLOYMENT.md](./DEPLOYMENT.md) → Bước 1.8 (Test TURN)
   - Check firewall: `sudo ufw status`
   - Check logs: `docker logs webrtc-turn-server`

2. **Signaling không kết nối**
   - Đợi 30-60s (Render wake up)
   - Check Render logs trong dashboard
   - Đảm bảo dùng `wss://` không phải `ws://`

3. **Frontend build failed**
   - Check Environment Variables trên Vercel
   - Đảm bảo tất cả biến `VITE_*` đều có
   - Test build local: `npm run build`

4. **Video không kết nối**
   - Mở Console (F12) xem logs
   - Check Stats Panel → Candidate type
   - Nếu không có `relay` → TURN chưa hoạt động

---

## 📞 Support

Các file documentation đầy đủ:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Chi tiết từng bước
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Checklist theo dõi
- [QUICK_START.md](./QUICK_START.md) - Commands tham khảo nhanh
- [README.md](./README.md) - Overview dự án

---

## ✅ Ready to Deploy!

Bây giờ bạn đã có đầy đủ:
- ✅ Documentation chi tiết
- ✅ Configuration files
- ✅ Automated scripts
- ✅ Examples và templates

**Bắt đầu từ [DEPLOYMENT.md](./DEPLOYMENT.md) → Bước 1!**

---

*Chúc bạn deploy thành công! 🚀*
