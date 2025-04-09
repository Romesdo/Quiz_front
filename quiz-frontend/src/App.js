import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './components/Home';
import Quiz from './components/Quiz';
import Login from './components/Login';
import Register from './components/Register';
import History from './components/History';
import axios from 'axios';
import './App.css';

function App() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        // Nếu có user và token → kiểm tra token có hợp lệ không
        if (storedUser && token) {
            axios.get('http://localhost:8000/api/user', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            .then(response => {
                setUser(JSON.parse(storedUser)); // Token hợp lệ → set user
            })
            .catch(error => {
                // Token không hợp lệ → xóa thông tin
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
            console.error('Logout failed:', err);
        }
    };

    return (
        <Router>
            <div className="App">
                <nav>
                    <Link to="/">Home</Link>
                    {user ? (
                        <>
                            <span className="welcome-message"> | Welcome, {user.name} | </span>
                            <Link to="/history">History</Link>
                            <span> | </span>
                            <button onClick={handleLogout}>Logout</button>
                        </>
                    ) : (
                        <>
                            <span> | </span>
                            <Link to="/login">Login</Link>
                            <span> | </span>
                            <Link to="/register">Register</Link>
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
