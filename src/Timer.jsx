import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { PlayFill, StopFill, ArrowCounterclockwise, DashLg, PlusLg, Infinity, ClockFill } from 'react-bootstrap-icons';
import './Timer.css';
import { loadFromLocalStorage, saveToLocalStorage } from './utils/storage';
import Settings from './components/Settings';

const SECOND = 1000;
const UPDATES_PER_SECOND = 5;
const RENDER_RATE = SECOND / UPDATES_PER_SECOND;

const READY_TIME = 3 * SECOND;
const SOON_TIME = 10 * SECOND;

const Timer = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [finishTime, setFinishTime] = useState(null);
    const [roundTime, setRoundTime] = useState(loadFromLocalStorage('roundTime', 5 * 60 * SECOND));
    const [restTime, setRestTime] = useState(loadFromLocalStorage('restTime', 20 * SECOND));
    const [currentRound, setCurrentRound] = useState(0);
    const [totalRounds, setTotalRounds] = useState(loadFromLocalStorage('totalRounds', 0));
    const [isRestTime, setIsRestTime] = useState(false);
    const [isReadyStage, setIsReadyStage] = useState(false);
    const [running, setRunning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(roundTime);

    // Use refs for mutable variables that don't trigger re-renders
    const startTime = useRef(null);
    const sessionStartTime = useRef(null);
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

    // This effect runs only once at component mount to set up timers and initial state
    useEffect(() => {
        // Update current time every minute
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 10000);
        setCurrentTime(new Date()); // set initial

        // Initial calculation of finish time on component mount
        if (totalRounds > 0) {
            // Use setTimeout to ensure this runs after the component is fully initialized
            setTimeout(() => calculateFinishTime(), 0);
        }

        // Load color settings on startup
        const colorSettings = loadFromLocalStorage('colorSettings', null);
        if (colorSettings) {
            document.documentElement.style.setProperty('--background-color', colorSettings.backgroundColor);
            document.documentElement.style.setProperty('--text-color', colorSettings.textColor);
            document.documentElement.style.setProperty('--current-time-color', colorSettings.currentTimeColor);
            document.documentElement.style.setProperty('--rest-phase-color', colorSettings.restPhaseColor);
            document.documentElement.style.setProperty('--ending-soon-color', colorSettings.endingSoonColor);
        }

        return () => clearInterval(interval);
    }, []);

    // Calculate finish time based on total rounds, round time, and rest time
    const calculateFinishTime = useCallback(() => {
        // If totalRounds is 0 (infinite mode), there's no defined finish time.
        if (totalRounds <= 0) {
            setFinishTime(null);
            return;
        }

        const now = new Date();
        // Start accumulating total remaining time with the time left in the *current* phase.
        // Note: 'timeLeft' might be stale if paused, but adding to 'now' keeps the estimate correct relative to wall-clock time.
        let totalTimeMs = timeLeft;

        let remainingFullRounds = 0; // Full rounds yet to start
        let remainingRestPeriods = 0; // Full rest periods yet to start

        if (isReadyStage) {
            // If in the initial 'Ready' stage, all rounds and rests are yet to come.
            remainingFullRounds = totalRounds;
            // There's one less rest period than the total number of rounds.
            remainingRestPeriods = Math.max(0, totalRounds - 1);

        } else if (isRestTime) {
            // If currently in a rest period, 'currentRound' rounds have been fully completed.
            // Calculate the number of full rounds remaining AFTER this rest period finishes.
            remainingFullRounds = totalRounds - currentRound;
            // Rests happen between these future rounds. If N rounds remain, N-1 rests remain.
            remainingRestPeriods = Math.max(0, remainingFullRounds - 1);

        } else {
            // If currently in an active work round ('currentRound' is in progress).
            // Calculate the number of full rounds remaining AFTER this current round finishes.
            remainingFullRounds = totalRounds - currentRound;
            // Calculate the number of full rest periods remaining:
            // one rest follows each upcoming round except the last one.
            remainingRestPeriods = Math.max(0, remainingFullRounds - 1);
        }

        // Add the total duration for all remaining full rounds.
        if (remainingFullRounds > 0) {
            totalTimeMs += remainingFullRounds * roundTime;
        }

        // Add the total duration for all remaining full rest periods.
        if (remainingRestPeriods > 0) {
            totalTimeMs += remainingRestPeriods * restTime;
        }

        // Calculate the final estimated finish time by adding the total remaining duration to the current time.
        const estimatedFinish = new Date(now.getTime() + totalTimeMs);
        setFinishTime(estimatedFinish);

    }, [totalRounds, timeLeft, currentRound, roundTime, restTime, isRestTime, isReadyStage]); // Dependencies based on values used in calculation


    // Start a new round
    const startRound = useCallback(() => {
        initializeAudio();
        startSound.current.play();
        startTime.current = Date.now();
        setIsRestTime(false);
        setIsReadyStage(false);
        setCurrentRound(prevRound => prevRound + 1);
        readySoundPlayed.current = false;
        soonSoundPlayed.current = false;
    }, []);

    // Start the ready stage
    const startReadyStage = useCallback(() => {
        initializeAudio();
        readySound.current.play();
        startTime.current = Date.now();
        setIsReadyStage(true);
        readySoundPlayed.current = true;
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
        let totalTime;
        if (isReadyStage) {
            totalTime = READY_TIME;
        } else if (isRestTime) {
            totalTime = restTime;
        } else {
            totalTime = roundTime;
        }

        const difference = totalTime - (updatedTime - startTime.current);
        setTimeLeft(difference <= 0 ? 0 : difference);

        // Always recalculate finish time on each tick when running
        if (totalRounds > 0) {
            calculateFinishTime();
        }

        // Play "ready" sound before round starts when in rest mode
        if (difference <= READY_TIME && difference > (READY_TIME - RENDER_RATE) && isRestTime && !isReadyStage && !readySoundPlayed.current) {
            readySound.current.play();
            readySoundPlayed.current = true;
        }

        // Play "soon" sound before round ends
        if (difference <= SOON_TIME && difference > (SOON_TIME - RENDER_RATE) && !isRestTime && !isReadyStage && !soonSoundPlayed.current) {
            soonSound.current.play();
            soonSoundPlayed.current = true;
        }

        if (difference <= 0) {
            if (isReadyStage) {
                startRound();
            } else if (isRestTime) {
                startRound();
            } else {
                // Check if we've reached the total number of rounds
                if (totalRounds > 0 && currentRound >= totalRounds) {
                // Stop the timer and reset state after the last round
                setRunning(false);
                finishSound.current.play();
                setIsRestTime(false);
                setIsReadyStage(false);
                setTimeLeft(roundTime);
                } else {
                    startRest();
                }
            }
        }
    }, [running, isRestTime, isReadyStage, restTime, roundTime, totalRounds, currentRound, startRound, startRest, calculateFinishTime]);

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

    // Use the custom useInterval hook to call tick at the render rate when running
    // Pass the delay as null when not running to avoid scheduling the interval
    useInterval(tick, running ? RENDER_RATE : null);

    const toggleTimer = () => {
        initializeAudio();
        if (!running) {
            // If this is the first round, start with the ready stage
            if (currentRound === 0) {
                startReadyStage();
            } else {
                startRound();
            }
            setRunning(true);
            sessionStartTime.current = Date.now();
            calculateFinishTime();
        } else {
            setRunning(false);
            // Don't clear finish time when stopping
        }
    };

    const resetTimer = () => {
        setRunning(false);
        setCurrentRound(0);
        setIsRestTime(false);
        setIsReadyStage(false);
        setTimeLeft(roundTime);
        sessionStartTime.current = null;

        // Recalculate finish time instead of setting to null
        if (totalRounds > 0) {
            calculateFinishTime();
        } else {
            setFinishTime(null);
        }
    };

    const changeTotalRounds = (amount) => {
        // Ensure totalRounds doesn't go below 0
        const newValue = Math.max(0, totalRounds + amount);
        setTotalRounds(newValue);
        saveToLocalStorage('totalRounds', newValue);

        // Always recalculate finish time if rounds > 0, regardless of running state
        if (newValue > 0) {
            calculateFinishTime();
        } else if (newValue === 0) {
            setFinishTime(null);
        }
    };

    const changeRoundTime = (amount) => {
        const newTime = Math.max(30 * SECOND, roundTime + amount * SECOND);
        setRoundTime(newTime);
        saveToLocalStorage('roundTime', newTime);
        if (!running && !isRestTime) {
            setTimeLeft(newTime);
        }

        // Always recalculate finish time when round time changes
        if (totalRounds > 0) {
            calculateFinishTime();
        }
    };

    const changeRestTime = (amount) => {
        const newTime = Math.max(10 * SECOND, restTime + amount * SECOND);
        setRestTime(newTime);
        saveToLocalStorage('restTime', newTime);
        if (!running && isRestTime) {
            setTimeLeft(newTime);
        }

        // Always recalculate finish time when rest time changes
        if (totalRounds > 0) {
            calculateFinishTime();
        }
    };

    const formatTime = (time) => {
        const minutes = Math.floor(time / (SECOND * 60));
        const seconds = Math.floor((time % (SECOND * 60)) / SECOND);
        return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const formatCurrentTime = (date) => {
        if (!date) return '';

        let hours = date.getHours();
        let minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'pm' : 'am';

        hours = hours % 12 || 12; // Convert '0' to '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;

        return `${hours}:${minutes} ${ampm}`;
    };

    // Recalculate finish time when relevant values change
    useEffect(() => {
        if (totalRounds > 0) {
            calculateFinishTime();
        }
    }, [calculateFinishTime, running, currentRound, isRestTime, totalRounds, roundTime, restTime]);

    // Update finish time when current time changes (even if timer is paused)
    useEffect(() => {
        // This ensures the finish time is updated even when the timer is paused
        if (totalRounds > 0 && !running) {
            calculateFinishTime();
        }
    }, [currentTime, calculateFinishTime, totalRounds, running]);

    return (
        <Container fluid id="timer" className={isRestTime || isReadyStage ? 'rest-phase' : 'round-phase'}>
            <Settings />
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
                        {running ? (isReadyStage ? 'Get Ready' : (isRestTime ? `Rest ${currentRound}` : `Round ${currentRound}`)) : 'Stopped'}
                    </div>
                </Col>
            </Row>
            <Row className="justify-content-center my-0">
                <Col md="auto">
                    <div id="display" className={!isRestTime && timeLeft <= SOON_TIME ? 'ending-soon' : ''}>
                        {formatTime(timeLeft)}
                    </div>
                </Col>
            </Row>
            <Row className="justify-content-center my-2">
                <Col xs={12} lg={10} xl={8} className="mx-auto">
                    <div className="d-flex flex-column flex-sm-row justify-content-center align-items-center gap-4">
                        <div className="timer-control-group">
                            <label className="me-2">Duration:</label>
                            <Button variant="secondary" size="sm" onClick={() => changeRoundTime(-30)} className="d-inline-flex align-items-center"><DashLg /></Button>
                            <span className="mx-2">{formatTime(roundTime)}</span>
                            <Button variant="secondary" size="sm" onClick={() => changeRoundTime(30)} className="d-inline-flex align-items-center"><PlusLg /></Button>
                        </div>
                        <div className="timer-control-group">
                            <label className="me-2">Rest:</label>
                            <Button variant="secondary" size="sm" onClick={() => changeRestTime(-10)} className="d-inline-flex align-items-center"><DashLg /></Button>
                            <span className="mx-2">{formatTime(restTime)}</span>
                            <Button variant="secondary" size="sm" onClick={() => changeRestTime(10)} className="d-inline-flex align-items-center"><PlusLg /></Button>
                        </div>
                        <div className="timer-control-group">
                            <label className="me-2">Rounds:</label>
                            <Button variant="secondary" size="sm" onClick={() => changeTotalRounds(-1)} className="d-inline-flex align-items-center"><DashLg /></Button>
                            <span className="mx-2">{totalRounds === 0 ? <Infinity /> : totalRounds}</span>
                            <Button variant="secondary" size="sm" onClick={() => changeTotalRounds(1)} className="d-inline-flex align-items-center"><PlusLg /></Button>
                        </div>
                    </div>
                    <div className="d-flex justify-content-center mt-4">
                        <Button variant={running ? 'danger' : 'success'} onClick={toggleTimer} className="d-flex align-items-center me-3">
                            {running ? <><StopFill className="me-1" /> Stop</> : <><PlayFill className="me-1" /> Start</>}
                        </Button>
                        <Button variant="dark" onClick={resetTimer} className="d-flex align-items-center">
                            <ArrowCounterclockwise className="me-1" /> Reset
                        </Button>
                    </div>
                    {finishTime && totalRounds > 0 && (
                        <div className="finish-time-container mt-3">
                            <ClockFill className="me-1" size={14} />
                            <span className="finish-time-label">Finish at:</span>
                            <span className="finish-time">{formatCurrentTime(finishTime)}</span>
                        </div>
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default Timer;
