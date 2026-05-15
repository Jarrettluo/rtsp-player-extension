import { Immutable, MessageEvent, PanelExtensionContext, SettingsTree, SettingsTreeAction } from "@foxglove/studio";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import videojs from "video.js";
import "video.js/dist/video-js.css";

interface Timestamp {
  sec: number;
  nsec: number;
}

interface StreamInfo {
  stream_url: string;
  stream_type?: "hls" | "webrtc";
  chassis_code: string;
  timestamp: Timestamp;
}

interface PanelSettings {
  streamUrl: string;
  streamType: "hls" | "webrtc";
}

const DEFAULT_SETTINGS: PanelSettings = {
  streamUrl: "http://localhost:8888/stream.m3u8",
  streamType: "hls",
};

const videoContainerStyle = {
  overflow: "hidden",
  height: "100%",
  width: "100%",
};

function RTSPPanel({ context }: { context: PanelExtensionContext }): JSX.Element {
  const [settings, setSettings] = useState<PanelSettings>(DEFAULT_SETTINGS);
  const [streamUrl, setStreamUrl] = useState<string>(DEFAULT_SETTINGS.streamUrl);
  const [streamType, setStreamType] = useState<"hls" | "webrtc">(DEFAULT_SETTINGS.streamType);
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<ReturnType<typeof videojs>>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  const handleSettingsChange = useCallback((action: SettingsTreeAction) => {
    if (action.action === "update") {
      const path = action.payload.path;
      const value = action.payload.value as string;
      const key = path[0] as keyof PanelSettings;
      setSettings((prev) => {
        const newSettings = { ...prev, [key]: value };
        return newSettings;
      });
      if (key === "streamUrl") {
        setStreamUrl(value);
      } else if (key === "streamType") {
        setStreamType(value as "hls" | "webrtc");
      }
      context.saveState({ [key]: value });
    }
  }, [context]);

  const settingsTree: SettingsTree = {
    actionHandler: handleSettingsChange,
    nodes: {
      general: {
        label: "Settings",
        fields: {
          streamType: {
            input: "select",
            label: "Stream Type",
            value: settings.streamType,
            options: [
              { label: "HLS/m3u8", value: "hls" },
              { label: "WebRTC", value: "webrtc" },
            ],
          },
          streamUrl: {
            input: "string",
            label: "Stream URL",
            value: settings.streamUrl,
            placeholder: settings.streamType === "hls" ? "http://localhost:8888/stream.m3u8" : "ws://localhost:8888/stream",
          },
        },
      },
    },
  };

  const handleMessages = useCallback((messages: Immutable<MessageEvent[]>) => {
    if (!messages || messages.length === 0) {
      return;
    }
    const lastMessage = messages[messages.length - 1]!;
    const info = lastMessage.message as StreamInfo;
    if (info?.stream_url) {
      setStreamUrl(info.stream_url);
      if (info.stream_type) {
        setStreamType(info.stream_type);
      }
    }
  }, []);

  const setupWebRTC = useCallback((url: string) => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (videoElementRef.current) {
      videoElementRef.current.srcObject = null;
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnectionRef.current = pc;

    pc.ontrack = (event) => {
      if (videoElementRef.current && event.streams[0]) {
        videoElementRef.current.srcObject = event.streams[0];
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("WebRTC ICE state:", pc.iceConnectionState);
    };

    if (url.startsWith("ws") || url.startsWith("wss")) {
      const ws = new WebSocket(url);
      ws.onopen = async () => {
        pc.createOffer().then((offer) => pc.setLocalDescription(offer));
      };
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.sdp) {
          pc.setRemoteDescription(new RTCSessionDescription(data));
        } else if (data.candidate) {
          pc.addIceCandidate(new RTCIceCandidate(data));
        }
      };
    }
  }, []);

  useLayoutEffect(() => {
    const saved = context.initialState as Partial<PanelSettings> | undefined;
    if (saved) {
      setSettings((prev) => ({ ...prev, ...saved }));
      if (saved.streamUrl) {
        setStreamUrl(saved.streamUrl);
      }
      if (saved.streamType) {
        setStreamType(saved.streamType);
      }
    }

    context.updatePanelSettingsEditor(settingsTree);

    context.onRender = (renderState, done) => {
      if (renderState.currentFrame) {
        handleMessages(renderState.currentFrame);
      }
      done();
    };

    context.watch("currentFrame");
    context.subscribe([{ topic: "/drive/chassis_code" }]);
  }, [context, handleMessages]);

  useLayoutEffect(() => {
    if (streamType === "webrtc") {
      setupWebRTC(streamUrl);
      return;
    }

    if (!videoRef.current) {
      return;
    }

    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }

    const videoElement = document.createElement("video-js");
    videoElement.classList.add("vjs-default-skin", "vjs-big-play-centered");
    videoElement.setAttribute("playsinline", "true");
    videoRef.current.appendChild(videoElement);

    const player = videojs(videoElement, {
      controls: true,
      autoplay: true,
      preload: "auto",
      fluid: true,
      sources: [
        {
          src: streamUrl,
          type: "application/x-mpegURL",
        },
      ],
    });

    playerRef.current = player;

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [streamUrl, streamType, setupWebRTC]);

  
  if (streamType === "webrtc") {
    return (
      <div style={videoContainerStyle}>
        <video
          ref={videoElementRef}
          autoPlay
          playsInline
          controls
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    );
  }

  return (
    <div ref={videoRef} style={videoContainerStyle} />
  );
}

export function initRTSPPanel(context: PanelExtensionContext): () => void {
  ReactDOM.render(<RTSPPanel context={context} />, context.panelElement);

  return () => {
    const videoEl = context.panelElement.querySelector("video");
    if (videoEl) {
      videoEl.srcObject = null;
    }
    ReactDOM.unmountComponentAtNode(context.panelElement);
  };
}