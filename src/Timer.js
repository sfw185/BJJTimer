import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import './Timer.css';
const startSound = new Audio('start.wav');
const finishSound = new Audio('finish.wav');
const SECOND = 1000;

const Timer = () => {
    const [roundTime, setRoundTime] = useState(5 * 60 * SECOND);
    const [restTime, setRestTime] = useState(20 * SECOND);
    const [currentTimer, setCurrentTimer] = useState('round'); // 'round' or 'rest'
    const [running, setRunning] = useState(false);
    const [startTime, setStartTime] = useState(null);
    const [timeLeft, setTimeLeft] = useState(roundTime);

    useEffect(() => {
        let interval;
        if (running) {
            setStartTime(new Date().getTime());
            interval = setInterval(() => {
                const updatedTime = new Date().getTime();
                const totalTime = currentTimer === 'round' ? roundTime : restTime;
                const difference = totalTime - (updatedTime - startTime);
                setTimeLeft(difference <= 0 ? totalTime : difference);

                if (difference <= 0) {
                    if (currentTimer === 'round') {
                        finishSound.play();
                        setCurrentTimer('rest');
                        setStartTime(updatedTime);
                    } else {
                        startSound.play();
                        setCurrentTimer('round');
                        setStartTime(updatedTime);
                    }
                }
            }, SECOND);
        }

        return () => clearInterval(interval);
    }, [running, roundTime, restTime, currentTimer, startTime]);

    const toggleTimer = () => {
        if (!running) {
            setRunning(true);
            setCurrentTimer('round');
            setStartTime(new Date().getTime());
            startSound.play(); // Play the start sound at the beginning of the first round
        } else {
            setRunning(false);
        }
    };

    const resetTimer = () => {
        setRunning(false);
        setTimeLeft(roundTime);
        setCurrentTimer('round');
    };

    const changeRoundTime = (amount) => {
        const newTime = Math.max(30 * SECOND, roundTime + amount * SECOND);
        setRoundTime(newTime);
        if (!running && currentTimer === 'round') {
            setTimeLeft(newTime);
        }
    };

    const changeRestTime = (amount) => {
        const newTime = Math.max(10 * SECOND, restTime + amount * SECOND);
        setRestTime(newTime);
        if (!running && currentTimer === 'rest') {
            setTimeLeft(newTime);
        }
    };

    const formatTime = (time) => {
        const minutes = Math.floor(time / (SECOND * 60));
        const seconds = Math.floor((time % (SECOND * 60)) / SECOND);
        return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <Container id="timer">
            <Row className="justify-content-center my-4">
                <Col md="auto">
                    <div id="display">{formatTime(timeLeft)}</div>
                </Col>
            </Row>
            <Row className="justify-content-center my-2">
                <Col md="auto" className="control-group">
                    <label>Round Time:</label>&nbsp;
                    <Button variant="secondary" onClick={() => changeRoundTime(-30)}>-</Button>
                    &nbsp;<span>{formatTime(roundTime)}</span>&nbsp;
                    <Button variant="secondary" onClick={() => changeRoundTime(30)}>+</Button>
                </Col>
            </Row>
            <Row className="justify-content-center my-2">
                <Col md="auto" className="control-group">
                    <label>Rest Time:</label>&nbsp;
                    <Button variant="secondary" onClick={() => changeRestTime(-10)}>-</Button>
                    &nbsp;<span>{formatTime(restTime)}</span>&nbsp;
                    <Button variant="secondary" onClick={() => changeRestTime(10)}>+</Button>
                </Col>
            </Row>
            <Row className="justify-content-center my-2">
                <Col md="auto">
                    <Button variant="success" onClick={toggleTimer}>{running ? 'Pause' : 'Start'}</Button>
                    {' '}
                    {running && <Button variant="dark" onClick={resetTimer}>Reset</Button>}
                </Col>
            </Row>
        </Container>
    );
};

export default Timer;
