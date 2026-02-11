# Quick Start Scripts for Deployment

## Deploy to Render (Signaling Server)

### Option 1: Deploy via Render Dashboard
1. Go to https://render.com/dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml` and configure everything
5. Click "Create Web Service"

### Option 2: Deploy via Render Blueprint
```bash
# Upload your repo to GitHub first
git remote add origin https://github.com/YOUR_USERNAME/Web-RTC.git
git push -u origin main

# Then connect via Render dashboard
```

---

## Deploy Frontend to Vercel

### Option 1: Vercel Dashboard (Recommended)
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure:
   - Root Directory: `frontend`
   - Framework Preset: `Vite`
   - Build: `npm run build`
   - Output: `dist`
4. Add Environment Variables (see below)
5. Click "Deploy"

### Option 2: Vercel CLI
```bash
# Install Vercel CLI globally
npm install -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel --prod

# Follow prompts to configure
```

### Required Environment Variables for Vercel:
```
VITE_SIGNALING_URL=wss://your-app.onrender.com
VITE_TURN_UDP_URL=turn:YOUR_VPS_IP:3478?transport=udp
VITE_TURN_TCP_URL=turn:YOUR_VPS_IP:3478?transport=tcp
VITE_TURN_TLS_URL=turns:YOUR_VPS_IP:5349?transport=tcp
VITE_TURN_USERNAME=your-username
VITE_TURN_PASSWORD=your-password
VITE_STUN_URL=stun:stun.l.google.com:19302
VITE_P2P_TIMEOUT=10000
```

---

## Setup TURN Server on VPS

### One-line setup script:
```bash
# SSH to your VPS first
ssh root@YOUR_VPS_IP

# Run this script
bash <(curl -s https://raw.githubusercontent.com/YOUR_REPO/main/turn/setup.sh)
```

### Manual setup:
```bash
# 1. Install Docker
curl -fsSL https://get.docker.com | sh
apt install docker-compose -y

# 2. Create directory
mkdir -p /opt/turn-server && cd /opt/turn-server

# 3. Download files
wget https://raw.githubusercontent.com/YOUR_REPO/main/turn/docker-compose.yml
wget https://raw.githubusercontent.com/YOUR_REPO/main/turn/turnserver.conf

# 4. Edit turnserver.conf with your IP
nano turnserver.conf
# Change: external-ip=YOUR_VPS_IP
# Change: user=YOUR_USERNAME:YOUR_PASSWORD

# 5. Configure firewall
ufw allow 22/tcp
ufw allow 3478/tcp
ufw allow 3478/udp
ufw allow 5349/tcp
ufw allow 49152:65535/udp
ufw enable

# 6. Start TURN server
docker-compose up -d

# 7. Check logs
docker logs webrtc-turn-server
```

---

## Test TURN Server

Open in browser: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/

Add your TURN server:
```
STUN/TURN URI: turn:YOUR_VPS_IP:3478
Username: your-username
Credential: your-password
```

Click "Gather candidates" → Should see green `relay` candidates ✅

---

## Complete Deployment Order

```
1. VPS (TURN Server)     → Get IP address (165.232.xxx.xxx)
   ↓
2. Render (Signaling)    → Get URL (wss://xyz.onrender.com)
   ↓
3. Update .env.production with IPs/URLs
   ↓
4. Vercel (Frontend)     → Deploy with env vars
   ↓
5. Test complete flow
```

---

## Useful Commands

### Check Render logs:
```bash
# Via dashboard: https://dashboard.render.com → Your Service → Logs
```

### Check Vercel deployment:
```bash
# Via CLI
vercel logs YOUR_DEPLOYMENT_URL

# Via dashboard: https://vercel.com/dashboard
```

### Check TURN server:
```bash
# SSH to VPS
ssh root@YOUR_VPS_IP

# View logs
docker logs -f webrtc-turn-server

# Restart if needed
docker-compose restart
```

### Monitor all services:
- Frontend: https://your-app.vercel.app
- Signaling: https://your-app.onrender.com (should return connection info)
- TURN: Use Trickle ICE tester

---

## Cost Summary

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Free | $0 |
| Render | Free (or Starter) | $0 (or $7/mo) |
| VPS for TURN | Basic | $5-6/mo |
| **Total** | | **$5-6/mo** |

**Note:** Render free tier sleeps after 15min inactivity. For production, use Starter plan ($7/mo).

---

## Post-Deployment

1. **Share your link:** `https://your-app.vercel.app`
2. **Monitor uptime:** Use UptimeRobot.com (free)
3. **Check analytics:** Vercel Analytics (free)
4. **Scale if needed:** See DEPLOYMENT.md for scaling guide

---

## Need Help?

- Full guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Checklist: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- Issues: Check logs on each platform
