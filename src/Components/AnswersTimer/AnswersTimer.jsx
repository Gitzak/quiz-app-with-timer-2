import React, { useEffect, useState, useRef } from "react";
import "./AnswersTimer.css";

export const AnswersTimer = ({ duration, onTimeUp }) => {
    const [counter, setCounter] = useState(0);
    const [progressLoaded, setProgressLoaded] = useState(0);
    const intervalRef = useRef();

    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setCounter((cur) => cur + 0.1);
        }, 100);

        return () => clearInterval(intervalRef.current);
    }, []);

    useEffect(() => {
        setProgressLoaded(100 * (counter / duration));
        if (counter >= duration) {
            clearInterval(intervalRef.current);
            setTimeout(() => {
                onTimeUp();
            }, 1000);
        }
    }, [counter]);

    return (
        <div className="answer-timer-container">
            <div
                style={{
                    width: `${progressLoaded}%`,
                    backgroundColor: `${
                      progressLoaded < 70 ? 'rgb(0, 255, 255)' : 'rgb(255, 0, 75)'
                    }`
                }}
                className="progress text-white">
                {counter}
            </div>
        </div>
    );
};
