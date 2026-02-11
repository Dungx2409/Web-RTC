# 📚 GIẢI THÍCH CHI TIẾT CODE THEO TỪNG CHỨC NĂNG

## 🎯 TỔNG QUAN LUỒNG HOẠT ĐỘNG

```
User mở app → Nhập nickname & roomId → Join/Create Room → 
→ WebSocket signaling → Start Group Call → 
→ Tạo RTCPeerConnections (mesh) → Send/Receive media streams →
→ Hiển thị video grid → Thống kê realtime → End call
```

---

## 📂 PHẦN 1: CẤU HÌNH VÀ CONSTANTS

### File: `frontend/src/services/config.js`

#### **Mục đích**: Quản lý tất cả cấu hình, không hardcode

```javascript
// Dòng 1-12: Helper function để đọc environment variables
const getEnvVar = (key, defaultValue) => {
  // Kiểm tra nếu import.meta.env tồn tại (Vite environment)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // Trả về giá trị từ .env hoặc default
    return import.meta.env[key] || defaultValue;
  }
  return defaultValue;
};
```

**Giải thích**: 
- Vite dùng `import.meta.env` để load biến môi trường từ file `.env`
- Nếu không có, dùng giá trị mặc định để dev local

```javascript
// Dòng 14-19: URL của signaling server
export const config = {
  SIGNALING_URL: getEnvVar('VITE_SIGNALING_URL', 'ws://localhost:3001'),
  // WebSocket URL - thay đổi khi deploy production
  
  P2P_TIMEOUT_MS: parseInt(getEnvVar('VITE_P2P_TIMEOUT', '10000')),
  // 10 giây - nếu P2P không kết nối được, báo user chuyển TURN
```

**Giải thích**:
- `SIGNALING_URL`: Địa chỉ server WebSocket để gửi signaling messages
- `P2P_TIMEOUT_MS`: Thời gian chờ trước khi thông báo cần TURN relay

```javascript
// Dòng 21-52: Danh sách ICE servers (STUN + TURN)
iceServers: [
  // STUN server - để phát hiện public IP của client
  {
    urls: getEnvVar('VITE_STUN_URL', 'stun:stun.l.google.com:19302')
  },
  // Backup STUN servers (nếu server chính fail)
  {
    urls: 'stun:stun1.l.google.com:19302'
  },
  {
    urls: 'stun:stun2.l.google.com:19302'
  },
  
  // TURN server UDP - relay traffic khi P2P fail
  {
    urls: getEnvVar('VITE_TURN_UDP_URL', 'turn:localhost:3478?transport=udp'),
    username: getEnvVar('VITE_TURN_USERNAME', 'webrtc'),
    credential: getEnvVar('VITE_TURN_PASSWORD', 'webrtc123')
  },
  
  // TURN server TCP - backup cho UDP
  {
    urls: getEnvVar('VITE_TURN_TCP_URL', 'turn:localhost:3478?transport=tcp'),
    username: getEnvVar('VITE_TURN_USERNAME', 'webrtc'),
    credential: getEnvVar('VITE_TURN_PASSWORD', 'webrtc123')
  },
  
  // TURN server TLS - encrypted relay
  {
    urls: getEnvVar('VITE_TURN_TLS_URL', 'turns:localhost:5349?transport=tcp'),
    username: getEnvVar('VITE_TURN_USERNAME', 'webrtc'),
    credential: getEnvVar('VITE_TURN_PASSWORD', 'webrtc123')
  }
],
```

**Giải thích ICE Servers**:
- **STUN**: Giúp client biết public IP của mình (để P2P)
- **TURN UDP**: Relay traffic qua server (khi P2P fail) - nhanh nhất
- **TURN TCP**: Backup cho UDP (khi UDP bị block)
- **TURN TLS**: Encrypted relay (an toàn nhất)

```javascript
// Dòng 54-66: Media constraints cho camera/microphone
mediaConstraints: {
  video: {
    width: { ideal: 1280 },      // Độ phân giải mong muốn
    height: { ideal: 720 },       // 720p HD
    frameRate: { ideal: 30 }      // 30 fps
  },
  audio: {
    echoCancellation: true,       // Triệt tiếng vọng
    noiseSuppression: true,       // Lọc nhiễu nền
    autoGainControl: true         // Tự động điều chỉnh âm lượng
  }
},
```

**Giải thích**:
- `ideal`: Trình duyệt cố gắng đạt, nhưng có thể thấp hơn nếu không đủ
- Audio filters giúp chất lượng cuộc gọi tốt hơn

```javascript
// Dòng 68-69: Tần suất thu thập statistics
STATS_INTERVAL_MS: 2000,  // Mỗi 2 giây lấy stats một lần
```

---

### File: `frontend/src/data/mockData.js`

#### **Mục đích**: Định nghĩa constants và helper functions

```javascript
// Dòng 1-10: Connection states của RTCPeerConnection
export const CONNECTION_STATES = {
  NEW: 'new',                    // Mới tạo, chưa connect
  CONNECTING: 'connecting',       // Đang kết nối
  CONNECTED: 'connected',         // Đã kết nối thành công
  DISCONNECTED: 'disconnected',   // Mất kết nối tạm thời
  FAILED: 'failed',              // Kết nối thất bại
  CLOSED: 'closed'               // Đã đóng connection
};
```

```javascript
// Dòng 13-21: ICE connection states
export const ICE_STATES = {
  NEW: 'new',                    // Chưa bắt đầu ICE
  CHECKING: 'checking',          // Đang thử các ICE candidates
  CONNECTED: 'connected',        // ICE đã kết nối
  COMPLETED: 'completed',        // ICE hoàn tất
  FAILED: 'failed',             // ICE thất bại
  DISCONNECTED: 'disconnected',  // ICE mất kết nối
  CLOSED: 'closed'              // ICE đóng
};
```

```javascript
// Dòng 24-29: App states cho state machine
export const APP_STATES = {
  IDLE: 'idle',         // Màn hình đầu - join/create room
  IN_ROOM: 'inRoom',    // Trong room lobby - chờ members
  CALLING: 'calling',   // Đang trong cuộc gọi
  ENDED: 'ended'        // Call đã kết thúc
};
```

**Giải thích State Machine**:
```
IDLE → (join/create) → IN_ROOM → (start call) → CALLING → (hangup) → ENDED → (rejoin) → IDLE
```

```javascript
// Dòng 32-36: Loại ICE candidates
export const CANDIDATE_TYPES = {
  HOST: 'host',      // Local IP (P2P trực tiếp)
  SRFLX: 'srflx',    // Public IP qua STUN (P2P qua NAT)
  RELAY: 'relay'     // TURN relay (qua server trung gian)
};
```

**Giải thích Candidate Types**:
- **host**: Cùng mạng LAN → nhanh nhất
- **srflx**: Khác mạng nhưng P2P được → nhanh
- **relay**: Phải qua TURN server → chậm nhất nhưng đảm bảo kết nối

---

## 📂 PHẦN 2: SIGNALING SERVER

### File: `server/server.js`

#### **Setup cơ bản (Dòng 1-60)**

```javascript
// Dòng 1-28: Import và khởi tạo
const express = require('express');        // HTTP server framework
const https = require('https');            // HTTPS module
const http = require('http');              // HTTP module
const WebSocket = require('ws');           // WebSocket library
const { v4: uuidv4 } = require('uuid');   // Generate unique IDs
const cors = require('cors');              // Cross-Origin Resource Sharing
const fs = require('fs');                  // File system

// Dòng 30-32: Configuration
const PORT = process.env.PORT || 3001;     // Server port
const USE_HTTPS = process.env.USE_HTTPS === 'true';  // HTTP hoặc HTTPS
```

**Giải thích**:
- Express: Framework để tạo HTTP endpoints
- WebSocket: Để realtime signaling (offer/answer/candidate)
- UUID: Tạo unique ID cho client và room

```javascript
// Dòng 34-58: Tạo HTTP hoặc HTTPS server
const app = express();
app.use(cors());           // Cho phép CORS (frontend khác domain)
app.use(express.json());   // Parse JSON body

let server;
if (USE_HTTPS) {
  // Nếu production → dùng HTTPS
  try {
    const options = {
      cert: fs.readFileSync(certPath),  // SSL certificate
      key: fs.readFileSync(keyPath)     // Private key
    };
    server = https.createServer(options, app);
  } catch (err) {
    // Nếu không có cert → fallback về HTTP
    server = http.createServer(app);
  }
} else {
  server = http.createServer(app);
}
```

**Giải thích HTTPS**:
- WebRTC yêu cầu HTTPS trong production (trừ localhost)
- Self-signed cert OK cho testing

```javascript
// Dòng 60-62: Tạo WebSocket server
const wss = new WebSocket.Server({ server });
// WebSocket chạy trên cùng port với HTTP server
```

#### **State Management (Dòng 64-67)**

```javascript
// Dòng 64-67: In-memory storage
const clients = new Map();  
// clientId -> { ws, name, roomId }
// Lưu thông tin mỗi client kết nối

const rooms = new Map();    
// roomId -> { id, members: Map(clientId -> {name, isHost}), callActive: boolean }
// Lưu thông tin mỗi room
```

**Giải thích Structure**:
```javascript
// Ví dụ clients Map:
{
  'client-abc': { 
    ws: WebSocket_object,
    name: 'Alice',
    roomId: 'room-123'
  },
  'client-xyz': {
    ws: WebSocket_object,
    name: 'Bob',
    roomId: 'room-123'
  }
}

// Ví dụ rooms Map:
{
  'room-123': {
    id: 'room-123',
    members: Map {
      'client-abc' => { name: 'Alice', isHost: true },
      'client-xyz' => { name: 'Bob', isHost: false }
    },
    callActive: false
  }
}
```

#### **Utility Functions (Dòng 69-110)**

```javascript
// Dòng 70: Generate unique client ID
const generateClientId = () => uuidv4();
// Ví dụ: '550e8400-e29b-41d4-a716-446655440000'

// Dòng 72-85: Broadcast message tới tất cả trong room (trừ sender)
const broadcast = (roomId, message, excludeClientId = null) => {
  const room = rooms.get(roomId);        // Lấy room
  if (!room) return;                     // Room không tồn tại
  
  room.members.forEach((memberInfo, clientId) => {
    if (clientId !== excludeClientId) {  // Không gửi lại cho sender
      const client = clients.get(clientId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));  // Gửi JSON
      }
    }
  });
};
```

**Giải thích Broadcast**:
- Dùng để thông báo: memberJoined, memberLeft, callStarted
- `excludeClientId`: Không gửi lại cho người vừa trigger event

```javascript
// Dòng 87-92: Gửi message cho 1 client cụ thể
const sendToClient = (clientId, message) => {
  const client = clients.get(clientId);
  if (client && client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(message));
  }
};
```

```javascript
// Dòng 94-109: Lấy danh sách members trong room
const getRoomMembers = (roomId) => {
  const room = rooms.get(roomId);
  if (!room) return [];
  
  const members = [];
  room.members.forEach((memberInfo, clientId) => {
    members.push({
      id: clientId,           // Client ID
      name: memberInfo.name,  // Nickname
      isHost: memberInfo.isHost  // Host là người tạo room
    });
  });
  return members;
};
```

#### **Cleanup Function (Dòng 111-148)**

```javascript
// Dòng 111-148: Dọn dẹp khi client disconnect
const cleanupClient = (clientId) => {
  const client = clients.get(clientId);
  if (!client) return;
  
  const { roomId, name } = client;
  
  if (roomId) {
    const room = rooms.get(roomId);
    if (room) {
      // Xóa client khỏi room
      room.members.delete(clientId);
      
      // Thông báo members khác
      broadcast(roomId, {
        type: 'memberLeft',
        roomId,
        name,
        memberId: clientId
      });
      
      // Cập nhật danh sách members
      broadcast(roomId, {
        type: 'roomMembers',
        roomId,
        members: getRoomMembers(roomId)
      });
      
      // Xóa room nếu không còn ai
      if (room.members.size === 0) {
        rooms.delete(roomId);
        console.log(`🗑️  Room ${roomId} deleted (empty)`);
      }
    }
  }
  
  // Xóa client khỏi Map
  clients.delete(clientId);
};
```

**Giải thích Cleanup**:
- Tự động chạy khi WebSocket disconnect
- Đảm bảo state luôn sync
- Xóa room rỗng để tiết kiệm memory

#### **WebSocket Connection Handler (Dòng 150-200)**

```javascript
// Dòng 151: Lắng nghe connection mới
wss.on('connection', (ws) => {
  // Dòng 152-153: Tạo unique ID cho client
  const clientId = generateClientId();
  clients.set(clientId, { ws, name: null, roomId: null });
  
  console.log(`🔌 New connection: ${clientId}`);
  
  // Dòng 157-161: Gửi ID cho client
  ws.send(JSON.stringify({
    type: 'connected',
    clientId
  }));
  // Client sẽ lưu clientId này
  
  // Dòng 163-173: Xử lý message từ client
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);  // Parse JSON
      handleMessage(clientId, message);   // Route đến handler
    } catch (err) {
      // Nếu JSON invalid → gửi error
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });
  
  // Dòng 175-177: Cleanup khi disconnect
  ws.on('close', () => {
    cleanupClient(clientId);
  });
  
  // Dòng 179-182: Xử lý WebSocket error
  ws.on('error', (err) => {
    console.error(`WebSocket error for ${clientId}:`, err);
    cleanupClient(clientId);
  });
});
```

**Giải thích Connection Flow**:
```
1. Client mở WebSocket → wss.on('connection')
2. Server tạo clientId → gửi về client
3. Client gửi messages → ws.on('message')
4. Server route message → handleMessage()
5. Client đóng → ws.on('close') → cleanupClient()
```

#### **Message Router (Dòng 185-215)**

```javascript
// Dòng 185-215: Route messages đến handler functions
const handleMessage = (clientId, message) => {
  const client = clients.get(clientId);
  if (!client) return;
  
  console.log(`📨 [${client.name || clientId}] ${message.type}`);
  
  // Switch theo message type
  switch (message.type) {
    case 'register':      // Client gửi nickname
      handleRegister(clientId, message);
      break;
    case 'createRoom':   // Tạo room mới
      handleCreateRoom(clientId, message);
      break;
    case 'joinRoom':     // Join room có sẵn
      handleJoinRoom(clientId, message);
      break;
    case 'leaveRoom':    // Rời room
      handleLeaveRoom(clientId, message);
      break;
    case 'startCall':    // Bắt đầu group call
      handleStartCall(clientId, message);
      break;
    case 'offer':        // WebRTC offer
      handleOffer(clientId, message);
      break;
    case 'answer':       // WebRTC answer
      handleAnswer(clientId, message);
      break;
    case 'candidate':    // ICE candidate
      handleCandidate(clientId, message);
      break;
    case 'endCall':      // Kết thúc call
      handleEndCall(clientId, message);
      break;
    default:
      console.warn(`Unknown message type: ${message.type}`);
  }
};
```

#### **Handler: Register (Dòng 218-230)**

```javascript
// Dòng 218-230: Lưu nickname của user
const handleRegister = (clientId, message) => {
  const client = clients.get(clientId);
  if (client) {
    // Lưu tên vào client object
    client.name = message.name;
    console.log(`✅ Registered: ${message.name} (${clientId})`);
    
    // Confirm lại cho client
    sendToClient(clientId, {
      type: 'registered',
      name: message.name,
      clientId
    });
  }
};
```

**Message Format**:
```javascript
// Client gửi:
{ type: 'register', name: 'Alice' }

// Server trả về:
{ type: 'registered', name: 'Alice', clientId: 'abc-123' }
```

#### **Handler: Create Room (Dòng 232-270)**

```javascript
// Dòng 232-270: Tạo room mới
const handleCreateRoom = (clientId, message) => {
  const client = clients.get(clientId);
  if (!client) return;
  
  // Generate room ID (hoặc dùng ID từ client)
  const roomId = message.roomId || uuidv4().substring(0, 8);
  // Ví dụ: 'a1b2c3d4'
  
  // Kiểm tra room đã tồn tại chưa
  if (rooms.has(roomId)) {
    sendToClient(clientId, {
      type: 'error',
      message: 'Room already exists',
      roomId
    });
    return;
  }
  
  // Tạo room object
  const room = {
    id: roomId,
    members: new Map(),      // Danh sách members
    callActive: false,       // Chưa có call
    createdAt: new Date().toISOString()
  };
  
  // Thêm client vào room (làm host)
  room.members.set(clientId, {
    name: message.name || client.name,
    isHost: true  // Người tạo là host
  });
  
  // Lưu room
  rooms.set(roomId, room);
  client.roomId = roomId;
  client.name = message.name || client.name;
  
  console.log(`🏠 Room created: ${roomId} by ${client.name}`);
  
  // Gửi thông tin room cho client
  sendToClient(clientId, {
    type: 'roomCreated',
    roomId,
    isHost: true,
    members: getRoomMembers(roomId)
  });
};
```

**Flow**:
```
1. User click "Create Room"
2. Client → server: { type: 'createRoom', name: 'Alice' }
3. Server tạo room ID + room object
4. Server → client: { type: 'roomCreated', roomId: 'a1b2c3d4', isHost: true }
5. Client chuyển sang IN_ROOM state
```

#### **Handler: Join Room (Dòng 272-326)**

```javascript
// Dòng 272-326: Join vào room có sẵn
const handleJoinRoom = (clientId, message) => {
  const client = clients.get(clientId);
  if (!client) return;
  
  const { roomId, name } = message;
  
  // Kiểm tra room có tồn tại không
  if (!rooms.has(roomId)) {
    sendToClient(clientId, {
      type: 'error',
      message: 'Room not found',
      roomId
    });
    return;
  }
  
  const room = rooms.get(roomId);
  
  // Thêm client vào room (không phải host)
  room.members.set(clientId, {
    name: name || client.name,
    isHost: false
  });
  
  client.roomId = roomId;
  client.name = name || client.name;
  
  console.log(`➡️  ${client.name} joined room ${roomId}`);
  
  // Notify client đã join
  sendToClient(clientId, {
    type: 'roomJoined',
    roomId,
    isHost: false,
    members: getRoomMembers(roomId),
    callActive: room.callActive  // Đang có call không?
  });
  
  // Notify members khác có người mới
  broadcast(roomId, {
    type: 'memberJoined',
    roomId,
    member: {
      id: clientId,
      name: client.name,
      isHost: false
    }
  }, clientId);  // Không gửi cho chính mình
  
  // Broadcast updated member list
  broadcast(roomId, {
    type: 'roomMembers',
    roomId,
    members: getRoomMembers(roomId)
  });
};
```

**Flow**:
```
1. User nhập Room ID + click "Join"
2. Client → server: { type: 'joinRoom', roomId: 'a1b2c3d4', name: 'Bob' }
3. Server validation
4. Server → Bob: { type: 'roomJoined', ... }
5. Server → Alice (existing): { type: 'memberJoined', member: {name: 'Bob'} }
6. Server → All: { type: 'roomMembers', members: [...] }
```

#### **Handler: Start Call (Dòng 382-399)**

```javascript
// Dòng 382-399: Bắt đầu group call
const handleStartCall = (clientId, message) => {
  const client = clients.get(clientId);
  if (!client || !client.roomId) return;
  
  const { roomId } = client;
  const room = rooms.get(roomId);
  
  if (room) {
    // Đánh dấu call đang active
    room.callActive = true;
    
    // Notify tất cả members
    broadcast(roomId, {
      type: 'callStarted',
      roomId,
      initiator: clientId,
      initiatorName: client.name
    });
    
    console.log(`📞 Call started in room ${roomId} by ${client.name}`);
  }
};
```

**Flow**:
```
1. Host click "Start Group Call"
2. Client → server: { type: 'startCall', roomId }
3. Server set callActive = true
4. Server → All members: { type: 'callStarted', initiator: 'Alice' }
5. All clients bắt đầu tạo peer connections
```

#### **Handler: Offer/Answer/Candidate (Dòng 401-461)**

```javascript
// Dòng 401-417: Forward WebRTC offer
const handleOffer = (clientId, message) => {
  const { roomId, target, offer } = message;
  const client = clients.get(clientId);
  
  if (!client) return;
  
  // Forward offer đến target peer
  sendToClient(target, {
    type: 'offer',
    roomId,
    sender: clientId,
    senderName: client.name,
    target,
    offer  // RTCSessionDescription
  });
  
  console.log(`📤 Offer: ${client.name} -> ${target}`);
};
```

**Signaling Flow** (SDP Exchange):
```
Alice (caller)               Server                Bob (callee)
     |                          |                        |
     | {offer, target: Bob}     |                        |
     |------------------------->|                        |
     |                          | {offer, sender: Alice} |
     |                          |----------------------->|
     |                          |                        |
     |                          |   {answer, target: A}  |
     |                          |<-----------------------|
     |  {answer, sender: Bob}   |                        |
     |<-------------------------|                        |
```

```javascript
// Dòng 419-435: Forward WebRTC answer
const handleAnswer = (clientId, message) => {
  const { roomId, target, answer } = message;
  const client = clients.get(clientId);
  
  if (!client) return;
  
  // Forward answer đến peer đã gửi offer
  sendToClient(target, {
    type: 'answer',
    roomId,
    sender: clientId,
    senderName: client.name,
    target,
    answer  // RTCSessionDescription
  });
  
  console.log(`📥 Answer: ${client.name} -> ${target}`);
};
```

```javascript
// Dòng 437-451: Forward ICE candidates
const handleCandidate = (clientId, message) => {
  const { roomId, target, candidate } = message;
  const client = clients.get(clientId);
  
  if (!client) return;
  
  // Forward ICE candidate đến peer
  sendToClient(target, {
    type: 'candidate',
    roomId,
    sender: clientId,
    senderName: client.name,
    target,
    candidate  // RTCIceCandidate
  });
};
```

**ICE Candidate Exchange**:
```
Sau khi setLocalDescription(), mỗi peer tìm các network paths:
- host candidates (local IP)
- srflx candidates (public IP via STUN)
- relay candidates (TURN server)

Gửi từng candidate qua signaling server → peer kia
Peer nhận → addIceCandidate()
```

---

## 📂 PHẦN 3: CLIENT SERVICES

### File: `frontend/src/services/signaling.js`

#### **SignalingService Class Setup (Dòng 1-30)**

```javascript
// Dòng 7-26: Constructor - khởi tạo state
class SignalingService {
  constructor() {
    this.ws = null;                    // WebSocket object
    this.clientId = null;              // ID từ server
    this.isConnected = false;          // Connection state
    this.reconnectAttempts = 0;        // Số lần đã reconnect
    this.maxReconnectAttempts = 5;     // Max 5 lần
    this.reconnectDelay = 2000;        // Đợi 2s giữa mỗi lần
    
    // Message handlers - Map để route messages
    this.handlers = new Map();
    
    // Pending messages queue
    this.pendingMessages = [];  // Gửi sau khi reconnect thành công
    
    // Callbacks
    this.onConnected = null;     // Trigger khi connect
    this.onDisconnected = null;  // Trigger khi disconnect
    this.onError = null;         // Trigger khi error
    this.onReconnecting = null;  // Trigger khi đang reconnect
  }
```

#### **Connect Method (Dòng 32-100)**

```javascript
// Dòng 32-100: Kết nối tới signaling server
connect() {
  return new Promise((resolve, reject) => {
    // Kiểm tra đã connect chưa
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      resolve();
      return;
    }

    console.log(`🔌 Connecting to signaling server: ${config.SIGNALING_URL}`);
    
    try {
      // Tạo WebSocket connection
      this.ws = new WebSocket(config.SIGNALING_URL);
    } catch (error) {
      reject(error);
      return;
    }

    // Dòng 49-58: Xử lý khi connection open
    this.ws.onopen = () => {
      console.log('✅ Connected to signaling server');
      this.isConnected = true;
      this.reconnectAttempts = 0;  // Reset counter
      
      // Gửi messages đã queue
      this.flushPendingMessages();
      
      if (this.onConnected) {
        this.onConnected();
      }
    };

    // Dòng 60-75: Xử lý messages từ server
    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);  // Route to handler
        
        // Resolve promise khi nhận được clientId
        if (message.type === 'connected') {
          this.clientId = message.clientId;
          resolve();
        }
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };

    // Dòng 77-89: Xử lý disconnect
    this.ws.onclose = (event) => {
      console.log(`🔌 Disconnected (code: ${event.code})`);
      this.isConnected = false;
      
      if (this.onDisconnected) {
        this.onDisconnected(event);
      }
      
      // Auto reconnect nếu không phải intentional close
      if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnect();
      }
    };

    // Dòng 91-98: Xử lý errors
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (this.onError) {
        this.onError(error);
      }
      reject(error);
    };
  });
}
```

**Connect Flow**:
```
1. Call connect()
2. new WebSocket(url)
3. onopen → isConnected = true
4. onmessage → nhận clientId → resolve promise
5. Client có thể gửi messages
```

#### **Message Sending (Dòng 130-150)**

```javascript
// Dòng 130-141: Gửi message
send(message) {
  if (this.ws && this.ws.readyState === WebSocket.OPEN) {
    // WebSocket sẵn sàng → gửi ngay
    this.ws.send(JSON.stringify(message));
  } else {
    // WebSocket chưa sẵn sàng → queue lại
    console.warn('WebSocket not connected, queueing message');
    this.pendingMessages.push(message);
  }
}

// Dòng 143-150: Gửi pending messages
flushPendingMessages() {
  while (this.pendingMessages.length > 0) {
    const message = this.pendingMessages.shift();
    this.send(message);
  }
}
```

#### **Message Handling (Dòng 153-175)**

```javascript
// Dòng 153-175: Route messages đến handlers
handleMessage(message) {
  console.log('📨 Received:', message.type);
  
  // Lấy handler cho message type này
  const handler = this.handlers.get(message.type);
  if (handler) {
    handler(message);  // Gọi callback
  }
}

// Dòng 177-180: Register handler cho message type
on(messageType, callback) {
  this.handlers.set(messageType, callback);
}

// Dòng 182-185: Unregister handler
off(messageType) {
  this.handlers.delete(messageType);
}
```

**Usage**:
```javascript
// Trong AppContext:
signalingService.on('offer', (message) => {
  handleReceiveOffer(message);
});

signalingService.on('memberJoined', (message) => {
  updateMemberList(message.member);
});
```

#### **Convenience Methods (Dòng 188-262)**

```javascript
// Dòng 192-197: Gửi offer
sendOffer(roomId, targetId, offer) {
  this.send({
    type: 'offer',
    roomId,
    target: targetId,
    offer
  });
}

// Dòng 204-209: Gửi answer
sendAnswer(roomId, targetId, answer) {
  this.send({
    type: 'answer',
    roomId,
    target: targetId,
    answer
  });
}

// Dòng 216-221: Gửi ICE candidate
sendCandidate(roomId, targetId, candidate) {
  this.send({
    type: 'candidate',
    roomId,
    target: targetId,
    candidate
  });
}
```

---

## 📂 PHẦN 4: WEBRTC SERVICE (QUAN TRỌNG NHẤT)

### File: `frontend/src/services/webrtc.js`

#### **Class Setup (Dòng 1-40)**

```javascript
// Dòng 11-40: Constructor
class WebRTCService {
  constructor() {
    // Peer connections: peerId -> RTCPeerConnection object
    this.peerConnections = new Map();
    
    // Remote streams: peerId -> MediaStream
    this.remoteStreams = new Map();
    
    // Local stream (camera + mic)
    this.localStream = null;
    
    // Stats tracking: peerId -> stats object
    this.stats = new Map();
    this.callStartTime = null;
    
    // Callbacks (được set từ AppContext)
    this.onRemoteStream = null;         // Khi nhận remote stream
    this.onRemoteStreamRemoved = null;  // Khi peer disconnect
    this.onConnectionStateChange = null; // Khi connection state thay đổi
    this.onIceStateChange = null;       // Khi ICE state thay đổi
    this.onStatsUpdate = null;          // Khi có stats mới
    this.onTurnFallback = null;         // Khi P2P timeout (cần TURN)
    
    // Stats interval timer
    this.statsInterval = null;
    
    // P2P timeout tracking
    this.p2pTimeouts = new Map();
    this.P2P_TIMEOUT = config.P2P_TIMEOUT_MS;  // 10 seconds
  }
```

**Giải thích Structure**:
```javascript
// Ví dụ với 3 người: Alice (local), Bob, Charlie
peerConnections = {
  'bob-id': RTCPeerConnection_to_Bob,
  'charlie-id': RTCPeerConnection_to_Charlie
}

remoteStreams = {
  'bob-id': MediaStream_from_Bob,
  'charlie-id': MediaStream_from_Charlie
}

// Alice có 2 peer connections (mesh topology)
```

#### **Get Local Stream (Dòng 47-73)**

```javascript
// Dòng 47-73: Xin permission camera/mic từ user
async getLocalStream(constraints = null) {
  // Default constraints nếu không truyền vào
  const defaultConstraints = {
    video: {
      width: { ideal: 1280 },    // 720p
      height: { ideal: 720 },
      facingMode: 'user'         // Camera trước
    },
    audio: {
      echoCancellation: true,    // Khử tiếng vọng
      noiseSuppression: true,    // Lọc nhiễu
      autoGainControl: true      // Tự động điều chỉnh volume
    }
  };

  try {
    // Gọi browser API để lấy stream
    this.localStream = await navigator.mediaDevices.getUserMedia(
      constraints || defaultConstraints
    );
    console.log('📹 Local stream acquired');
    return this.localStream;
  } catch (error) {
    console.error('Failed to get local stream:', error);
    throw error;  // Permission denied hoặc no camera
  }
}
```

**Flow**:
```
1. User click "Start Call"
2. await webRTCService.getLocalStream()
3. Browser hiện popup xin permission
4. User cho phép → return MediaStream
5. MediaStream có tracks: [VideoTrack, AudioTrack]
```

#### **Toggle Controls (Dòng 75-110)**

```javascript
// Dòng 82-90: Bật/tắt mic
toggleAudio(enabled) {
  if (this.localStream) {
    // Lấy tất cả audio tracks
    this.localStream.getAudioTracks().forEach(track => {
      track.enabled = enabled;  // true = unmute, false = mute
    });
    return enabled;
  }
  return false;
}

// Dòng 95-103: Bật/tắt camera
toggleVideo(enabled) {
  if (this.localStream) {
    // Lấy tất cả video tracks
    this.localStream.getVideoTracks().forEach(track => {
      track.enabled = enabled;  // true = on, false = off
    });
    return enabled;
  }
  return false;
}
```

**Giải thích**:
- `track.enabled = false`: Track vẫn tồn tại nhưng không gửi data
- Không cần renegotiate connection (nhanh)
- Khác với `track.stop()` (dừng hẳn, cần getUserMedia lại)

#### **Create Peer Connection (Dòng 108-193) - QUAN TRỌNG**

```javascript
// Dòng 108-193: Tạo RTCPeerConnection đến 1 peer
createPeerConnection(peerId, peerName) {
  // Dòng 109-112: Check đã tạo chưa
  if (this.peerConnections.has(peerId)) {
    console.warn(`Peer connection already exists for ${peerId}`);
    return this.peerConnections.get(peerId);
  }

  console.log(`🔗 Creating peer connection to ${peerName} (${peerId})`);

  // Dòng 116-118: Tạo RTCPeerConnection với ICE servers
  const pc = new RTCPeerConnection({
    iceServers: this.getIceServers()  // STUN + TURN servers
  });

  // Dòng 120-125: Thêm local tracks vào connection
  if (this.localStream) {
    this.localStream.getTracks().forEach(track => {
      pc.addTrack(track, this.localStream);
      // Gửi audio/video tracks cho peer
    });
  }

  // Dòng 127-137: Xử lý khi nhận remote track
  pc.ontrack = (event) => {
    console.log(`📺 Received remote track from ${peerName}`);
    const [remoteStream] = event.streams;  // MediaStream từ peer
    this.remoteStreams.set(peerId, remoteStream);
    
    // Callback đến AppContext để hiển thị video
    if (this.onRemoteStream) {
      this.onRemoteStream(peerId, peerName, remoteStream);
    }
  };

  // Dòng 139-153: Theo dõi connection state
  pc.onconnectionstatechange = () => {
    console.log(`🔌 Connection state [${peerName}]: ${pc.connectionState}`);
    
    // Callback để update UI
    if (this.onConnectionStateChange) {
      this.onConnectionStateChange(peerId, peerName, pc.connectionState);
    }

    // Clear P2P timeout khi connected
    if (pc.connectionState === 'connected') {
      this.clearP2PTimeout(peerId);
    }

    // Cleanup khi failed/closed
    if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
      this.handleConnectionFailed(peerId, peerName);
    }
  };

  // Dòng 155-166: Theo dõi ICE state
  pc.oniceconnectionstatechange = () => {
    console.log(`🧊 ICE state [${peerName}]: ${pc.iceConnectionState}`);
    
    if (this.onIceStateChange) {
      this.onIceStateChange(peerId, peerName, pc.iceConnectionState);
    }

    // Check candidate type khi connected
    if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
      this.checkCandidateType(peerId, peerName, pc);
    }
  };

  // Dòng 168-171: Log ICE gathering state
  pc.onicegatheringstatechange = () => {
    console.log(`🧊 ICE gathering state [${peerName}]: ${pc.iceGatheringState}`);
  };

  // Dòng 173-176: Lưu peer connection
  this.peerConnections.set(peerId, pc);
  
  // Dòng 178-179: Bắt đầu P2P timeout timer
  this.startP2PTimeout(peerId, peerName);
  
  return pc;
}
```

**Connection States Flow**:
```
new → connecting → connected
                 ↓
              disconnected → failed
                           ↓
                         closed
```

**ICE States Flow**:
```
new → checking → connected/completed
              ↓
           failed
```

#### **P2P Timeout Detection (Dòng 195-223)**

```javascript
// Dòng 195-211: Start timeout để detect P2P failure
startP2PTimeout(peerId, peerName) {
  const timeout = setTimeout(() => {
    const pc = this.peerConnections.get(peerId);
    
    // Sau 10s mà chưa connected → likely cần TURN
    if (pc && pc.connectionState !== 'connected') {
      console.log(`⏰ P2P timeout for ${peerName}, likely using TURN relay`);
      
      // Callback để hiển thị toast notification
      if (this.onTurnFallback) {
        this.onTurnFallback(peerId, peerName);
      }
    }
  }, this.P2P_TIMEOUT);  // 10000ms
  
  this.p2pTimeouts.set(peerId, timeout);
}

// Dòng 217-223: Clear timeout khi connected
clearP2PTimeout(peerId) {
  const timeout = this.p2pTimeouts.get(peerId);
  if (timeout) {
    clearTimeout(timeout);
    this.p2pTimeouts.delete(peerId);
  }
}
```

**Tại sao cần timeout?**
- P2P thường connect trong 2-5 giây
- Nếu > 10 giây → NAT/firewall block → cần TURN
- Thông báo user để họ biết connection đang qua relay (chậm hơn)

#### **Check Candidate Type (Dòng 225-275) - PHÁT HIỆN TURN**

```javascript
// Dòng 225-275: Kiểm tra connection đang dùng candidate type gì
async checkCandidateType(peerId, peerName, pc) {
  try {
    // Lấy WebRTC statistics
    const stats = await pc.getStats();
    let candidateType = 'unknown';
    let localCandidate = null;
    let remoteCandidate = null;

    // Dòng 234-256: Duyệt qua stats để tìm active candidate pair
    stats.forEach(report => {
      // Tìm candidate-pair đang active
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        const localCandidateId = report.localCandidateId;
        const remoteCandidateId = report.remoteCandidateId;

        // Tìm chi tiết candidates
        stats.forEach(stat => {
          if (stat.id === localCandidateId) {
            localCandidate = stat;
            candidateType = stat.candidateType;  // host/srflx/relay
          }
          if (stat.id === remoteCandidateId) {
            remoteCandidate = stat;
          }
        });
      }
    });

    console.log(`📊 Candidate type for ${peerName}: ${candidateType}`);
    
    // Dòng 258-263: Lưu stats
    this.stats.set(peerId, {
      candidateType,
      localCandidate,
      remoteCandidate,
      connectionState: pc.connectionState,
      iceConnectionState: pc.iceConnectionState
    });

    // Dòng 265-271: Thông báo nếu dùng TURN relay
    if (candidateType === 'relay') {
      console.log(`🔄 ${peerName} is connected via TURN relay`);
      if (this.onStatsUpdate) {
        this.onStatsUpdate(peerId, { candidateType, isRelay: true });
      }
    }

    return { candidateType, localCandidate, remoteCandidate };
  } catch (error) {
    console.error('Failed to get candidate stats:', error);
    return { candidateType: 'unknown' };
  }
}
```

**Candidate Types**:
- `host`: Local IP (192.168.x.x) → cùng mạng LAN
- `srflx`: Server Reflexive (public IP via STUN) → P2P qua NAT
- `relay`: TURN relay → traffic qua server, chậm nhất

#### **SDP Exchange (Dòng 293-365)**

```javascript
// Dòng 293-309: Tạo và gửi offer
async createOffer(peerId) {
  const pc = this.peerConnections.get(peerId);
  if (!pc) return null;

  try {
    // Tạo SDP offer
    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });
    
    // Set làm local description
    await pc.setLocalDescription(offer);
    console.log(`📤 Created offer for ${peerId}`);
    return offer;  // Gửi qua signaling server
  } catch (error) {
    console.error(`Failed to create offer for ${peerId}:`, error);
    throw error;
  }
}

// Dòng 314-333: Xử lý offer nhận được
async handleOffer(peerId, peerName, offer) {
  // Tạo peer connection nếu chưa có
  let pc = this.peerConnections.get(peerId);
  if (!pc) {
    pc = this.createPeerConnection(peerId, peerName);
  }

  try {
    // Set offer làm remote description
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    console.log(`📥 Set remote offer from ${peerName}`);
    return pc;
  } catch (error) {
    console.error(`Failed to handle offer from ${peerId}:`, error);
    throw error;
  }
}

// Dòng 338-355: Tạo answer
async createAnswer(peerId) {
  const pc = this.peerConnections.get(peerId);
  if (!pc) return null;

  try {
    // Tạo SDP answer
    const answer = await pc.createAnswer();
    
    // Set làm local description
    await pc.setLocalDescription(answer);
    console.log(`📤 Created answer for ${peerId}`);
    return answer;  // Gửi qua signaling server
  } catch (error) {
    console.error(`Failed to create answer for ${peerId}:`, error);
    throw error;
  }
}

// Dòng 360-374: Xử lý answer nhận được
async handleAnswer(peerId, answer) {
  const pc = this.peerConnections.get(peerId);
  if (!pc) return;

  try {
    // Set answer làm remote description
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
    console.log(`📥 Set remote answer from ${peerId}`);
  } catch (error) {
    console.error(`Failed to handle answer from ${peerId}:`, error);
    throw error;
  }
}
```

**SDP (Session Description Protocol)**:
```javascript
// Offer chứa:
{
  type: 'offer',
  sdp: 'v=0\r\no=- ...\r\n...'  // Mô tả media capabilities
}

// Answer chứa:
{
  type: 'answer',
  sdp: 'v=0\r\no=- ...\r\n...'
}

// SDP chứa thông tin:
- Codecs hỗ trợ (VP8, H264, Opus...)
- Media formats
- Network info
- ICE credentials
```

#### **ICE Candidate Handling (Dòng 376-400)**

```javascript
// Dòng 379-395: Xử lý ICE candidate nhận được
async handleCandidate(peerId, candidate) {
  const pc = this.peerConnections.get(peerId);
  if (!pc) return;

  try {
    if (candidate) {
      // Thêm ICE candidate vào peer connection
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  } catch (error) {
    console.error(`Failed to add ICE candidate from ${peerId}:`, error);
  }
}

// Dòng 400-414: Đăng ký callback cho ICE candidates
onIceCandidate(peerId, callback) {
  const pc = this.peerConnections.get(peerId);
  if (!pc) return;

  // Khi có candidate mới
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      callback(event.candidate);  // Gửi qua signaling
    }
  };
}
```

**ICE Candidate Flow**:
```
1. setLocalDescription() → trigger ICE gathering
2. Browser tìm network paths (host/srflx/relay)
3. Mỗi path → 1 candidate
4. onicecandidate event → gửi candidate
5. Peer nhận → addIceCandidate()
6. Browser test connectivity
7. Chọn best candidate pair
```

#### **Statistics Collection (Dòng 420-546)**

```javascript
// Dòng 420-444: Start thu thập stats định kỳ
startStatsCollection() {
  if (this.statsInterval) return;  // Đã start rồi
  
  this.callStartTime = new Date();  // Lưu thời gian bắt đầu
  
  // Mỗi 2 giây
  this.statsInterval = setInterval(() => {
    this.collectAllStats();
  }, config.STATS_INTERVAL_MS);
  
  console.log('📊 Started stats collection');
}

// Dòng 446-454: Stop thu thập stats
stopStatsCollection() {
  if (this.statsInterval) {
    clearInterval(this.statsInterval);
    this.statsInterval = null;
    this.callStartTime = null;
  }
}

// Dòng 456-546: Thu thập stats từ tất cả connections
async collectAllStats() {
  const aggregatedStats = {
    callStart: this.callStartTime?.toLocaleTimeString() || '',
    duration: this.getCallDuration(),
    connectionState: 'new',
    iceState: 'new',
    candidateType: 'unknown',
    bytesReceived: 0,
    bytesSent: 0,
    packetsReceived: 0,
    packetsSent: 0,
    packetsLost: 0,
    jitter: 0,
    roundTripTime: 0,
    videoResolution: { width: 0, height: 0, frameRate: 0 },
    audioCodec: '',
    videoCodec: ''
  };

  // Duyệt qua tất cả peer connections
  for (const [peerId, pc] of this.peerConnections) {
    const stats = await pc.getStats();
    
    stats.forEach(report => {
      // Inbound RTP (nhận)
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        aggregatedStats.bytesReceived += report.bytesReceived || 0;
        aggregatedStats.packetsReceived += report.packetsReceived || 0;
        aggregatedStats.packetsLost += report.packetsLost || 0;
        aggregatedStats.jitter = report.jitter || 0;
        
        // Video resolution
        if (report.frameWidth && report.frameHeight) {
          aggregatedStats.videoResolution = {
            width: report.frameWidth,
            height: report.frameHeight,
            frameRate: report.framesPerSecond || 0
          };
        }
      }
      
      // Outbound RTP (gửi)
      if (report.type === 'outbound-rtp' && report.kind === 'video') {
        aggregatedStats.bytesSent += report.bytesSent || 0;
        aggregatedStats.packetsSent += report.packetsSent || 0;
      }

      // Candidate pair (connection info)
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        aggregatedStats.roundTripTime = (report.currentRoundTripTime || 0) * 1000;
        aggregatedStats.candidateType = this.stats.get(peerId)?.candidateType || 'unknown';
      }

      // Codecs
      if (report.type === 'codec') {
        if (report.mimeType?.includes('audio')) {
          aggregatedStats.audioCodec = report.mimeType.split('/')[1] || '';
        }
        if (report.mimeType?.includes('video')) {
          aggregatedStats.videoCodec = report.mimeType.split('/')[1] || '';
        }
      }
    });
  }

  return aggregatedStats;
}
```

**Stats Metrics**:
- **bytesReceived/Sent**: Tổng data transfer
- **packetsLost**: Số packets bị mất → quality indicator
- **jitter**: Độ biến động delay → ảnh hưởng audio
- **roundTripTime (RTT)**: Ping → latency
- **videoResolution**: Độ phân giải thực tế
- **candidateType**: host/srflx/relay

#### **Cleanup (Dòng 416-454)**

```javascript
// Dòng 416-454: Đóng 1 peer connection
closePeerConnection(peerId) {
  const pc = this.peerConnections.get(peerId);
  if (pc) {
    // Đóng connection
    pc.close();
    this.peerConnections.delete(peerId);
    
    // Xóa remote stream
    this.remoteStreams.delete(peerId);
    
    // Xóa stats
    this.stats.delete(peerId);
    
    // Clear timeout
    this.clearP2PTimeout(peerId);
    
    console.log(`🔌 Closed peer connection: ${peerId}`);
  }
}

// Close tất cả connections
closeAllConnections() {
  this.peerConnections.forEach((pc, peerId) => {
    this.closePeerConnection(peerId);
  });
  
  this.stopStatsCollection();
  console.log('🔌 Closed all peer connections');
}

// Stop local stream
stopLocalStream() {
  if (this.localStream) {
    this.localStream.getTracks().forEach(track => track.stop());
    this.localStream = null;
  }
}
```

---

## 📂 PHẦN 5: APP CONTEXT (STATE MANAGEMENT)

### File: `frontend/src/context/AppContext.jsx`

#### **Setup và State (Dòng 1-80)**

```javascript
// Dòng 1-22: Imports và Context setup
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { APP_STATES, generateRoomId } from '../data/mockData';
import { webRTCService } from '../services/webrtc';
import { signalingService } from '../services/signaling';
import { config } from '../services/config';

// Tạo React Context
const AppContext = createContext(null);

// Custom hook để dùng context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

// Dòng 24-81: State definitions
export const AppProvider = ({ children }) => {
  // App state machine
  const [appState, setAppState] = useState(APP_STATES.IDLE);
  
  // Current user info
  const [currentUser, setCurrentUser] = useState({
    id: null,
    name: '',
    isLocal: true,
    isMuted: false,
    isCameraOff: false
  });
  
  // Room info
  const [isHost, setIsHost] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [roomMembers, setRoomMembers] = useState([]);
  
  // Call participants
  const [participants, setParticipants] = useState([]);
  
  // Local media stream
  const [localStream, setLocalStream] = useState(null);
  
  // Connection states
  const [connectionState, setConnectionState] = useState('new');
  const [iceState, setIceState] = useState('new');
  
  // Stats
  const [callStats, setCallStats] = useState(null);
  const [callDuration, setCallDuration] = useState('00:00:00');
  
  // UI state
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // Signaling connected
  const [signalingConnected, setSignalingConnected] = useState(false);
```

**State Organization**:
- **App State**: IDLE → IN_ROOM → CALLING → ENDED
- **User State**: currentUser, isHost
- **Room State**: roomId, roomMembers
- **Call State**: participants, localStream
- **Connection State**: connectionState, iceState
- **UI State**: showStats, notification

#### **Call Timer (Dòng 75-115)**

```javascript
// Dòng 75-89: Start call timer
const startCallTimer = useCallback(() => {
  callStartTimeRef.current = new Date();
  
  // Update mỗi giây
  callTimerRef.current = setInterval(() => {
    const now = new Date();
    const diff = now - callStartTimeRef.current;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    // Format: HH:MM:SS
    setCallDuration(
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    );
  }, 1000);
}, []);

// Dòng 91-98: Stop call timer
const stopCallTimer = useCallback(() => {
  if (callTimerRef.current) {
    clearInterval(callTimerRef.current);
    callTimerRef.current = null;
  }
  callStartTimeRef.current = null;
  setCallDuration('00:00:00');
}, []);
```

#### **Setup Signaling (Dòng 200-350)**

```javascript
// Dòng 203-211: Connect to signaling server và setup handlers
useEffect(() => {
  const setupSignaling = async () => {
    try {
      // Connect WebSocket
      await signalingService.connect();
      setSignalingConnected(true);
      setCurrentUser(prev => ({
        ...prev,
        id: signalingService.getClientId()
      }));

      // Dòng 213-240: Register message handlers
      
      // Handle room created
      signalingService.on('roomCreated', (msg) => {
        setRoomId(msg.roomId);
        setIsHost(true);
        setRoomMembers(msg.members || []);
        setAppState(APP_STATES.IN_ROOM);
      });

      // Handle room joined
      signalingService.on('roomJoined', (msg) => {
        setRoomId(msg.roomId);
        setIsHost(msg.isHost);
        setRoomMembers(msg.members || []);
        setAppState(APP_STATES.IN_ROOM);
      });

      // Handle room members update
      signalingService.on('roomMembers', (msg) => {
        setRoomMembers(msg.members || []);
      });

      // Handle member left
      signalingService.on('memberLeft', (msg) => {
        // Remove từ participants
        setParticipants(prev => 
          prev.filter(p => p.id !== msg.memberId)
        );
        
        // Close peer connection
        webRTCService.closePeerConnection(msg.memberId);
      });

      // Handle call started
      signalingService.on('callStarted', async (msg) => {
        setAppState(APP_STATES.CALLING);
        await startGroupCall();
      });

      // Dòng 245-250: Handle WebRTC signaling messages
      signalingService.on('offer', handleReceiveOffer);
      signalingService.on('answer', handleReceiveAnswer);
      signalingService.on('candidate', handleReceiveCandidate);

    } catch (error) {
      console.error('Failed to setup signaling:', error);
      setNotification({
        type: 'error',
        message: 'Failed to connect to server'
      });
    }
  };

  setupSignaling();
}, []);
```

**Signaling Setup Flow**:
```
1. Mount AppContext
2. setupSignaling()
3. signalingService.connect()
4. Register handlers cho tất cả message types
5. Sẵn sàng nhận/gửi signaling messages
```

#### **Create/Join Room (Dòng 350-450)**

```javascript
// Dòng 353-367: Create room function
const createRoom = useCallback(async (nickname) => {
  try {
    // Set user info
    setCurrentUser(prev => ({
      ...prev,
      name: nickname
    }));

    // Generate room ID (hoặc user nhập)
    const newRoomId = generateRoomId();  // Random 8 chars

    // Gửi createRoom message
    signalingService.send({
      type: 'createRoom',
      roomId: newRoomId,
      name: nickname
    });
    
    // Server sẽ trả về roomCreated message
    // → handler sẽ update state
  } catch (error) {
    console.error('Failed to create room:', error);
  }
}, []);

// Dòng 370-384: Join room function
const joinRoom = useCallback(async (nickname, roomIdToJoin) => {
  try {
    setCurrentUser(prev => ({
      ...prev,
      name: nickname
    }));

    // Gửi joinRoom message
    signalingService.send({
      type: 'joinRoom',
      roomId: roomIdToJoin,
      name: nickname
    });
    
    // Server sẽ trả về roomJoined message
  } catch (error) {
    console.error('Failed to join room:', error);
  }
}, []);
```

**Room Flow**:
```
CREATE ROOM:
1. User nhập nickname
2. createRoom(nickname)
3. Client → Server: {type: 'createRoom', roomId, name}
4. Server tạo room → gửi roomCreated
5. Client nhận → update state → chuyển IN_ROOM

JOIN ROOM:
1. User nhập nickname + room ID
2. joinRoom(nickname, roomId)
3. Client → Server: {type: 'joinRoom', roomId, name}
4. Server validation → gửi roomJoined
5. Server → All: {type: 'memberJoined'}
6. Client update members list
```

#### **Start Group Call (Dòng 452-580) - MESH TOPOLOGY**

```javascript
// Dòng 452-580: Bắt đầu group call
const startGroupCall = useCallback(async () => {
  try {
    console.log('🚀 Starting group call...');

    // Dòng 456-460: Get local stream
    const stream = await webRTCService.getLocalStream();
    setLocalStream(stream);

    // Dòng 462-473: Thêm local participant vào list
    setParticipants(prev => {
      const localExists = prev.find(p => p.isLocal);
      if (!localExists) {
        return [{
          id: signalingService.getClientId(),
          name: currentUserRef.current.name,
          isLocal: true,
          stream,
          connectionState: 'connected',
          iceState: 'connected',
          isMuted: currentUserRef.current.isMuted,
          isCameraOff: currentUserRef.current.isCameraOff
        }, ...prev];
      }
      return prev;
    });

    // Dòng 475-485: Setup WebRTC callbacks
    webRTCService.onRemoteStream = (peerId, peerName, remoteStream) => {
      // Thêm remote participant
      setParticipants(prev => {
        const exists = prev.find(p => p.id === peerId);
        if (!exists) {
          return [...prev, {
            id: peerId,
            name: peerName,
            isLocal: false,
            stream: remoteStream,
            connectionState: 'connected',
            iceState: 'connected',
            isMuted: false,
            isCameraOff: false
          }];
        }
        return prev;
      });
    };

    webRTCService.onConnectionStateChange = (peerId, peerName, state) => {
      // Update connection state trong UI
      setParticipants(prev => prev.map(p => 
        p.id === peerId ? { ...p, connectionState: state } : p
      ));
    };

    webRTCService.onTurnFallback = (peerId, peerName) => {
      // Hiển thị notification
      setNotification({
        type: 'warning',
        message: `P2P failed with ${peerName}, using TURN relay...`
      });
    };

    // Dòng 520-555: TẠO MESH CONNECTIONS
    // Với mỗi member khác (không phải mình)
    for (const member of roomMembers) {
      if (member.id !== signalingService.getClientId()) {
        console.log(`🔗 Initiating call to ${member.name}`);
        
        // 1. Tạo peer connection
        await initiateCallToPeer(roomIdRef.current, member.id, member.name);
      }
    }

    // Dòng 557-560: Start stats collection
    webRTCService.startStatsCollection();
    startCallTimer();

    // Dòng 562-565: Nếu là host → notify server
    if (isHost) {
      signalingService.send({
        type: 'startCall',
        roomId: roomIdRef.current
      });
    }

  } catch (error) {
    console.error('Failed to start call:', error);
    setNotification({
      type: 'error',
      message: 'Failed to start call: ' + error.message
    });
  }
}, [roomMembers, isHost]);
```

**Mesh Topology**:
```
3 người: Alice, Bob, Charlie

Alice tạo connections:
- Alice ↔ Bob
- Alice ↔ Charlie

Bob tạo connections:
- Bob ↔ Alice
- Bob ↔ Charlie

Charlie tạo connections:
- Charlie ↔ Alice
- Charlie ↔ Bob

Total: 3 connections (N*(N-1)/2)
Mỗi người maintain N-1 connections
```

#### **Initiate Call to Peer (Dòng 195-220) - OFFER SIDE**

```javascript
// Dòng 195-220: Bắt đầu call với 1 peer cụ thể
const initiateCallToPeer = useCallback(async (targetRoomId, peerId, peerName) => {
  console.log(`📞 Initiating call to ${peerName}`);
  
  // Dòng 198-199: Tạo peer connection
  webRTCService.createPeerConnection(peerId, peerName);
  
  // Dòng 201-204: Setup ICE candidate handler
  webRTCService.onIceCandidate(peerId, (candidate) => {
    // Gửi mỗi ICE candidate qua signaling
    signalingService.sendCandidate(targetRoomId, peerId, candidate);
  });
  
  // Dòng 206-210: Tạo và gửi offer
  const offer = await webRTCService.createOffer(peerId);
  signalingService.sendOffer(targetRoomId, peerId, offer);
}, []);
```

**Offer Flow**:
```
Alice → Bob:
1. createPeerConnection(bob-id)
2. Thêm local tracks
3. createOffer() → SDP offer
4. setLocalDescription(offer)
5. Trigger ICE gathering → onicecandidate events
6. sendOffer() qua signaling server
7. sendCandidate() cho mỗi ICE candidate
```

#### **Handle Receive Offer (Dòng 222-280) - ANSWER SIDE**

```javascript
// Dòng 222-280: Nhận offer từ peer
const handleReceiveOffer = useCallback(async (msg) => {
  const { sender, senderName, roomId: msgRoomId, offer } = msg;
  
  console.log(`📥 Received offer from ${senderName}`);
  
  // Dòng 228-240: Get local stream nếu chưa có
  if (!webRTCService.localStream) {
    try {
      const stream = await webRTCService.getLocalStream();
      setLocalStream(stream);
      
      // Thêm local participant
      setParticipants(prev => {
        const localExists = prev.find(p => p.isLocal);
        if (!localExists) {
          return [{
            id: signalingService.getClientId(),
            name: currentUserRef.current.name,
            isLocal: true,
            stream,
            ...
          }, ...prev];
        }
        return prev;
      });
    } catch (error) {
      console.error('Failed to get local stream:', error);
      return;
    }
  }

  // Dòng 252-263: Handle offer và tạo answer
  try {
    // 1. Set remote offer
    await webRTCService.handleOffer(sender, senderName, offer);
    
    // 2. Setup ICE candidate handler
    webRTCService.onIceCandidate(sender, (candidate) => {
      signalingService.sendCandidate(msgRoomId, sender, candidate);
    });
    
    // 3. Tạo answer
    const answer = await webRTCService.createAnswer(sender);
    
    // 4. Gửi answer
    signalingService.sendAnswer(msgRoomId, sender, answer);
    
    console.log(`📤 Sent answer to ${senderName}`);
  } catch (error) {
    console.error('Failed to handle offer:', error);
  }
}, []);
```

**Answer Flow**:
```
Bob nhận offer từ Alice:
1. handleReceiveOffer(msg)
2. getLocalStream() nếu chưa có
3. createPeerConnection(alice-id)
4. handleOffer() → setRemoteDescription(offer)
5. Thêm local tracks
6. createAnswer() → SDP answer
7. setLocalDescription(answer)
8. Trigger ICE gathering
9. sendAnswer() qua signaling
10. sendCandidate() cho mỗi ICE candidate
```

#### **Handle Answer (Dòng 282-295)**

```javascript
// Dòng 282-295: Nhận answer từ peer
const handleReceiveAnswer = useCallback(async (msg) => {
  const { sender, senderName, answer } = msg;
  
  console.log(`📥 Received answer from ${senderName}`);
  
  try {
    // Set remote answer
    await webRTCService.handleAnswer(sender, answer);
    console.log(`✅ Answer processed from ${senderName}`);
  } catch (error) {
    console.error('Failed to handle answer:', error);
  }
}, []);
```

#### **Handle ICE Candidate (Dòng 297-310)**

```javascript
// Dòng 297-310: Nhận ICE candidate từ peer
const handleReceiveCandidate = useCallback(async (msg) => {
  const { sender, candidate } = msg;
  
  try {
    // Thêm candidate vào peer connection
    await webRTCService.handleCandidate(sender, candidate);
  } catch (error) {
    console.error('Failed to handle candidate:', error);
  }
}, []);
```

**Complete Signaling Flow**:
```
ALICE (Caller)                          BOB (Callee)
---------------                         -------------
1. createPeerConnection()
2. addTracks()
3. createOffer()
4. setLocalDescription(offer)
5. → ICE gathering starts
6. onicecandidate → send candidates →
                                        7. Receive offer
                                        8. createPeerConnection()
                                        9. addTracks()
                                        10. setRemoteDescription(offer)
                                        11. createAnswer()
                                        12. setLocalDescription(answer)
13. ← Receive answer ←                  13. → ICE gathering starts
14. setRemoteDescription(answer)        14. onicecandidate → send candidates
15. ← Receive ICE candidates ←          15. → Send ICE candidates →
16. addIceCandidate()                   16. addIceCandidate()
17. ICE connectivity checks
18. ✅ CONNECTED ✅
```

---

Tôi đã hoàn thành giải thích chi tiết **PHẦN 4 (WebRTC Service)** và **PHẦN 5 (AppContext)**. 

Bạn muốn tôi tiếp tục với **PHẦN 6: UI COMPONENTS** (JoinRoomScreen, VideoGrid, ControlBar...) không?

Hoặc bạn có câu hỏi nào về phần đã giải thích?

---

## 📂 PHẦN 6: UI COMPONENTS

### File: `frontend/src/App.jsx`

#### **Main App Structure (Dòng 1-35)**

```javascript
// Dòng 1-5: Imports
import { AppProvider, useAppContext } from './context/AppContext';
import { APP_STATES } from './data/mockData';
import JoinRoomScreen from './components/JoinRoomScreen';
import RoomLobbyScreen from './components/RoomLobbyScreen';
import VideoCallScreen from './components/VideoCallScreen';
import CallEndedScreen from './components/CallEndedScreen';

// Dòng 8-22: App content với state-based routing
const AppContent = () => {
  const { appState } = useAppContext();

  // Render component theo app state (state machine)
  switch (appState) {
    case APP_STATES.IDLE:       // Chưa join room
      return <JoinRoomScreen />;
    case APP_STATES.IN_ROOM:    // Trong lobby
      return <RoomLobbyScreen />;
    case APP_STATES.CALLING:    // Đang gọi
      return <VideoCallScreen />;
    case APP_STATES.ENDED:      // Call đã kết thúc
      return <CallEndedScreen />;
    default:
      return <JoinRoomScreen />;
  }
};

// Dòng 25-33: App wrapper với Context Provider
function App() {
  return (
    <AppProvider>
      {/* AppContent có access đến context */}
      <AppContent />
    </AppProvider>
  );
}
```

**State Machine Routing**:
```
IDLE (JoinRoomScreen) 
  ↓ createRoom/joinRoom
IN_ROOM (RoomLobbyScreen)
  ↓ startCall
CALLING (VideoCallScreen)
  ↓ hangup
ENDED (CallEndedScreen)
  ↓ rejoin
IDLE
```

---

### File: `frontend/src/components/JoinRoomScreen.jsx`

#### **Validation và Event Handlers**

```javascript
// Validation inputs
const validateInputs = (requireRoomId = false) => {
  const newErrors = {};
  
  // Validate nickname
  if (!nickname.trim()) {
    newErrors.nickname = 'Please enter your nickname';
  } else if (nickname.trim().length < 2) {
    newErrors.nickname = 'Nickname must be at least 2 characters';
  }
  
  // Validate room ID (chỉ khi join)
  if (requireRoomId && !roomIdInput.trim()) {
    newErrors.roomId = 'Please enter a Room ID';
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;  // true nếu không có errors
};

// Create room handler
const handleCreateRoom = async () => {
  if (!validateInputs(false)) return;  // Không cần room ID
  
  setIsLoading(true);
  await new Promise(resolve => setTimeout(resolve, 500));
  createRoom(nickname.trim());  // Gọi context function
  setIsLoading(false);
};

// Join room handler
const handleJoinRoom = async () => {
  if (!validateInputs(true)) return;  // Cần room ID
  
  setIsLoading(true);
  await new Promise(resolve => setTimeout(resolve, 500));
  joinRoom(nickname.trim(), roomIdInput.trim());
  setIsLoading(false);
};
```

**UI Flow:**
```
1. User thấy form với 2 inputs
2. Nhập nickname (required)
3. Option A: Không nhập room ID → click "Create New Room"
4. Option B: Nhập room ID → click "Join Room"
5. Validation
6. Loading state
7. Call context function
8. State chuyển sang IN_ROOM
```

---

### File: `frontend/src/components/VideoGrid.jsx`

#### **Grid Layout Algorithm**

```javascript
// Calculate grid layout
const getGridLayout = (count) => {
  // 1 người
  if (count === 1) return { cols: 1, rows: 1 };
  
  // 2 người - side by side trên desktop, stack trên mobile
  if (count === 2) return { cols: 2, rows: 1 };
  
  // 3-4 người - grid 2x2
  if (count <= 4) return { cols: 2, rows: 2 };
  
  // 5-6 người - grid 3x2
  if (count <= 6) return { cols: 3, rows: 2 };
  
  // 7-9 người - grid 3x3
  if (count <= 9) return { cols: 3, rows: 3 };
  
  // 10-12 người - grid 4x3
  if (count <= 12) return { cols: 4, rows: 3 };
  
  // 13-16 người - grid 4x4
  if (count <= 16) return { cols: 4, rows: 4 };
  
  // > 16 người - grid 5x5 max
  return { cols: 5, rows: 5 };
};
```

**Grid Layout Examples:**
```
1 người:  [████████]

2 người:  [████][████]

3-4 người:
[████][████]
[████][████]

5-6 người:
[███][███][███]
[███][███][███]

7-9 người:
[███][███][███]
[███][███][███]
[███][███][███]
```

---

### File: `frontend/src/components/VideoTile.jsx`

#### **Video Tile Component**

```javascript
// Attach stream to video element
useEffect(() => {
  if (videoRef.current && participant.stream) {
    // Set srcObject
    videoRef.current.srcObject = participant.stream;
    
    // Event listeners
    const video = videoRef.current;
    
    video.onloadedmetadata = () => {
      // Play video khi metadata loaded
      video.play()
        .then(() => setIsVideoPlaying(true))
        .catch(err => console.error('Error playing video:', err));
    };

    video.onplay = () => setIsVideoPlaying(true);
    video.onpause = () => setIsVideoPlaying(false);
  }

  // Cleanup
  return () => {
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };
}, [participant.stream]);
```

**Video Tile Features:**
- ✅ Video element với auto-play
- ✅ Camera off overlay (avatar + name)
- ✅ Mic muted indicator
- ✅ Connection quality indicator
- ✅ Local vs Remote badges
- ✅ TURN relay indicator
- ✅ Hover để xem chi tiết connection state

---

### File: `frontend/src/components/ControlBar.jsx`

**Control Bar Layout:**
```
┌───────────────────────────────────────┐
│  [🎤]  [📹]  [📞]  [📊]  [⚙️]      │
│  Mic   Cam   End  Stats Settings   │
└───────────────────────────────────────┘
```

**Button States:**
- **Mic**: Gray (unmuted) → Red (muted)
- **Camera**: Gray (on) → Red (off)
- **End Call**: Always red (danger action)
- **Stats/Settings**: Gray → Blue (active)

---

### File: `frontend/src/components/StatsPanel.jsx`

**Stats Panel Sections:**
1. **Call Info**: Start time, duration
2. **Connection State**: ICE state, connection state, candidate type
3. **ICE Candidates**: Local và remote candidate details
4. **Network Stats**: Bytes, packets, jitter, RTT
5. **Media Stats**: Resolution, codecs

**TURN Detection:**
- Candidate type = "relay" → highlight vàng
- Hiển thị rõ đang dùng TURN server

---

## 🎯 TỔNG HỢP LUỒNG HOÀN CHỈNH

### **User Journey từ đầu đến cuối:**

```
┌──────────────────────────────────────────────────────────────┐
│                    USER JOURNEY                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. JoinRoomScreen                                           │
│     ↓ User nhập nickname + roomId (optional)                │
│     ↓ Click "Create" hoặc "Join"                            │
│     ↓ validateInputs() → createRoom()/joinRoom()            │
│                                                              │
│  2. AppContext                                               │
│     ↓ signalingService.send({type: 'createRoom',...})       │
│     ↓ WebSocket message → Server                            │
│                                                              │
│  3. Server (server.js)                                       │
│     ↓ handleMessage() → handleCreateRoom()                  │
│     ↓ Tạo room object, lưu vào Map                          │
│     ↓ sendToClient({type: 'roomCreated',...})               │
│     ↓ broadcast({type: 'roomMembers',...})                  │
│                                                              │
│  4. AppContext (receive roomCreated)                         │
│     ↓ signalingService.on('roomCreated', handler)           │
│     ↓ setAppState(IN_ROOM)                                  │
│     ↓ setRoomId(), setIsHost()                              │
│                                                              │
│  5. RoomLobbyScreen renders                                 │
│     ↓ Hiển thị room ID, member list                         │
│     ↓ User click "Start Group Call"                         │
│     ↓ startGroupCall()                                      │
│                                                              │
│  6. startGroupCall() - AppContext                            │
│     ↓ webRTCService.getLocalStream()                        │
│     ↓ Browser popup xin permission                          │
│     ↓ User allow → MediaStream                              │
│     ↓ For each member: initiateCallToPeer()                 │
│                                                              │
│  7. initiateCallToPeer()                                     │
│     ↓ webRTCService.createPeerConnection()                  │
│     │   ↓ new RTCPeerConnection({iceServers})               │
│     │   ↓ pc.addTrack() for each local track                │
│     │   ↓ Setup event listeners                             │
│     ↓ webRTCService.createOffer()                           │
│     │   ↓ pc.createOffer()                                  │
│     │   ↓ pc.setLocalDescription(offer)                     │
│     │   ↓ Trigger ICE gathering                             │
│     │   ↓ onicecandidate events                             │
│     ↓ signalingService.sendOffer(offer)                     │
│     ↓ signalingService.sendCandidate(candidate) * N         │
│                                                              │
│  8. Server forwards offer                                    │
│     ↓ handleOffer() → sendToClient(target, offer)           │
│     ↓ handleCandidate() → sendToClient(target, candidate)   │
│                                                              │
│  9. Peer nhận offer - AppContext                             │
│     ↓ handleReceiveOffer()                                  │
│     ↓ webRTCService.handleOffer()                           │
│     │   ↓ createPeerConnection()                            │
│     │   ↓ pc.setRemoteDescription(offer)                    │
│     ↓ webRTCService.createAnswer()                          │
│     │   ↓ pc.createAnswer()                                 │
│     │   ↓ pc.setLocalDescription(answer)                    │
│     ↓ signalingService.sendAnswer(answer)                   │
│     ↓ signalingService.sendCandidate(candidate) * N         │
│                                                              │
│  10. Server forwards answer                                  │
│     ↓ handleAnswer() → sendToClient(target, answer)         │
│                                                              │
│  11. Original caller nhận answer                             │
│     ↓ handleReceiveAnswer()                                 │
│     ↓ webRTCService.handleAnswer()                          │
│     │   ↓ pc.setRemoteDescription(answer)                   │
│                                                              │
│  12. ICE Connectivity Checks                                 │
│     ↓ Browser tests all candidate pairs                     │
│     ↓ STUN → discover public IP                             │
│     ↓ Try direct P2P (host candidates)                      │
│     ↓ Try P2P via NAT (srflx candidates)                    │
│     ↓ Fallback TURN (relay candidates) if needed            │
│     ↓ Select best candidate pair                            │
│                                                              │
│  13. Connection Established                                  │
│     ↓ onconnectionstatechange → 'connected'                 │
│     ↓ oniceconnectionstatechange → 'connected'              │
│     ↓ checkCandidateType() via getStats()                   │
│     ↓ pc.ontrack → receive remote MediaStream               │
│     ↓ webRTCService.onRemoteStream callback                 │
│                                                              │
│  14. AppContext updates participants                         │
│     ↓ setParticipants([...prev, newParticipant])            │
│     ↓ setAppState(CALLING)                                  │
│                                                              │
│  15. VideoCallScreen renders                                 │
│     ↓ VideoGrid renders                                     │
│     ↓ VideoTile * N renders                                 │
│     │   ↓ videoRef.current.srcObject = stream               │
│     │   ↓ video.play()                                      │
│     ↓ ControlBar renders                                    │
│     ↓ ConnectionStatus renders                              │
│     ↓ startStatsCollection()                                │
│                                                              │
│  16. During Call                                             │
│     ↓ User click mic → toggleMic()                          │
│     │   ↓ webRTCService.toggleAudio()                       │
│     │   ↓ track.enabled = false                             │
│     │   ↓ Update UI (red icon)                              │
│     ↓ User click stats → setShowStats(true)                 │
│     │   ↓ StatsPanel slides in                              │
│     │   ↓ getAggregatedStats() every 2s                     │
│     │   ↓ Display metrics                                   │
│     ↓ TURN detection                                        │
│     │   ↓ P2P timeout (10s) → onTurnFallback()              │
│     │   ↓ Toast: "P2P failed, using TURN..."               │
│     │   ↓ checkCandidateType() → 'relay'                    │
│     │   ↓ Badge: "TURN Relay" on VideoTile                  │
│                                                              │
│  17. End Call                                                │
│     ↓ User click hangup → endCall()                         │
│     ↓ webRTCService.closeAllConnections()                   │
│     │   ↓ pc.close() for each connection                    │
│     ↓ webRTCService.stopLocalStream()                       │
│     │   ↓ track.stop() for each track                       │
│     ↓ signalingService.send({type: 'leaveRoom'})            │
│     ↓ Server cleanup                                        │
│     │   ↓ room.members.delete(clientId)                     │
│     │   ↓ broadcast('memberLeft')                           │
│     ↓ setAppState(ENDED)                                    │
│     ↓ CallEndedScreen renders                               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## ✅ KẾT LUẬN

### **Files đã giải thích chi tiết:**

#### **Backend (1 file):**
- ✅ `server/server.js` (528 dòng)

#### **Frontend Services (3 files):**
- ✅ `services/config.js` (77 dòng)
- ✅ `services/signaling.js` (319 dòng)  
- ✅ `services/webrtc.js` (603 dòng)

#### **Frontend Context (1 file):**
- ✅ `context/AppContext.jsx` (657 dòng)

#### **Frontend Components (10 files):**
- ✅ `App.jsx` (35 dòng)
- ✅ `JoinRoomScreen.jsx` (189 dòng)
- ✅ `RoomLobbyScreen.jsx` (169 dòng)
- ✅ `VideoCallScreen.jsx` (84 dòng)
- ✅ `VideoGrid.jsx` (86 dòng)
- ✅ `VideoTile.jsx` (150 dòng)
- ✅ `ControlBar.jsx` (120 dòng)
- ✅ `StatsPanel.jsx` (212 dòng)
- ✅ `ConnectionStatus.jsx` (60 dòng)
- ✅ `Toast.jsx` (80 dòng)

**TỔNG: 15 files | ~3300+ dòng code đã được giải thích chi tiết**

---

### **Key Concepts đã cover:**

1. ✅ **WebRTC Core**: RTCPeerConnection, MediaStream, ICE, SDP
2. ✅ **Signaling**: WebSocket protocol, message routing
3. ✅ **STUN/TURN**: ICE servers, fallback mechanism, detection
4. ✅ **Mesh Topology**: N*(N-1)/2 connections
5. ✅ **State Management**: React Context pattern
6. ✅ **UI/UX**: Google Meet clone, responsive design
7. ✅ **Statistics**: getStats() API, realtime metrics
8. ✅ **Error Handling**: Validation, timeouts, cleanup

---

## 📖 SỬ DỤNG TÀI LIỆU NÀY

### **Để học:**
1. Đọc theo thứ tự: Config → Server → Services → Context → Components
2. Chạy code trong đầu theo flow diagrams
3. Test thực tế và đối chiếu với giải thích

### **Để debug:**
1. Tìm component/function bị lỗi
2. Đọc giải thích chi tiết dòng code đó
3. Check console logs theo pattern đã giải thích
4. Verify state và props

### **Để mở rộng:**
1. Hiểu rõ architecture hiện tại
2. Xác định điểm cần modify
3. Follow existing patterns
4. Test thoroughly

---

**🎉 HOÀN THÀNH GIẢI THÍCH TOÀN BỘ DỰ ÁN!**

*Tài liệu này giải thích chi tiết 3300+ dòng code với 15 files chính, bao gồm toàn bộ luồng từ UI → Signaling → WebRTC → Rendering.*
