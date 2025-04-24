import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/home.css';

function Home() {
  const [category, setCategory] = useState('Pháp luật đại cương'); // Mặc định là bài thi đầu tiên
  const [difficulty, setDifficulty] = useState('easy');
  const navigate = useNavigate();

  const quizzes = [
    'Pháp luật đại cương',
    'Tư tưởng Hồ Chí Minh',
    'Lịch sử Đảng',
    'Triết học Mác Lênin',
    'Quản trị học',
    'Chủ nghĩa xã hội khoa học',
  ];

  const handleQuizSelect = (quiz) => {
    setCategory(quiz);
  };

  const handleStartQuiz = (e) => {
    e.preventDefault();
    if (!category) {
      alert('Vui lòng chọn một bài thi!');
      return;
    }
    navigate('/quiz', { state: { category: `Trắc nghiệm ${category}`, difficulty } });
  };

  return (
    <div className="Home">
      <h1>Chọn bài thi</h1>
      <div className="quiz-row">
        {quizzes.map((quiz, index) => (
          <button
            key={index}
            className={`quiz-button ${category === quiz ? 'selected' : ''}`}
            onClick={() => handleQuizSelect(quiz)}
          >
            {quiz}
          </button>
        ))}
      </div>
      <form onSubmit={handleStartQuiz} className="difficulty-form">
        <div className="form-group">
          <label htmlFor="difficulty">Chọn độ khó:</label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="easy">Dễ</option>
            <option value="medium">Trung bình</option>
            <option value="hard">Khó</option>
          </select>
        </div>
        <button type="submit" className="start-button">
          Bắt đầu làm bài
        </button>
      </form>
    </div>
  );
}

export default Home;
