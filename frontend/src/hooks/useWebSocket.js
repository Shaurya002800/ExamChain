import { useEffect, useRef, useState } from "react";

export default function useWebSocket(url, { enabled = true, onMessage } = {}) {
  const socketRef = useRef(null);
  const [state, setState] = useState("idle");
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    if (!enabled || !url) {
      setState("idle");
      return undefined;
    }

    setState("connecting");
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => setState("open");
    socket.onclose = () => setState("closed");
    socket.onerror = () => setState("error");
    socket.onmessage = (event) => {
      let payload = event.data;
      try {
        payload = JSON.parse(event.data);
      } catch {
        // Text payloads are valid for operational logs.
      }
      setLastMessage(payload);
      onMessage?.(payload);
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [enabled, onMessage, url]);

  const send = (payload) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) return false;
    socketRef.current.send(typeof payload === "string" ? payload : JSON.stringify(payload));
    return true;
  };

  return { state, lastMessage, send };
}
