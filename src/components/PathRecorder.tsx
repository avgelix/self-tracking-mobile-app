import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Play, Pause, Square, MapPin, Timer, Navigation } from 'lucide-react';
import { PathData, GPSCoordinate } from '../types';

interface PathRecorderProps {
  value?: PathData | null;
  onChange: (path: PathData | null) => void;
  className?: string;
}

export function PathRecorder({ value, onChange, className }: PathRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPath, setCurrentPath] = useState<PathData | null>(value || null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<GPSCoordinate | null>(null);
  const recordingStartTime = useRef<number>(0);

  // Format duration for display
  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (coord1: GPSCoordinate, coord2: GPSCoordinate): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
    const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculate total distance of path
  const calculateTotalDistance = (coordinates: GPSCoordinate[]): number => {
    if (coordinates.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < coordinates.length; i++) {
      totalDistance += calculateDistance(coordinates[i-1], coordinates[i]);
    }
    return totalDistance;
  };

  // Start recording path
  const startRecording = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    setError(null);
    const startTime = Date.now();
    recordingStartTime.current = startTime;
    
    const newPath: PathData = {
      id: `path_${startTime}`,
      coordinates: [],
      startTime,
      isRecording: true
    };

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const coordinate: GPSCoordinate = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: Date.now(),
          accuracy: position.coords.accuracy
        };

        setCurrentLocation(coordinate);
        
        setCurrentPath(prev => {
          if (!prev) return newPath;
          
          const updatedPath = {
            ...prev,
            coordinates: [...prev.coordinates, coordinate],
            distance: calculateTotalDistance([...prev.coordinates, coordinate]),
            duration: Date.now() - prev.startTime
          };
          
          onChange(updatedPath);
          return updatedPath;
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError('Unable to get your location. Please check your location permissions.');
        stopRecording();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000
      }
    );

    setWatchId(id);
    setIsRecording(true);
    setIsPaused(false);
    setCurrentPath(newPath);
    onChange(newPath);
  };

  // Pause recording
  const pauseRecording = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsPaused(true);
    setIsRecording(false);
  };

  // Resume recording
  const resumeRecording = () => {
    if (!currentPath) return;
    
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const coordinate: GPSCoordinate = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: Date.now(),
          accuracy: position.coords.accuracy
        };

        setCurrentLocation(coordinate);
        
        setCurrentPath(prev => {
          if (!prev) return currentPath;
          
          const updatedPath = {
            ...prev,
            coordinates: [...prev.coordinates, coordinate],
            distance: calculateTotalDistance([...prev.coordinates, coordinate]),
            duration: Date.now() - prev.startTime
          };
          
          onChange(updatedPath);
          return updatedPath;
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError('Unable to get your location.');
        stopRecording();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000
      }
    );

    setWatchId(id);
    setIsRecording(true);
    setIsPaused(false);
  };

  // Stop recording
  const stopRecording = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    
    if (currentPath) {
      const finalPath = {
        ...currentPath,
        endTime: Date.now(),
        isRecording: false,
        duration: Date.now() - currentPath.startTime
      };
      setCurrentPath(finalPath);
      onChange(finalPath);
    }
    
    setIsRecording(false);
    setIsPaused(false);
  };

  // Clear path
  const clearPath = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setCurrentPath(null);
    setCurrentLocation(null);
    setIsRecording(false);
    setIsPaused(false);
    setError(null);
    onChange(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const formatDistance = (distance: number): string => {
    if (distance < 1000) {
      return `${Math.round(distance)} m`;
    }
    return `${(distance / 1000).toFixed(2)} km`;
  };

  return (
    <Card className={`p-4 bg-white/60 backdrop-blur-sm border-white/30 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-blue-600" />
          <h3>Path Recording</h3>
          {(isRecording || isPaused) && (
            <Badge variant={isRecording ? "default" : "secondary"}>
              {isRecording ? "Recording" : "Paused"}
            </Badge>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Recording stats */}
        {currentPath && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Duration</div>
              <div className="font-medium">
                {formatDuration(currentPath.duration || (Date.now() - currentPath.startTime))}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Distance</div>
              <div className="font-medium">
                {formatDistance(currentPath.distance || 0)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Points</div>
              <div className="font-medium">{currentPath.coordinates.length}</div>
            </div>
          </div>
        )}

        {/* Current location */}
        {currentLocation && (
          <div className="bg-muted/30 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4" />
              <span className="text-muted-foreground">Current location:</span>
            </div>
            <div className="text-xs font-mono mt-1">
              {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              {currentLocation.accuracy && (
                <span className="text-muted-foreground ml-2">
                  (±{Math.round(currentLocation.accuracy)}m)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Control buttons */}
        <div className="flex gap-2">
          {!isRecording && !isPaused && (
            <motion.div whileTap={{ scale: 0.95 }} className="flex-1">
              <Button
                onClick={startRecording}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Recording
              </Button>
            </motion.div>
          )}

          {isRecording && (
            <motion.div whileTap={{ scale: 0.95 }} className="flex-1">
              <Button
                onClick={pauseRecording}
                variant="outline"
                className="w-full"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            </motion.div>
          )}

          {isPaused && (
            <motion.div whileTap={{ scale: 0.95 }} className="flex-1">
              <Button
                onClick={resumeRecording}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Resume
              </Button>
            </motion.div>
          )}

          {(isRecording || isPaused) && (
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                onClick={stopRecording}
                className="bg-red-600 hover:bg-red-700"
              >
                <Square className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {currentPath && !isRecording && !isPaused && (
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                onClick={clearPath}
                variant="outline"
                size="sm"
              >
                Clear
              </Button>
            </motion.div>
          )}
        </div>

        {/* Path summary */}
        {currentPath && currentPath.coordinates.length > 0 && (
          <div className="bg-muted/30 p-3 rounded-lg text-xs">
            <div className="text-muted-foreground mb-1">Path Summary:</div>
            <div>
              Started: {new Date(currentPath.startTime).toLocaleTimeString()}
              {currentPath.endTime && (
                <span> • Ended: {new Date(currentPath.endTime).toLocaleTimeString()}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}