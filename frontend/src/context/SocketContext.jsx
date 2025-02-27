/* eslint-disable no-undef */
import React, { createContext, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import io from "socket.io-client";
import { useLocation } from "react-router-dom";

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageStatus, setImageStatus] = useState(false);
  const [receivedOptions, setReceivedOptions] = useState(Array(8).fill(null));
  const [errorStatus, setErrorStatus] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const location = useLocation();

  useEffect(() => {
    let socketUrl = process.env.REACT_APP_BACKEND_URL;

    if (socketUrl.startsWith("https://")) {
      socketUrl = socketUrl.replace("https://", "wss://"); // HTTPS -> WSS
    } else if (socketUrl.startsWith("http://")) {
      socketUrl = socketUrl.replace("http://", "ws://"); // HTTP -> WS
    }

    const newSocket = io(socketUrl, {
      transports: ["websocket"], // WebSocket만 사용
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
    });

    newSocket.on("operation_status", (status) => {
      if (status.success) {
        setUploadStatus(true);
        if (status.image_path) {
          setImageUrl(status.image_path);
        }
      }

      if (status.image_success) {
        setImageStatus(true);
      }

      if (status.error_status) {
        setErrorStatus(true);
        console.log("에러났다내요");
      }
    });

    newSocket.on("image_path", (url) => {
      setImageUrl(url);
    });

    newSocket.on("options_data", (data) => {
      console.log("Received options via socket:", data.options);
      setReceivedOptions(data.options);
    });

    newSocket.on("index_data", (index) => {
      console.log("인덱스 받아왔어용:", index.index_status);
      setQuestionIndex(index.index_status);
    });

    return () => {
      newSocket.disconnect();
      console.log("Socket disconnected");
    };
  }, []);

  useEffect(() => {
    setUploadStatus(false);
    setImageUrl(null);
    setReceivedOptions([]);
    setQuestionIndex(0);
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname === "/" || location.pathname === "/upload") {
      setImageStatus(false);
      setErrorStatus(false);
    }
  }, [location.pathname]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        uploadStatus,
        setUploadStatus,
        imageUrl,
        imageStatus,
        receivedOptions,
        errorStatus,
        questionIndex,
        setQuestionIndex,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

SocketProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useSocket = () => useContext(SocketContext);
