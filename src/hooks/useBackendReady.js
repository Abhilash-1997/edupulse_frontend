import { useEffect, useState } from "react";
import api from "@/config/axiosConfig";

export default function useBackendReady() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let retryTimeout;

    const wakeServer = async () => {
      try {
        await api.get("/check/health");
        setIsReady(true);
      } catch (error) {
        retryTimeout = setTimeout(wakeServer, 30000); // 30 sec retry
      }
    };

    wakeServer();

    return () => clearTimeout(retryTimeout);
  }, []);

  return isReady;
}