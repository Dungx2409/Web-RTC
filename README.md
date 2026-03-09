# Đồ án Hệ Thống Video Call Nhóm WebRTC (Mesh Topology)


## Cấu trúc thư mục

*   `server/`: Signaling Server viết bằng Node.js (dùng Express và `ws` WebSocket).
*   `frontend/`: Client App viết bằng React + Vite + TailwindCSS.

## 1. Yêu cầu hệ thống

*   Node.js v16 trở lên
*   Trình duyệt hỗ trợ WebRTC API (Chrome, Firefox, Safari, Edge...)

## 2. Cài đặt

Mở Terminal và clone code về:

```bash
git clone https://github.com/Dungx2409/Web-RTC.git
cd Web-RTC
```

**Cài đặt các thư viện cần thiết:**

Mở Terminal 1 (cho thư mục Backend):
```bash
cd server
npm install
```

Mở Terminal 2 (cho thư mục Frontend):
```bash
cd frontend
npm install
```

## 3. Cách chạy ứng dụng

Đồ án có 2 cách chạy chính: chạy Local trên máy để test nhanh, hoặc Deploy thẳng nhóm Backend/Frontend lên Render/Vercel.

### Cách 1: Chạy Local (Môi trường dev trên máy tính)

*   **Chạy Backend (Signaling Server):**
    ```bash
    cd server
    npm run dev
    # Server mặc định sẽ chạy ở ws://localhost:3001
    ```
*   **Chạy Frontend (React App):**
    ```bash
    cd frontend
    npm run dev
    # Web sẽ chạy ở http://localhost:5173
    ```
Lúc này bạn có thể mở 2-3 tab ẩn danh trên cùng 1 máy tính bằng đường link `http://localhost:5173` để test chức năng tạo và gọi video vào cùng 1 room.

*(Mẹo test cho thiết bị khác mạng WLAN: Nếu bạn dùng ngrok, hãy chạy `ngrok http 5173` để lấy link HTTPS public test trên điện thoại)*

### Cách 2: Deploy lên thực tế (Ví dụ: Web Service của Render & Vercel)

*   **Deploy Backend:** Đẩy nguyên folder `server` lên Web Service của Render. Biến môi trường mặc định là chạy port Render tự cấp. Render sẽ tự cung cấp link wss:// cho bạn.
*   **Deploy Frontend:** Đẩy module `frontend` lên Vercel hoặc Render Static Web. Trên Vercel, bạn vào mục Environment Variables, thêm biến môi trường là URL của tín hiệu Render ở trên: `VITE_SIGNALING_URL=wss://<link-render-app>.onrender.com`.

## 4. Cấu hình TURN Server (Metered Cloud API)

Hệ thống tự động ưu tiên kết nối ngang hàng P2P (Host/STUN) trước, nếu mạng quá kém bị chặn port, nó sẽ fallback sang dùng relay TURN server sau 10 giây.

Vì Render không hỗ trợ cấp phát cổng UDP cho WebRTC nên việc dùng Docker tự chạy ứng dụng Coturn trên Web Service là bất khả thi.
Giải pháp tối ưu và thực tế nhất được cài đặt sẵn trong codebase là sử dụng **TURN API Cloud của Metered**.

**Cách lấy mã cấu hình:**
1. Truy cập [Metered TURN](https://www.metered.ca/tools/openrelay) và đăng ký tài khoản miễn phí.
2. Bạn sẽ nhận được 1 URL API có dạng: `https://<ten-project>.metered.ca/api/v1/turn/credentials?apiKey=<MA-API-KEY>`
3. Copy toàn bộ URL API đó.

### Cấu hình lúc chạy Local (Máy tính cá nhân):
1. Tại thư mục `frontend`, tạo một file tên là `.env.local`
2. Mở file đó lên và dán dòng này vào:
```env
VITE_METERED_TURN_URL=https://<ten-project>.metered.ca/api/v1/turn/credentials?apiKey=<MA-API-KEY>
```
3. Chạy `npm run dev` như bình thường. Vite sẽ tự nạp TURN server vào config.

### Cấu hình lúc Release (Render / Vercel):
1. Vào trang Dashboard quản lý dự án Frontend (trên Vercel/Render).
2. Tìm đến mục **Settings $\rightarrow$ Environment Variables**.
3. Bấm Add New Variable:
   - **Key:** `VITE_METERED_TURN_URL`
   - **Value:** Dán cái link URL API Metered của bạn vào.
4. Lưu lại và bấm **Redeploy** là xong! Project tải lên mạng sẽ tự động sở hữu dàn TURN đa năng vượt mọi loại Firewall 4G.
## 5. Hướng dẫn Test nghiệm thu đồ án (Room, P2P, và TURN)

### A. Test gọi nhóm trong Room cùng mạng
1. Mở 2 hoặc 3 cửa sổ trình duyệt (hoặc tải web từ link Render/Vercel).
2. **Cửa Sổ 1**: Nhập Nickname "User 1", nhấn **Create Room**. Copy mã `Room ID` vừa hiện ra.
3. Các **Cửa Sổ còn lại**: Lần lượt nhập Nickname, dán mã `Room ID` trên và nhấn **Join Room**. Mọi người sẽ tụ tập lại ở Sảnh Chờ.
4. Host (User 1) nhấn **Start Group Call**. Hệ thống tự động thiết lập Mesh đa chiều. 
5. Sẽ thấy Grid Layout chia đều màn hình các video.
6. Kiểm tra trong Static hoặc log sẽ thấy đang sử dụng P2P server - Host STUN server (HOST)

### B. Test gọi nhóm trong Room khác mạng
1. Dùng laptop mở 1 cửa sổ trình duyệt.
2. **Cửa Sổ 1**: Nhập Nickname "User 1", nhấn **Create Room**. Copy mã `Room ID` vừa hiện ra.
3. Dùng thiết bị khác sử dụng mạng khác và mở 1 cửa sổ trình duyệt.
4. Lần lượt nhập Nickname, dán mã `Room ID` trên và nhấn **Join Room**. Mọi người sẽ tụ tập lại ở Sảnh Chờ.
5. Host (User 1) nhấn **Start Group Call**. Hệ thống tự động thiết lập Mesh đa chiều. 
6. Sẽ thấy Grid Layout chia đều màn hình các video.
7. Kiểm tra trong Static hoặc log sẽ thấy đang sử dụng P2P server - Host STUN server (SRFLX)

### C. Test kịch bản "Xin phép vào phòng đang họp"
1. Đang có 2, 3 bạn đang họp nhóm Mesh trong Room.
2. Ném link Room ID cho 1 **người thứ N**. Người này cố gắng Join lúc các bạn trong phòng đang bật cam họp.
3. Màn hình người mới sẽ hiện trạng thái đứng chờ **"Waiting for Host Approval"**, tránh việc đánh sập luồng video đột ngột.
4. Màn hình của Host sẽ nhảy notification, Host bấm ✓ thì luồng P2P mới bắt đầu kéo node mới này vào.
5. Nếu deny thì người thứ N sẽ bị đẩy ra màn hình dashboard.

### D. Test kịch bản cúp máy và dọn Socket
1. Đang Mesh lưới 4 Người $\rightarrow$ Người thứ 2 bấm nút **Hangup** đỏ chót rời đi. Video người này biến mất nhẹ nhàng nhưng 3 người còn lại cam vẫn trong, không đứt kết nối. P2P đã được xóa thành công cho riêng socket người 2.
2. Host bấm nút **Hangup**. Cả phòng thoát, tự động đá tất cả ra. Host có thể tiếp tục tạo phòng mới ở trang chủ bình thường (tài nguyên RAM trên node.js đã được sweep sạch).

### E. Test chức năng Fallback qua TURN Server bằng 4G
1. Lấy Máy Laptop (bắt WiFi) $\rightarrow$ Dùng Điện Thoại (Tắt WiFi, Bật 4G phát mạng).
2. Dùng Điện thoại tải web, tạo Room (làm Host), laptop Copy Room ID vào the. 
3. *Trường hợp Firewall mạng chặn P2P UDP ngang hàng*: Màn hình sẽ Load lâu hơn chút và hiện Toast Cảnh Báo: **"P2P failed, trying TURN relay..."** ngay tại cột mốc 10 giây (cấu hình biến số `P2P_TIMEOUT`).
4. Lúc này, candidate đẩy fallback dùng mảng Relay TURN Server, 5 giây sau hình ảnh xuất hiện.
5. Xem log chứng minh: 
   - Click nút cờ lê `[Stats]` dưới màn hình để bật **Debug Panel**. Panel này giả lập log console chọc xuống.
   - App lọc log lấy `pc.getStats()`, bóc trần kiểu candidate và bắn dòng log server: `🔗 P2P Connection: User 1

### F. Test chức năng Fallback qua TURN Server bằng cơ chế có sẵn
1. Khi vào cuộc họp, ở phần cài đặt, điều chỉnh ICE transport policy thành `relay only`.
2. Sau đó end cuộc gọi và tạo lại.
3. Lúc này, candidate đẩy fallback dùng mảng Relay TURN Server
4. Xem log chứng minh: 
   - Click nút cờ lê `[Stats]` dưới màn hình để bật **Debug Panel**. Panel này giả lập log console chọc xuống.
   - App lọc log lấy `pc.getStats()`, bóc trần kiểu candidate và bắn dòng log server: `🔗 P2P Connection: User 1 <-> User 2 via [TURN Relay]`. 
