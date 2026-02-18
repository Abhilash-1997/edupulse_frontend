import { useState, useEffect } from 'react';

const OSRM_API_URL = 'https://router.project-osrm.org/route/v1/driving';

const useRoutePath = (stops) => {
    const [path, setPath] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!stops || stops.length < 2) {
            setPath([]);
            return;
        }

        const fetchRoute = async () => {
            setLoading(true);
            setError(null);

            try {
                // Sort stops by order
                const sortedStops = [...stops].sort((a, b) => a.order - b.order);

                // Format coordinates for OSRM: lng,lat;lng,lat
                const coordinates = sortedStops
                    .map(stop => `${stop.lng},${stop.lat}`)
                    .join(';');

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
                    // Fallback to straight lines if no route found
                    const straightLinePath = sortedStops.map(stop => [stop.lat, stop.lng]);
                    setPath(straightLinePath);
                }

            } catch (err) {
                console.error('Error fetching route:', err);
                setError(err.message);
                // Fallback to straight lines on error
                const straightLinePath = stops
                    .sort((a, b) => a.order - b.order)
                    .map(stop => [stop.lat, stop.lng]);
                setPath(straightLinePath);
            } finally {
                setLoading(false);
            }
        };

        fetchRoute();
    }, [stops]);

    return { path, loading, error };
};

export default useRoutePath;
