# WebRTC Meet - Video Calling System with TURN Support

Hệ thống gọi video WebRTC hỗ trợ STUN/TURN và Group Call (Mesh Topology).

## 📋 Tính năng

### A. TURN / Kết nối qua Internet
- ✅ **A1**: Cấu hình ICE servers với STUN + TURN (UDP/TCP/TLS)
- ✅ **A2**: Tự động fallback - hiển thị thông báo khi P2P thất bại, sử dụng TURN relay
- ✅ **A3**: Báo cáo thống kê - hiển thị connectionState, iceConnectionState, candidate type

### B. Room & Group Call
- ✅ **B1**: Tạo/Tham gia phòng với nickname và roomId
- ✅ **B2**: Gọi nhóm (mesh topology) - mỗi client tạo n-1 peer connections
- ✅ **B3**: Quản lý trạng thái - Hangup, leaveRoom, dọn dẹp state

## 🏗️ Kiến trúc

```
┌─────────────────────────────────────────────────────────────────┐
│                          Architecture                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐       WebSocket        ┌───────────────────┐     │
│  │ Client 1 │◄─────────────────────►│                   │     │
│  └──────────┘                        │   Signaling       │     │
│       ▲                              │   Server          │     │
│       │ P2P/TURN                     │   (Node.js)       │     │
│       ▼                              │                   │     │
│  ┌──────────┐       WebSocket        │                   │     │
│  │ Client 2 │◄─────────────────────►│                   │     │
│  └──────────┘                        └───────────────────┘     │
│       ▲                                                         │
│       │ P2P/TURN                                               │
│       ▼                              ┌───────────────────┐     │
│  ┌──────────┐                        │   TURN Server     │     │
│  │ Client 3 │◄──────────────────────►│   (coturn)        │     │
│  └──────────┘       Relay            └───────────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 Cấu trúc thư mục

```
Web-RTC/
├── frontend/               # React + Vite frontend
│   ├── src/
│   │   ├── components/    # UI Components
│   │   ├── context/       # React Context (AppContext)
│   │   ├── services/      # WebRTC & Signaling services
│   │   │   ├── config.js  # Cấu hình ICE servers
│   │   │   ├── signaling.js # WebSocket signaling
│   │   │   └── webrtc.js  # WebRTC peer connections
│   │   └── data/          # Mock data & utilities
│   ├── .env               # Environment variables
│   └── package.json
├── server/                # Node.js Signaling Server
│   ├── server.js          # WebSocket signaling server
│   └── package.json
├── turn/                  # TURN Server (coturn)
│   ├── docker-compose.yml
│   ├── turnserver.conf
│   └── README.md
├── report.md              # Báo cáo thử nghiệm
└── README.md              # File này
```

## 🚀 Hướng dẫn cài đặt và chạy

### Yêu cầu
- Node.js >= 18
- Docker (cho TURN server)
- Trình duyệt hỗ trợ WebRTC (Chrome, Firefox, Edge)

### 1. Clone và cài đặt dependencies

```bash
# Frontend
cd frontend
npm install

# Server
cd ../server
npm install
```

### 2. Khởi động TURN Server (tùy chọn, cho test qua mạng)

```bash
cd turn
docker-compose up -d
```

### 3. Khởi động Signaling Server

```bash
cd server
npm run dev
# Server chạy tại ws://localhost:3001
```

### 4. Khởi động Frontend

```bash
cd frontend
npm run dev
# App chạy tại http://localhost:5173
```

### 5. Test

1. Mở 2 tab trình duyệt tại `http://localhost:5173`
2. Tab 1: Nhập tên, click "Create Room"
3. Tab 2: Nhập tên và Room ID từ Tab 1, click "Join Room"
4. Click "Start Call" để bắt đầu cuộc gọi nhóm

## 🔧 Cấu hình

### Environment Variables (Frontend)

```bash
# .env
VITE_SIGNALING_URL=ws://localhost:3001
VITE_P2P_TIMEOUT=10000
VITE_STUN_URL=stun:stun.l.google.com:19302
VITE_TURN_UDP_URL=turn:localhost:3478?transport=udp
VITE_TURN_TCP_URL=turn:localhost:3478?transport=tcp
VITE_TURN_TLS_URL=turns:localhost:5349?transport=tcp
VITE_TURN_USERNAME=webrtc
VITE_TURN_PASSWORD=webrtc123
```

### ICE Servers Configuration

Cấu hình ICE servers nằm trong `frontend/src/services/config.js`:

```javascript
iceServers: [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'turn:HOST:3478?transport=udp', username: 'user', credential: 'pass' },
  { urls: 'turn:HOST:3478?transport=tcp', username: 'user', credential: 'pass' },
  { urls: 'turns:HOST:5349?transport=tcp', username: 'user', credential: 'pass' }
]
```

## 📡 Signaling Protocol

| Message Type | Direction | Description |
|-------------|-----------|-------------|
| `register` | Client → Server | Đăng ký tên người dùng |
| `createRoom` | Client → Server | Tạo phòng mới |
| `joinRoom` | Client → Server | Tham gia phòng |
| `roomMembers` | Server → Client | Danh sách thành viên |
| `startCall` | Client → Server | Bắt đầu cuộc gọi |
| `offer` | Client → Server → Client | WebRTC offer SDP |
| `answer` | Client → Server → Client | WebRTC answer SDP |
| `candidate` | Client → Server → Client | ICE candidate |
| `leaveRoom` | Client → Server | Rời phòng |
| `memberLeft` | Server → Client | Thông báo người rời |
| `endCall` | Client → Server | Kết thúc cuộc gọi |

### Ví dụ Message

```json
// Register
{ "type": "register", "name": "Alice" }

// Create Room
{ "type": "createRoom", "roomId": "abc-def-ghi", "name": "Alice" }

// Offer
{ 
  "type": "offer", 
  "roomId": "abc-def-ghi", 
  "sender": "client-id-1", 
  "target": "client-id-2", 
  "offer": { "type": "offer", "sdp": "..." }
}

// Candidate
{
  "type": "candidate",
  "roomId": "abc-def-ghi",
  "sender": "client-id-1",
  "target": "client-id-2",
  "candidate": { "candidate": "...", "sdpMid": "0", "sdpMLineIndex": 0 }
}
```

## 📊 Thống kê WebRTC

Hệ thống thu thập và hiển thị các thống kê sau:

- **Connection State**: new/connecting/connected/disconnected/failed
- **ICE State**: new/checking/connected/completed/failed
- **Candidate Type**: host/srflx/relay
- **Traffic**: bytes/packets sent/received
- **Quality**: jitter, round-trip time, packet loss
- **Media**: video resolution, frame rate, codecs

Click biểu tượng "Statistics" trên thanh điều khiển để xem chi tiết.

## 🔐 TURN Server

### Sử dụng Coturn (Docker)

```bash
cd turn
docker-compose up -d

# Kiểm tra logs
docker logs webrtc-turn-server
```

### Credentials mặc định
- Username: `webrtc`
- Password: `webrtc123`

### Test TURN Server

Sử dụng [Trickle ICE](https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/):
1. Thêm TURN URL: `turn:YOUR_IP:3478`
2. Nhập username/password
3. Click "Gather candidates"
4. Kiểm tra có "relay" candidate không

## 🧪 Testing

### Test cùng LAN
1. 2 thiết bị cùng mạng WiFi
2. Truy cập qua IP local (ví dụ: `http://192.168.1.100:5173`)
3. Kỳ vọng: Kết nối P2P (host candidate)

### Test khác mạng (4G)
1. 1 thiết bị dùng WiFi, 1 thiết bị dùng 4G
2. Cần TURN server với public IP
3. Kỳ vọng: Kết nối qua TURN relay

Xem chi tiết kết quả test trong [report.md](./report.md)

## 🐛 Troubleshooting

### Không kết nối được camera/mic
- Kiểm tra permission trong trình duyệt
- Đảm bảo không có ứng dụng khác đang sử dụng

### Không thể kết nối P2P
- Kiểm tra firewall
- Thử sử dụng TURN server
- Xem console log để biết ICE state

### TURN không hoạt động
- Kiểm tra TURN server đang chạy
- Kiểm tra credentials đúng
- Kiểm tra firewall mở port 3478/5349

## 📝 License

MIT License
