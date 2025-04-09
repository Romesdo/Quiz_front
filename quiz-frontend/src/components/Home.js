import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const [category, setCategory] = useState('Geography');
  const [difficulty, setDifficulty] = useState('easy');
  const navigate = useNavigate();

  const handleStartQuiz = (e) => {
    e.preventDefault();
    navigate('/quiz', { state: { category, difficulty } });
  };

  return (
    <div className="Home">
      <h1>TEST ONLINE</h1>
      <form onSubmit={handleStartQuiz} className="filter-form">
        <div>
          <label>Category:</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="Geography">Geography</option>
            <option value="Science">Science</option>
            <option value="History">History</option>
          </select>
        </div>
        <div>
          <label>Difficulty:</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <button type="submit">Start</button>
      </form>
    </div>
  );
}

export default Home;