import React, { useEffect, useRef, useState, useCallback } from 'react';

const SCROLL_DURATION = 600;

const AutoScroller = ({ children, activeIndex }) => {
    const containerRef = useRef(null);
    const childrenArray = React.Children.toArray(children);
    const totalItems = childrenArray.length;

    const [currentIndex, setCurrentIndex] = useState(activeIndex);
    const [isPaused, setIsPaused] = useState(false);
    const [userScrolledUp, setUserScrolledUp] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);

    // Smooth scrolling with easing
    const animateScroll = (targetPosition, duration = SCROLL_DURATION) => {
        const container = containerRef.current;
        const start = container.scrollTop;
        const change = targetPosition - start;
        const startTime = performance.now();

        const easeInOutQuad = (t) =>
            t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

        const step = (time) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            container.scrollTop = start + change * easeInOutQuad(progress);
            if (progress < 1) requestAnimationFrame(step);
        };

        requestAnimationFrame(step);
    };

    const scrollToIndex = useCallback((index) => {
        const container = containerRef.current;
        const target = container?.querySelector(`[data-index='${index}']`);
        if (target) {
            animateScroll(target.offsetTop);
            setCurrentIndex(index);
        }
    }, []);

    const scrollToTop = () => scrollToIndex(0);
    const scrollToBottom = () => scrollToIndex(totalItems - 1);
    const scrollToPrev = () => scrollToIndex(Math.max(currentIndex - 1, 0));
    const scrollToNext = () => scrollToIndex(Math.min(currentIndex + 1, totalItems - 1));

    // Scroll to active index automatically
    useEffect(() => {
        if (!isPaused && !userScrolledUp) {
            scrollToIndex(activeIndex);
        }
    }, [activeIndex, isPaused, userScrolledUp, scrollToIndex]);

    // Debounced scroll detection
    useEffect(() => {
        const container = containerRef.current;
        let timeout;

        const handleScroll = () => {
            clearTimeout(timeout);

            const atBottom = Math.abs(container.scrollTop + container.clientHeight - container.scrollHeight) < 5;
            setUserScrolledUp(!atBottom);

            const percent = (container.scrollTop / (container.scrollHeight - container.clientHeight)) * 100;
            setScrollProgress(Math.max(0, Math.min(100, percent)));

            timeout = setTimeout(() => {
                setUserScrolledUp(!atBottom);
            }, 100);
        };

        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    }, []);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                scrollToPrev();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                scrollToNext();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [scrollToPrev, scrollToNext]);

    return (
        <div style={{ position: 'relative' }}>
            {/* Scroll Progress Bar */}
            <div
                style={{
                    position: 'sticky',
                    top: 0,
                    height: '4px',
                    background: 'linear-gradient(to right, #4ade80, #22d3ee)',
                    width: `${scrollProgress}%`,
                    zIndex: 20,
                    transition: 'width 0.2s ease'
                }}
            />

            {/* ✅ Moved Buttons to Top */}
            <div
                style={{
                    position: 'sticky',
                    top: '8px',
                    backgroundColor: '#fff',
                    padding: '0.5rem',
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                    justifyContent: 'flex-end',
                    zIndex: 15,
                    borderRadius: '8px',
                    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)'
                }}
            >
                <button className="btn small-btn" onClick={scrollToTop}>⏫ Top</button>
                <button className="btn small-btn" onClick={scrollToPrev}>⬆️ Prev</button>
                <button className="btn small-btn" onClick={scrollToNext}>⬇️ Next</button>
                <button className="btn small-btn" onClick={scrollToBottom}>⏬ Bottom</button>
                <button
                    className="btn small-btn"
                    onClick={() => setIsPaused((prev) => !prev)}
                    style={{ backgroundColor: isPaused ? '#f97316' : '#10b981' }}
                >
                    {isPaused ? '▶️ Resume' : '⏸️ Pause'}
                </button>
            </div>

            {/* Scrollable Content */}
            <div
                ref={containerRef}
                className="card scrollable-card"
                style={{
                    overflowY: 'auto',
                    maxHeight: '80vh',
                    paddingRight: '1rem',
                    scrollSnapType: 'y mandatory',
                    paddingTop: '1rem'
                }}
            >
                {childrenArray.map((child, i) => (
                    <div
                        key={i}
                        data-index={i}
                        aria-current={currentIndex === i}
                        tabIndex={0}
                        style={{
                            padding: '1rem',
                            marginBottom: '0.5rem',
                            borderRadius: '8px',
                            backgroundColor: currentIndex === i ? '#f0f9ff' : 'transparent',
                            scrollSnapAlign: 'start',
                            transition: 'background-color 0.3s ease'
                        }}
                    >
                        {child}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AutoScroller;
