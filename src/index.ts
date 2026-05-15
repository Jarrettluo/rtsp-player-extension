import { ExtensionContext } from "@foxglove/studio";
import { initRTSPPanel } from "./RTSPPanel";

export function activate(extensionContext: ExtensionContext): void {
  extensionContext.registerPanel({ name: "rtsp-player-extension", initPanel: initRTSPPanel });
}
