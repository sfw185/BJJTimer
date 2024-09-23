import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import './Timer.css';
import { loadFromLocalStorage, saveToLocalStorage } from './utils/storage';

const SECOND = 1000;
const UPDATES_PER_SECOND = 5;
const RENDER_RATE = SECOND / UPDATES_PER_SECOND;

const READY_TIME = 3 * SECOND;
const SOON_TIME = 10 * SECOND;

const Timer = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [roundTime, setRoundTime] = useState(loadFromLocalStorage('roundTime', 5 * 60 * SECOND));
    const [restTime, setRestTime] = useState(loadFromLocalStorage('restTime', 20 * SECOND));
    const [currentRound, setCurrentRound] = useState(0);
    const [isRestTime, setIsRestTime] = useState(false);
    const [running, setRunning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(roundTime);

    // Use refs for mutable variables that don't trigger re-renders
    const startTime = useRef(null);
    const soonSoundPlayed = useRef(false);
    const readySoundPlayed = useRef(false);

    // Audio objects as refs to prevent re-creation
    const startSound = useRef(null);
    const soonSound = useRef(null);
    const readySound = useRef(null);
    const finishSound = useRef(null);

    // Initialize audio refs on user interaction
    const initializeAudio = () => {
        if (!startSound.current) {
            startSound.current = new Audio('go.mp3');
            soonSound.current = new Audio('soon.mp3');
            readySound.current = new Audio('ready.mp3');
            finishSound.current = new Audio('finish.mp3');

            // Load audio files after user interaction
            startSound.current.load();
            soonSound.current.load();
            readySound.current.load();
            finishSound.current.load();
        }
    };

    // Update current time every second
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Start a new round
    const startRound = useCallback(() => {
        initializeAudio();
        startSound.current.play();
        startTime.current = Date.now();
        setIsRestTime(false);
        setCurrentRound(prevRound => prevRound + 1);
        readySoundPlayed.current = false;
        soonSoundPlayed.current = false;
    }, []);

    // Start rest time
    const startRest = useCallback(() => {
        finishSound.current.play();
        startTime.current = Date.now();
        setIsRestTime(true);
        readySoundPlayed.current = false;
        soonSoundPlayed.current = false;
    }, []);

    // The main timer function
    const tick = useCallback(() => {
        if (!running) return;

        const updatedTime = Date.now();
        const totalTime = isRestTime ? restTime : roundTime;
        const difference = totalTime - (updatedTime - startTime.current);
        setTimeLeft(difference <= 0 ? 0 : difference);

        // Play "ready" sound before round starts
        if (difference <= READY_TIME && difference > (READY_TIME - RENDER_RATE) && isRestTime && !readySoundPlayed.current) {
            readySound.current.play();
            readySoundPlayed.current = true;
        }

        // Play "soon" sound before round ends
        if (difference <= SOON_TIME && difference > (SOON_TIME - RENDER_RATE) && !isRestTime && !soonSoundPlayed.current) {
            soonSound.current.play();
            soonSoundPlayed.current = true;
        }

        if (difference <= 0) {
            if (isRestTime) {
                startRound();
            } else {
                startRest();
            }
        }
    }, [running, isRestTime, restTime, roundTime, startRound, startRest]);

    // Custom hook to handle intervals with the latest state
    function useInterval(callback, delay) {
        const savedCallback = useRef();

        // Remember the latest callback if it changes
        useEffect(() => {
            savedCallback.current = callback;
        }, [callback]);

        // Set up the interval
        useEffect(() => {
            if (delay !== null) {
                const id = setInterval(() => savedCallback.current(), delay);
                return () => clearInterval(id);
            }
        }, [delay]);
    }

    // Use the custom useInterval hook
    useInterval(running ? tick : null, RENDER_RATE);

    const toggleTimer = () => {
        initializeAudio();
        if (!running) {
            startRound();
            setRunning(true);
        } else {
            setRunning(false);
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

        hours = hours % 12 || 12; // Convert '0' to '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;

        return `${hours}:${minutes} ${ampm}`;
    };

    return (
        <Container id="timer">
            <Row className="justify-content-center my-0">
                <Col md="auto">
                    <div className="current-time">
                        {formatCurrentTime(currentTime)}
                    </div>
                </Col>
            </Row>
            <Row className="justify-content-center mt-1">
                <Col md="auto">
                    <div className="status-display">
                        {running ? (isRestTime ? `Rest ${currentRound}` : `Round ${currentRound}`) : 'Timer Stopped'}
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
                        <Button variant={running ? 'danger' : 'success'} onClick={toggleTimer}>
                            {running ? 'Stop' : 'Start'}
                        </Button>
                        &nbsp;
                        <Button variant="dark" onClick={resetTimer}>Reset</Button>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default Timer;
