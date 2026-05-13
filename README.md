# rtsp-player-extension

A [Foxglove Studio](https://console.foxglove.dev/) extension used to play [RTSP](https://en.wikipedia.org/wiki/Real_Time_Streaming_Protocol) video stream data seamlessly.

An implementation for Foxglove GitHub issue [AVC / H.264 video support #87](https://github.com/foxglove/community/issues/87)

## Usage

The panel subscribes to a topic and extracts the RTSP URL from messages, then renders the stream in an iframe.

### Configuration

| Setting | Value |
|---------|-------|
| Topic | `/drive/chassis_code` |
| Message Schema | `{ rtsp_url: string, chassis_code: string, timestamp: { sec: number, nsec: number } }` |

### Code

```html
<iframe allow="autoplay" src="http://127.0.0.1:8888/demo1" style="overflow: hidden; height: 100%; width: 100%;"></iframe>
```

### Preview

!["RTSP Stream Player"](images/rtsp-play-render.png "RTSP Stream Player")

## Get Started

1. `git clone https://github.com/Jarrettluo/rtsp-player-extension.git`

2. `cd rtsp-player-extension`

3. `npm install`

4. `npm run package` — generates `orienlink.rtsp-player-extension-0.0.1.foxe`

5. Drag the `.foxe` file into your Foxglove web page. On successful installation, you'll see a notification:

   !["foxglove install success"](images/foxglove-extension-install-success.png "foxglove install success")

6. Select the "RTSP流媒体播放" panel from the panel selector:

   !["foxglove select custom panel"](images/foxglove-select-custom-panel.png "foxglove select custom panel")

## Development

```bash
npm run build      # Build the extension
npm run package    # Package as .foxe file
npm run local-install  # Install locally for testing
npm run lint       # Lint and fix
```