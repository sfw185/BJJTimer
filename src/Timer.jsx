import React, { useEffect } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { PlayFill, StopFill, ArrowCounterclockwise, DashLg, PlusLg, Infinity, ClockFill } from 'react-bootstrap-icons';
import './Timer.css';
import { loadFromLocalStorage } from './utils/storage';
import Settings from './components/Settings';
import { useTimer } from './hooks/useTimer';

const Timer = () => {
    const { state, actions, formatters, computed } = useTimer();

    // Apply color settings on mount
    useEffect(() => {
        const colorSettings = loadFromLocalStorage('colorSettings', null);
        if (colorSettings) {
            document.documentElement.style.setProperty('--background-color', colorSettings.backgroundColor);
            document.documentElement.style.setProperty('--text-color', colorSettings.textColor);
            document.documentElement.style.setProperty('--current-time-color', colorSettings.currentTimeColor);
            document.documentElement.style.setProperty('--rest-phase-color', colorSettings.restPhaseColor);
            document.documentElement.style.setProperty('--ending-soon-color', colorSettings.endingSoonColor);
        }
    }, []);

    return (
        <Container fluid id="timer" className={computed.isRestPhase ? 'rest-phase' : 'round-phase'}>
            <Settings />
            <Row className="justify-content-center my-0">
                <Col md="auto">
                    <div className="current-time">
                        {formatters.formatCurrentTime(state.currentTime)}
                    </div>
                </Col>
            </Row>
            <Row className="justify-content-center mt-1">
                <Col md="auto">
                    <div className="status-display">
                        {computed.getStatusText()}
                    </div>
                </Col>
            </Row>
            <Row className="justify-content-center my-0">
                <Col md="auto">
                    <div id="display" className={computed.isEndingSoon ? 'ending-soon' : ''}>
                        {formatters.formatTime(Math.max(0, state.timeLeft))}
                    </div>
                </Col>
            </Row>            <Row className="justify-content-center my-2">
                <Col xs={12} lg={10} xl={8} className="mx-auto">
                    <div className="d-flex flex-column flex-sm-row justify-content-center align-items-center gap-4">
                        <div className="timer-control-group">
                            <label className="me-2">Duration:</label>
                            <Button variant="secondary" size="sm" onClick={() => actions.changeRoundTime(-30)} className="d-inline-flex align-items-center">
                                <DashLg />
                            </Button>
                            <span className="mx-2">{formatters.formatTime(state.roundTime)}</span>
                            <Button variant="secondary" size="sm" onClick={() => actions.changeRoundTime(30)} className="d-inline-flex align-items-center">
                                <PlusLg />
                            </Button>
                        </div>
                        <div className="timer-control-group">
                            <label className="me-2">Rest:</label>
                            <Button variant="secondary" size="sm" onClick={() => actions.changeRestTime(-10)} className="d-inline-flex align-items-center">
                                <DashLg />
                            </Button>
                            <span className="mx-2">{formatters.formatTime(state.restTime)}</span>
                            <Button variant="secondary" size="sm" onClick={() => actions.changeRestTime(10)} className="d-inline-flex align-items-center">
                                <PlusLg />
                            </Button>
                        </div>
                        <div className="timer-control-group">
                            <label className="me-2">Rounds:</label>
                            <Button variant="secondary" size="sm" onClick={() => actions.changeTotalRounds(-1)} className="d-inline-flex align-items-center">
                                <DashLg />
                            </Button>
                            <span className="mx-2">{state.totalRounds === 0 ? <Infinity /> : state.totalRounds}</span>
                            <Button variant="secondary" size="sm" onClick={() => actions.changeTotalRounds(1)} className="d-inline-flex align-items-center">
                                <PlusLg />
                            </Button>
                        </div>
                    </div>
                    <div className="d-flex justify-content-center mt-4">
                        <Button variant={state.isRunning ? 'danger' : 'success'} onClick={actions.toggle} className="d-flex align-items-center me-3">
                            {state.isRunning ? <><StopFill className="me-1" /> Stop</> : <><PlayFill className="me-1" /> Start</>}
                        </Button>
                        <Button variant="dark" onClick={actions.reset} className="d-flex align-items-center">
                            <ArrowCounterclockwise className="me-1" /> Reset
                        </Button>
                    </div>
                    {state.finishTime && state.totalRounds > 0 && (
                        <div className="finish-time-container mt-3">
                            <ClockFill className="me-1" size={14} />
                            <span className="finish-time-label">Finish at:</span>
                            <span className="finish-time">{formatters.formatCurrentTime(state.finishTime)}</span>
                        </div>
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default Timer;