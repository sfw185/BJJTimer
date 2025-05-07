import React, { useState, useEffect, useRef, useCallback } from 'react';
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

    const startTime = useRef(null);
    // sessionStartTime is not used in the provided logic for finish time, but kept for other potential uses
    const sessionStartTime = useRef(null);
    const soonSoundPlayed = useRef(false);
    const readySoundPlayed = useRef(false);

    const startSound = useRef(null);
    const soonSound = useRef(null);
    const readySound = useRef(null);
    const finishSound = useRef(null);

    const initializeAudio = () => {
        if (!startSound.current) {
            startSound.current = new Audio('go.mp3');
            soonSound.current = new Audio('soon.mp3');
            readySound.current = new Audio('ready.mp3');
            finishSound.current = new Audio('finish.mp3');
            startSound.current.load();
            soonSound.current.load();
            readySound.current.load();
            finishSound.current.load();
        }
    };

    // Effect for updating current time and loading initial settings (colors)
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 10000); // Updates current time display every 10 seconds
        setCurrentTime(new Date()); // Set initial current time

        const colorSettings = loadFromLocalStorage('colorSettings', null);
        if (colorSettings) {
            document.documentElement.style.setProperty('--background-color', colorSettings.backgroundColor);
            document.documentElement.style.setProperty('--text-color', colorSettings.textColor);
            document.documentElement.style.setProperty('--current-time-color', colorSettings.currentTimeColor);
            document.documentElement.style.setProperty('--rest-phase-color', colorSettings.restPhaseColor);
            document.documentElement.style.setProperty('--ending-soon-color', colorSettings.endingSoonColor);
        }

        return () => clearInterval(interval);
    }, []); // Runs only once on component mount

    // Recalculate finish time based on current state
    const calculateFinishTime = useCallback(() => {
        if (totalRounds <= 0) {
            setFinishTime(null);
            return;
        }

        const now = new Date();
        let futureMillis = timeLeft; // Start with time remaining in the current phase

        if (isReadyStage) {
            // After the current 'Ready' phase (whose remainder is in timeLeft):
            // Add all work rounds
            futureMillis += totalRounds * roundTime;
            // Add all rest periods between these rounds
            if (totalRounds > 1) {
                futureMillis += (totalRounds - 1) * restTime;
            }
        } else if (isRestTime) {
            // Currently in a rest period. 'timeLeft' is for this current rest.
            // 'currentRound' has just finished.
            // Rounds remaining to START after this rest finishes:
            const roundsYetToStartAfterThisRest = totalRounds - currentRound;
            if (roundsYetToStartAfterThisRest > 0) {
                futureMillis += roundsYetToStartAfterThisRest * roundTime; // Work time for these future rounds
                // Rest periods BETWEEN these future rounds:
                if (roundsYetToStartAfterThisRest > 1) {
                    futureMillis += (roundsYetToStartAfterThisRest - 1) * restTime;
                }
            }
        } else { // Currently in an active work round
            // 'timeLeft' is for the current work round ('currentRound').
            // Full work rounds remaining AFTER this current one finishes:
            const fullRoundsAfterCurrentWork = totalRounds - currentRound;

            if (fullRoundsAfterCurrentWork > 0) {
                // Add time for these full future work rounds
                futureMillis += fullRoundsAfterCurrentWork * roundTime;
                // Add time for all rests that will occur from after the current round until the end:
                // This includes the rest immediately after the current work round (if not the last overall)
                // and rests between subsequent work rounds. Total is 'fullRoundsAfterCurrentWork' rests.
                futureMillis += fullRoundsAfterCurrentWork * restTime;
            }
        }

        const estimatedFinish = new Date(now.getTime() + futureMillis);
        setFinishTime(estimatedFinish);

    }, [totalRounds, timeLeft, currentRound, roundTime, restTime, isRestTime, isReadyStage]);

    // Effect to calculate finish time when core parameters or timer state change
    useEffect(() => {
        if (totalRounds > 0) {
            calculateFinishTime();
        } else {
            setFinishTime(null); // Clear finish time if totalRounds is 0 (infinite mode)
        }
    }, [calculateFinishTime, totalRounds]); // calculateFinishTime itself has all other relevant dependencies

    // Effect to update finish time when timer is paused (due to passage of real time)
    useEffect(() => {
        if (totalRounds > 0 && !running) {
            calculateFinishTime();
        }
    }, [currentTime, running, totalRounds, calculateFinishTime]);


    const startRound = useCallback(() => {
        initializeAudio();
        startSound.current.play();
        startTime.current = Date.now();
        setIsRestTime(false);
        setIsReadyStage(false);
        setCurrentRound(prevRound => prevRound + 1);
        setTimeLeft(roundTime); // Set timeLeft for the new round
        readySoundPlayed.current = false;
        soonSoundPlayed.current = false;
    }, [roundTime]); // Added roundTime dependency for setTimeLeft

    const startReadyStage = useCallback(() => {
        initializeAudio();
        readySound.current.play();
        startTime.current = Date.now();
        setIsReadyStage(true);
        setIsRestTime(false); // Ensure not in rest time
        setCurrentRound(0);   // Reset current round for ready stage
        setTimeLeft(READY_TIME); // Set timeLeft for the ready stage
        readySoundPlayed.current = true;
        soonSoundPlayed.current = false;
    }, []);

    const startRest = useCallback(() => {
        initializeAudio(); // Ensure audio is initialized
        finishSound.current.play();
        startTime.current = Date.now();
        setIsRestTime(true);
        setIsReadyStage(false); // Ensure not in ready stage
        setTimeLeft(restTime); // Set timeLeft for the rest period
        readySoundPlayed.current = false;
        soonSoundPlayed.current = false;
    }, [restTime]); // Added restTime dependency for setTimeLeft

    const tick = useCallback(() => {
        if (!running) return;

        const updatedTime = Date.now();
        let currentPhaseTotalTime;
        if (isReadyStage) {
            currentPhaseTotalTime = READY_TIME;
        } else if (isRestTime) {
            currentPhaseTotalTime = restTime;
        } else {
            currentPhaseTotalTime = roundTime;
        }

        const elapsedTimeInPhase = updatedTime - startTime.current;
        const newTimeLeft = currentPhaseTotalTime - elapsedTimeInPhase;
        setTimeLeft(newTimeLeft <= 0 ? 0 : newTimeLeft);

        // Play "ready" sound before round starts when in rest mode
        if (newTimeLeft <= READY_TIME && newTimeLeft > (READY_TIME - RENDER_RATE) && isRestTime && !isReadyStage && !readySoundPlayed.current) {
            readySound.current.play();
            readySoundPlayed.current = true;
        }

        // Play "soon" sound before round ends
        if (newTimeLeft <= SOON_TIME && newTimeLeft > (SOON_TIME - RENDER_RATE) && !isRestTime && !isReadyStage && !soonSoundPlayed.current) {
            soonSound.current.play();
            soonSoundPlayed.current = true;
        }

        if (newTimeLeft <= 0) {
            if (isReadyStage) {
                startRound();
            } else if (isRestTime) {
                startRound();
            } else { // Work round finished
                if (totalRounds > 0 && currentRound >= totalRounds) {
                    setRunning(false);
                    finishSound.current.play();
                    setIsRestTime(false); // Reset state
                    setIsReadyStage(false);
                    setTimeLeft(roundTime); // Reset timeLeft for next potential start
                    // currentRound remains at totalRounds, indicating completion
                } else {
                    startRest();
                }
            }
        }
    }, [running, isRestTime, isReadyStage, restTime, roundTime, totalRounds, currentRound, startRound, startRest]); // Dependencies for tick

    function useInterval(callback, delay) {
        const savedCallback = useRef();
        useEffect(() => {
            savedCallback.current = callback;
        }, [callback]);
        useEffect(() => {
            if (delay !== null) {
                const id = setInterval(() => savedCallback.current(), delay);
                return () => clearInterval(id);
            }
        }, [delay]);
    }

    useInterval(tick, running ? RENDER_RATE : null);

    const toggleTimer = () => {
        initializeAudio();
        if (!running) {
            if (currentRound === 0 && !isRestTime && !isReadyStage) { // Fresh start or after reset
                startReadyStage();
            } else {
                // Resuming: Recalculate startTime to continue from current timeLeft
                let currentPhaseDuration = isReadyStage ? READY_TIME : (isRestTime ? restTime : roundTime);
                startTime.current = Date.now() - (currentPhaseDuration - timeLeft);
            }
            setRunning(true);
            if (sessionStartTime.current === null) { // Only set if it's a new session start
                 sessionStartTime.current = Date.now();
            }
        } else {
            setRunning(false);
            // timeLeft will hold the paused time.
        }
    };

    const resetTimer = () => {
        setRunning(false);
        setCurrentRound(0);
        setIsRestTime(false);
        setIsReadyStage(false);
        setTimeLeft(roundTime); // This will trigger useEffect to update finishTime
        sessionStartTime.current = null;
        readySoundPlayed.current = false;
        soonSoundPlayed.current = false;
    };

    const changeTotalRounds = (amount) => {
        setTotalRounds(prev => {
            const newValue = Math.max(0, prev + amount);
            saveToLocalStorage('totalRounds', newValue);
            return newValue;
        });
        // useEffect will handle finishTime recalculation
    };

    const changeRoundTime = (amount) => {
        setRoundTime(prev => {
            const newTime = Math.max(30 * SECOND, prev + amount * SECOND);
            saveToLocalStorage('roundTime', newTime);
            // If timer is stopped and in a work phase, or just reset, update timeLeft
            if (!running && !isRestTime && !isReadyStage && currentRound === 0) {
                setTimeLeft(newTime);
            } else if (!running && !isRestTime && !isReadyStage && currentRound > 0) {
                // If stopped mid-round, and round time changes, what should timeLeft be?
                // For simplicity, if reset, it will take new roundTime.
                // If paused mid-round, changing roundTime might be complex for timeLeft.
                // Current logic: only updates timeLeft if "fully stopped" or reset.
            }
            return newTime;
        });
        // useEffect will handle finishTime recalculation
    };

    const changeRestTime = (amount) => {
        setRestTime(prev => {
            const newTime = Math.max(10 * SECOND, prev + amount * SECOND);
            saveToLocalStorage('restTime', newTime);
            // If timer is stopped and in a rest phase, update timeLeft
            if (!running && isRestTime) {
                setTimeLeft(newTime);
            }
            return newTime;
        });
        // useEffect will handle finishTime recalculation
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
        hours = hours % 12 || 12;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        return `${hours}:${minutes} ${ampm}`;
    };

    // Initializing timeLeft based on current state if not running
    // This is useful if roundTime changes while timer is stopped but not reset to round 0.
    useEffect(() => {
        if (!running) {
            if (isReadyStage) {
                // setTimeLeft(READY_TIME); // Usually set by startReadyStage
            } else if (isRestTime) {
                // setTimeLeft(restTime); // Usually set by startRest
            } else if (currentRound === 0) { // idle, before first start or after reset
                 setTimeLeft(roundTime);
            }
            // If paused mid-round (currentRound > 0, not isRestTime, not isReadyStage), timeLeft should persist.
        }
    }, [roundTime, restTime, running, isRestTime, isReadyStage, currentRound]);


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
                        {running ? (isReadyStage ? 'Get Ready' : (isRestTime ? `Rest ${currentRound > 0 ? currentRound : ''}`.trim() : `Round ${currentRound}`)) : (currentRound === 0 ? 'Stopped' : `Paused - Round ${currentRound}`)}
                    </div>
                </Col>
            </Row>
            <Row className="justify-content-center my-0">
                <Col md="auto">
                    <div id="display" className={!isRestTime && !isReadyStage && timeLeft <= SOON_TIME ? 'ending-soon' : ''}>
                        {formatTime(timeLeft < 0 ? 0 : timeLeft)}
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