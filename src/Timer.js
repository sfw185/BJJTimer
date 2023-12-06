import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import './Timer.css';
import { loadFromLocalStorage, saveToLocalStorage } from './utils/storage';

const startSound = new Audio('start.mp3');
const finishSound = new Audio('finish.mp3');

const SECOND = 1000;
const RENDER_RATE = 250; // 4 updates a second

const Timer = () => {
    const [roundTime, setRoundTime] = useState(loadFromLocalStorage('roundTime', 5 * 60 * SECOND));
    const [restTime, setRestTime] = useState(loadFromLocalStorage('restTime', 20 * SECOND));
    const [currentRound, setCurrentRound] = useState(0);
    const [isRestTime, setIsRestTime] = useState(false);
    const [running, setRunning] = useState(false);
    const [startTime, setStartTime] = useState(null);
    const [timeLeft, setTimeLeft] = useState(roundTime);

    useEffect(() => {
        let interval;
        if (running) {
            setStartTime(new Date().getTime());
            interval = setInterval(tick, RENDER_RATE);
        }

        return () => clearInterval(interval);
    }, [running, roundTime, restTime, isRestTime, startTime, currentRound]); // eslint-disable-line react-hooks/exhaustive-deps

    const tick = () => {
        const updatedTime = now();
        const totalTime = isRestTime ? restTime : roundTime;
        const difference = totalTime - (updatedTime - startTime);
        setTimeLeft(difference <= 0 ? totalTime : difference);

        if (difference <= 0) {
            if (isRestTime) {
                // Transition from Rest to a New Round
                startRound();
            } else {
                // Transition from a Round to Rest
                startRest();
            }
        }

    }

    const now = () => Date.now();

    const startRound = () => {
        // Explicitly loading audio here as some browsers don't like it happening outside of a user interaction
        startSound.load();
        finishSound.load();

        startSound.play();
        setIsRestTime(false);
        setCurrentRound(currentRound => currentRound + 1)
        setStartTime(now());
    }

    const startRest = () => {
        finishSound.play();
        setIsRestTime(true);
        setStartTime(now());
    }

    const toggleTimer = () => {
        if (!running) {
            startRound()
            setRunning(true);
        } else {
            setRunning(false)
        }
    };

    const resetTimer = () => {
        setRunning(false);
        setCurrentRound(0);
        setIsRestTime(false);
        setTimeLeft(roundTime);
    };

    const changeRoundTime = (amount) => {
        const newTime = Math.max(30 * SECOND, roundTime + amount * SECOND);
        setRoundTime(newTime);
        saveToLocalStorage('roundTime', newTime);
        if (!running && !isRestTime) {
            setTimeLeft(newTime);
        }
    };

    const changeRestTime = (amount) => {
        const newTime = Math.max(10 * SECOND, restTime + amount * SECOND);
        setRestTime(newTime);
        saveToLocalStorage('restTime', newTime);
        if (!running && isRestTime) {
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
            <Row className="justify-content-center my-2">
                <Col md="auto">
                    <div className="status-display">
                        {running ? (isRestTime ? 'Rest Time' : `Round ${currentRound}`) : 'Timer Stopped'}
                    </div>
                </Col>
            </Row>
            <Row className="justify-content-center my-4">
                <Col md="auto">
                    <div id="display">{formatTime(timeLeft)}</div>
                </Col>
            </Row>
            <Row className="justify-content-center my-2">
                <Col md={6} className="control-group">
                    <label>Round:</label>&nbsp;
                    <Button variant="secondary" onClick={() => changeRoundTime(-30)}>-</Button>
                    &nbsp;<span>{formatTime(roundTime)}</span>&nbsp;
                    <Button variant="secondary" onClick={() => changeRoundTime(30)}>+</Button>
                </Col>
                <Col md={6} className="control-group">
                    <label>Rest:</label>&nbsp;
                    <Button variant="secondary" onClick={() => changeRestTime(-10)}>-</Button>
                    &nbsp;<span>{formatTime(restTime)}</span>&nbsp;
                    <Button variant="secondary" onClick={() => changeRestTime(10)}>+</Button>
                </Col>
            </Row>
            <Row className="justify-content-center my-2">
                <Col md="auto">
                    <Button variant={running ? 'danger' : 'success'} onClick={toggleTimer}>{running ? 'Stop' : 'Start'}</Button>
                    &nbsp;
                    <Button variant="dark" onClick={resetTimer}>Reset</Button>
                </Col>
            </Row>
        </Container>
    );
};

export default Timer;
