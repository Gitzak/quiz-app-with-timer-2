import { QuizScreen } from './Components/QuizScreen/QuizScreen';
import { JoinScreen } from './Components/JoinScreen/JoinScreen';
import QuestionList from "./data/quizzes.json";
import { useState } from 'react';


function App() {
  const [isQuizStarted, setIsQuizStarted] = useState(false)
  return (
    <div className="quiz-container">
      {
        isQuizStarted ? (
          <QuizScreen retry={() => setIsQuizStarted(false)} questions={QuestionList} />
        ) : (
          <JoinScreen start={() => setIsQuizStarted(true)} />
        )
      }
    </div>
  );
}

export default App;
