import { QuizScreen } from './Components/QuizScreen/QuizScreen';
import { JoinScreen } from './Components/JoinScreen/JoinScreen';
import { useState } from 'react';


function App() {
  const [isQuizStarted, setIsQuizStarted] = useState(false)

  const preventContextMenu = (event) => {
    event.preventDefault();
  }

  return (
    <div className="quiz-container" onContextMenu={preventContextMenu}>
      {
        isQuizStarted ? (
          <QuizScreen retry={() => setIsQuizStarted(false)} />
        ) : (
          <JoinScreen start={() => setIsQuizStarted(true)} />
        )
      }
    </div>
  );
}

export default App;
