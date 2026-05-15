# rtsp-player-extension

A [Foxglove Studio](https://console.foxglove.dev/) extension for playing HLS/m3u8 video stream data.

## Supported Formats

| Format | URL Pattern | Description |
|--------|------------|-------------|
| HLS | `.m3u8` | HTTP Live Streaming, recommended |
| m3u8 | `http://.../stream.m3u8` | Native HLS playlist |

**Note**: This extension uses video.js to play HLS streams. The stream URL must point to an `.m3u8` HLS playlist. Ensure your video source is encoded and packaged as HLS format (e.g., via mediaMTX, nginx-rtmp, or FFmpeg).

## Usage

The panel subscribes to a topic and extracts the stream URL from messages, then renders the HLS stream using video.js.

### Configuration

| Setting | Description |
|---------|-------------|
| Stream URL | HLS/m3u8 stream URL (e.g., `http://localhost:8888/stream.m3u8`) |

### Topic Schema

Message format on topic `/drive/chassis_code`:

```json
{
  "stream_url": "http://127.0.0.1:8888/stream.m3u8",
  "chassis_code": "string",
  "timestamp": {
    "sec": 0,
    "nsec": 0
  }
}
```

### Code

```html
<video-js class="vjs-default-skin vjs-big-play-centered" playsinline>
  <source src="http://localhost:8888/stream.m3u8" type="application/x-mpegURL">
</video-js>
```

### Preview

!["HLS Stream Player"](images/rtsp-play-render.png "HLS Stream Player")

## Get Started

1. `git clone https://github.com/Jarrettluo/rtsp-player-extension.git`

2. `cd rtsp-player-extension`

3. `npm install`

4. `npm run package` — generates `orienlink.rtsp-player-extension-0.0.3.foxe`

5. Drag the `.foxe` file into your Foxglove web page. On successful installation, you'll see a notification:

   !["foxglove install success"](images/foxglove-extension-install-success.png "foxglove install success")

6. Select the "rtsp-player-extension" panel from the panel selector:

   !["foxglove select custom panel"](images/foxglove-select-custom-panel.png "foxglove select custom panel")

7. Enter your HLS stream URL in the settings (e.g., `http://localhost:8888/stream.m3u8`)

## Development

```bash
npm run build      # Build the extension
npm run package    # Package as .foxe file
npm run local-install  # Install locally for testing
npm run lint       # Lint and fix
```

## Stream Preparation

To play video in the browser, your video source must be converted to HLS format. Example using FFmpeg:

```bash
ffmpeg -i rtsp://camera_ip:8554/stream -c:v libx264 -c:a aac -f hls -hls_time 2 -hls_list_size 10 /var/www/html/stream.m3u8
```

Or use mediaMTX for automatic RTSP-to-HLS conversion.