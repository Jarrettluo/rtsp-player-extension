import { Immutable, MessageEvent, PanelExtensionContext, SettingsTree, SettingsTreeAction } from "@foxglove/studio";
import { useCallback, useLayoutEffect, useState } from "react";
import ReactDOM from "react-dom";

interface Timestamp {
  sec: number;
  nsec: number;
}

interface RtspInfo {
  rtsp_url: string;
  chassis_code: string;
  timestamp: Timestamp;
}

interface PanelSettings {
  panelTitle: string;
  rtspUrl: string;
}

const DEFAULT_SETTINGS: PanelSettings = {
  panelTitle: "RTSP流媒体播放",
  rtspUrl: "localhost:8990",
};

const frameStyle = {
  overflow:'hidden',
  height:'100%',
  width:'100%',
};

function RTSPPanel({ context }: { context: PanelExtensionContext }): JSX.Element {
  const [settings, setSettings] = useState<PanelSettings>(DEFAULT_SETTINGS);
  const [rtspUrl, setRtspUrl] = useState<string>(DEFAULT_SETTINGS.rtspUrl);

  const handleSettingsChange = useCallback((action: SettingsTreeAction) => {
    if (action.action === "update") {
      const path = action.payload.path;
      const value = action.payload.value;
      const key = path[0] as keyof PanelSettings;
      setSettings((prev) => {
        const newSettings = { ...prev, [key]: value };
        context.saveState(newSettings);
        if (key === "rtspUrl") {
          setRtspUrl(value as string);
        }
        return newSettings;
      });
    }
  }, [context]);

  const settingsTree: SettingsTree = {
    actionHandler: handleSettingsChange,
    nodes: {
      general: {
        label: "Settings",
        fields: {
          panelTitle: {
            input: "string",
            label: "Panel Title",
            value: settings.panelTitle,
          },
          rtspUrl: {
            input: "string",
            label: "RTSP URL",
            value: settings.rtspUrl,
          },
        },
      },
    },
  };

  const handleMessages = useCallback((messages: Immutable<MessageEvent[]>) => {
    if (!messages || messages.length === 0) {
      return;
    }
    // Get the last message's RTSP URL
    const lastMessage = messages[messages.length - 1]!;
    const info = lastMessage.message as RtspInfo;
    if (info?.rtsp_url) {
      setRtspUrl(info.rtsp_url);
    }
  }, []);

  useLayoutEffect(() => {
    // Restore saved settings
    const saved = context.initialState as Partial<PanelSettings> | undefined;
    if (saved) {
      setSettings((prev) => ({ ...prev, ...saved }));
      if (saved.rtspUrl) {
        setRtspUrl(saved.rtspUrl);
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
  }, [context, handleMessages, settingsTree]);

  return (
    <iframe
       style={ frameStyle }
       src={ rtspUrl }
       allow="autoplay">
    </iframe>
  );
}

export function initRTSPPanel(context: PanelExtensionContext): () => void {
  ReactDOM.render(<RTSPPanel context={context} />, context.panelElement);

  // Return a function to run when the panel is removed
  return () => {
    ReactDOM.unmountComponentAtNode(context.panelElement);
  };
}