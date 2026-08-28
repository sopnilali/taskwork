'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const CATEGORIES = ['Work', 'Study', 'Design', 'Development', 'Meeting', 'Personal'];
const STORAGE_KEY = 'tasktimer_active';

interface ActiveTimer {
    task_name: string;
    category: string;
    hourly_rate: number;
    status: 'running' | 'paused';
    started_at: number;
    last_resumed_at: number | null;
    accumulated_duration: number;
    paused_at: number | null;
}

function formatTime(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDurationShortLong(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
}

function getElapsedSeconds(timer: ActiveTimer): number {
    if (timer.status === 'paused') return timer.accumulated_duration;
    const now = Date.now();
    const elapsed = Math.floor((now - timer.last_resumed_at!) / 1000);
    return timer.accumulated_duration + elapsed;
}

export default function TimerCard({ onTaskSaved, onSessionUpdate }: { onTaskSaved: () => void; onSessionUpdate?: (seconds: number) => void }) {
    const { authFetch } = useAuth();
    const [taskName, setTaskName] = useState('');
    const [category, setCategory] = useState('Work');
    const [hourlyRate, setHourlyRate] = useState(0);
    const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
    const [display, setDisplay] = useState('00:00:00');
    const [currentSession, setCurrentSession] = useState('00h 00m');
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const timerRef = useRef<ActiveTimer | null>(null);

    const saveActiveTimer = useCallback((timer: ActiveTimer | null) => {
        if (timer) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(timer));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, []);

    const loadActiveTimer = useCallback((): ActiveTimer | null => {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (!data) return null;
            return JSON.parse(data);
        } catch {
            return null;
        }
    }, []);

    const updateDisplay = useCallback((timer: ActiveTimer | null) => {
        if (!timer) {
            setDisplay('00:00:00');
            setCurrentSession('00h 00m');
            onSessionUpdate?.(0);
            return;
        }
        const elapsed = getElapsedSeconds(timer);
        setDisplay(formatTime(elapsed));
        setCurrentSession(formatDurationShortLong(elapsed));
        onSessionUpdate?.(elapsed);
    }, [onSessionUpdate]);

    const startInterval = useCallback(() => {
        stopInterval();
        intervalRef.current = setInterval(() => {
            const t = timerRef.current;
            if (!t) return;
            const elapsed = getElapsedSeconds(t);
            setDisplay(formatTime(elapsed));
            setCurrentSession(formatDurationShortLong(elapsed));
            onSessionUpdate?.(elapsed);
        }, 1000);
    }, [onSessionUpdate]);

    function stopInterval() {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }

    const startTimer = () => {
        if (!taskName.trim()) return;
        const timer: ActiveTimer = {
            task_name: taskName.trim(),
            category,
            hourly_rate: hourlyRate,
            status: 'running',
            started_at: Date.now(),
            last_resumed_at: Date.now(),
            accumulated_duration: 0,
            paused_at: null,
        };
        setActiveTimer(timer);
        timerRef.current = timer;
        saveActiveTimer(timer);
        startInterval();
    };

    const pauseTimer = () => {
        if (!activeTimer || activeTimer.status !== 'running') return;
        const now = Date.now();
        const updated = {
            ...activeTimer,
            accumulated_duration: activeTimer.accumulated_duration + Math.floor((now - activeTimer.last_resumed_at!) / 1000),
            last_resumed_at: null,
            paused_at: now,
            status: 'paused' as const,
        };
        setActiveTimer(updated);
        timerRef.current = updated;
        saveActiveTimer(updated);
        stopInterval();
        updateDisplay(updated);
    };

    const resumeTimer = () => {
        if (!activeTimer || activeTimer.status !== 'paused') return;
        const updated = {
            ...activeTimer,
            last_resumed_at: Date.now(),
            paused_at: null,
            status: 'running' as const,
        };
        setActiveTimer(updated);
        timerRef.current = updated;
        saveActiveTimer(updated);
        startInterval();
    };

    const stopTimer = () => {
        if (!activeTimer) return;
        stopInterval();

        const elapsed = getElapsedSeconds(activeTimer);
        const endedAt = new Date().toISOString();
        const startedAt = new Date(activeTimer.started_at).toISOString();

        const task = {
            task_name: activeTimer.task_name,
            category: activeTimer.category,
            hourly_rate: activeTimer.hourly_rate,
            status: 'completed',
            started_at: startedAt,
            ended_at: endedAt,
            total_duration: elapsed,
        };

        setActiveTimer(null);
        timerRef.current = null;
        saveActiveTimer(null);
        setDisplay('00:00:00');

        authFetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task),
        }).then(() => onTaskSaved()).catch(console.error);

        onTaskSaved();
    };

    const resetTimer = () => {
        stopInterval();
        setActiveTimer(null);
        timerRef.current = null;
        saveActiveTimer(null);
        setDisplay('00:00:00');
        setTaskName('');
        setCategory('Work');
        setHourlyRate(0);
    };

    const addTime = (minutes: number) => {
        if (!activeTimer) return;
        const seconds = minutes * 60;
        let updated: ActiveTimer;
        if (activeTimer.status === 'paused') {
            updated = { ...activeTimer, accumulated_duration: activeTimer.accumulated_duration + seconds };
        } else {
            updated = { ...activeTimer, last_resumed_at: activeTimer.last_resumed_at! - seconds * 1000 };
        }
        setActiveTimer(updated);
        timerRef.current = updated;
        saveActiveTimer(updated);
    };

    useEffect(() => {
        const saved = loadActiveTimer();
        if (saved) {
            setActiveTimer(saved);
            timerRef.current = saved;
            setTaskName(saved.task_name);
            setCategory(saved.category);
            setHourlyRate(saved.hourly_rate || 0);
            if (saved.status === 'running') {
                const elapsed = getElapsedSeconds(saved);
                saved.accumulated_duration = elapsed;
                saved.last_resumed_at = Date.now();
                timerRef.current = saved;
                saveActiveTimer(saved);
                startInterval();
            }
            updateDisplay(saved);
        }
        return () => stopInterval();
    }, []);

    const isRunning = activeTimer?.status === 'running';
    const isPaused = activeTimer?.status === 'paused';
    const timerActive = activeTimer !== null;

    return (
        <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-body">
                <div className="section-title">Current Task</div>
                <div className="row g-3">
                    <div className="col-md-5">
                        <label className="form-label">Task Name</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="What are you working on?"
                            maxLength={100}
                            value={taskName}
                            onChange={e => setTaskName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !timerActive) startTimer(); }}
                        />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">Category</label>
                        <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="col-md-2">
                        <label className="form-label">Hourly Rate</label>
                        <input
                            type="number"
                            className="form-control"
                            placeholder="৳/hr"
                            min={0}
                            step={50}
                            value={hourlyRate}
                            onChange={e => setHourlyRate(parseFloat(e.target.value) || 0)}
                        />
                    </div>
                </div>

                <div className="timer-status">
                    <div className={`status-dot ${isRunning ? 'running' : isPaused ? 'paused' : 'ready'}`}></div>
                    <span className={`status-text ${isRunning ? 'running' : isPaused ? 'paused' : ''}`}>
                        {isRunning ? 'Running' : isPaused ? 'Paused' : 'Ready'}
                    </span>
                </div>

                <div className="timer-display">
                    <div className="timer-digits">{display}</div>
                    <div className="timer-label">Elapsed Time</div>
                </div>

                <div className="timer-controls">
                    {!timerActive && (
                        <button className="btn-timer btn-start" title="Start Timer" onClick={startTimer}>
                            <i className="fas fa-play" style={{ marginLeft: 2 }}></i>
                        </button>
                    )}
                    {isRunning && (
                        <>
                            <button className="btn-timer btn-pause" title="Pause Timer" onClick={pauseTimer}>
                                <i className="fas fa-pause"></i>
                            </button>
                            <button className="btn-timer btn-stop" title="Stop Timer" onClick={stopTimer}>
                                <i className="fas fa-stop"></i>
                            </button>
                        </>
                    )}
                    {isPaused && (
                        <>
                            <button className="btn-timer btn-resume" title="Resume Timer" onClick={resumeTimer}>
                                <i className="fas fa-play" style={{ marginLeft: 2 }}></i>
                            </button>
                            <button className="btn-timer btn-stop" title="Stop Timer" onClick={stopTimer}>
                                <i className="fas fa-stop"></i>
                            </button>
                        </>
                    )}
                    <button className="btn-timer btn-reset" title="Reset Timer" onClick={resetTimer}>
                        <i className="fas fa-redo-alt"></i>
                    </button>
                </div>

                <div className="quick-time-controls">
                    <button className="btn-quick" disabled={!timerActive} onClick={() => addTime(5)}>+5 min</button>
                    <button className="btn-quick" disabled={!timerActive} onClick={() => addTime(15)}>+15 min</button>
                    <button className="btn-quick" disabled={!timerActive} onClick={() => addTime(30)}>+30 min</button>
                    <button className="btn-quick" disabled={!timerActive} onClick={() => {
                        const mins = prompt('Enter minutes to add (1-480):');
                        if (mins) {
                            const m = parseInt(mins);
                            if (m > 0 && m <= 480) addTime(m);
                        }
                    }}>Custom</button>
                </div>
            </div>
        </div>
    );
}
