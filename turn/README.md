# TURN Server (Coturn) Setup Guide

## Overview
Coturn is an open-source TURN/STUN server implementation that enables WebRTC to traverse NATs and firewalls.

## Quick Start with Docker

### 1. Navigate to the turn directory
```bash
cd /home/wintermouse/Documents/Development/Web-RTC/turn
```

### 2. Start the TURN server
```bash
docker-compose up -d
```

### 3. Check if it's running
```bash
docker logs webrtc-turn-server
```

### 4. Test the TURN server
```bash
# Test STUN
turnutils_stunclient localhost

# Test TURN (if you have turnutils installed)
turnutils_uclient -u webrtc -w webrtc123 localhost
```

## Configuration

### Default Credentials
- **Username:** webrtc
- **Password:** webrtc123

### Ports
- **3478 (UDP/TCP):** Standard TURN port
- **5349 (TCP):** TLS TURN port (TURNS)

### Changing Credentials
1. Edit `turnserver.conf`
2. Change the line: `user=webrtc:webrtc123` to your desired credentials
3. Restart the container: `docker-compose restart`

## Production Setup

### 1. Set External IP
For a server behind NAT, edit `turnserver.conf`:
```
external-ip=YOUR_PUBLIC_IP
```

### 2. Enable TLS (TURNS)
1. Obtain SSL certificates
2. Place them in `./certs/` directory
3. Uncomment TLS lines in `docker-compose.yml`
4. Uncomment cert/pkey lines in `turnserver.conf`

### 3. Firewall Configuration
Open the following ports:
- 3478 UDP/TCP (TURN)
- 5349 TCP (TURNS)
- 49152-65535 UDP (Relay ports)

```bash
# UFW example
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp
sudo ufw allow 5349/tcp
sudo ufw allow 49152:65535/udp
```

## Troubleshooting

### Check if ports are open
```bash
netstat -tuln | grep 3478
```

### View logs
```bash
docker logs -f webrtc-turn-server
```

### Test with Trickle ICE
Open in browser: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/

Add your TURN server:
- STUN: `stun:YOUR_IP:3478`
- TURN: `turn:YOUR_IP:3478` with username/password

Click "Gather candidates" to test.

## Client Configuration

In the frontend app, update `.env`:
```
VITE_TURN_UDP_URL=turn:YOUR_IP:3478?transport=udp
VITE_TURN_TCP_URL=turn:YOUR_IP:3478?transport=tcp
VITE_TURN_TLS_URL=turns:YOUR_IP:5349?transport=tcp
VITE_TURN_USERNAME=webrtc
VITE_TURN_PASSWORD=webrtc123
```
