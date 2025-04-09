import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

function Quiz() {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [showResults, setShowResults] = useState({});
    const [quizFinished, setQuizFinished] = useState(false);
    const [score, setScore] = useState(0);
    const [reviewMode, setReviewMode] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 phút = 1800 giây
    const location = useLocation();
    const navigate = useNavigate();

    const { category, difficulty } = location.state || { category: 'Geography', difficulty: 'easy' };
    const token = localStorage.getItem('token');

    // Đếm ngược thời gian
    useEffect(() => {
        if (quizFinished || reviewMode) return; // Dừng đếm ngược nếu đã nộp bài hoặc đang xem lại

        const timer = setInterval(() => {
            setTimeLeft((prevTime) => {
                if (prevTime <= 0) {
                    clearInterval(timer);
                    handleFinishQuiz(); // Tự động nộp bài khi hết thời gian
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => clearInterval(timer); // Dọn dẹp timer khi component unmount
    }, [quizFinished, reviewMode]);

    // Định dạng thời gian thành mm:ss
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const fetchQuestions = async () => {
        setLoading(true);
        setError(null);
        setSelectedAnswers({});
        setShowResults({});
        setQuizFinished(false);
        setReviewMode(false);
        setScore(0);
        setTimeLeft(30 * 60); // Reset thời gian về 30 phút khi bắt đầu bài kiểm tra

        if (!token) {
            setError('Bạn phải đăng nhập để làm bài kiểm tra. Vui lòng đăng nhập trước.');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get('http://localhost:8000/api/fetch-questions', {
                params: { category, difficulty },
                headers: { Authorization: `Bearer ${token}` },
            });
            setQuestions(response.data);
            setLoading(false);
        } catch (err) {
            setError('Không thể tải câu hỏi: ' + (err.response?.data?.error || err.message));
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, [category, difficulty]);

    const handleAnswerSelect = (questionId, answerKey) => {
        setSelectedAnswers({ ...selectedAnswers, [questionId]: answerKey });
    };

    const handleCheckAnswer = (questionId) => {
        setShowResults({ ...showResults, [questionId]: true });
    };

    const calculateScore = () => {
        let score = 0;
        questions.forEach((question) => {
            const selectedAnswer = selectedAnswers[question.id];
            const correctAnswer = Object.keys(question.correct_answer)
                .find((key) => question.correct_answer[key] === 'true')
                ?.replace('_correct', '');
            if (selectedAnswer === correctAnswer) score += 1;
        });
        return score;
    };

    const handleFinishQuiz = async () => {
        const finalScore = calculateScore();
        setScore(finalScore);
        setQuizFinished(true);

        if (!token) {
            setError('Bạn phải đăng nhập để lưu kết quả.');
            return;
        }

        const payload = {
            score: finalScore,
            total_questions: questions.length,
            category: category || 'Geography',
            difficulty: difficulty || 'easy',
        };

        try {
            await axios.post('http://localhost:8000/api/save-result', payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch (err) {
            setError('Không thể lưu kết quả: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleReviewAnswers = () => {
        setReviewMode(true);
    };

    const handleRestartQuiz = () => {
        navigate('/');
    };

    const getAnswerLabel = (answerKey) => {
        switch (answerKey) {
            case 'answer_a': return 'A';
            case 'answer_b': return 'B';
            case 'answer_c': return 'C';
            case 'answer_d': return 'D';
            default: return '';
        }
    };

    if (loading) return <div className="loading-message">Đang tải...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="Quiz">
            <h1>Bài kiểm tra: {category} ({difficulty})</h1>
            <p>Tổng số câu hỏi: {questions.length}</p>

            {/* Đồng hồ đếm ngược */}
            <div className="timer">
                <span>Thời gian còn lại: </span>
                <span className={timeLeft <= 60 ? 'timer-warning' : ''}>{formatTime(timeLeft)}</span>
            </div>

            {/* Thanh điều hướng câu hỏi */}
            <div className="question-nav">
                {questions.map((question, index) => (
                    <button
                        key={question.id}
                        className={`question-nav-item ${selectedAnswers[question.id] ? 'answered' : ''}`}
                    >
                        {index + 1}
                    </button>
                ))}
            </div>

            {/* Chú thích */}
            <div className="legend">
                <span className="legend-item answered">Đã hoàn thành</span>
                <span className="legend-item not-answered">Cần xem lại</span>
            </div>

            <div className="questions-container">
                {questions.length > 0 ? (
                    questions.map((question, index) => {
                        const selectedAnswer = selectedAnswers[question.id];
                        const showResult = showResults[question.id];
                        const correctAnswer = Object.keys(question.correct_answer)
                            .find((key) => question.correct_answer[key] === 'true')
                            ?.replace('_correct', '');

                        return (
                            <div key={question.id} className="question">
                                <h3>{index + 1}. {question.question}</h3>
                                <ul>
                                    {Object.entries(question.answers)
                                        .filter(([key, value]) => value !== null)
                                        .map(([key, value]) => (
                                            <li key={key}>
                                                <label>
                                                    <input
                                                        type="radio"
                                                        name={`question-${question.id}`}
                                                        value={key}
                                                        checked={selectedAnswer === key}
                                                        onChange={() => handleAnswerSelect(question.id, key)}
                                                        disabled={showResult || quizFinished || reviewMode}
                                                    />
                                                    {getAnswerLabel(key)}. {value}
                                                    {reviewMode && selectedAnswer === key && (
                                                        <span className={selectedAnswer === correctAnswer ? 'correct' : 'incorrect'}>
                                                            {selectedAnswer === correctAnswer ? ' (Đúng)' : ' (Sai)'}
                                                        </span>
                                                    )}
                                                </label>
                                            </li>
                                        ))}
                                </ul>
                                {selectedAnswer && !showResult && !quizFinished && !reviewMode && (
                                    <button onClick={() => handleCheckAnswer(question.id)}>Kiểm tra đáp án</button>
                                )}
                                {(showResult || reviewMode) && (
                                    <div>
                                        <p>
                                            <strong>Đáp án của bạn: </strong>
                                            {selectedAnswer
                                                ? `${getAnswerLabel(selectedAnswer)}. ${question.answers[selectedAnswer]}`
                                                : 'Chưa trả lời'}
                                            {selectedAnswer && (
                                                <span className={selectedAnswer === correctAnswer ? 'correct' : 'incorrect'}>
                                                    {selectedAnswer === correctAnswer ? ' (Đúng)' : ' (Sai)'}
                                                </span>
                                            )}
                                        </p>
                                        <p>
                                            <strong>Đáp án đúng: </strong>
                                            {getAnswerLabel(correctAnswer)}. {question.answers[correctAnswer]}
                                        </p>
                                        <p><strong>Giải thích: </strong>{question.explanation || 'Không có giải thích'}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <p>Không có câu hỏi nào.</p>
                )}
            </div>

            {!quizFinished && !reviewMode && (
                <button
                    onClick={handleFinishQuiz}
                    disabled={Object.keys(selectedAnswers).length !== questions.length}
                    className="finish-button"
                >
                    Hoàn thành bài kiểm tra
                </button>
            )}

            {quizFinished && !reviewMode && (
                <div className="result">
                    <h2>Điểm của bạn: {score}/{questions.length}</h2>
                    <button onClick={handleReviewAnswers}>Xem lại đáp án</button>
                    <button onClick={handleRestartQuiz}>Quay về trang chủ</button>
                </div>
            )}

            {reviewMode && (
                <button onClick={handleRestartQuiz} className="restart-button">
                    Quay về trang chủ
                </button>
            )}
        </div>
    );
}

export default Quiz;