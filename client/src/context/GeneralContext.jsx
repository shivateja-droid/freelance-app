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
            const loginInputs = { email, password }
            await axios.post(`${BASE_URI}/login`, loginInputs)
                .then(async (res) => {

                    storeSession(res.data);
                    navigateForUser(res.data.user);
                }).catch((err) => {
                    alert("login failed!!");
                    console.log(err);
                });

        } catch (err) {
            console.log(err);
        }
    }

    const inputs = { username, email, usertype, password };

    const register = async () => {
        try {
            await axios.post(`${BASE_URI}/register`, inputs)
                .then(async (res) => {
                    storeSession(res.data);
                    navigateForUser(res.data.user);

                }).catch((err) => {
                    alert("registration failed!!");
                    console.log(err);
                });
        } catch (err) {
            console.log(err);
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
