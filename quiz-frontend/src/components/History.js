import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../styles/history.css';
import '../styles/result.css';
import '../styles/question.css';

function History() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedResult, setSelectedResult] = useState(null);
    const token = localStorage.getItem('token');
    const resultDetailsRef = useRef(null);

    // Cuộn xuống phần result-details ngay khi selectedResult thay đổi
    useEffect(() => {
        if (selectedResult && resultDetailsRef.current) {
            console.log('Selected Result:', selectedResult);
            resultDetailsRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [selectedResult]);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!token) {
                setError('Bạn phải đăng nhập để xem lịch sử');
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const response = await axios.get('http://localhost:8000/api/history', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log('History API Response:', response.data);
                setHistory(response.data);
                setLoading(false);
            } catch (err) {
                setError('Không thể tải lịch sử: ' + (err.response?.data?.message || err.message));
                setLoading(false);
            }
        };

        fetchHistory();
    }, [token]);

    const handleViewDetails = async (resultId) => {
        try {
            const response = await axios.get(`http://localhost:8000/api/result/${resultId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log('Result API Response:', response.data);
            setSelectedResult(response.data);
        } catch (error) {
            console.error('Lỗi khi tải chi tiết bài thi:', error);
            setError('Không thể tải chi tiết bài thi: ' + (error.response?.data?.message || error.message));
            setSelectedResult(null);
        }
    };

    if (loading) return <div className="loading-message">Đang tải dữ liệu...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="History">
            <h1>Lịch sử làm bài</h1>
            {history.length > 0 ? (
                <table className="history-table">
                    <thead>
                        <tr>
                            <th>Ngày làm bài</th>
                            <th>Tên bài thi</th>
                            <th>Độ khó</th>
                            <th>Điểm số</th>
                            <th>Số câu hỏi</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map((result) => (
                            <tr key={result.id}>
                                <td>{new Date(result.created_at).toLocaleString()}</td>
                                <td>{result.quiz}</td>
                                <td>{result.difficulty}</td>
                                <td>{result.score}</td>
                                <td>{result.total_questions}</td>
                                <td>
                                    <button onClick={() => handleViewDetails(result.id)}>
                                        Xem chi tiết
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className="no-history">Bạn chưa có lịch sử làm bài nào.</p>
            )}

            {selectedResult && (
                <div className="result-details" ref={resultDetailsRef}>
                    <h2>Chi tiết bài thi: {selectedResult.quiz}</h2>
                    <div className="result-stats">
                        <p className="difficulty-highlight">Độ khó: {selectedResult.difficulty}</p>
                        <p className="score-highlight">Điểm số: {selectedResult.score}/{selectedResult.total_questions}</p>
                    </div>
                    <button onClick={() => setSelectedResult(null)} className="result-button">Đóng</button>
                </div>
            )}
        </div>
    );
}

export default History;