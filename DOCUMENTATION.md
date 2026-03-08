# WebRTC Video Call Application — Tài Liệu Hướng Dẫn & Giải Thích Chi Tiết

## Mục Lục

1. [Tổng Quan Dự Án](#1-tổng-quan-dự-án)
2. [Kiến Trúc Hệ Thống](#2-kiến-trúc-hệ-thống)
3. [Cách Cài Đặt & Chạy](#3-cách-cài-đặt--chạy)
4. [Backend — Signaling Server](#4-backend--signaling-server)
5. [Frontend — React Application](#5-frontend--react-application)
6. [Services (Lõi Logic)](#6-services-lõi-logic)
7. [Components (Giao Diện)](#7-components-giao-diện)
8. [Context (Quản Lý State)](#8-context-quản-lý-state)
9. [Luồng Hoạt Động (Flow)](#9-luồng-hoạt-động-flow)
10. [TURN Server](#10-turn-server)
11. [Đánh Giá Độ Ổn Định](#11-đánh-giá-độ-ổn-định)
12. [Cấu Hình Biến Môi Trường](#12-cấu-hình-biến-môi-trường)

---

## 1. Tổng Quan Dự Án

Đây là ứng dụng **video call nhóm** sử dụng công nghệ **WebRTC** với kiến trúc **Mesh Topology** (mỗi peer kết nối trực tiếp với tất cả peer khác).

### Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Frontend | React 18, Vite 5, Tailwind CSS 3 |
| Backend (Signaling) | Node.js, Express, WebSocket (`ws`) |
| Giao thức | WebRTC, WebSocket, STUN/TURN (ICE) |
| Icons | Lucide React |
| ID generation | UUID v4 |

### Tính năng chính

- Tạo/Tham gia phòng họp bằng Room ID
- Video call nhóm (mesh topology)
- Bật/tắt camera, micro
- Hiển thị trạng thái kết nối real-time
- Thống kê cuộc gọi (bitrate, codec, resolution, packet loss...)
- Hỗ trợ STUN/TURN server (tự động fallback)
- Danh sách phòng đang hoạt động (REST API)
- Auto-reconnect khi mất kết nối WebSocket
- Debug panel (Ctrl+Shift+D)
- Responsive UI

---

## 2. Kiến Trúc Hệ Thống

```
┌──────────────────────────────────────────────────────────────┐
│                        Clients (Browsers)                     │
│                                                               │
│   ┌─────────┐     ┌─────────┐     ┌─────────┐               │
│   │ Client A │◄───►│ Client B │◄───►│ Client C │  ← WebRTC   │
│   │ (React)  │     │ (React)  │     │ (React)  │    P2P      │
│   └────┬─────┘     └────┬─────┘     └────┬─────┘             │
│        │                │                │                    │
│        └────────┬───────┴───────┬────────┘                    │
│                 │               │                             │
│            WebSocket       WebSocket                          │
│                 │               │                             │
│         ┌───────▼───────────────▼────────┐                    │
│         │     Signaling Server           │                    │
│         │  (Node.js + Express + WS)      │                    │
│         │  - Quản lý phòng               │                    │
│         │  - Chuyển tiếp SDP/ICE         │                    │
│         │  - REST API                    │                    │
│         └────────────────────────────────┘                    │
│                                                               │
│         ┌────────────────────────────────┐                    │
│         │     STUN/TURN Server           │                    │
│         │  - NAT traversal               │                    │
│         │  - Relay khi P2P thất bại      │                    │
│         └────────────────────────────────┘                    │
└──────────────────────────────────────────────────────────────┘
```

**Mesh Topology**: Mỗi participant kết nối trực tiếp P2P với tất cả participant khác. Phù hợp cho nhóm nhỏ (2-6 người). Server chỉ đóng vai trò **signaling** (trao đổi SDP offer/answer và ICE candidates), KHÔNG relay media.

---

## 3. Cách Cài Đặt & Chạy

### Yêu cầu
- Node.js >= 16
- npm hoặc yarn

### Cài đặt

```bash
# Clone project
git clone <repo-url>
cd Web-RTC

# Cài đặt dependencies cho server
cd server
npm install

# Cài đặt dependencies cho frontend
cd ../frontend
npm install
```

### Chạy Development

```bash
# Terminal 1 — Chạy Signaling Server
cd server
npm run dev          # Chạy với nodemon (auto-restart), port 3001

# Terminal 2 — Chạy Frontend
cd frontend
npm run dev          # Chạy Vite dev server, port 5173
```

### Chạy Production

```bash
# Build frontend
cd frontend
npm run build

# Chạy production server
cd ../server
npm start

# Chạy frontend static
cd ../frontend
npm start            # Serve dist/ trên port $PORT hoặc 4173
```

### Truy cập
- Frontend: `http://localhost:5173`
- Server health check: `http://localhost:3001/health`
- Danh sách phòng: `http://localhost:3001/api/rooms`

---

## 4. Backend — Signaling Server

### File: `server/server.js` (528 dòng)

Server làm nhiệm vụ **signaling** — trung gian trao đổi thông tin kết nối giữa các peer. Server KHÔNG xử lý media (audio/video).

### Cấu trúc dữ liệu

```javascript
clients: Map<clientId, { ws, name, roomId }>     // Quản lý tất cả clients đang kết nối
rooms: Map<roomId, { id, members, callActive }>   // Quản lý tất cả rooms
```

### Các hàm chính

| Hàm | Chức năng |
|---|---|
| `generateClientId()` | Tạo UUID v4 duy nhất cho mỗi client kết nối |
| `broadcast(roomId, message, excludeClientId)` | Gửi message đến tất cả members trong room (trừ sender) |
| `sendToClient(clientId, message)` | Gửi message đến 1 client cụ thể |
| `getRoomMembers(roomId)` | Lấy danh sách members của room (id, name, isHost) |
| `cleanupClient(clientId)` | Dọn dẹp khi client disconnect: xóa khỏi room, thông báo members, xóa room nếu trống |
| `handleMessage(clientId, message)` | Router chính — phân loại message type và gọi handler tương ứng |

### Các handler xử lý message

| Handler | Message Type | Chức năng |
|---|---|---|
| `handleRegister` | `register` | Đăng ký tên người dùng cho client |
| `handleCreateRoom` | `createRoom` | Tạo room mới, client trở thành host |
| `handleJoinRoom` | `joinRoom` | Tham gia room có sẵn, thông báo cho members hiện tại |
| `handleLeaveRoom` | `leaveRoom` | Rời room, cập nhật danh sách members, xóa room nếu trống |
| `handleStartCall` | `startCall` | Đánh dấu `callActive = true`, broadcast thông báo |
| `handleOffer` | `offer` | Chuyển tiếp SDP Offer từ sender đến target peer |
| `handleAnswer` | `answer` | Chuyển tiếp SDP Answer từ sender đến target peer |
| `handleCandidate` | `candidate` | Chuyển tiếp ICE Candidate từ sender đến target peer |
| `handleEndCall` | `endCall` | Đánh dấu `callActive = false`, broadcast thông báo kết thúc |

### REST API Endpoints

| Endpoint | Method | Chức năng |
|---|---|---|
| `/health` | GET | Health check — trả về uptime, số room, số client |
| `/api/rooms` | GET | Danh sách tất cả rooms (id, memberCount, callActive, createdAt) |
| `/api/rooms/:roomId` | GET | Thông tin chi tiết 1 room cụ thể |

### Signaling Protocol (Giao thức tín hiệu)

```
Client → Server:
  register    → { type: 'register', name }
  createRoom  → { type: 'createRoom', roomId, name }
  joinRoom    → { type: 'joinRoom', roomId, name }
  leaveRoom   → { type: 'leaveRoom', roomId, sender }
  startCall   → { type: 'startCall', roomId, sender }
  offer       → { type: 'offer', roomId, sender, target, offer }
  answer      → { type: 'answer', roomId, sender, target, answer }
  candidate   → { type: 'candidate', roomId, sender, target, candidate }
  endCall     → { type: 'endCall', roomId, sender }

Server → Client:
  connected     → { type: 'connected', clientId }
  registered    → { type: 'registered', name, clientId }
  roomCreated   → { type: 'roomCreated', roomId, isHost, members }
  roomJoined    → { type: 'roomJoined', roomId, isHost, members, callActive }
  roomMembers   → { type: 'roomMembers', roomId, members }
  memberJoined  → { type: 'memberJoined', roomId, member }
  memberLeft    → { type: 'memberLeft', roomId, name, memberId }
  leftRoom      → { type: 'leftRoom', roomId }
  callStarted   → { type: 'callStarted', roomId, initiator, initiatorName }
  callEnded     → { type: 'callEnded', roomId, endedBy, endedByName }
  offer/answer/candidate → forward nguyên vẹn đến target
  error         → { type: 'error', message }
```

---

## 5. Frontend — React Application

### Cấu trúc thư mục

```
frontend/src/
├── App.jsx              # Component gốc, routing theo state
├── main.jsx             # Entry point, render App
├── index.css            # Tailwind CSS imports
├── components/          # Tất cả UI components
├── context/             # React Context (state management)
├── data/                # Constants, mock data, utilities
└── services/            # WebRTC, Signaling, Config
```

### App States (Trạng thái ứng dụng)

Ứng dụng sử dụng state-based routing (không dùng React Router):

```
IDLE ──► IN_ROOM ──► CALLING ──► ENDED ──► IN_ROOM/IDLE
 │          │
 │          ◄── leaveRoom ──► IDLE
 │
 ◄── Luôn có thể quay lại
```

| State | Màn hình | Mô tả |
|---|---|---|
| `IDLE` | JoinRoomScreen | Nhập nickname, tạo/tham gia phòng |
| `IN_ROOM` | RoomLobbyScreen | Phòng chờ, xem members, bắt đầu call |
| `CALLING` | VideoCallScreen | Đang trong cuộc gọi video |
| `ENDED` | CallEndedScreen | Cuộc gọi kết thúc (hiển thị 2s rồi về IN_ROOM) |

---

## 6. Services (Lõi Logic)

### 6.1. `services/config.js` — Cấu Hình

Tập trung **tất cả cấu hình** của ứng dụng, đọc từ biến môi trường Vite (`VITE_*`).

| Config | Mặc định | Mô tả |
|---|---|---|
| `SIGNALING_URL` | `ws://localhost:3001` | URL WebSocket server |
| `P2P_TIMEOUT_MS` | `10000` | Timeout trước khi cảnh báo cần TURN |
| `iceServers` | Google STUN + localhost TURN | Danh sách STUN/TURN servers |
| `STATS_INTERVAL_MS` | `2000` | Chu kỳ thu thập stats (ms) |
| `MAX_RECONNECT_ATTEMPTS` | `5` | Số lần thử reconnect tối đa |
| `RECONNECT_DELAY_MS` | `2000` | Delay giữa các lần reconnect |

### 6.2. `services/signaling.js` — SignalingService (319 dòng)

Quản lý kết nối WebSocket đến signaling server. Singleton pattern.

| Phương thức | Chức năng |
|---|---|
| `connect()` | Kết nối WebSocket, trả về Promise resolve khi nhận `connected` message |
| `disconnect()` | Đóng kết nối WebSocket (code 1000) |
| `send(message)` | Gửi message JSON, nếu chưa connect thì queue vào pending |
| `flushPendingMessages()` | Gửi tất cả messages đang đợi khi kết nối lại |
| `attemptReconnect()` | Tự động reconnect với delay tăng dần (delay × attempt) |
| `on(type, handler)` | Đăng ký handler cho message type cụ thể |
| `off(type, handler)` | Hủy đăng ký handler |
| `handleMessage(message)` | Phân phối message đến các handlers đã đăng ký |
| `register(name)` | Gửi message đăng ký tên |
| `createRoom(roomId, name)` | Gửi message tạo phòng |
| `joinRoom(roomId, name)` | Gửi message tham gia phòng |
| `leaveRoom(roomId)` | Gửi message rời phòng |
| `startCall(roomId)` | Gửi message bắt đầu cuộc gọi |
| `sendOffer(roomId, target, offer)` | Gửi SDP Offer đến target peer |
| `sendAnswer(roomId, target, answer)` | Gửi SDP Answer đến target peer |
| `sendCandidate(roomId, target, candidate)` | Gửi ICE Candidate đến target peer |
| `endCall(roomId)` | Gửi message kết thúc cuộc gọi |
| `getClientId()` | Lấy client ID được server cấp |
| `isReady()` | Kiểm tra WebSocket đã sẵn sàng chưa |

### 6.3. `services/webrtc.js` — WebRTCService (603 dòng)

Quản lý tất cả peer connections WebRTC. Singleton pattern.

| Phương thức | Chức năng |
|---|---|
| **Media** | |
| `getLocalStream(constraints)` | Lấy camera/mic stream từ trình duyệt (`getUserMedia`) |
| `stopLocalStream()` | Dừng tất cả tracks của local stream |
| `toggleAudio(enabled)` | Bật/tắt audio track |
| `toggleVideo(enabled)` | Bật/tắt video track |
| **Peer Connections** | |
| `createPeerConnection(peerId, peerName)` | Tạo `RTCPeerConnection` mới, add local tracks, thiết lập event handlers (`ontrack`, `onconnectionstatechange`, `oniceconnectionstatechange`) |
| `createOffer(peerId)` | Tạo SDP Offer và set LocalDescription |
| `handleOffer(peerId, peerName, offer)` | Nhận SDP Offer, tạo peer connection nếu chưa có, set RemoteDescription |
| `createAnswer(peerId)` | Tạo SDP Answer và set LocalDescription |
| `handleAnswer(peerId, answer)` | Nhận SDP Answer, set RemoteDescription |
| `handleCandidate(peerId, candidate)` | Thêm ICE Candidate nhận được vào peer connection |
| `onIceCandidate(peerId, callback)` | Đăng ký callback khi có ICE Candidate mới |
| `closePeerConnection(peerId)` | Đóng 1 peer connection cụ thể |
| `closeAllConnections()` | Đóng tất cả peer connections |
| **TURN Fallback** | |
| `startP2PTimeout(peerId, peerName)` | Bắt đầu timer, nếu sau `P2P_TIMEOUT_MS` vẫn chưa connected → cảnh báo cần TURN |
| `clearP2PTimeout(peerId)` | Hủy timer khi đã connected thành công |
| `checkCandidateType(peerId, peerName, pc)` | Kiểm tra loại ICE candidate đang dùng (host/srflx/relay) |
| **Thống kê** | |
| `startStatsCollection(interval)` | Bắt đầu thu thập stats định kỳ từ tất cả connections |
| `stopStatsCollection()` | Dừng thu thập stats |
| `getDetailedStats(pc)` | Lấy stats chi tiết: bytes, packets, jitter, RTT, resolution, codec, candidate type |
| `getCallDuration()` | Tính thời lượng cuộc gọi |
| `getAllStats()` | Lấy stats tổng hợp tất cả connections |
| `getConnectionCount()` | Số lượng peer connections hiện tại |
| `areAllConnectionsStable()` | Kiểm tra tất cả connections đã ổn định chưa |

#### Callbacks của WebRTCService

| Callback | Khi nào được gọi |
|---|---|
| `onRemoteStream(peerId, peerName, stream)` | Nhận được remote media stream |
| `onRemoteStreamRemoved(peerId, peerName)` | Remote stream bị mất |
| `onConnectionStateChange(peerId, peerName, state)` | Trạng thái connection thay đổi |
| `onIceStateChange(peerId, peerName, state)` | Trạng thái ICE thay đổi |
| `onStatsUpdate(peerId, stats)` | Stats được cập nhật |
| `onTurnFallback(peerId, peerName)` | Timeout P2P, có thể cần TURN relay |

---

## 7. Components (Giao Diện)

### 7.1. `JoinRoomScreen` — Màn hình chính (Landing page)

- Nhập **nickname** (tối thiểu 2 ký tự)
- **Tạo phòng mới**: Chỉ cần nickname → tạo room với ID ngẫu nhiên
- **Tham gia phòng**: Nhập nickname + Room ID → join room có sẵn
- **Browse Active Rooms**: Mở RoomListScreen
- Validate input, hiển thị lỗi inline

### 7.2. `RoomListScreen` — Danh sách phòng

- Gọi REST API `GET /api/rooms` để lấy danh sách phòng đang hoạt động
- Auto-refresh mỗi 5 giây (có thể bật/tắt)
- Tìm kiếm phòng theo Room ID
- Hiển thị: Room ID, số members, trạng thái call, thời gian tạo
- Click để tham gia phòng

### 7.3. `RoomLobbyScreen` — Phòng chờ

- Hiển thị Room ID với nút **Copy** (clipboard API)
- Danh sách members online (hiện tên, badge Host/You)
- Nút **Start Group Call** (yêu cầu ≥ 2 members)
- Nút **Leave Room** để rời phòng
- Hiển thị trạng thái "Waiting for participants" khi chỉ có 1 người

### 7.4. `VideoCallScreen` — Màn hình cuộc gọi

- Layout chính: Header (Room ID, ConnectionStatus, timer) + VideoGrid + ControlBar
- Tích hợp StatsPanel và SettingsPanel (slide-in panels)
- Backdrop overlay khi panel mở
- Hiển thị Toast notifications

### 7.5. `VideoGrid` — Lưới video

- Responsive grid layout tùy theo số participants:
  - 1 người: 1 cột (full width)
  - 2 người: 2 cột
  - 3-4 người: 2 cột
  - 5-6 người: 3 cột
  - 7+ người: 3-4 cột
- Render `VideoTile` cho mỗi participant

### 7.6. `VideoTile` — Ô video từng người

- Gắn `MediaStream` vào `<video>` element qua `useEffect`
- Local video: mirror ngang (`scale-x-[-1]`), mute (chống echo)
- Camera off: hiển thị avatar/icon thay thế
- Hiển thị tên, trạng thái mic/camera, connection status dot
- Spinner overlay khi đang connecting
- Host có thể xóa remote participant

### 7.7. `ControlBar` — Thanh điều khiển

- **Mic toggle**: Bật/tắt micro (đỏ khi tắt)
- **Camera toggle**: Bật/tắt camera (đỏ khi tắt)
- **End call**: Kết thúc cuộc gọi (đỏ)
- **Stats**: Mở/đóng bảng thống kê
- **Settings**: Mở/đóng bảng cài đặt
- Hiển thị số participants

### 7.8. `ConnectionStatus` — Badge trạng thái

- Hiển thị dot màu + text tương ứng trạng thái:
  - 🟢 Connected | 🟡 Connecting | 🔴 Failed/Disconnected | ⚪ New
- Pulse animation khi đang connecting
- Hiển thị ICE state (tùy chọn)
- Hiển thị badge TURN khi sử dụng relay

### 7.9. `StatsPanel` — Bảng thống kê cuộc gọi

- Slide-in panel bên phải
- Hiển thị real-time:
  - Thời gian bắt đầu, thời lượng
  - Connection state, ICE state
  - Candidate type (host/srflx/relay)
  - Local/Remote candidate info (IP, port, protocol)
  - Bytes/Packets sent/received
  - Packet loss, Jitter, Round-trip time
  - Available bitrate (outgoing/incoming)
  - Video resolution, frame rate
  - Audio/Video codec

### 7.10. `SettingsPanel` — Bảng cài đặt ICE/TURN

- Cấu hình STUN URL, TURN URLs (UDP/TCP/TLS)
- Cấu hình TURN credentials (username/password)
- ICE Transport Policy (all/relay)
- **Test Connection**: Tạo RTCPeerConnection tạm, gather ICE candidates, báo cáo loại candidates tìm được (host/srflx/relay)

### 7.11. `CallEndedScreen` — Màn hình kết thúc

- Hiển thị tóm tắt cuộc gọi (mock data)
- Nút quay lại trang chủ

### 7.12. `DebugPanel` — Panel debug

- Ẩn mặc định, bật bằng **Ctrl+Shift+D**
- Hiển thị cấu hình hiện tại: Signaling URL, ICE servers, P2P timeout
- Log config ra console

### 7.13. `Toast` — Thông báo

- Floating notification ở góc trên phải
- 4 loại: info (xanh), success (xanh lá), warning (vàng), error (đỏ)
- Animation slide-up, auto-dismiss

---

## 8. Context (Quản Lý State)

### `context/AppContext.jsx` (657 dòng)

Đây là **trung tâm quản lý state** của toàn bộ ứng dụng, sử dụng React Context + Hooks.

#### State được quản lý

| State | Kiểu | Mô tả |
|---|---|---|
| `appState` | string | Trạng thái ứng dụng (IDLE/IN_ROOM/CALLING/ENDED) |
| `currentUser` | object | Thông tin user hiện tại {id, name, isMuted, isCameraOff} |
| `isHost` | boolean | User có phải host không |
| `roomId` | string | ID phòng hiện tại |
| `roomMembers` | array | Danh sách members trong phòng |
| `participants` | array | Danh sách participants đang trong cuộc gọi (có stream) |
| `localStream` | MediaStream | Stream camera/mic local |
| `connectionState` | string | Trạng thái connection tổng hợp |
| `iceState` | string | Trạng thái ICE tổng hợp |
| `callStats` | object | Thống kê cuộc gọi real-time |
| `callDuration` | string | Thời lượng cuộc gọi (HH:MM:SS) |
| `signalingConnected` | boolean | Trạng thái kết nối signaling server |
| `notification` | object | Thông báo hiện tại {type, message} |

#### Actions (Hàm hành động)

| Hàm | Chức năng |
|---|---|
| `createRoom(nickname)` | Đăng ký tên → Tạo room mới với ID ngẫu nhiên |
| `joinRoom(nickname, roomId)` | Đăng ký tên → Tham gia room có sẵn |
| `leaveRoom()` | Rời room, cleanup call, reset state về IDLE |
| `startGroupCall()` | Lấy local stream → Thêm local participant → Notify server → Tạo peer connections đến tất cả members khác → Gửi offers |
| `endCall()` | Notify server → Log stats → Cleanup call → Hiển thị ENDED → Quay về IN_ROOM |
| `toggleMic()` | Bật/tắt mic, cập nhật local participant |
| `toggleCamera()` | Bật/tắt camera, cập nhật local participant |
| `getAggregatedStats()` | Tổng hợp stats từ tất cả peer connections |

#### Signaling Event Handlers (trong useEffect)

| Event | Xử lý |
|---|---|
| `connected` | Cập nhật clientId cho currentUser |
| `roomCreated` | Set roomId, isHost=true, members, chuyển IN_ROOM |
| `roomJoined` | Set roomId, isHost=false, members, chuyển IN_ROOM |
| `roomMembers` | Cập nhật danh sách members |
| `memberJoined` | Hiển thị notification |
| `memberLeft` | Đóng peer connection, xóa participant, notification |
| `leftRoom` | Chuyển về IDLE |
| `callStarted` | Notification cho non-initiator |
| `offer` | Gọi `handleReceiveOffer()` — lấy local stream, handle offer, tạo answer, gửi answer |
| `answer` | Gọi `webRTCService.handleAnswer()` |
| `candidate` | Gọi `webRTCService.handleCandidate()` |
| `callEnded` | Cleanup call, notification, chuyển IN_ROOM |
| `error` | Hiển thị error notification |

---

## 9. Luồng Hoạt Động (Flow)

### Flow 1: Tạo phòng và bắt đầu cuộc gọi

```
User A nhập nickname → Click "Create Room"
  → register(name) → server lưu tên
  → createRoom(roomId, name) → server tạo room
  → server gửi roomCreated → UI chuyển sang RoomLobbyScreen
  
User B nhập nickname + Room ID → Click "Join Room"
  → register(name) → server lưu tên  
  → joinRoom(roomId, name) → server thêm B vào room
  → server gửi roomJoined cho B → B thấy RoomLobbyScreen
  → server gửi memberJoined cho A → A thấy B trong member list

User A click "Start Group Call"
  → getLocalStream() → lấy camera/mic
  → startCall(roomId) → server broadcast callStarted
  → Với mỗi member khác (B):
      → createPeerConnection(B.id, B.name) → tạo RTCPeerConnection
      → createOffer() → tạo SDP Offer
      → sendOffer(roomId, B.id, offer) → gửi qua signaling
  
User B nhận offer:
  → getLocalStream() → lấy camera/mic (nếu chưa có)
  → handleOffer(A.id, offer) → set RemoteDescription
  → createAnswer() → tạo SDP Answer
  → sendAnswer(roomId, A.id, answer) → gửi qua signaling

ICE Candidates trao đổi qua signaling server
  → Khi ICE connected → P2P media stream bắt đầu chảy
  → ontrack event → remote video hiển thị
```

### Flow 2: WebRTC Connection Establishment

```
1. createPeerConnection()
   → new RTCPeerConnection({ iceServers })
   → addTrack() — thêm local audio/video tracks

2. createOffer() / createAnswer()
   → SDP trao đổi qua signaling server
   → setLocalDescription() / setRemoteDescription()

3. ICE Candidate Gathering
   → onicecandidate → gửi candidate qua signaling
   → handleCandidate() → addIceCandidate() ở phía nhận

4. Connection States:
   new → checking → connected ✓
   new → checking → failed ✗ (cần TURN)
   
5. Nếu P2P thất bại → TURN relay
   → startP2PTimeout() cảnh báo sau 10s
   → Nếu có TURN server → kết nối qua relay
   → checkCandidateType() xác nhận loại kết nối
```

---

## 10. TURN Server

### Thư mục: `turn/`

Cấu hình TURN server sử dụng **coturn** qua Docker.

| File | Mô tả |
|---|---|
| `docker-compose.yml` | Docker Compose config để chạy coturn container |
| `turnserver.conf` | Cấu hình coturn (port, realm, credentials...) |
| `setup.sh` | Script tự động setup TURN server |

### Khi nào cần TURN?

- **Cùng mạng LAN**: Không cần (kết nối trực tiếp qua host candidate)
- **Khác mạng, NAT đơn giản**: STUN đủ (srflx candidate)
- **NAT phức tạp/Symmetric NAT/Firewall**: **Cần TURN** (relay candidate)

### Cấu hình TURN qua biến môi trường

```env
VITE_TURN_UDP_URL=turn:your-server:3478?transport=udp
VITE_TURN_TCP_URL=turn:your-server:3478?transport=tcp
VITE_TURN_TLS_URL=turns:your-server:5349?transport=tcp
VITE_TURN_USERNAME=webrtc
VITE_TURN_PASSWORD=webrtc123
```

---

## 11. Đánh Giá Độ Ổn Định

### ✅ Điểm mạnh — Đã hoạt động tốt

1. **Kiến trúc rõ ràng**: Tách biệt signaling server, WebRTC service, signaling service, context, components. Dễ hiểu và bảo trì.

2. **Signaling protocol hoàn chỉnh**: Đầy đủ message types cho tạo/join/leave room, start/end call, trao đổi SDP/ICE.

3. **Xử lý lỗi cơ bản**: Có error handling ở WebSocket, peer connection, getUserMedia. Có reconnect tự động cho WebSocket.

4. **Quản lý state tốt**: Sử dụng React Context kết hợp refs để tránh stale closure. Cleanup đúng cách khi unmount.

5. **UI hoàn chỉnh**: Đầy đủ các màn hình, responsive, có stats panel, settings panel, notifications, debug panel.

6. **Cleanup khi disconnect**: Server tự động dọn dẹp khi client mất kết nối (xóa khỏi room, thông báo members, xóa room trống).

7. **Config tập trung**: Tất cả cấu hình qua biến môi trường, không hardcode.

8. **TURN fallback**: Có cơ chế phát hiện và cảnh báo khi P2P thất bại.

### ⚠️ Điểm cần lưu ý — Có thể gây vấn đề

1. **Mesh topology giới hạn scale**: Mỗi client phải duy trì N-1 peer connections. Với 6 người = mỗi người 5 connections → tốn bandwidth và CPU. **Khuyến nghị tối đa 4-6 người mỗi room**.

2. **Không có authentication**: Bất kỳ ai biết Room ID đều có thể tham gia. Phù hợp cho demo/internal, không nên dùng cho production công khai.

3. **Không persist data**: Rooms và clients lưu trong memory (Map). Server restart = mất tất cả rooms. Phù hợp cho ứng dụng real-time không cần lưu lịch sử.

4. **TURN mặc định trỏ localhost**: Nếu deploy lên server thật mà không cấu hình TURN đúng → client ở mạng khác nhau có thể không kết nối P2P được. **Cần cấu hình TURN server khi deploy**.

5. **Không có screen sharing**: Chỉ hỗ trợ camera + mic, chưa có chia sẻ màn hình.

6. **Không có chat text**: Chỉ có video/audio call, không có text chat trong room.

7. **`useState` dùng như `useEffect`**: Trong `App.jsx`, keyboard event listener được đăng ký trong `useState(() => {...})` thay vì `useEffect`. Điều này hoạt động nhưng không phải best practice — cleanup function sẽ không được gọi.

### 🟢 Kết luận

**Project CÓ THỂ chạy ổn định** trong các điều kiện sau:

| Điều kiện | Trạng thái |
|---|---|
| 2-4 người cùng mạng LAN | ✅ Ổn định, không cần TURN |
| 2-4 người khác mạng, NAT đơn giản | ✅ Ổn định với Google STUN |
| 2-4 người NAT phức tạp/firewall | ⚠️ Cần cấu hình TURN server |
| 5-6 người | ⚠️ Hoạt động nhưng có thể lag (mesh) |
| 7+ người | ❌ Không khuyến nghị (quá nhiều connections) |
| Deploy production | ⚠️ Cần cấu hình TURN, HTTPS, domain |

**Tóm lại**: Đây là một project WebRTC **hoàn chỉnh về chức năng cốt lõi**, code sạch, kiến trúc tốt. Phù hợp để demo, học tập, hoặc sử dụng nội bộ nhóm nhỏ. Để production-ready cần thêm: authentication, TURN server thật, HTTPS, và cân nhắc chuyển sang SFU (Selective Forwarding Unit) nếu cần scale lên nhiều người.

---

## 12. Cấu Hình Biến Môi Trường

### Frontend (`.env` trong thư mục `frontend/`)

```env
# Signaling server WebSocket URL
VITE_SIGNALING_URL=ws://localhost:3001

# STUN server
VITE_STUN_URL=stun:stun.l.google.com:19302

# TURN servers
VITE_TURN_UDP_URL=turn:your-turn-server:3478?transport=udp
VITE_TURN_TCP_URL=turn:your-turn-server:3478?transport=tcp
VITE_TURN_TLS_URL=turns:your-turn-server:5349?transport=tcp
VITE_TURN_USERNAME=webrtc
VITE_TURN_PASSWORD=webrtc123

# P2P timeout (ms)
VITE_P2P_TIMEOUT=10000
```

### Server

```env
# Server port
PORT=3001

# HTTPS mode
USE_HTTPS=false
CERT_PATH=./cert.pem
KEY_PATH=./key.pem
```
