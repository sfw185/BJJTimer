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
    const [currentRound, setCurrentRound] = useState(0); // 0 means not started or reset
    const [totalRounds, setTotalRounds] = useState(loadFromLocalStorage('totalRounds', 0)); // 0 for infinite
    const [isRestTime, setIsRestTime] = useState(false);
    const [isReadyStage, setIsReadyStage] = useState(false);
    const [running, setRunning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(roundTime);

    const startTime = useRef(null); // Start time of the current phase
    const sessionStartTime = useRef(null); // Not used for ETA, but kept

    const soonSoundPlayed = useRef(false);
    const readySoundPlayed = useRef(false);

    const startSound = useRef(null);
    const soonSound = useRef(null);
    const readySound = useRef(null);
    const finishSound = useRef(null);

    const initializeAudio = useCallback(() => {
        if (!startSound.current) {
            try {
                startSound.current = new Audio('go.mp3');
                soonSound.current = new Audio('soon.mp3');
                readySound.current = new Audio('ready.mp3');
                finishSound.current = new Audio('finish.mp3');
                // Preload audio
                startSound.current.load();
                soonSound.current.load();
                readySound.current.load();
                finishSound.current.load();
            } catch (error) {
                console.error("Error initializing audio:", error);
                // Fallback or disable audio if there's an error (e.g., in environments without Audio)
                startSound.current = { play: () => {}, load: () => {} };
                soonSound.current = { play: () => {}, load: () => {} };
                readySound.current = { play: () => {}, load: () => {} };
                finishSound.current = { play: () => {}, load: () => {} };
            }
        }
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 10000);
        setCurrentTime(new Date());

        const colorSettings = loadFromLocalStorage('colorSettings', null);
        if (colorSettings) {
            document.documentElement.style.setProperty('--background-color', colorSettings.backgroundColor);
            document.documentElement.style.setProperty('--text-color', colorSettings.textColor);
            document.documentElement.style.setProperty('--current-time-color', colorSettings.currentTimeColor);
            document.documentElement.style.setProperty('--rest-phase-color', colorSettings.restPhaseColor);
            document.documentElement.style.setProperty('--ending-soon-color', colorSettings.endingSoonColor);
        }
        initializeAudio(); // Initialize audio once on mount

        return () => clearInterval(interval);
    }, [initializeAudio]);

    const calculateFinishTime = useCallback(() => {
        if (totalRounds <= 0) { // Infinite rounds means no specific finish time
            setFinishTime(null);
            return;
        }

        const now = new Date();
        let futureMillis = 0;

        // Case 1: Timer is idle (reset, or before first ever start)
        if (currentRound === 0 && !isReadyStage && !isRestTime) {
            futureMillis = READY_TIME; // Starts with a ready stage
            futureMillis += totalRounds * roundTime; // Total time for all work rounds
            if (totalRounds > 1) {
                futureMillis += (totalRounds - 1) * restTime; // Total time for rests between rounds
            }
        }
        // Case 2: Timer is in the 'Get Ready' stage
        else if (isReadyStage) {
            futureMillis = timeLeft; // Remaining time in current 'Get Ready' stage
            futureMillis += totalRounds * roundTime; // Add all work rounds
            if (totalRounds > 1) {
                futureMillis += (totalRounds - 1) * restTime; // Add all rest periods between these work rounds
            }
        }
        // Case 3: Timer is in a Rest period
        else if (isRestTime) {
            futureMillis = timeLeft; // Remaining time in current Rest period
            // 'currentRound' indicates the round that has just finished
            const roundsYetToStartAfterThisRest = totalRounds - currentRound;
            if (roundsYetToStartAfterThisRest > 0) {
                futureMillis += roundsYetToStartAfterThisRest * roundTime; // Work time for these future rounds
                // Rest periods BETWEEN these future work rounds:
                if (roundsYetToStartAfterThisRest > 1) {
                    futureMillis += (roundsYetToStartAfterThisRest - 1) * restTime;
                }
            }
        }
        // Case 4: Timer is in an active Work round
        else { // Implies: !isReadyStage && !isRestTime && currentRound > 0
            futureMillis = timeLeft; // Remaining time in current Work round
            // 'currentRound' is the currently active round (1-indexed)
            const fullWorkRoundsRemainingAfterCurrent = totalRounds - currentRound;

            if (fullWorkRoundsRemainingAfterCurrent > 0) {
                // Add time for these full future work rounds
                futureMillis += fullWorkRoundsRemainingAfterCurrent * roundTime;
                // Add time for rests that will occur *after* the current round and *between* subsequent rounds.
                // Each of these future work rounds will be followed by a rest,
                // except there's no rest after the very final work round of the session.
                // So, number of rests = fullWorkRoundsRemainingAfterCurrent.
                futureMillis += fullWorkRoundsRemainingAfterCurrent * restTime;
            }
        }

        if (futureMillis < 0) futureMillis = 0; // Precaution

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
        if (totalRounds > 0 && !running && finishTime) { // Only if finishTime was already set
            calculateFinishTime();
        }
    }, [currentTime, running, totalRounds, calculateFinishTime, finishTime]);


    const startRound = useCallback(() => {
        startSound.current?.play().catch(e => console.error("Error playing start sound:", e));
        startTime.current = Date.now();
        setIsRestTime(false);
        setIsReadyStage(false);
        setCurrentRound(prevRound => prevRound + 1); // Increment for the new round
        setTimeLeft(roundTime);
        readySoundPlayed.current = false;
        soonSoundPlayed.current = false;
    }, [roundTime, startSound]);

    const startReadyStage = useCallback(() => {
        readySound.current?.play().catch(e => console.error("Error playing ready sound:", e));
        startTime.current = Date.now();
        setIsReadyStage(true);
        setIsRestTime(false);
        setCurrentRound(0); // In ready stage, effectively before round 1
        setTimeLeft(READY_TIME);
        readySoundPlayed.current = true; // The main "ready" sound for the stage itself
        soonSoundPlayed.current = false;
    }, [readySound]);

    const startRest = useCallback(() => {
        finishSound.current?.play().catch(e => console.error("Error playing finish sound:", e));
        startTime.current = Date.now();
        setIsRestTime(true);
        setIsReadyStage(false);
        setTimeLeft(restTime);
        // currentRound remains the number of the round just completed
        readySoundPlayed.current = false; // Reset for the "ready" sound at end of rest
        soonSoundPlayed.current = false;
    }, [restTime, finishSound]);

    const resetTimer = useCallback(() => {
        setRunning(false);
        setCurrentRound(0); // Key indicator for idle/reset state
        setIsRestTime(false);
        setIsReadyStage(false);
        setTimeLeft(roundTime); // Display upcoming round time; calculateFinishTime handles ETA from scratch
        sessionStartTime.current = null;
        readySoundPlayed.current = false;
        soonSoundPlayed.current = false;
        // calculateFinishTime will be triggered by state changes via useEffect
    }, [roundTime]);


    const tick = useCallback(() => {
        if (!running || !startTime.current) return;

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

        // Play "ready" sound towards the end of a rest period
        if (isRestTime && !isReadyStage && newTimeLeft <= READY_TIME && newTimeLeft > (READY_TIME - RENDER_RATE) && !readySoundPlayed.current) {
            readySound.current?.play().catch(e => console.error("Error playing ready sound (in rest):", e));
            readySoundPlayed.current = true;
        }

        // Play "soon" sound towards the end of a work round
        if (!isRestTime && !isReadyStage && newTimeLeft <= SOON_TIME && newTimeLeft > (SOON_TIME - RENDER_RATE) && !soonSoundPlayed.current) {
            soonSound.current?.play().catch(e => console.error("Error playing soon sound:", e));
            soonSoundPlayed.current = true;
        }

        if (newTimeLeft <= 0) {
            if (isReadyStage) {
                startRound(); // currentRound will become 1
            } else if (isRestTime) {
                // After rest, start the next work round. currentRound is already set to the completed round.
                startRound(); // currentRound will be incremented
            } else { // Work round finished
                if (totalRounds > 0 && currentRound >= totalRounds) { // Last round finished
                    finishSound.current?.play().catch(e => console.error("Error playing finish sound (session end):", e));
                    resetTimer();
                } else { // Not the last round, or infinite rounds
                    startRest();
                }
            }
        }
    }, [running, isRestTime, isReadyStage, restTime, roundTime, totalRounds, currentRound, startRound, startRest, resetTimer, readySound, soonSound, finishSound]);

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
        initializeAudio(); // Ensure audio is ready on first interaction
        if (!running) {
            // If starting from a fresh (reset) state or very first start
            if (currentRound === 0 && !isRestTime && !isReadyStage) {
                startReadyStage();
            } else {
                // Resuming: Recalculate startTime based on current timeLeft to continue accurately
                let currentPhaseNominalDuration = isReadyStage ? READY_TIME : (isRestTime ? restTime : roundTime);
                startTime.current = Date.now() - (currentPhaseNominalDuration - timeLeft);
            }
            setRunning(true);
            if (sessionStartTime.current === null) {
                 sessionStartTime.current = Date.now();
            }
        } else {
            setRunning(false);
            // timeLeft holds the paused time. calculateFinishTime (via useEffect on currentTime) will update ETA.
        }
    };

    const changeTotalRounds = (amount) => {
        setTotalRounds(prev => {
            const newValue = Math.max(0, prev + amount); // Allow 0 for infinite
            saveToLocalStorage('totalRounds', newValue);
            return newValue;
        });
    };

    const changeRoundTime = (amount) => {
        setRoundTime(prev => {
            const newTime = Math.max(30 * SECOND, prev + amount * SECOND);
            saveToLocalStorage('roundTime', newTime);
            if (!running && currentRound === 0 && !isRestTime && !isReadyStage) {
                setTimeLeft(newTime); // Update displayed timeLeft if idle
            }
            // If running or paused mid-round, timeLeft for current phase persists.
            // calculateFinishTime will update ETA based on new roundTime for future rounds.
            return newTime;
        });
    };

    const changeRestTime = (amount) => {
        setRestTime(prev => {
            const newTime = Math.max(10 * SECOND, prev + amount * SECOND);
            saveToLocalStorage('restTime', newTime);
            if (!running && isRestTime) {
                // If paused during a rest, update timeLeft to the new restTime.
                // This is a choice: alternatively, could let it run out original rest time.
                // For simplicity and user expectation, if rest time setting changes while paused in rest,
                // it makes sense for timeLeft to reflect that.
                setTimeLeft(newTime);
            }
            return newTime;
        });
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
        minutes = minutes < 10 ? '0' + minutes : minutes.toString();
        return `${hours}:${minutes.padStart(2, '0')} ${ampm}`;
    };

    // This useEffect ensures timeLeft reflects roundTime when idle, if roundTime changes.
    useEffect(() => {
        if (!running && currentRound === 0 && !isRestTime && !isReadyStage) {
            setTimeLeft(roundTime);
        }
    }, [roundTime, running, currentRound, isRestTime, isReadyStage]);


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
                        {running ?
                            (isReadyStage ? 'Get Ready' : (isRestTime ? `Rest ${currentRound > 0 ? currentRound : ''}`.trim() : `Round ${currentRound}`)) :
                            (currentRound === 0 && !isReadyStage && !isRestTime ? 'Stopped' :
                                (isReadyStage ? 'Paused - Get Ready' :
                                (isRestTime ? `Paused - Rest ${currentRound > 0 ? currentRound : ''}`.trim() : `Paused - Round ${currentRound}`)))
                        }
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