import { useState, useEffect, useRef } from 'react';

// Linear interpolation function
const lerp = (start, end, t) => {
    return start * (1 - t) + end * t;
};

// Calculate bearing between two points
const calculateBearing = (startLat, startLng, destLat, destLng) => {
    const startLatRad = (startLat * Math.PI) / 180;
    const startLngRad = (startLng * Math.PI) / 180;
    const destLatRad = (destLat * Math.PI) / 180;
    const destLngRad = (destLng * Math.PI) / 180;

    const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
    const x =
        Math.cos(startLatRad) * Math.sin(destLatRad) -
        Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);

    const bearingRad = Math.atan2(y, x);
    const bearingDeg = (bearingRad * 180) / Math.PI;
    return (bearingDeg + 360) % 360;
};

const useSmoothPosition = (targetPosition, duration = 1000) => {
    const [currentPosition, setCurrentPosition] = useState(targetPosition);
    const animationRef = useRef(null);
    const startTimeRef = useRef(null);
    const startPositionRef = useRef(targetPosition);

    useEffect(() => {
        if (!targetPosition) return;

        // If it's the first update or no previous position, verify if we should just snap
        if (!currentPosition) {
            setCurrentPosition(targetPosition);
            startPositionRef.current = targetPosition;
            return;
        }

        // If target hasn't changed effectively, do nothing (handling float precision)
        if (
            Math.abs(currentPosition.lat - targetPosition.lat) < 0.000001 &&
            Math.abs(currentPosition.lng - targetPosition.lng) < 0.000001
        ) {
            return;
        }

        startPositionRef.current = currentPosition;
        startTimeRef.current = performance.now();

        const animate = (time) => {
            const elapsed = time - startTimeRef.current;
            const progress = Math.min(elapsed / duration, 1);

            // Ease function (optional, using linear for now as it's more predictable for tracking)
            // const ease = t => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t; 
            const ease = t => t;

            const t = ease(progress);

            const newLat = lerp(startPositionRef.current.lat, targetPosition.lat, t);
            const newLng = lerp(startPositionRef.current.lng, targetPosition.lng, t);

            // Calculate heading based on movement
            const heading = calculateBearing(
                startPositionRef.current.lat,
                startPositionRef.current.lng,
                targetPosition.lat,
                targetPosition.lng
            );

            setCurrentPosition({
                lat: newLat,
                lng: newLng,
                // Use target speed/timestamp, but interpolate heading could be tricky, 
                // for now we calculate instantaneous heading or use target heading if provided
                heading: targetPosition.heading || heading,
                speed: targetPosition.speed
            });

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                // Ensure we end exactly at target
                setCurrentPosition(targetPosition);
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [targetPosition, duration]);

    return currentPosition;
};

export default useSmoothPosition;
