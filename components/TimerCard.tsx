'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const CATEGORIES = ['Work', 'Study', 'Design', 'Development', 'Meeting', 'Personal'];
const STORAGE_KEY = 'tasktimer_active';

interface ActiveTimer {
    task_name: string;
    category: string;
    hourly_rate: number;
    work_date: string;
    status: 'running' | 'paused';
    started_at: number;
    last_resumed_at: number | null;
    accumulated_duration: number;
    paused_at: number | null;
}

function getTodayLocal(): string {
    return new Date().toLocaleDateString('en-CA');
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
    const [workDate, setWorkDate] = useState(getTodayLocal());

    useEffect(() => {
        try {
            const raw = localStorage.getItem('tasktimer_prefs');
            if (raw) {
                const p = JSON.parse(raw);
                if (p.defaultCategory) setCategory(p.defaultCategory);
                if (typeof p.defaultRate === 'number') setHourlyRate(p.defaultRate);
            }
        } catch {}
    }, []);
    const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
    const [display, setDisplay] = useState('00:00:00');
    const [taskNameError, setTaskNameError] = useState(false);
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [customMinutes, setCustomMinutes] = useState(10);
    const [mounted, setMounted] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const timerRef = useRef<ActiveTimer | null>(null);
    const taskNameRef = useRef<HTMLInputElement>(null);

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
            onSessionUpdate?.(0);
            return;
        }
        const elapsed = getElapsedSeconds(timer);
        setDisplay(formatTime(elapsed));
        onSessionUpdate?.(elapsed);
    }, [onSessionUpdate]);

    const startInterval = useCallback(() => {
        stopInterval();
        intervalRef.current = setInterval(() => {
            const t = timerRef.current;
            if (!t) return;
            const elapsed = getElapsedSeconds(t);
            setDisplay(formatTime(elapsed));
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
        if (!taskName.trim()) {
            setTaskNameError(true);
            taskNameRef.current?.focus();
            setTimeout(() => setTaskNameError(false), 2000);
            return;
        }
        const timer: ActiveTimer = {
            task_name: taskName.trim(),
            category,
            hourly_rate: hourlyRate,
            work_date: workDate,
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
            work_date: activeTimer.work_date || workDate,
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
        setWorkDate(getTodayLocal());
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
            setWorkDate(saved.work_date || getTodayLocal());
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
        setMounted(true);
        return () => stopInterval();
    }, []);

    const isRunning = activeTimer?.status === 'running';
    const isPaused = activeTimer?.status === 'paused';
    const timerActive = activeTimer !== null;

    if (!mounted) {
        return (
            <div className="timer-card">
                <div className="timer-card-header">
                    <div className="timer-card-title">
                        <i className="fas fa-play-circle"></i>
                        Current Task
                    </div>
                    <div className="timer-badge ready">
                        <div className="timer-badge-dot ready"></div>
                        Ready
                    </div>
                </div>
                <div className="timer-card-body">
                    <div className="timer-display-section">
                        <div className="timer-digits">00:00:00</div>
                        <div className="timer-label">Elapsed Time</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="timer-card">
            <div className="timer-card-header">
                <div className="timer-card-title">
                    <i className="fas fa-play-circle"></i>
                    Current Task
                </div>
                {timerActive && (
                    <div className={`timer-badge ${isRunning ? 'running' : 'paused'}`}>
                        <div className={`timer-badge-dot ${isRunning ? 'running' : 'paused'}`}></div>
                        {isRunning ? 'Running' : 'Paused'}
                    </div>
                )}
                {!timerActive && (
                    <div className="timer-badge ready">
                        <div className="timer-badge-dot ready"></div>
                        Ready
                    </div>
                )}
            </div>

            <div className="timer-card-body">
                <div className="timer-inputs">
                    <div className="timer-input-group" style={{ flex: 2 }}>
                        <label className="timer-input-label">
                            <i className="fas fa-pen"></i> Task Name
                        </label>
                        <input
                            ref={taskNameRef}
                            type="text"
                            className={`timer-input ${taskNameError ? 'error' : ''}`}
                            placeholder="What are you working on?"
                            maxLength={100}
                            value={taskName}
                            onChange={e => { setTaskName(e.target.value); setTaskNameError(false); }}
                            onKeyDown={e => { if (e.key === 'Enter' && !timerActive) startTimer(); }}
                            disabled={timerActive}
                        />
                    </div>
                    <div className="timer-input-group" style={{ flex: 1 }}>
                        <label className="timer-input-label">
                            <i className="fas fa-tag"></i> Category
                        </label>
                        <select className="timer-input" value={category} onChange={e => setCategory(e.target.value)} disabled={timerActive}>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="timer-input-group" style={{ flex: 1 }}>
                        <label className="timer-input-label">
                            <i className="fas fa-coins"></i> Rate
                        </label>
                        <input
                            type="number"
                            className="timer-input"
                            placeholder="৳/hr"
                            min={0}
                            step={50}
                            value={hourlyRate}
                            onChange={e => setHourlyRate(parseFloat(e.target.value) || 0)}
                            disabled={timerActive}
                        />
                    </div>
                    <div className="timer-input-group" style={{ flex: 1 }}>
                        <label className="timer-input-label">
                            <i className="fas fa-calendar"></i> Date
                        </label>
                        <input
                            type="date"
                            className="timer-input"
                            value={workDate}
                            max={getTodayLocal()}
                            onChange={e => setWorkDate(e.target.value)}
                            disabled={timerActive}
                        />
                    </div>
                </div>

                <div className="timer-display-section">
                    <div className={`timer-glow ${isRunning ? 'running' : isPaused ? 'paused' : ''}`}></div>
                    <div className="timer-digits">{display}</div>
                    <div className="timer-label">Elapsed Time</div>
                </div>

                <div className="timer-controls">
                    {!timerActive && (
                        <button className="timer-btn start" title="Start Timer" onClick={startTimer}>
                            <i className="fas fa-play"></i>
                        </button>
                    )}
                    {isRunning && (
                        <>
                            <button className="timer-btn pause" title="Pause Timer" onClick={pauseTimer}>
                                <i className="fas fa-pause"></i>
                            </button>
                            <button className="timer-btn stop" title="Stop Timer" onClick={stopTimer}>
                                <i className="fas fa-stop"></i>
                            </button>
                        </>
                    )}
                    {isPaused && (
                        <>
                            <button className="timer-btn resume" title="Resume Timer" onClick={resumeTimer}>
                                <i className="fas fa-play"></i>
                            </button>
                            <button className="timer-btn stop" title="Stop Timer" onClick={stopTimer}>
                                <i className="fas fa-stop"></i>
                            </button>
                        </>
                    )}
                    <button className="timer-btn reset" title="Reset Timer" onClick={resetTimer}>
                        <i className="fas fa-redo-alt"></i>
                    </button>
                </div>

                <div className="timer-quick-controls">
                    <button className="quick-btn" disabled={!timerActive} onClick={() => addTime(5)}>+5 min</button>
                    <button className="quick-btn" disabled={!timerActive} onClick={() => addTime(15)}>+15 min</button>
                    <button className="quick-btn" disabled={!timerActive} onClick={() => addTime(30)}>+30 min</button>
                    <button className="quick-btn custom" disabled={!timerActive} onClick={() => { setCustomMinutes(10); setShowCustomModal(true); }}>
                        <i className="fas fa-clock"></i> Custom
                    </button>
                </div>

                {timerActive && (
                    <div className="timer-task-info">
                        <div className="task-info-item">
                            <i className="fas fa-folder"></i>
                            <span>{activeTimer?.category}</span>
                        </div>
                        <div className="task-info-item">
                            <i className="fas fa-calendar"></i>
                            <span>{(() => {
                                const raw = activeTimer?.work_date?.slice(0, 10) || '';
                                if (!raw) return '';
                                const [y, m, d] = raw.split('-').map(Number);
                                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                return `${String(d).padStart(2, '0')} ${months[m - 1]} ${y}`;
                            })()}</span>
                        </div>
                        {activeTimer?.hourly_rate ? (
                            <div className="task-info-item">
                                <i className="fas fa-coins"></i>
                                <span>৳{activeTimer.hourly_rate}/hr</span>
                            </div>
                        ) : null}
                        {activeTimer?.hourly_rate ? (
                            <div className="task-info-item earnings">
                                <i className="fas fa-bangladeshi-taka-sign"></i>
                                <span>৳{Math.round(getElapsedSeconds(activeTimer) * activeTimer.hourly_rate / 3600)}</span>
                            </div>
                        ) : null}
                    </div>
                )}
            </div>

            {showCustomModal && (
                <div className="modal-overlay" onClick={() => setShowCustomModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3><i className="fas fa-clock"></i> Add Custom Time</h3>
                            <button className="modal-close" onClick={() => setShowCustomModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <label className="timer-input-label">Minutes (1-480)</label>
                            <input
                                type="number"
                                className="timer-input"
                                min={1}
                                max={480}
                                value={customMinutes}
                                onChange={e => setCustomMinutes(parseInt(e.target.value) || 0)}
                                onKeyDown={e => { if (e.key === 'Enter') { if (customMinutes > 0 && customMinutes <= 480) { addTime(customMinutes); setShowCustomModal(false); } } }}
                                autoFocus
                            />
                        </div>
                        <div className="modal-footer">
                            <button className="modal-btn cancel" onClick={() => setShowCustomModal(false)}>Cancel</button>
                            <button className="modal-btn confirm" onClick={() => { if (customMinutes > 0 && customMinutes <= 480) { addTime(customMinutes); setShowCustomModal(false); } }}>
                                <i className="fas fa-plus"></i> Add Time
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
