import { useCallback, useMemo, useState } from "react";

export default function useBehavior(initialRisk = 8) {
  const [risk, setRisk] = useState(initialRisk);
  const [events, setEvents] = useState([]);

  const status = useMemo(() => {
    if (risk >= 70) return "critical";
    if (risk >= 40) return "review";
    return "clean";
  }, [risk]);

  const recordEvent = useCallback((event) => {
    const severity = event.severity || "INFO";
    setEvents((prev) => [{ time: event.time || "LIVE", severity, ...event }, ...prev].slice(0, 12));
    if (severity === "CRITICAL") setRisk((value) => Math.min(100, value + 30));
    if (severity === "WARNING") setRisk((value) => Math.min(100, value + 18));
  }, []);

  const lowerRisk = useCallback((amount = 5) => {
    setRisk((value) => Math.max(0, value - amount));
  }, []);

  return { risk, status, events, setRisk, recordEvent, lowerRisk };
}
