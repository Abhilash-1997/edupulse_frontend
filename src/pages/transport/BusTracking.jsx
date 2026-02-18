import { PageHeader } from '@/components/common';
import { useSocket } from '@/context/SocketContext';
import { transportService } from '@/services';
import useSmoothPosition from '@/hooks/useSmoothPosition';
import useRoutePath from '@/hooks/useRoutePath';
import useActiveRoute from '@/hooks/useActiveRoute';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Select,
    SelectItem,
    Spinner
} from '@heroui/react';
import { Icon } from '@iconify/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';

// Custom bus icon
const createBusIcon = (heading = 0) => new L.DivIcon({
    className: 'bus-icon',
    html: `<div style="transform: rotate(${heading}deg)"><img style="width: 50px; height: 50px;" src="https://cdn-icons-png.flaticon.com/512/416/416597.png"/></div>`,
    iconSize: [50, 50],
    iconAnchor: [12, 25],
    popupAnchor: [0, -25],
});


const stopIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', // Default red
    iconSize: [25, 25],
    iconAnchor: [12, 25],
    popupAnchor: [0, -25],
});

const visitedStopIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/190/190411.png', // Checkmark or Green
    iconSize: [25, 25],
    iconAnchor: [12, 25],
    popupAnchor: [0, -25],
});

const nextStopIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/149/149059.png', // Distinctive (e.g., Target/Flag)
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
    className: 'animate-bounce-slow' // Optional CSS animation if supported
});

const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
};

// Component to handle map center updates
const MapUpdater = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, map.getZoom(), {
                animate: true,
                duration: 1.5
            });
        }
    }, [center, map]);
    return null;
};

// Component to handle smooth bus marker
const BusMarker = ({ location, busDatas }) => {
    const smoothPosition = useSmoothPosition(location);
    const [icon, setIcon] = useState(createBusIcon(0));

    useEffect(() => {
        if (smoothPosition?.heading !== undefined) {
            setIcon(createBusIcon(smoothPosition.heading));
        }
    }, [smoothPosition?.heading]);

    if (!smoothPosition) return null;

    return (
        <Marker
            position={[smoothPosition.lat, smoothPosition.lng]}
            icon={icon}
        >
            <Popup>
                <div className="text-center">
                    <strong>{busDatas?.busNumber}</strong>
                    <br />
                    Speed: {Number(smoothPosition.speed || 0).toFixed(1)} km/h
                    <br />
                    <small>
                        Updated: {' '}
                        {location.timestamp ? new Date(location.timestamp).toLocaleTimeString() : 'Just now'}
                    </small>
                </div>
            </Popup>
        </Marker>
    );
}

const RouteRenderer = ({ stops }) => {
    const { path, loading } = useRoutePath(stops);

    if (!path || path.length === 0) return null;

    return (
        <Polyline
            positions={path}
            color="#1969daff" // Slate-400, dimmed
            weight={4}
            opacity={0.5}
            lineCap="round"
            lineJoin="round"
            dashArray="10, 10" // Dashed line for scheduled route
        />
    );
};

const ActiveRouteRenderer = ({ start, end }) => {
    const { path } = useActiveRoute(start, end);

    if (!path || path.length === 0) return null;

    return (
        <Polyline
            positions={path}
            color="#2563eb" // Bright Blue
            weight={6}
            opacity={0.9}
            lineCap="round"
            lineJoin="round"
        />
    );
};

const BusTracking = () => {
    const { socket, isConnected } = useSocket();
    const [buses, setBuses] = useState([]);
    const [selectedBus, setSelectedBus] = useState(null);
    const [busLocation, setBusLocation] = useState(null);
    const [activeTrip, setActiveTrip] = useState(null);
    const [route, setRoute] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);
    console.log("activeTrip", activeTrip);

    // Derived next stop
    const nextStop = activeTrip?.BusRoute?.stops?.[activeTrip?.lastReachedStopOrder]; // Assuming order is unique/identifier

    const subscribedBusRef = useRef(null);

    // Default center (can be changed based on school location)
    const defaultCenter = [12.9716, 77.5946]; // Bangalore

    // Add socket listener for trip updates
    useEffect(() => {
        if (!socket) return;

        const handleTripUpdate = (data) => {
            if (activeTrip && data.tripId === activeTrip.id) {
                setActiveTrip(prev => ({ ...prev, lastReachedStopOrder: data.lastReachedStopOrder }));
            }
        };

        socket.on('bus:trip:update', handleTripUpdate);

        return () => {
            socket.off('bus:trip:update', handleTripUpdate);
        };
    }, [socket, activeTrip, route]);

    // Fetch all buses
    useEffect(() => {
        const fetchBuses = async () => {
            try {
                // Pass proper params object
                const response = await transportService.getAllBuses({ isActive: true });
                if (response.data?.success) {
                    setBuses(response.data.data);
                }
            } catch (err) {
                setError('Failed to load buses');
            } finally {
                setLoading(false);
            }
        };
        fetchBuses();
    }, []);

    // Fetch live location when bus is selected
    const fetchLiveLocation = useCallback(async (busId) => {
        try {
            const response = await transportService.getLiveLocation(busId);
            if (response.data?.success) {
                const { location, activeTrip: tripData } = response.data.data;
                if (location) {
                    setBusLocation({
                        lat: parseFloat(location.lat),
                        lng: parseFloat(location.lng),
                        speed: location.speed,
                        heading: location.heading || 0,
                        timestamp: location.timestamp,
                    });
                    setLastUpdate(new Date(location.timestamp));
                }
                if (tripData) {
                    setActiveTrip(tripData);
                    // Fetch route details if available
                    if (tripData.BusRoute) {
                        setRoute(tripData.BusRoute);
                    }
                } else {
                    setActiveTrip(null);
                }
            }
        } catch (err) {
        }
    }, []);

    // Subscribe to socket updates when bus is selected
    useEffect(() => {
        if (!socket || !selectedBus) return;

        // console.log(`Subscribing to bus: ${selectedBus}`);

        // Unsubscribe from previous bus
        if (subscribedBusRef.current && subscribedBusRef.current !== selectedBus) {
            socket.emit('bus:unsubscribe', { busId: subscribedBusRef.current });
        }

        // Subscribe to new bus
        socket.emit('bus:subscribe', { busId: selectedBus });
        subscribedBusRef.current = selectedBus;

        // Fetch initial location
        fetchLiveLocation(selectedBus);

        // Listen for location updates
        const handleLocationUpdate = (data) => {
            // console.log('Location update received:', data);

            // Ensure ID comparison matches (handle string/number differences)
            if (String(data.busId) === String(selectedBus)) {
                setBusLocation({
                    lat: data.lat,
                    lng: data.lng,
                    speed: data.speed,
                    heading: data.heading || 0,
                    timestamp: data.timestamp,
                });
                setLastUpdate(new Date(data.timestamp));
            }
        };

        socket.on('bus:location:receive', handleLocationUpdate);

        // Listen for subscription confirmation
        socket.on('bus:subscribed', (data) => {
            // console.log('Subscription confirmed for bus:', data.busId);
        });

        // Listen for trip events
        socket.on('bus:trip:start', (data) => {
            if (String(data.busId) === String(selectedBus)) {
                fetchLiveLocation(selectedBus);
            }
        });

        socket.on('bus:trip:end', (data) => {
            if (String(data.busId) === String(selectedBus)) {
                setActiveTrip(null);
            }
        });

        return () => {
            socket.off('bus:location:receive', handleLocationUpdate);
            socket.off('bus:trip:start');
            socket.off('bus:trip:end');
            socket.off('bus:subscribed');
        };
    }, [socket, selectedBus, fetchLiveLocation]);

    // Fallback polling when socket is disconnected
    useEffect(() => {
        if (isConnected || !selectedBus) return;

        const intervalId = setInterval(() => {
            console.log('Socket disconnected, polling for location...');
            fetchLiveLocation(selectedBus);
        }, 10000); // Poll every 10 seconds

        return () => clearInterval(intervalId);
    }, [isConnected, selectedBus, fetchLiveLocation]);

    // Refresh button handler
    const handleRefresh = () => {
        if (selectedBus) {
            fetchLiveLocation(selectedBus);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'IN_PROGRESS':
                return 'success';
            case 'NOT_STARTED':
                return 'warning';
            case 'COMPLETED':
                return 'default';
            default:
                return 'default';
        }
    };

    const selectedBusData = buses.find((b) => b.id === selectedBus);
    console.log(busLocation)

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Bus Tracking"
                subtitle="Track live bus locations in real-time"
                action={
                    <div className="flex items-center gap-3">
                        <Chip
                            color={isConnected ? 'success' : 'danger'}
                            variant="flat"
                            startContent={
                                <Icon icon={isConnected ? 'mdi:wifi' : 'mdi:wifi-off'} width={16} />
                            }
                            classNames={{ content: "font-medium" }}
                        >
                            {isConnected ? 'Live' : 'Offline'}
                        </Chip>
                        <Button
                            isIconOnly
                            variant="flat"
                            color="default"
                            onPress={handleRefresh}
                            isDisabled={!selectedBus}
                        >
                            <Icon icon="mdi:refresh" width={20} />
                        </Button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar */}
                <div className="space-y-4">
                    <Card className="bg-content1 border border-default-200 shadow-sm">
                        <CardHeader className="border-b border-default-100">
                            <h3 className="font-semibold text-foreground">Select Bus</h3>
                        </CardHeader>
                        <CardBody>
                            {loading ? (
                                <Spinner size="sm" />
                            ) : (
                                <Select
                                    label="Choose a bus"
                                    placeholder="Select bus to track"
                                    selectedKeys={selectedBus ? [selectedBus] : []}
                                    onSelectionChange={(keys) => setSelectedBus([...keys][0])}
                                    variant="bordered"
                                    labelPlacement="outside"
                                >
                                    {buses.map((bus) => (
                                        <SelectItem key={bus.id} textValue={bus.busNumber}>
                                            <div className="flex justify-between items-center">
                                                <span>{bus.busNumber}</span>
                                                <Chip size="sm" color={bus.isActive ? 'success' : 'default'} variant="flat">
                                                    {bus.isActive ? 'Active' : 'Inactive'}
                                                </Chip>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </Select>
                            )}
                        </CardBody>
                    </Card>

                    {selectedBusData && (
                        <Card className="bg-content1 border border-default-200 shadow-sm">
                            <CardHeader className="border-b border-default-100">
                                <h3 className="font-semibold text-foreground">Bus Details</h3>
                            </CardHeader>
                            <CardBody className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-default-500">Number:</span>
                                    <span className="font-medium text-foreground">{selectedBusData.busNumber}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-default-500">Registration:</span>
                                    <span className="font-medium text-foreground">{selectedBusData.registrationNumber}</span>
                                </div>
                                {selectedBusData.driver && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-default-500">Driver:</span>
                                        <span className="font-medium text-foreground">{selectedBusData.driver.name}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="text-default-500">Status:</span>
                                    <Chip
                                        size="sm"
                                        color={getStatusColor(activeTrip?.status || 'NOT_STARTED')}
                                        variant="flat"
                                        classNames={{ content: "font-medium" }}
                                    >
                                        {activeTrip?.status?.replace('_', ' ') || 'No Active Trip'}
                                    </Chip>
                                </div>
                                {busLocation && (
                                    <>
                                        <div className="flex justify-between items-center">
                                            <span className="text-default-500">Speed:</span>
                                            <span className="font-medium text-foreground font-mono">
                                                {busLocation.speed ? `${busLocation.speed} km/h` : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-default-500">Last Update:</span>
                                            <span className="font-medium text-foreground text-xs">
                                                {lastUpdate?.toLocaleTimeString()}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </CardBody>
                        </Card>
                    )}

                    {route && route.stops && route.stops.length > 0 && (
                        <Card className="bg-content1 border border-default-200 shadow-sm">
                            <CardHeader className="border-b border-default-100">
                                <h3 className="font-semibold text-foreground">Route: {route.routeName}</h3>
                            </CardHeader>
                            <CardBody>
                                <div className="space-y-2">
                                    {route.stops
                                        .sort((a, b) => a.order - b.order)
                                        .map((stop, idx) => {
                                            const isVisited = stop.order <= activeTrip?.lastReachedStopOrder;
                                            const isNext = nextStop?.order === stop.order;

                                            return (
                                                <div
                                                    key={idx}
                                                    className={`flex items-center gap-2 text-sm p-2 rounded-lg transition-colors ${isNext
                                                        ? 'bg-primary-50 border-primary border'
                                                        : isVisited
                                                            ? 'bg-default-100 opacity-60'
                                                            : 'hover:bg-default-50'
                                                        }`}
                                                >
                                                    <Icon
                                                        icon={isVisited ? "mdi:check-circle" : "mdi:map-marker"}
                                                        className={isVisited ? "text-success" : isNext ? "text-primary" : "text-default-400"}
                                                        width={18}
                                                    />
                                                    <span className={`text-foreground ${isVisited ? 'line-through' : ''} ${isNext ? 'font-bold' : ''}`}>
                                                        {stop.order}. {stop.name}
                                                    </span>
                                                    {isNext && (
                                                        <Chip size="sm" color="primary" variant="flat" className="ml-auto h-5 text-[10px]">
                                                            NEXT
                                                        </Chip>
                                                    )}
                                                </div>
                                            );
                                        })}
                                </div>
                            </CardBody>
                        </Card>
                    )}
                </div>

                {/* Map */}
                <div className="lg:col-span-3">
                    <Card className="h-[600px] bg-content1 border border-default-200 shadow-sm">
                        <CardBody className="p-0 overflow-hidden">
                            <MapContainer
                                center={
                                    busLocation
                                        ? [busLocation.lat, busLocation.lng]
                                        : defaultCenter
                                }
                                zoom={14}
                                style={{ height: '100%', width: '100%' }}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <MapUpdater
                                    center={
                                        busLocation
                                            ? [busLocation.lat, busLocation.lng]
                                            : null
                                    }
                                />

                                {/* Bus marker with smooth animation */}
                                {busLocation && (
                                    <BusMarker location={busLocation} busDatas={selectedBusData} />
                                )}

                                {/* Route stops */}
                                {route &&
                                    route.stops &&
                                    route.stops.map((stop, idx) => {
                                        const isVisited = stop.order <= activeTrip?.lastReachedStopOrder;
                                        const isNext = nextStop?.order === stop.order;
                                        let icon = stopIcon;
                                        if (isVisited) icon = visitedStopIcon;
                                        else if (isNext) icon = nextStopIcon;

                                        return (
                                            <Marker
                                                key={idx}
                                                position={[stop.lat, stop.lng]}
                                                icon={icon}
                                                opacity={isVisited ? 0.6 : 1}
                                            >
                                                <Popup>
                                                    <div className="text-center">
                                                        <strong>
                                                            Stop {stop.order}: {stop.name}
                                                        </strong>
                                                        <br />
                                                        {isVisited ? (
                                                            <span className="text-success font-medium">Reached</span>
                                                        ) : isNext ? (
                                                            <span className="text-primary font-medium">Next Stop</span>
                                                        ) : (
                                                            <span className="text-default-500">Upcoming</span>
                                                        )}
                                                        {stop.estimatedTime && (
                                                            <>
                                                                <br />
                                                                ETA: {stop.estimatedTime}
                                                            </>
                                                        )}
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        );
                                    })}

                                {/* Full route polyline (background) */}
                                {route && route.stops && route.stops.length > 1 && (
                                    <RouteRenderer stops={route.stops} />
                                )}

                                {/* Active route (Bus -> Next Stop) */}
                                {busLocation && nextStop && (
                                    <ActiveRouteRenderer
                                        start={{ lat: busLocation.lat, lng: busLocation.lng }}
                                        end={{ lat: parseFloat(nextStop.lat), lng: parseFloat(nextStop.lng) }}
                                    />
                                )}
                            </MapContainer>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default BusTracking;
