import { Immutable, MessageEvent, PanelExtensionContext} from "@foxglove/studio";
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

const frameStyle = {
  overflow:'hidden',
  height:'100%',
  width:'100%',
};

const DEFAULT_RTSP_URL = 'http://127.0.0.1:8888/demo1';
const RTSP_TOPIC = '/drive/chassis_code';

function RTSPPanel({ context }: { context: PanelExtensionContext }): JSX.Element {
  const [rtspUrl, setRtspUrl] = useState<string>(DEFAULT_RTSP_URL);

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
    context.onRender = (renderState, done) => {
      if (renderState.currentFrame) {
        handleMessages(renderState.currentFrame);
      }
      done();
    };

    context.watch("currentFrame");
    context.subscribe([{ topic: RTSP_TOPIC }]);
  }, [context, handleMessages]);

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