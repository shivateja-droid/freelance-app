import React, { createContext, useEffect, useRef, useState } from 'react';
import axios from "axios";
import { useNavigate } from "react-router-dom";
import socketIoClient from 'socket.io-client';

// The context is intentionally exported for the consumer components in this app.
// eslint-disable-next-line react-refresh/only-export-components
export const GeneralContext = createContext();

const GeneralContextProvider = ({ children }) => {

    const BASE_URI = import.meta.env.VITE_API_URL;
    const WS = `${BASE_URI}`;
    const socketRef = useRef(null);
    const navigate = useNavigate();
    const initialTokenRef = useRef(localStorage.getItem('token'));

    if (initialTokenRef.current) {
        axios.defaults.headers.common.Authorization = `Bearer ${initialTokenRef.current}`;
    }

    if (!socketRef.current) {
        socketRef.current = socketIoClient(WS, { autoConnect: false, auth: { token: initialTokenRef.current } });
    }

    useEffect(() => {
        if (initialTokenRef.current) {
            socketRef.current.auth = { token: initialTokenRef.current };
            socketRef.current.connect();
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    const socket = socketRef.current;

    const storeSession = ({ token, user }) => {
        initialTokenRef.current = token;
        localStorage.setItem('token', token);
        localStorage.setItem('userId', user._id);
        localStorage.setItem('usertype', user.usertype);
        localStorage.setItem('username', user.username);
        localStorage.setItem('email', user.email);
        axios.defaults.headers.common.Authorization = `Bearer ${token}`;
        socket.auth = { token };
        socket.connect();
    };

    const navigateForUser = (user) => {
        if (user.usertype === 'freelancer') {
            navigate('/freelancer');
        } else if (user.usertype === 'client') {
            navigate('/client');
        } else if (user.usertype === 'admin') {
            navigate('/admin');
        }
    };

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [usertype, setUsertype] = useState('');

    const login = async () => {
        try {
            if (!email.trim() || !password) {
                return { success: false, message: 'Please enter your email and password.' };
            }

            const response = await axios.post(`${BASE_URI}/login`, { email, password });
            storeSession(response.data);
            navigateForUser(response.data.user);
            return { success: true };
        } catch (err) {
            const responseData = err.response?.data;
            const serverMessage = responseData?.msg || responseData?.details?.[0]?.message;
            const message = err.response?.status === 400 && serverMessage
                ? serverMessage
                : err.response?.status === 401
                    ? 'Invalid email or password.'
                    : err.response
                        ? 'Unable to complete login. Please try again.'
                        : 'Unable to connect to the server. Please try again.';

            return { success: false, message };
        }
    }

    const inputs = { username, email, usertype, password };

    const register = async () => {
        try {
            const response = await axios.post(`${BASE_URI}/register`, inputs);
            storeSession(response.data);
            navigateForUser(response.data.user);
            return { success: true };
        } catch (err) {
            const responseData = err.response?.data;
            const details = Array.isArray(responseData?.details) ? responseData.details : [];
            const fieldErrors = Object.fromEntries(
                details
                    .filter((detail) => detail.field && detail.message)
                    .map((detail) => [detail.field, detail.message]),
            );
            const responseMessage = details[0]?.message
                || responseData?.msg
                || (responseData?.error !== 'Internal server error' ? responseData?.error : null);

            return {
                success: false,
                message: responseMessage || (err.response
                    ? 'Registration could not be completed. Please check your details and try again.'
                    : 'Unable to reach the server. Please check your connection and try again.'),
                fieldErrors,
            };
        }
    }


    const logout = async () => {
        socket.disconnect();
        initialTokenRef.current = null;
        delete axios.defaults.headers.common.Authorization;
        ['token', 'userId', 'usertype', 'username', 'email'].forEach((key) => localStorage.removeItem(key));
        navigate('/');
    }


    return (
        <GeneralContext.Provider value={{ socket, login, register, logout, username, setUsername, email, setEmail, password, setPassword, usertype, setUsertype }} >{children}</GeneralContext.Provider>
    )
}

export default GeneralContextProvider
