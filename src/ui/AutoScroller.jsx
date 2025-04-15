import React, { useEffect, useRef, useState, useCallback } from 'react';

const AutoScroller = ({ children, activeIndex }) => {
    const containerRef = useRef(null);
    const [isPaused, setIsPaused] = useState(false);
    const [userScrolledUp, setUserScrolledUp] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(activeIndex);
    const childrenArray = React.Children.toArray(children);
    const totalItems = childrenArray.length;

    // Detect user scroll
    useEffect(() => {
        const container = containerRef.current;

        const handleScroll = () => {
            const atBottom = Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 5;
            setUserScrolledUp(!atBottom);
        };

        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    }, []);

    // Auto-scroll to activeIndex
    useEffect(() => {
        if (!isPaused && !userScrolledUp && containerRef.current) {
            const container = containerRef.current;
            const activeChild = container.querySelector(`[data-index='${activeIndex}']`);

            if (activeChild) {
                activeChild.scrollIntoView({ behavior: "smooth", block: "start" });
                setCurrentIndex(activeIndex);
            } else {
                container.scrollTop = container.scrollHeight;
            }
        }
    }, [childrenArray, activeIndex, isPaused, userScrolledUp]);

    const scrollToIndex = useCallback((index) => {
        const container = containerRef.current;
        const target = container.querySelector(`[data-index='${index}']`);
        if (target) {
            const offsetTop = target.offsetTop;
            animateScroll(offsetTop, 600); // Customize duration
            setCurrentIndex(index);
        }
    }, []);


    const scrollToNext = () => scrollToIndex(Math.min(currentIndex + 1, totalItems - 1));
    const scrollToPrev = () => scrollToIndex(Math.max(currentIndex - 1, 0));

    // Keyboard control
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
    }, [scrollToNext, scrollToPrev]);

    // Scroll progress
    const [scrollProgress, setScrollProgress] = useState(0);
    useEffect(() => {
        const handleScroll = () => {
            const container = containerRef.current;
            const percent = (container.scrollTop / (container.scrollHeight - container.clientHeight)) * 100;
            setScrollProgress(Math.min(100, Math.max(0, percent)));
        };
        const container = containerRef.current;
        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    }, []);


    const animateScroll = (targetPosition, duration = 500) => {
        const container = containerRef.current;
        if (!container) return;

        const start = container.scrollTop;
        const change = targetPosition - start;
        const startTime = performance.now();

        const easeInOutQuad = (t) =>
            t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

        const animate = (time) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeInOutQuad(progress);
            container.scrollTop = start + change * easedProgress;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    };
    const scrollToTop = () => {
        animateScroll(0, 800); // 800ms duration
        setCurrentIndex(0);
    };

    const scrollToBottom = () => {
        animateScroll(containerRef.current.scrollHeight, 1000); // 1s duration
        setCurrentIndex(totalItems - 1);
    };


    return (
        <div style={{ position: "relative" }}>
            {/* Scroll Progress Bar */}
            <div
                style={{
                    position: "sticky",
                    top: 0,
                    height: "4px",
                    background: "linear-gradient(to right, #4ade80, #22d3ee)",
                    width: `${scrollProgress}%`,
                    zIndex: 20,
                    transition: 'width 0.2s ease',
                }}
            />

            {/* Scrollable Content */}
            <div
                ref={containerRef}
                className="card scrollable-card"
                style={{
                    overflowY: "auto",
                    maxHeight: "80vh",
                    paddingRight: "1rem",
                    scrollSnapType: "y proximity"
                }}
            >
                {childrenArray.map((child, i) => (
                    <div
                        key={i}
                        data-index={i}
                        style={{
                            padding: "1rem",
                            marginBottom: "0.5rem",
                            backgroundColor: currentIndex === i ? "#f0f9ff" : "transparent",
                            borderRadius: "8px",
                            scrollSnapAlign: "start",
                            transition: "background-color 0.3s ease"
                        }}
                    >
                        {child}
                    </div>
                ))}
            </div>

            {/* Controls */}
            <div
                style={{
                    position: "sticky",
                    bottom: 10,
                    right: 10,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    justifyContent: "flex-end",
                    marginTop: "0.5rem",
                    zIndex: 10,
                }}
            >
                <button className="btn small-btn" onClick={scrollToTop}>⏫ Top</button>
                <button className="btn small-btn" onClick={scrollToPrev}>⬆️ Prev</button>
                <button className="btn small-btn" onClick={scrollToNext}>⬇️ Next</button>
                <button className="btn small-btn" onClick={scrollToBottom}>⏬ Bottom</button>
                <button
                    className="btn small-btn"
                    onClick={() => setIsPaused((p) => !p)}
                    style={{ backgroundColor: isPaused ? '#f97316' : '#10b981' }}
                >
                    {isPaused ? '▶️ Resume' : '⏸️ Pause'}
                </button>
            </div>
        </div>
    );
};

export default AutoScroller;
