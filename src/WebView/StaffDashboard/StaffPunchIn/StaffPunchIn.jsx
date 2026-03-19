import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MapPin, Clock, CheckCircle, XCircle, Loader2, Calendar, LogOut, Navigation, AlertCircle, RefreshCw, Zap } from 'lucide-react';
import { HitApi } from '../../../Api/ApiHit';
import { addAttendance, searchAttendance, updateAttendance } from '../../../constant/Constant';
import { getElevateUser, getSelectedUnit } from '../../../storage/Storage';
import { getDeviceInfo, perMinuteSalary } from '../../../utils/utils';
import toast from 'react-hot-toast';

// Constants moved outside component to prevent re-creation
//elevate
const ALLOWED_LOCATION = {// this is for testing i have put the ofc cordinates 
  lat: 28.538716533580914,
  lng: 77.19891107912056
};


//headsup corp
// const ALLOWED_LOCATION = {
//   lat: 28.538588,
//   lng: 77.198683
// };

//homes
// const ALLOWED_LOCATION = {
//   lat: 28.553525557535057,
//   lng: 77.28335585263001
// };

const MAX_DISTANCE = 300;

function StaffPunchIn({ workingTime, setWorkingTime }) {
  const [userLocation, setUserLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [punchOutLoading, setPunchOutLoading] = useState(false);
  const [locationAttempts, setLocationAttempts] = useState(0);
  const [punchInTime, setPunchInTime] = useState(null);
  const [currentDeviceInfo, setCurrentDeviceInfo] = useState(null);
  const [deviceValidation, setDeviceValidation] = useState({
    isValid: null,
    isChecking: true,
    message: ''
  });

  // Get user data and calculate per minute rate
  const userData = useMemo(() => getElevateUser(), []);
  const perMinuteRate = useMemo(() => perMinuteSalary(userData), [userData]);

  // Validate current device against registered device
  const validateDevice = useCallback(() => {
    try {
      const deviceInfoArray = getDeviceInfo();
      const currentDevice = deviceInfoArray[0];
      const currentFingerprint = currentDevice.deviceFingerprint;

      setCurrentDeviceInfo(currentDevice);

      // Get registered device fingerprint from user data
      const registeredDeviceFingerprint = userData?.deviceMacAddress || userData?.deviceFingerprint;

      console.log('Device validation:', {
        currentFingerprint,
        registeredDeviceFingerprint,
        userHasRegisteredDevice: !!registeredDeviceFingerprint
      });

      if (!registeredDeviceFingerprint) {
        setDeviceValidation({
          isValid: false,
          isChecking: false,
          message: 'No device registered. Please register your device first in Device Registration section.'
        });
        return;
      }

      if (currentFingerprint === registeredDeviceFingerprint) {
        setDeviceValidation({
          isValid: true,
          isChecking: false,
          message: 'Device verified successfully'
        });
      } else {
        setDeviceValidation({
          isValid: false,
          isChecking: false,
          message: 'Device not recognized. Please use your registered device or contact administrator.'
        });
      }
    } catch (error) {
      console.error('Error validating device:', error);
      setDeviceValidation({
        isValid: false,
        isChecking: false,
        message: 'Error validating device. Please try again.'
      });
    }
  }, [userData]);

  // Calculate earned salary from working time string
  const calculateEarnedSalary = useCallback((timeString) => {
    if (!timeString || (!perMinuteRate && !userData?.salary)) return 0;

    console.log("Calculating earned salary - timeString:", timeString, "perMinuteRate:", perMinuteRate);

    // Parse working time string like "1h 3m 22s"
    const timeRegex = /(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?/;
    const match = timeString.match(timeRegex);

    if (match) {
      const hours = parseInt(match[1]) || 0;
      const minutes = parseInt(match[2]) || 0;
      const seconds = parseInt(match[3]) || 0;

      console.log("Parsed time - hours:", hours, "minutes:", minutes, "seconds:", seconds);

      // Convert to total minutes
      const totalMinutes = hours * 60 + minutes + seconds / 60;
      console.log("Total minutes:", totalMinutes);

      // Calculate salary - use perMinuteRate if available, otherwise calculate from monthly salary
      const ratePerMinute = perMinuteRate || (userData?.salary / (30 * 8 * 60)) || 0;
      console.log("Rate per minute:", ratePerMinute);

      const calculated = totalMinutes * ratePerMinute;
      console.log("Calculated salary:", calculated);

      // Return with 2 decimal places
      return parseFloat(calculated.toFixed(2));
    }

    return 0;
  }, [perMinuteRate, userData?.salary]);


  // Calculate distance between two coordinates using Haversine formula - memoized
  const calculateDistance = useCallback((lat1, lng1, lat2, lng2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }, []);

  // Get location string for attendance record - memoized
  const getLocationString = useCallback(() => {
    if (!userLocation) {
      return 'Location unavailable';
    }
    return `${userLocation.lat.toFixed(6)}, ${userLocation.lng.toFixed(6)}`;
  }, [userLocation]);

  // Check location permission status
  const checkLocationPermission = useCallback(async () => {
    if (!navigator.permissions) {
      console.log('Permissions API not supported');
      return 'unsupported';
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      setLocationPermission(result.state);
      console.log('Location permission:', result.state);

      // Listen for permission changes
      result.onchange = () => {
        setLocationPermission(result.state);
        if (result.state === 'granted') {
          getCurrentLocation();
        }
      };

      return result.state;
    } catch (error) {
      console.error('Error checking location permission:', error);
      return 'error';
    }
  }, []);

  // Memoized function to prevent re-renders
  const getTodaysAttendance = useCallback(() => {
    setAttendanceLoading(true);
    // Get today's date range (full day - 00:00 to 23:59)
    const today = new Date();
    const startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0).getTime(); // 12:00 AM
    const endTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).getTime(); // 11:59 PM

    const userId = userData?._id;

    if (!userId) {
      setAttendanceLoading(false);
      return;
    }

    let json = {
      page: 1,
      limit: 10,
      search: {
        userId: userId,
        punchInTime: {
          $gte: startTime,
          $lte: endTime
        }
      }
    }

    HitApi(json, searchAttendance).then((res) => {
      console.log("res", res);

      // ✅ Fix: API response mein data.docs hai, toh usse correctly set karo
      const attendanceRecords = res?.data?.docs || [];

      setAttendanceData({
        ...res,
        data: attendanceRecords  // Now this will be the array of attendance records
      });

      setAttendanceLoading(false);

      // Set punch in time for timer calculation
      if (attendanceRecords.length > 0 && attendanceRecords[0].punchInTime) {
        setPunchInTime(attendanceRecords[0].punchInTime);
      }

      // If there's existing attendance data, we don't need to set any state
      // The component will handle the display based on attendanceData
      if (attendanceRecords.length > 0) {
        console.log('User has already punched in today');
      } else {
        console.log('No attendance record found for today - user can punch in');
      }
    }).catch((error) => {
      console.error("Error fetching attendance:", error);
      setAttendanceLoading(false);
    });
  }, [userData?._id]); // Add userData dependency

  // Format time for display - memoized
  const formatTime = useCallback((date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }, []);

  // Calculate working duration - memoized
  const calculateWorkingTime = useCallback(() => {
    if (!punchInTime) return '';

    const now = Date.now();
    const timeDiff = now - punchInTime;

    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }, [punchInTime]);

  // Get user's current location with improved error handling
  const getCurrentLocation = useCallback(() => {
    setLoading(true);
    setError(null);
    setLocationAttempts(prev => prev + 1);

    console.log(`Location attempt ${locationAttempts + 1}`);

    if (!navigator.geolocation) {
      const errorMsg = 'Geolocation is not supported by this browser. Please use Chrome, Firefox, Safari, or Edge.';
      setError(errorMsg);
      setLoading(false);
      console.error(errorMsg);
      return;
    }

    // Check if we're on HTTPS (required for geolocation in most browsers)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      const errorMsg = 'Location access requires a secure (HTTPS) connection. Please contact your administrator.';
      setError(errorMsg);
      setLoading(false);
      console.error(errorMsg);
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 20000, // Increased timeout to 20 seconds
      maximumAge: 30000 // 30 seconds cache
    };

    console.log('Requesting location with options:', options);

    const successCallback = (position) => {
      console.log('Location obtained successfully:', position);
      const { latitude, longitude, accuracy } = position.coords;

      setUserLocation({ lat: latitude, lng: longitude });
      console.log(`Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (accuracy: ${accuracy}m)`);

      const dist = calculateDistance(
        latitude,
        longitude,
        ALLOWED_LOCATION.lat,
        ALLOWED_LOCATION.lng
      );

      setDistance(Math.round(dist));
      setLoading(false);
      setError(null);

      console.log(`Distance to office: ${Math.round(dist)}m`);
    };

    const errorCallback = (error) => {
      console.error('Geolocation error:', error);
      let errorMessage;

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Location access denied. Please click the location icon in your browser's address bar and select 'Allow', then refresh the page.";
          setLocationPermission('denied');
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Location information unavailable. Please check your device's location services and try again.";
          break;
        case error.TIMEOUT:
          errorMessage = "Location request timed out. Please ensure you have a good GPS signal and try again.";
          break;
        default:
          errorMessage = `Location error: ${error.message}. Please try again.`;
          break;
      }

      setError(errorMessage);
      setLoading(false);
    };

    // Try to get the location
    navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);
  }, [calculateDistance, locationAttempts]);

  // Request location permission explicitly
  const requestLocationPermission = useCallback(async () => {
    try {
      console.log('Requesting location permission...');
      setLocationAttempts(0); // Reset attempts when user manually requests
      getCurrentLocation();
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setError('Unable to request location permission. Please enable manually in browser settings.');
    }
  }, [getCurrentLocation]);

  // Memoized computed values - moved before useEffects that use them
  const isWithinRange = useMemo(() => distance !== null && distance <= MAX_DISTANCE, [distance]);
  const hasNoAttendanceToday = useMemo(() => attendanceData?.data && attendanceData.data.length === 0, [attendanceData]);
  const hasAttendanceToday = useMemo(() => attendanceData?.data && attendanceData.data.length > 0, [attendanceData]);
  const canPunchIn = useMemo(() => isWithinRange && hasNoAttendanceToday && !attendanceLoading && deviceValidation.isValid,
    [isWithinRange, hasNoAttendanceToday, attendanceLoading, deviceValidation.isValid]);
  const canPunchOut = useMemo(() => isWithinRange && hasAttendanceToday && !attendanceLoading && deviceValidation.isValid,
    [isWithinRange, hasAttendanceToday, attendanceLoading, deviceValidation.isValid]);

  // Check if already punched out today
  const isPunchedOut = useMemo(() => {
    if (hasAttendanceToday) {
      const todaysRecord = attendanceData.data[0];
      return todaysRecord.punchOutTime ? true : false;
    }
    return false;
  }, [hasAttendanceToday, attendanceData]);

  // Combined useEffect for initial data loading
  useEffect(() => {
    console.log('Component mounted, initializing...');

    // Validate device first
    validateDevice();

    getTodaysAttendance();
    checkLocationPermission().then((permissionState) => {
      if (permissionState === 'granted') {
        getCurrentLocation();
      } else if (permissionState === 'denied') {
        setError('Location permission denied. Please enable location access in your browser settings.');
        setLoading(false);
      } else {
        // For 'prompt' or other states, we'll wait for user interaction
        setLoading(false);
      }
    });
  }, [getTodaysAttendance, checkLocationPermission, validateDevice]);

  // Separate useEffect for time updates
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timeInterval);
  }, []);

  // Working timer useEffect - Updates every second when punched in
  useEffect(() => {
    let workingInterval;

    if (punchInTime && hasAttendanceToday && !isPunchedOut) {
      workingInterval = setInterval(() => {
        const workingTimeString = calculateWorkingTime();
        setWorkingTime(workingTimeString);
      }, 1000); // Update every second
    } else {
      setWorkingTime('');
    }

    return () => {
      if (workingInterval) {
        clearInterval(workingInterval);
      }
    };
  }, [punchInTime, hasAttendanceToday, isPunchedOut, calculateWorkingTime, setWorkingTime]);

  // Handle punch in with better error handling - REMOVED WORKING HOURS CHECK
  const handlePunchIn = useCallback(() => {
    if (!userLocation) {
      setError('Location not available. Please enable location access first.');
      return;
    }

    if (distance > MAX_DISTANCE) {
      setError(`You are too far from the office (${distance}m away). You must be within ${MAX_DISTANCE}m.`);
      return;
    }

    // Show loading state
    setLoading(true);
    setError(null);

    // Recheck location before punching in
    const recheckLocation = () => {
      console.log('Rechecking location before punch in...');

      const options = {
        enableHighAccuracy: true,
        timeout: 15000, // 15 seconds timeout for punch-in recheck
        maximumAge: 0 // Don't use cached location for punch-in
      };

      const successCallback = (position) => {
        console.log('Location recheck successful:', position);
        const { latitude, longitude } = position.coords;

        // Calculate fresh distance
        const freshDistance = calculateDistance(
          latitude,
          longitude,
          ALLOWED_LOCATION.lat,
          ALLOWED_LOCATION.lng
        );

        const roundedDistance = Math.round(freshDistance);
        console.log(`Fresh distance check: ${roundedDistance}m`);

        // Check if still within range
        if (roundedDistance > MAX_DISTANCE) {
          setLoading(false);
          setError(`Location check failed: You are ${roundedDistance}m away from office. Must be within ${MAX_DISTANCE}m.`);
          return;
        }


        const punchInData = {
          punchInTime: Date.now(),
          userId: userData?._id,
          location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, // Use fresh location
          deviceInfo: getDeviceInfo(),
          status: "Present",
          remarks: "Punch In",
          unitIds: getSelectedUnit()?._id
        };

        console.log("punchInData with fresh location:", punchInData);

        HitApi(punchInData, addAttendance).then((res) => {

          setLoading(false);
          if (res?.statusCode === 201) {
            toast.success("Punch In successfully")
            window.location.reload();
          } else {
            setError('Failed to punch in. Please try again.');
          }
        }).catch((error) => {
          console.error("Error punching in:", error);
          setLoading(false);
          setError('Failed to punch in. Please check your connection and try again.');
        });
      };

      const errorCallback = (error) => {
        console.error('Location recheck failed:', error);
        setLoading(false);
        let errorMessage;

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied during punch-in. Please enable location access.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location unavailable during punch-in. Please check your device's location services.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location check timed out during punch-in. Please try again.";
            break;
          default:
            errorMessage = `Location error during punch-in: ${error.message}. Please try again.`;
            break;
        }

        setError(errorMessage);
      };

      // Get fresh location for punch-in
      navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);
    };

    // Start location recheck
    recheckLocation();
  }, [distance, getLocationString, userLocation, calculateDistance, userData]);

  const handlePunchOut = useCallback(() => {
    if (!userLocation) {
      setError('Location not available. Please enable location access first.');
      return;
    }

    if (distance > MAX_DISTANCE) {
      setError(`You are too far from the office (${distance}m away). You must be within ${MAX_DISTANCE}m.`);
      return;
    }

    if (!attendanceData?.data || attendanceData.data.length === 0) {
      setError('No attendance record found for today.');
      return;
    }

    // Calculate earned salary at punch out time
    const earnedSalary = calculateEarnedSalary(workingTime);
    console.log("Calculated earned salary at punch out:", earnedSalary);

    setPunchOutLoading(true);
    setError(null);

    // Recheck location before punching out
    const recheckLocation = () => {
      console.log('Rechecking location before punch out...');

      const options = {
        enableHighAccuracy: true,
        timeout: 15000, // 15 seconds timeout for punch-out recheck
        maximumAge: 0 // Don't use cached location for punch-out
      };

      const successCallback = (position) => {
        console.log('Location recheck successful for punch out:', position);
        const { latitude, longitude } = position.coords;

        // Calculate fresh distance
        const freshDistance = calculateDistance(
          latitude,
          longitude,
          ALLOWED_LOCATION.lat,
          ALLOWED_LOCATION.lng
        );

        const roundedDistance = Math.round(freshDistance);
        console.log(`Fresh distance check for punch out: ${roundedDistance}m`);

        // Check if still within range
        if (roundedDistance > MAX_DISTANCE) {
          setPunchOutLoading(false);
          setError(`Location check failed: You are ${roundedDistance}m away from office. Must be within ${MAX_DISTANCE}m.`);
          return;
        }

        // Location is valid, proceed with punch out
        const todaysRecord = attendanceData.data[0];
        const punchOutTime = Date.now();

        // Calculate total hours worked (in hours, not milliseconds)
        const totalMilliseconds = punchOutTime - todaysRecord?.punchInTime;
        const totalHours = totalMilliseconds / (1000 * 60 * 60); // Convert ms to hours

        // For very short durations, show more decimal places to capture seconds
        let formattedTotalHours;
        if (totalHours < 0.01) { // Less than 0.01 hours (36 seconds)
          formattedTotalHours = parseFloat(totalHours.toFixed(6)); // 6 decimal places for precision
        } else {
          formattedTotalHours = parseFloat(totalHours.toFixed(2)); // 2 decimal places for normal durations
        }

        const punchOutData = {
          _id: todaysRecord._id,
          punchOutTime: punchOutTime,
          Location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, // Use fresh location
          DeviceInfo: getDeviceInfo(),
          totalHours: formattedTotalHours,
          remarks: "Punch Out",
          todaySalary: earnedSalary,
          dayType: totalHours > 6 ? "Full Day" : "Half Day",
        };
        // API call to update attendance
        HitApi(punchOutData, updateAttendance).then((res) => {

          setPunchOutLoading(false);

          if (res?.statusCode === 200) {
            window.location.reload();
          } else {
            setError('Failed to punch out. Please try again.');
          }
        }).catch((error) => {
          console.error("Error punching out:", error);
          setPunchOutLoading(false);
          setError('Failed to punch out. Please check your connection and try again.');
        });
      };

      const errorCallback = (error) => {
        console.error('Location recheck failed for punch out:', error);
        setPunchOutLoading(false);
        let errorMessage;

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied during punch-out. Please enable location access.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location unavailable during punch-out. Please check your device's location services.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location check timed out during punch-out. Please try again.";
            break;
          default:
            errorMessage = `Location error during punch-out: ${error.message}. Please try again.`;
            break;
        }

        setError(errorMessage);
      };

      // Get fresh location for punch-out
      navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);
    };

    // Start location recheck
    recheckLocation();
  }, [distance, attendanceData, getLocationString, userLocation, calculateDistance, workingTime, calculateEarnedSalary]);



  return (
    <div >
      <div className="max-w-md mx-auto md:max-w-3xl">
        {/* Only show time section when user hasn't punched in yet */}
        {hasNoAttendanceToday && (
          <div className="bg-white rounded-3xl shadow-2xl shadow-blue-500/20 mb-6 overflow-hidden border border-blue-100">
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-white opacity-10 transform -skew-y-6 origin-top-left"></div>
              <div className="relative z-10">
                <div className="bg-white bg-opacity-15 rounded-2xl p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-center mb-2">
                    <Calendar className="w-5 h-5 text-white mr-2" />
                    <span className="text-white font-medium">Current Time</span>
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {formatTime(currentTime)}
                  </div>
                  <div className="text-blue-100 text-sm mt-1">
                    {currentTime.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


        <div className="space-y-4">
          {/* Device Validation Error */}
          {deviceValidation.isChecking && (
            <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full mr-3">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-800">Validating Device</h3>
                  <p className="text-blue-600 text-sm">Checking device registration...</p>
                </div>
              </div>
            </div>
          )}

          {!deviceValidation.isChecking && !deviceValidation.isValid && (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-6">
              <div className="flex items-center mb-4">
                <div className="bg-red-100 p-3 rounded-full mr-3">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-800">Device Not Authorized</h3>
                  <p className="text-red-600 text-sm">This device is not registered for attendance</p>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-red-100 p-4 mb-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Current Device:</span>
                    <span className="font-mono text-red-600">{currentDeviceInfo?.deviceFingerprint?.slice(0, 16)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span className="text-red-600 font-medium">Not Registered</span>
                  </div>
                </div>
              </div>

              <p className="text-red-700 text-sm mb-4">{deviceValidation.message}</p>

              <button
                onClick={validateDevice}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Retry Validation
              </button>
            </div>
          )}

          {!deviceValidation.isChecking && deviceValidation.isValid && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-full mr-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-green-800 font-medium">Device Authorized</p>
                  <p className="text-green-600 text-sm">Ready for attendance tracking</p>
                </div>
              </div>
            </div>
          )}

          {locationPermission === 'denied' && (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-6">
              <div className="flex items-center mb-4">
                <div className="bg-red-100 p-3 rounded-full mr-3">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-800">Location Access Required</h3>
                  <p className="text-red-600 text-sm">Enable location to use attendance system</p>
                </div>
              </div>

              <div className="space-y-2 text-red-700 text-sm mb-4">
                <p>• Click the location icon in your browser's address bar</p>
                <p>• Select "Allow" for location access</p>
                <p>• Click "Try Again" below</p>
              </div>

              <button
                onClick={requestLocationPermission}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Try Again
              </button>
            </div>
          )}

          {(locationPermission === 'prompt' || (!userLocation && !loading && error)) && (
            <button
              onClick={requestLocationPermission}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-xl flex items-center justify-center"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 mr-2 animate-spin" />
              ) : (
                <Navigation className="w-6 h-6 mr-2" />
              )}
              {loading ? 'Getting Location...' : 'Enable Location Access'}
            </button>
          )}

          {hasNoAttendanceToday && (
            <button
              onClick={handlePunchIn}
              disabled={!canPunchIn || loading || attendanceLoading}
              className={`w-full py-2.5 px-4 rounded-xl font-semibold text-base transition-all duration-300 flex items-center justify-center ${canPunchIn && !loading && !attendanceLoading
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/20 active:scale-95'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-60'
                }`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 mr-1.5 animate-spin" />
              ) : (
                <Clock className="w-5 h-5 mr-1.5" />
              )}
              {loading ? 'Processing...' : 'Punch In'}
            </button>
          )}

          {/* Punch Out Button */}
          {hasAttendanceToday && !isPunchedOut && (
            <button
              onClick={handlePunchOut}
              disabled={!canPunchOut || loading || attendanceLoading || punchOutLoading}
              className={`w-full py-2.5 px-6 rounded-2xl font-semibold text-lg transition-all duration-300 flex items-center justify-center transform ${canPunchOut && !loading && !attendanceLoading && !punchOutLoading
                ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-2xl shadow-red-500/30 hover:scale-105 hover:shadow-3xl hover:shadow-red-500/40'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-60'
                }`}
            >
              {punchOutLoading ? (
                <Loader2 className="w-6 h-6 mr-2 animate-spin" />
              ) : (
                <LogOut className="w-6 h-6 mr-2" />
              )}
              {punchOutLoading ? 'Punching Out...' : 'Punch Out'}
            </button>
          )}

          {/* Completed State */}
          {hasAttendanceToday && isPunchedOut && (
            <div className="w-full py-4 px-6 rounded-2xl font-semibold text-lg bg-gradient-to-r from-gray-400 to-gray-500 text-white flex items-center justify-center opacity-80">
              <CheckCircle className="w-6 h-6 mr-2" />
              Work Completed for Today
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
              <div className="flex items-start">
                <div className="bg-yellow-100 p-2 rounded-full mr-3 flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-yellow-800 mb-1">Attention Required</h4>
                  <p className="text-yellow-700 text-sm mb-3">{error}</p>
                  <button
                    onClick={requestLocationPermission}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Distance Warning */}
          {((hasNoAttendanceToday && !canPunchIn) || (hasAttendanceToday && !isPunchedOut && !canPunchOut)) &&
            !loading && !attendanceLoading && distance !== null && !isWithinRange && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <div className="flex items-center">
                  <div className="bg-red-100 p-2 rounded-full mr-3">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-red-800 font-medium">Too Far from Office</p>
                    <p className="text-red-600 text-sm">You must be within {MAX_DISTANCE} meters to punch in/out</p>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default StaffPunchIn;