import React, { createContext, useContext, useEffect, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let client;

    if (isAuthenticated) {
      const API_URL = import.meta.env.VITE_API_URL
      const SOCKET_URL = `${API_URL}/ws-chat`; 
      client = new Client({
        webSocketFactory: () => new SockJS(SOCKET_URL),
        reconnectDelay: 5000,

        onConnect: () => {
          console.log("Connected to WebSocket");
          setIsConnected(true);
        },

        onDisconnect: () => {
          setIsConnected(false);
        },

        onStompError: (frame) => {
          console.error("Broker error:", frame.headers["message"]);
        }
      });

      client.activate();
      setStompClient(client);
    }

    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ stompClient, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
