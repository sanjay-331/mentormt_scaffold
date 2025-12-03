import React, { useEffect, useState } from "react";
import api from "./services/api";

export default function App() {
  const [msg, setMsg] = useState("Loading...");

  useEffect(() => {
    async function getPing() {
      try {
        const r = await api.get("/ping");
        setMsg(r.data.ping);
      } catch (err) {
        setMsg("Error: " + (err.message || "unknown"));
      }
    }
    getPing();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold mb-4">DATABank (Frontend)</h1>
        <p>Backend ping: <span className="font-mono">{msg}</span></p>
      </div>
    </div>
  );
}
