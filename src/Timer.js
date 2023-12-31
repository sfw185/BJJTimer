import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import './Timer.css';
import { loadFromLocalStorage, saveToLocalStorage } from './utils/storage';

const startSound = new Audio('go.mp3');
const soonSound = new Audio('soon.mp3');
const readySound = new Audio('ready.mp3');
const finishSound = new Audio('finish.mp3');

const SECOND = 1000;
const RENDER_RATE = 250; // 4 updates a second
const READY_TIME = 3 * SECOND;
const SOON_TIME = 10 * SECOND;

const Timer = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [roundTime, setRoundTime] = useState(loadFromLocalStorage('roundTime', 5 * 60 * SECOND));
    const [restTime, setRestTime] = useState(loadFromLocalStorage('restTime', 20 * SECOND));
    const [soonSoundPlayed, setSoonSoundPlayed] = useState(false);
    const [readySoundPlayed, setReadySoundPlayed] = useState(false);
    const [currentRound, setCurrentRound] = useState(0);
    const [isRestTime, setIsRestTime] = useState(false);
    const [running, setRunning] = useState(false);
    const [startTime, setStartTime] = useState(null);
    const [timeLeft, setTimeLeft] = useState(roundTime);

    // Set up timer to refresh every 250ms
    useEffect(() => {
        let interval;
        if (running) {
            setStartTime(new Date().getTime());
            setSoonSoundPlayed(false);
            setReadySoundPlayed(false);
            interval = setInterval(tick, RENDER_RATE);
        }

        return () => clearInterval(interval);
    }, [running, roundTime, restTime, isRestTime, startTime, currentRound]); // eslint-disable-line react-hooks/exhaustive-deps

    // Show current time
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(interval);
    }, []);


    const tick = () => {
        const updatedTime = now();
        const totalTime = isRestTime ? restTime : roundTime;
        const difference = totalTime - (updatedTime - startTime);
        setTimeLeft(difference <= 0 ? totalTime : difference);

        // Play "ready" before round starts
        if (difference <= READY_TIME && difference > (READY_TIME - RENDER_RATE) && isRestTime && !readySoundPlayed) {
            readySound.play();
            setReadySoundPlayed(true);
        }

        // Play "soon" before round ends
        if (difference <= SOON_TIME && difference > (SOON_TIME - RENDER_RATE) && !isRestTime && !soonSoundPlayed) {
            soonSound.play();
            setSoonSoundPlayed(true);
        }

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
        soonSound.load();
        readySound.load();
        finishSound.load();

        startSound.play();
        setIsRestTime(false);
        setCurrentRound(currentRound => currentRound + 1)
        setStartTime(now());
        setReadySoundPlayed(false);
        setSoonSoundPlayed(false);
    }

    const startRest = () => {
        finishSound.play();
        setIsRestTime(true);
        setStartTime(now());
        setReadySoundPlayed(false);
        setSoonSoundPlayed(false);
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

    const formatCurrentTime = (date) => {
        let hours = date.getHours();
        let minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'pm' : 'am';

        hours = hours % 12;
        hours = hours || 12; // Convert '0' to '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;

        return `${hours}:${minutes} ${ampm}`;
    };

    return (
        <Container id="timer">
            <Row className="justify-content-center my-0">
                <Col md="auto">
                    <div className="current-time">
                        { formatCurrentTime(currentTime) }
                    </div>
                </Col>
            </Row>
            <Row className="justify-content-center mt-1">
                <Col md="auto">
                    <div className="status-display">
                        {running ? (isRestTime ? 'Rest Time' : `Round ${currentRound}`) : 'Timer Stopped'}
                    </div>
                </Col>
            </Row>
            <Row className="justify-content-center my-0">
                <Col md="auto">
                    <div id="display">{formatTime(timeLeft)}</div>
                </Col>
            </Row>
            <Row className="justify-content-center my-2">
                <Col xs={12} md={6}>
                    <div className="d-flex justify-content-between">
                        <div>
                            <label>Round:</label>
                            <Button variant="secondary" size="sm" onClick={() => changeRoundTime(-30)}>-</Button>
                            &nbsp;<span>{formatTime(roundTime)}</span>&nbsp;
                            <Button variant="secondary" size="sm" onClick={() => changeRoundTime(30)}>+</Button>
                        </div>
                        <div>
                            <label>Rest:</label>
                            <Button variant="secondary" size="sm" onClick={() => changeRestTime(-10)}>-</Button>
                            &nbsp;<span>{formatTime(restTime)}</span>&nbsp;
                            <Button variant="secondary" size="sm" onClick={() => changeRestTime(10)}>+</Button>
                        </div>
                    </div>
                </Col>
                <Col xs={12} md={6} className="d-flex justify-content-center mt-3 mt-md-0">
                    <div>
                        <Button variant={running ? 'danger' : 'success'} onClick={toggleTimer}>{running ? 'Stop' : 'Start'}</Button>
                        &nbsp;
                        <Button variant="dark" onClick={resetTimer}>Reset</Button>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default Timer;
