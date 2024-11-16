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
  const [receivedOptions, setReceivedOptions] = useState([]); // 소켓으로 받은 옵션 데이터
  const location = useLocation();

  useEffect(() => {
    const newSocket = io(`http://${process.env.REACT_APP_HOST}:5000`);
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
    });

    newSocket.on("image_path", (url) => {
      setImageUrl(url);
    });

    newSocket.on("options_data", (data) => {
      console.log("Received options via socket:", data.options);
      setReceivedOptions(data.options);
    });

    return () => {
      newSocket.disconnect();
      console.log("Socket disconnected");
    };
  }, []);

  useEffect(() => {
    setUploadStatus(false);
    setImageUrl(null);
  }, [location.pathname]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        uploadStatus,
        setUploadStatus,
        imageUrl,
        receivedOptions,
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
