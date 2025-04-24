import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './components/Home';
import Quiz from './components/Quiz';
import Login from './components/Login';
import Register from './components/Register';
import History from './components/History';
import axios from 'axios';
import './styles/global.css';
import './styles/navigation.css';

function App() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (storedUser && token) {
            axios.get('http://localhost:8000/api/user', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            .then(response => {
                setUser(JSON.parse(storedUser));
            })
            .catch(error => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
            });
        }
    }, []);

    const handleLogout = async () => {
        try {
            await axios.post('http://localhost:8000/api/logout', {}, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
        } catch (err) {
            console.error('Đăng xuất thất bại:', err);
        }
    };

    return (
        <Router>
            <div className="App">
                <nav>
                    <Link to="/">Trang chủ</Link>
                    {user ? (
                        <>
                            <span className="welcome-message"> | Xin chào, {user.name} | </span>
                            <Link to="/history">Lịch sử làm bài</Link>
                            <span> | </span>
                            <button onClick={handleLogout}>Đăng xuất</button>
                        </>
                    ) : (
                        <>
                            <span> | </span>
                            <Link to="/login">Đăng nhập</Link>
                            <span> | </span>
                            <Link to="/register">Đăng ký</Link>
                        </>
                    )}
                </nav>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/quiz" element={<Quiz />} />
                    <Route path="/login" element={<Login setUser={setUser} />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/history" element={<History />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
