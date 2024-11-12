/* eslint-disable no-undef */
import React, { createContext, useContext, useState, useEffect } from "react";
import PropTypes from 'prop-types';
import io from "socket.io-client";

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const socket = io(`http://${process.env.REACT_APP_HOST}:5000`);
    const [uploadStatus, setUploadStatus] = useState(false);

    useEffect(() => {
        // 서버에서 uploadStatus 이벤트를 받으면 상태 업데이트
        socket.on("operation_status", (status) => {
            if (status.success) {
                setUploadStatus(true); // 업로드 성공 시 상태 true로 변경
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [socket]);

    return (
        <SocketContext.Provider value={{ socket, uploadStatus, setUploadStatus }}>
            {children}
        </SocketContext.Provider>
    );
};

SocketProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export const useSocket = () => useContext(SocketContext);