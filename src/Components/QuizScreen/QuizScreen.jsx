import React, { useMemo, useState } from "react";
import bcrypt from "bcryptjs-react";
import { Loader } from "../Loader/Loader";
import "./QuizScreen.css";
import { resultInitialState } from "../../Constants/constants";
import { AnswersTimer } from "../AnswersTimer/AnswersTimer";
import UseFetchData from "../../hooks/UseFetchData";

export const QuizScreen = ({ retry }) => {

    const bas_url = "http://localhost:3000/quizzes";

    const apiUrl = useMemo(() => bas_url, [bas_url]);

    const { data: questions, loader } = UseFetchData(apiUrl);
    const [duration] = useState(10);

    const [currentQuestion, setCurrentQuestion] = useState(0);

    const [answerIndex, setAnswerIndex] = useState(null);

    const [answer, setAnswer] = useState("");

    const [result, setResult] = useState(resultInitialState);

    const [showReult, setShowReult] = useState(false);

    const [showAnswerTimer, setShowAnswerTimer] = useState(true);

    if (loader) {
        return (
            <div className="container px-5 my-5">
                <div className="row gx-5">
                    <div className="col-12 d-flex justify-content-center align-items-center" style={{ height: "80vh" }}>
                        <Loader />
                    </div>
                </div>
            </div>
        );
    }

    const { question, options, correct_index } = questions[currentQuestion];
    const onAnswerClicked = async (answer, index) => {
        setAnswerIndex(index);
        const isCorrect = bcrypt.compareSync(answer, correct_index);
        setAnswer(isCorrect);       
    };

    const onClickNext = (finalAnswer) => {
        // console.log(finalAnswer);
        setAnswerIndex(null);
        setShowAnswerTimer(false);
        setResult((prev) =>
            finalAnswer
                ? {
                      ...prev,
                      scrore: prev.scrore + 5,
                      correctAnswers: prev.correctAnswers + 1,
                  }
                : {
                      ...prev,
                      wrongAnswers: prev.wrongAnswers + 1,
                  }
        );

        if (currentQuestion !== questions.length - 1) {
            setCurrentQuestion((prev) => prev + 1);
        } else {
            setCurrentQuestion(0);
            setShowReult(true);
        }

        setTimeout(() => {
            setShowAnswerTimer(true);
        });
    };

    // const onTryAgain = () => {
    //     setResult(resultInitialState);
    //     setShowReult(false);
    // };

    const handleTimeUp = () => {
        setAnswer(false);
        onClickNext(false);
    };

    const commonClassName = "btn btn-lg px-4 me-sm-3 rounded-pill w-100";

    return (
        <section className="bg-dark py-5 vh-100">
            <div className="container px-5">
                <div className="row gx-5 align-items-center justify-content-center">
                    <div className="col-lg-8">
                        {!showReult ? (
                            <div id="question-container" className="my-5 pt-3">
                                {showAnswerTimer && <AnswersTimer duration={duration} onTimeUp={handleTimeUp} />}
                                <h2 className="fw-medium text-white my-4 text-center">
                                    {currentQuestion + 1} / {questions.length}
                                </h2>
                                <h1 className="display-5 fw-medium text-white my-4 text-left">{question}</h1>
                                <div className="d-flex flex-wrap flex-shrink gap-3 justify-content-center">
                                    {options.map((option, index) => {
                                        return (
                                            <button
                                                key={index}
                                                className={`${answerIndex === index ? "btn-info" : "btn-outline-light"} ${commonClassName}`}
                                                onClick={() => {
                                                    onAnswerClicked(option, index);
                                                }}>
                                                {option}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="d-flex m-4 justify-content-end fixed-bottom">
                                    <button onClick={() => onClickNext(answer)} className="btn btn-warning btn-lg px-4 me-sm-4 rounded-pill">
                                        {currentQuestion === question.length - 1 ? "Finish" : "Next"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="my-5">
                                <h1 className="display-5 fw-bolder text-white my-4 text-left">Result</h1>
                                <p className="muted text-white">Total question : {questions.length}</p>
                                <p className="muted text-white">Total Scrore : {result.scrore}</p>
                                <p className="muted text-white">Correct Answers : {result.correctAnswers}</p>
                                <p className="muted text-white">Wrong Answers : {result.wrongAnswers}</p>
                                <div className="d-flex mt-4 justify-content-end">
                                    <button className="btn btn-primary btn-lg px-4 rounded-pill me-sm-4" onClick={retry}>
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};
