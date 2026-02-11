# 📋 Hướng dẫn Quản lý nhiều Phòng (Room Management)

Tính năng mới cho phép bạn **xem danh sách và quản lý tất cả các phòng đang hoạt động**.

---

## ✨ Tính năng mới

### 1. **Browse Active Rooms**
- Xem danh sách tất cả phòng đang hoạt động
- Thông tin hiển thị:
  - Room ID
  - Số lượng thành viên
  - Trạng thái cuộc gọi (Live/Idle)
  - Thời gian tạo phòng

### 2. **Auto-refresh**
- Tự động cập nhật danh sách phòng mỗi 5 giây
- Có thể bật/tắt auto-refresh
- Manual refresh button

### 3. **Search & Filter**
- Tìm kiếm phòng theo Room ID
- Lọc kết quả real-time

### 4. **Quick Join**
- Click "Join" để tham gia phòng ngay lập tức
- Không cần nhập Room ID thủ công

---

## 🚀 Cách sử dụng

### **Bước 1: Vào trang chủ**
Truy cập: `https://webrtc-frontend-opgy.onrender.com`

### **Bước 2: Click "Browse Active Rooms"**
- Ở màn hình đầu tiên, nhập tên (optional)
- Click nút **"Browse Active Rooms"**

### **Bước 3: Xem danh sách phòng**
Bạn sẽ thấy:
- ✅ Tất cả phòng đang active
- 👥 Số lượng member mỗi phòng
- 🟢 Trạng thái "Live" nếu đang có cuộc gọi
- ⏰ Thời gian tạo phòng

### **Bước 4: Join phòng**
- Hover vào phòng muốn join
- Click nút **"Join"** 
- Tự động vào phòng

### **Bước 5: Quản lý**
- **Auto-refresh**: Toggle nút "Auto" để bật/tắt auto-refresh
- **Manual refresh**: Click icon refresh để update thủ công
- **Search**: Gõ Room ID vào ô search để filter
- **Back**: Click "Back" để quay về trang tạo phòng

---

## 🎯 Use Cases

### 1. **Tìm bạn bè**
Bạn bè của bạn tạo phòng nhưng quên gửi Room ID? 
→ Browse rooms và tìm họ!

### 2. **Join nhóm đang gọi**
Muốn join nhóm đang gọi video?
→ Xem các phòng có badge "🟢 Live"

### 3. **Monitor rooms**
Admin muốn xem có bao nhiêu phòng active?
→ Browse rooms với auto-refresh

### 4. **Quick access**
Không muốn nhập Room ID dài?
→ Browse và click Join

---

## 🔧 Technical Details

### **Backend API đã có sẵn**
Server đã implement các endpoints:

```
GET /api/rooms
→ Lấy danh sách tất cả phòng

GET /api/rooms/:roomId
→ Lấy thông tin chi tiết 1 phòng

GET /health
→ Health check server
```

### **Frontend Components**

**RoomListScreen.jsx** - Component quản lý danh sách phòng:
- Fetch rooms từ API
- Auto-refresh mỗi 5s
- Search & filter
- Join room

**JoinRoomScreen.jsx** - Đã update:
- Thêm button "Browse Active Rooms"
- Separator "or"
- Better UI/UX

**App.jsx** - State management:
- Toggle giữa JoinScreen ↔ RoomListScreen
- Handle room selection

---

## 📸 Screenshots

### **1. Join Screen với nút Browse**
```
┌─────────────────────────────────────┐
│         WebRTC Meet                 │
│                                     │
│  Name: [_____________]              │
│  Room ID: [_____________]           │
│                                     │
│  [📋 Browse Active Rooms]           │
│                                     │
│  ────────── or ──────────           │
│                                     │
│  [➕ Create]  [→ Join]              │
└─────────────────────────────────────┘
```

### **2. Room List Screen**
```
┌─────────────────────────────────────┐
│  Active Rooms          [Auto] [🔄]  │
│  5 rooms available          [Back]  │
│                                     │
│  🔍 Search rooms...                 │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 🎥 Room abc-123     🟢 Live   │ │
│  │    👥 3 members  ⏰ 10m ago   │ │
│  │                      [Join →] │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 🎥 Room xyz-789               │ │
│  │    👥 1 member   ⏰ 5m ago    │ │
│  │                      [Join →] │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 🎨 UI Features

### **Live Indicator**
Phòng đang có cuộc gọi hiển thị:
```
🟢 Live (màu xanh, nháy)
```

### **Member Count**
```
👥 3 members
```

### **Time Ago**
```
⏰ Just now
⏰ 5m ago
⏰ 2h ago
⏰ Yesterday
```

### **Auto-refresh Indicator**
Khi bật auto-refresh:
```
[🔄 Auto] ← Icon quay
"Auto-refreshing every 5 seconds"
```

### **Empty State**
Khi không có phòng:
```
👥 No active rooms
Be the first to create a room!
[Create Room]
```

---

## ⚙️ Cấu hình

### **Auto-refresh Interval**
Mặc định: 5 giây

Muốn thay đổi? Sửa trong `RoomListScreen.jsx`:
```javascript
interval = setInterval(fetchRooms, 5000); // 5000ms = 5s
```

### **API Endpoint**
Tự động detect từ `VITE_SIGNALING_URL`:
- `ws://localhost:3001` → `http://localhost:3001/api/rooms`
- `wss://xxx.onrender.com` → `https://xxx.onrender.com/api/rooms`

---

## 🚀 Deploy lại

Đã push code lên GitHub branch `logic`.

### **Redeploy trên Render:**

1. Vào Render Dashboard
2. Service: **webrtc-frontend**
3. Click **"Manual Deploy"** → Branch **logic**
4. Đợi 3-5 phút
5. Refresh browser

---

## 🧪 Testing

### **Test scenario 1: Browse rooms**
1. Mở tab 1 → Tạo phòng A
2. Mở tab 2 → Click "Browse Active Rooms"
3. ✅ Thấy phòng A trong danh sách
4. ✅ Số member = 1
5. Click Join → Vào phòng A thành công

### **Test scenario 2: Live indicator**
1. Tab 1 + Tab 2 đã join phòng
2. Start call
3. Mở tab 3 → Browse rooms
4. ✅ Thấy badge "🟢 Live"

### **Test scenario 3: Auto-refresh**
1. Browse rooms (danh sách trống)
2. Mở tab khác → Tạo phòng mới
3. Quay lại tab browse
4. ✅ Sau 5s, phòng mới xuất hiện tự động

### **Test scenario 4: Search**
1. Browse rooms (nhiều phòng)
2. Gõ Room ID vào search
3. ✅ Filter kết quả real-time

---

## 📊 Monitoring

### **Check API health**
```bash
curl https://webrtc-signaling-xxx.onrender.com/health
```

Response:
```json
{
  "status": "ok",
  "uptime": 12345,
  "rooms": 5,
  "clients": 8
}
```

### **Get rooms list**
```bash
curl https://webrtc-signaling-xxx.onrender.com/api/rooms
```

Response:
```json
[
  {
    "id": "abc-123",
    "memberCount": 3,
    "callActive": true,
    "createdAt": "2026-02-11T03:00:00Z"
  }
]
```

---

## 🐛 Troubleshooting

### **"Failed to load rooms"**
**Nguyên nhân:** Backend không accessible

**Giải pháp:**
1. Check backend đang chạy: `curl https://YOUR-BACKEND/health`
2. Check CORS: Backend phải enable CORS
3. Check environment variables: `VITE_SIGNALING_URL`

---

### **Rooms không auto-refresh**
**Nguyên nhân:** Auto-refresh bị tắt

**Giải pháp:**
1. Click nút "Auto" để bật
2. Hoặc refresh thủ công

---

### **Empty state dù có phòng**
**Nguyên nhân:** API trả về empty array

**Giải pháp:**
1. Tạo phòng mới
2. Check backend logs
3. Test API: `/api/rooms`

---

## 🎉 Benefits

### **Cho Users:**
- ✅ Dễ tìm và join phòng
- ✅ Không cần nhớ Room ID
- ✅ Thấy phòng nào đang live
- ✅ Quick access

### **Cho Admins:**
- ✅ Monitor tất cả phòng
- ✅ Thống kê số lượng users
- ✅ Real-time updates
- ✅ API cho automation

### **Cho Developers:**
- ✅ RESTful API sẵn có
- ✅ Easy to extend
- ✅ Clean architecture
- ✅ Reusable components

---

## 🔮 Future Enhancements

Có thể thêm:
- **Room categories/tags**
- **Room passwords**
- **Max members limit**
- **Room expiration**
- **Admin controls** (kick, mute all)
- **Room analytics** (duration, bandwidth)
- **Favorite rooms**
- **Recent rooms history**

---

## 📚 Related Files

```
frontend/src/components/RoomListScreen.jsx  ← Main component
frontend/src/components/JoinRoomScreen.jsx  ← Updated với Browse button
frontend/src/App.jsx                        ← State management
server/server.js                            ← API endpoints (lines 470-520)
```

---

**✅ Done! Giờ bạn có thể quản lý nhiều phòng dễ dàng!**

Có câu hỏi? Hãy test và feedback! 🚀
