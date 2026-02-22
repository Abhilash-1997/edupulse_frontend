import { useEffect, useState } from "react";
import axios from "axios";

export default function useBackendReady() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let retryTimeout;

    const wakeServer = async () => {
      try {
        await axios.get("/api/check/health");
        setIsReady(true);
      } catch (error) {
        retryTimeout = setTimeout(wakeServer, 5000); // 5 sec retry
      }
    };

    wakeServer();

    return () => clearTimeout(retryTimeout);
  }, []);

  return isReady;
}