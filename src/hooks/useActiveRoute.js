import { useState, useEffect, useRef } from 'react';

const OSRM_API_URL = 'https://router.project-osrm.org/route/v1/driving';

const useActiveRoute = (start, end) => {
    const [path, setPath] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const lastFetchTimeRef = useRef(0);

    useEffect(() => {
        if (!start || !end) {
            setPath([]);
            return;
        }

        const fetchRoute = async () => {
            // Rate limit: Don't fetch more than once every 2 seconds
            const now = Date.now();
            if (now - lastFetchTimeRef.current < 2000) {
                return;
            }
            lastFetchTimeRef.current = now;

            setLoading(true);
            setError(null);

            try {
                // OSRM expects lng,lat
                const coordinates = `${start.lng},${start.lat};${end.lng},${end.lat}`;

                const response = await fetch(
                    `${OSRM_API_URL}/${coordinates}?overview=full&geometries=geojson`
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch route');
                }

                const data = await response.json();

                if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                    // OSRM returns [lng, lat], Leaflet needs [lat, lng]
                    const coordinates = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
                    setPath(coordinates);
                } else {
                    // Fallback to straight line
                    setPath([[start.lat, start.lng], [end.lat, end.lng]]);
                }

            } catch (err) {
                console.error('Error fetching active route:', err);
                setError(err.message);
                setPath([[start.lat, start.lng], [end.lat, end.lng]]);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchRoute, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [start?.lat, start?.lng, end?.lat, end?.lng]);

    return { path, loading, error };
};

export default useActiveRoute;
