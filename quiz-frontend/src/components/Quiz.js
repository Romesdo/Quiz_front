import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/quiz.css';
import '../styles/question.css';
import '../styles/result.css';
import '../styles/global.css';

function Quiz() {
  const { state } = useLocation();
  const { category, difficulty } = state || {};
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [reviewMode, setReviewMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 phút = 1800 giây
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  // Di chuyển các hàm lên trước useEffect
  const calculateScore = useCallback(() => {
    let score = 0;
    questions.forEach((question) => {
      const correctAnswer = Object.keys(question.correct_answer || {})
        .find((key) => question.correct_answer[key] === 'true')
        ?.replace('_correct', '') || null;
      const selectedAnswer = selectedAnswers[question.id];
      if (selectedAnswer === correctAnswer) score += 1;
    });
    return score;
  }, [questions, selectedAnswers]);

  const handleFinishQuiz = useCallback(async () => {
    const finalScore = calculateScore();
    setScore(finalScore);
    setQuizFinished(true);

    if (!token) {
      setError('Bạn phải đăng nhập để lưu kết quả.');
      return;
    }

    if (!questions || questions.length === 0) {
      setError('Không có câu hỏi để lưu kết quả.');
      return;
    }

    const attemptDetails = questions.map((question) => {
      const selectedAnswer = selectedAnswers[question.id];
      if (!question.correct_answer) {
        console.warn(`No correct_answer for question ${question.id}`);
        return {
          question_id: question.id,
          question_text: question.question,
          answers: question.answers,
          selected_answer: selectedAnswer || null,
          correct_answer: null,
          is_correct: false,
        };
      }

      const correctAnswerKey = Object.keys(question.correct_answer)
        .find((key) => question.correct_answer[key] === 'true');
      const correctAnswer = correctAnswerKey
        ? correctAnswerKey.replace('_correct', '')
        : null;

      console.log(`Correct answer for question ${question.id}:`, {
        correctAnswerKey,
        correctAnswer,
        raw: question.correct_answer,
      });

      return {
        question_id: question.id,
        question_text: question.question,
        answers: question.answers,
        selected_answer: selectedAnswer || null,
        correct_answer: correctAnswer,
        is_correct: selectedAnswer === correctAnswer,
      };
    });

    const payload = {
      user_id: user?.id,
      score: finalScore,
      total_questions: questions.length,
      quiz: category || 'Pháp luật đại cương',
      difficulty: difficulty || 'easy',
      attempt_details: attemptDetails,
    };

    console.log('Questions:', questions);
    console.log('Selected Answers:', selectedAnswers);
    console.log('Attempt Details:', attemptDetails);
    console.log('Payload:', payload);

    try {
      const response = await axios.post('http://localhost:8000/api/save-result', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Save result response:', response.data);
    } catch (err) {
      console.error('Error saving result:', err.response?.data || err.message);
      setError('Không thể lưu kết quả: ' + (err.response?.data?.error || err.message));
    }
  }, [calculateScore, token, questions, selectedAnswers, user, category, difficulty, setError, setScore, setQuizFinished]);

  const handleAnswerSelect = (questionId, answerKey) => {
    setSelectedAnswers({ ...selectedAnswers, [questionId]: answerKey });
  };

  const handleCheckAnswer = (questionId) => {
    setShowResults({ ...showResults, [questionId]: true });
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReviewAnswers = () => {
    setReviewMode(true);
  };

  const handleRestartQuiz = () => {
    navigate('/');
  };

  const getAnswerLabel = (answerKey) => {
    if (!answerKey) return '';
    switch (answerKey) {
      case 'answer_a':
        return 'A';
      case 'answer_b':
        return 'B';
      case 'answer_c':
        return 'C';
      case 'answer_d':
        return 'D';
      default:
        return '';
    }
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      setError(null);
      setSelectedAnswers({});
      setShowResults({});
      setQuizFinished(false);
      setReviewMode(false);
      setScore(0);
      setTimeLeft(30 * 60);

      if (!token) {
        setError('Bạn phải đăng nhập để làm bài kiểm tra. Vui lòng đăng nhập trước.');
        setLoading(false);
        return;
      }

      if (!category || !difficulty) {
        setError('Vui lòng chọn bài thi và độ khó từ trang chủ.');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get('http://localhost:8000/api/fetch-questions', {
          params: { quiz: category, difficulty },
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Questions from API:', response.data);
        setQuestions(response.data);
        setLoading(false);
      } catch (err) {
        setError('Không thể tải câu hỏi: ' + (err.response?.data?.error || err.message));
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [category, difficulty, token]);

  useEffect(() => {
    if (quizFinished || reviewMode) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 0) {
          clearInterval(timer);
          handleFinishQuiz();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizFinished, reviewMode, handleFinishQuiz]);

  if (loading) return <div className="loading-message">Đang tải...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="Quiz">
      <h1>Bài kiểm tra: {category} ({difficulty})</h1>
      <p>Tổng số câu hỏi: {questions.length}</p>

      <div className="timer">
        <span>Thời gian còn lại: </span>
        <span className={timeLeft <= 60 ? 'timer-warning' : ''}>{formatTime(timeLeft)}</span>
      </div>

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

      <div className="legend">
        <span className="legend-item answered">Đã hoàn thành</span>
        <span className="legend-item not-answered">Cần xem lại</span>
      </div>

      <div className="questions-container">
        {questions.length > 0 ? (
          questions.map((question, index) => {
            const selectedAnswer = selectedAnswers[question.id];
            const showResult = showResults[question.id];
            const correctAnswer = Object.keys(question.correct_answer || {})
              .find((key) => question.correct_answer[key] === 'true')
              ?.replace('_correct', '') || null;

            return (
              <div key={question.id} className="question">
                <h3>
                  {index + 1}. {question.question}
                </h3>
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
                            <span
                              className={selectedAnswer === correctAnswer ? 'correct' : 'incorrect'}
                            >
                              {selectedAnswer === correctAnswer ? ' (Đúng)' : ' (Sai)'}
                            </span>
                          )}
                        </label>
                      </li>
                    ))}
                </ul>
                {selectedAnswer && !showResult && !quizFinished && !reviewMode && (
                  <button
                    onClick={() => handleCheckAnswer(question.id)}
                    className="check-answer-button"
                  >
                    Kiểm tra đáp án
                  </button>
                )}
                {(showResult || reviewMode) && (
                  <div>
                    <p>
                      <strong>Đáp án của bạn: </strong>
                      {selectedAnswer
                        ? `${getAnswerLabel(selectedAnswer)}. ${question.answers[selectedAnswer]}`
                        : 'Chưa trả lời'}
                      {selectedAnswer && (
                        <span
                          className={selectedAnswer === correctAnswer ? 'correct' : 'incorrect'}
                        >
                          {selectedAnswer === correctAnswer ? ' (Đúng)' : ' (Sai)'}
                        </span>
                      )}
                    </p>
                    <p>
                      <strong>Đáp án đúng: </strong>
                      {getAnswerLabel(correctAnswer) || 'Không có'}. {question.answers[correctAnswer] || 'Không có'}
                    </p>
                    <p className="explanation">
                      <strong>Giải thích: </strong>
                      {question.explanation || 'Không có giải thích'}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p className="no-questions">Không có câu hỏi nào.</p>
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
          <button onClick={handleReviewAnswers} className="review-button">
            Xem lại đáp án
          </button>
          <button onClick={handleRestartQuiz} className="restart-button">
            Quay về trang chủ
          </button>
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