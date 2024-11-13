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

    return () => {
      newSocket.disconnect();
      console.log("Socket disconnected");
    };
  }, []);

  useEffect(() => {
    setUploadStatus(false);
  }, [location.pathname]);

  return (
    <SocketContext.Provider
      value={{ socket, uploadStatus, setUploadStatus, imageUrl }}
    >
      {children}
    </SocketContext.Provider>
  );
};

SocketProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useSocket = () => useContext(SocketContext);
