import React, { useState, useEffect } from 'react';
import axios from 'axios';

function History() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchHistory = async () => {
            if (!token) {
                setError('You must be logged in to view your history');
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const response = await axios.get('http://localhost:8000/api/history', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setHistory(response.data);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch history: ' + (err.response?.data?.message || err.message));
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
            console.log(response.data); // Hiển thị chi tiết trong console, có thể mở rộng giao diện sau
        } catch (error) {
            console.error('Error fetching quiz details:', error);
        }
    };

    if (loading) return <div className="loading-message">Loading...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="History">
            <h1>Your Quiz History</h1>
            {history.length > 0 ? (
                <table className="history-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Category</th>
                            <th>Difficulty</th>
                            <th>Score</th>
                            <th>Total Questions</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map((result) => (
                            <tr key={result.id}>
                                <td>{new Date(result.created_at).toLocaleString()}</td>
                                <td>{result.category}</td>
                                <td>{result.difficulty}</td>
                                <td>{result.score}</td>
                                <td>{result.total_questions}</td>
                                <td>
                                    <button onClick={() => handleViewDetails(result.id)}>
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className="no-history">No quiz history available.</p>
            )}
        </div>
    );
}

export default History;