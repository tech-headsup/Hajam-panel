import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CameraOff, CheckCircle, AlertCircle, Loader, User, RotateCcw, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { setApiJson } from '../../redux/Actions/ApiAction';
import * as faceapi from 'face-api.js';

/**
 * FaceDetection - Face detection component that automatically updates Redux state
 * @param {string} name - Field name for Redux state (like 'faceData')
 * @param {string} title - Label text for the component
 * @param {boolean} important - Whether face registration is required (shows * indicator)
 * @param {boolean} error - Whether the component has an error
 * @param {string} errormsg - Error message to display
 * @param {string} mode - 'register' or 'verify' mode
 * @param {boolean} disabled - Whether the component is disabled
 * @param {function} onFaceRegistered - Callback when face is registered (optional)
 * @param {function} onFaceVerified - Callback when face is verified (optional)
 */
const FaceDetection = ({
    name = 'faceData',
    title = 'Face Recognition',
    important = false,
    error = false,
    errormsg = '',
    mode = 'register', // 'register' or 'verify'
    disabled = false,
    onFaceRegistered,
    onFaceVerified,
    existingFaceData = null,
    modelsPath = '/models', // Path to face-api.js models
    ...rest
}) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, success, error
    const [errorMessage, setErrorMessage] = useState('');
    const [faceDescriptor, setFaceDescriptor] = useState(null);
    const [showCamera, setShowCamera] = useState(false);

    // Redux state management (following AppInput pattern)
    const ApiReducer = useSelector((state) => state.ApiReducer);
    const dispatch = useDispatch();

    // Get face data from Redux store
    const faceData = ApiReducer.apiJson && ApiReducer.apiJson[name] !== undefined
        ? ApiReducer.apiJson[name]
        : null;

    const faceRegistered = faceData?.faceRegistered || false;

    // Load face-api models
    useEffect(() => {
        loadModels();
    }, []);

    const loadModels = async () => {
        try {
            setStatus('idle');
            setErrorMessage('Loading AI models...');

            // Load face-api.js models
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(modelsPath),
                faceapi.nets.faceLandmark68Net.loadFromUri(modelsPath),
                faceapi.nets.faceRecognitionNet.loadFromUri(modelsPath),
                faceapi.nets.faceExpressionNet.loadFromUri(modelsPath)
            ]);

            setIsModelLoaded(true);
            setErrorMessage('');
            console.log('Face-api.js models loaded successfully');
        } catch (error) {
            console.error('Error loading face-api.js models:', error);
            setErrorMessage('Failed to load AI models. Please check that models are available at: ' + modelsPath);
            setStatus('error');
        }
    };

    const startCamera = async () => {
        console.log('Starting camera...');

        if (!videoRef.current) {
            console.error('Video element not found');
            setErrorMessage('Video element not ready. Please wait and try again.');
            setStatus('error');
            return;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error('getUserMedia not supported');
            setErrorMessage('Camera not supported in this browser. Please use Chrome, Firefox, or Safari.');
            setStatus('error');
            return;
        }

        try {
            console.log('Requesting camera permissions...');
            setErrorMessage('Requesting camera access...');
            setStatus('loading');

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640, max: 1280 },
                    height: { ideal: 480, max: 720 },
                    facingMode: 'user'
                },
                audio: false
            });

            console.log('Camera stream obtained:', stream);

            if (!stream.getVideoTracks().length) {
                throw new Error('No video track found in stream');
            }

            if (!videoRef.current) {
                console.error('Video element became null');
                setErrorMessage('Video element disappeared. Please try again.');
                setStatus('error');
                return;
            }

            console.log('Setting video source...');
            videoRef.current.srcObject = stream;

            videoRef.current.onloadedmetadata = () => {
                console.log('Video metadata loaded, dimensions:',
                    videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);

                // Setup canvas dimensions to match video
                if (canvasRef.current && videoRef.current) {
                    const displaySize = {
                        width: videoRef.current.videoWidth || 640,
                        height: videoRef.current.videoHeight || 480
                    };
                    faceapi.matchDimensions(canvasRef.current, displaySize);
                }

                if (videoRef.current) {
                    videoRef.current.play().then(() => {
                        console.log('Video playing successfully');
                        setIsCameraOn(true);
                        setErrorMessage('');
                        setStatus('idle');
                    }).catch((playError) => {
                        console.error('Error playing video:', playError);
                        setErrorMessage('Failed to start video playback: ' + playError.message);
                        setStatus('error');
                    });
                }
            };

            videoRef.current.onerror = (videoError) => {
                console.error('Video element error:', videoError);
                setErrorMessage('Video display error occurred');
                setStatus('error');
            };

            setTimeout(() => {
                if (videoRef.current && !isCameraOn) {
                    console.log('Fallback: trying to play video directly');
                    videoRef.current.play().catch(console.error);
                }
            }, 1000);

        } catch (error) {
            console.error('Camera access error:', error);

            let errorMsg = 'Unable to access camera. ';

            switch (error.name) {
                case 'NotAllowedError':
                case 'PermissionDeniedError':
                    errorMsg += 'Camera permission denied. Please:\n1. Click camera icon in URL bar\n2. Select "Allow"\n3. Refresh page';
                    break;
                case 'NotFoundError':
                case 'DevicesNotFoundError':
                    errorMsg += 'No camera found. Please check if camera is connected and not being used by another app.';
                    break;
                case 'NotReadableError':
                case 'TrackStartError':
                    errorMsg += 'Camera is busy. Please close other apps using camera (Teams, Zoom, Skype, etc.)';
                    break;
                case 'OverconstrainedError':
                case 'ConstraintNotSatisfiedError':
                    errorMsg += 'Camera settings not supported. Trying basic settings...';
                    try {
                        console.log('Trying with minimal constraints...');
                        const simpleStream = await navigator.mediaDevices.getUserMedia({
                            video: true
                        });

                        if (videoRef.current) {
                            videoRef.current.srcObject = simpleStream;
                            await videoRef.current.play();
                            setIsCameraOn(true);
                            setErrorMessage('');
                            setStatus('idle');
                            return;
                        }
                    } catch (retryError) {
                        console.error('Retry with simple constraints failed:', retryError);
                        errorMsg += ' Retry also failed.';
                    }
                    break;
                default:
                    errorMsg += `Error: ${error.message || error.name || 'Unknown error'}`;
            }

            setErrorMessage(errorMsg);
            setStatus('error');
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject;
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraOn(false);
        setFaceDetected(false);
    };

    const detectFace = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current || !isModelLoaded || isProcessing) {
            return;
        }

        setIsProcessing(true);

        try {
            // Define detection options
            const detectionOptions = new faceapi.TinyFaceDetectorOptions({
                inputSize: 416,
                scoreThreshold: 0.5
            });

            // Detect faces with landmarks and descriptors
            const detections = await faceapi
                .detectAllFaces(videoRef.current, detectionOptions)
                .withFaceLandmarks()
                .withFaceDescriptors();

            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            // Clear previous drawings
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Match canvas dimensions to video
            const displaySize = {
                width: videoRef.current.videoWidth || 640,
                height: videoRef.current.videoHeight || 480
            };
            faceapi.matchDimensions(canvas, displaySize);

            if (detections.length > 0) {
                // Use the first detected face
                const detection = detections[0];
                setFaceDetected(true);

                // Resize the detection results to match canvas
                const resizedDetections = faceapi.resizeResults(detections, displaySize);

                // Draw face detection box and landmarks
                faceapi.draw.drawDetections(canvas, resizedDetections);
                faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

                // Store face descriptor (128-dimensional array)
                const descriptor = detection.descriptor;
                setFaceDescriptor(Array.from(descriptor));

                if (mode === 'register') {
                    setStatus('success');
                    setErrorMessage('Face detected successfully! Click Register to save.');
                } else if (mode === 'verify' && existingFaceData && existingFaceData.faceDescriptor) {
                    // Compare with existing face data using euclidean distance
                    const existingDescriptor = new Float32Array(existingFaceData.faceDescriptor);
                    const currentDescriptor = detection.descriptor;

                    const distance = faceapi.euclideanDistance(existingDescriptor, currentDescriptor);
                    const threshold = 0.6; // Lower distance means better match

                    if (distance < threshold) {
                        setStatus('success');
                        setErrorMessage(`Face verified successfully! (Confidence: ${((1 - distance) * 100).toFixed(1)}%)`);
                        onFaceVerified && onFaceVerified(true, 1 - distance);
                    } else {
                        setStatus('error');
                        setErrorMessage(`Face verification failed. Distance: ${distance.toFixed(3)} (threshold: ${threshold})`);
                        onFaceVerified && onFaceVerified(false, 1 - distance);
                    }
                }
            } else {
                setFaceDetected(false);
                setErrorMessage('No face detected. Please position your face in the camera.');

                // Draw message on canvas
                ctx.fillStyle = '#ff0000';
                ctx.font = '16px Arial';
                ctx.fillText('No face detected', 10, 30);
            }
        } catch (error) {
            console.error('Error detecting face:', error);
            setErrorMessage('Face detection failed: ' + error.message);
            setStatus('error');
        } finally {
            setIsProcessing(false);
        }
    }, [isModelLoaded, isProcessing, mode, existingFaceData, onFaceVerified]);

    // Continuous face detection when camera is on
    useEffect(() => {
        let interval;
        if (isCameraOn && isModelLoaded) {
            interval = setInterval(detectFace, 1000); // Detect every second
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isCameraOn, isModelLoaded, detectFace]);

    // Generate unique Face ID
    const generateUniqueFaceID = () => {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        return `face_${timestamp}_${random}`;
    };

    // Handle face registration (Following AppInput Redux pattern)
    const handleRegisterFace = () => {
        if (faceDescriptor) {
            // Generate unique Face ID
            const uniqueFaceID = generateUniqueFaceID();

            // Create complete face data object
            const faceDataObject = {
                faceID: uniqueFaceID,
                faceDescriptor: faceDescriptor, // Array of 128 numbers
                faceRegistered: true,
                faceRegistrationDate: new Date().toISOString(),
                faceConfidence: 0.95,
                faceRegistrationData: {
                    id: uniqueFaceID,
                    descriptor: faceDescriptor,
                    timestamp: new Date().toISOString(),
                    confidence: 0.95,
                    descriptorLength: faceDescriptor.length
                }
            };

            // Update Redux store
            const updatedApiJson = {
                ...ApiReducer.apiJson,
                [name]: faceDataObject
            };

            dispatch(setApiJson(updatedApiJson));

            setStatus('success');
            setErrorMessage('Face registered successfully!');
            stopCamera();
            setShowCamera(false);

            // Call optional callback
            onFaceRegistered && onFaceRegistered(faceDataObject);
        }
    };

    // Remove face registration
    const removeFaceRegistration = () => {
        const updatedApiJson = { ...ApiReducer.apiJson };
        delete updatedApiJson[name];
        dispatch(setApiJson(updatedApiJson));
        resetComponent();
    };

    const resetComponent = () => {
        setStatus('idle');
        setErrorMessage('');
        setFaceDetected(false);
        setFaceDescriptor(null);
        setShowCamera(false);
        stopCamera();
    };

    return (
        <div className="mb-4">
            {/* Label */}
            {title && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {title}
                    {important && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            {/* Face Registration Container */}
            <div className="w-full border rounded-lg border-slate-300 hover:border-slate-400 focus-within:border-blue-500 transition-colors">

                {/* Header with Status */}
                <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <Camera className="w-5 h-5 text-purple-600 mr-2" />
                            <span className="font-medium text-gray-800">
                                {mode === 'register' ? 'Register Face' : 'Verify Face'}
                            </span>
                            {faceRegistered && (
                                <div className="ml-3 flex items-center text-green-600">
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    <span className="text-sm font-medium">Registered</span>
                                </div>
                            )}
                        </div>

                        {faceRegistered && (
                            <button
                                onClick={removeFaceRegistration}
                                disabled={disabled}
                                className="text-red-600 hover:text-red-700 disabled:text-gray-400"
                                title="Remove Face Registration"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-4">
                    {!showCamera && !faceRegistered && (
                        <div className="text-center py-8">
                            <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                                <Camera className="w-6 h-6 text-purple-600" />
                            </div>
                            <p className="text-gray-600 mb-4 text-sm">
                                {mode === 'register'
                                    ? 'Click to register face for biometric authentication'
                                    : 'Click to verify your identity using face recognition'
                                }
                            </p>
                            <button
                                onClick={() => setShowCamera(true)}
                                disabled={!isModelLoaded || disabled}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center mx-auto transition-colors text-sm"
                            >
                                <Camera className="w-4 h-4 mr-2" />
                                Start Face {mode === 'register' ? 'Registration' : 'Verification'}
                            </button>
                        </div>
                    )}

                    {!showCamera && faceRegistered && (
                        <div className="text-center py-6">
                            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <p className="text-gray-600 mb-4 text-sm">
                                Face has been successfully registered for biometric authentication
                            </p>

                            {/* Debug Info */}
                            <div className="bg-gray-100 rounded-lg p-3 mb-4 text-left text-xs text-gray-600">
                                <div className="font-medium mb-1">Face Data Status:</div>
                                <div>Registered: {faceRegistered ? 'Yes' : 'No'}</div>
                                <div>Face ID: {faceData?.faceID || 'Not Generated'}</div>
                                <div>Descriptor Points: {faceData?.faceDescriptor?.length || 'N/A'}</div>
                                <div>Registration Date: {faceData?.faceRegistrationDate ? new Date(faceData.faceRegistrationDate).toLocaleDateString() : 'N/A'}</div>
                                <div>Confidence: {faceData?.faceConfidence || 'N/A'}</div>
                                <div>Complete Object: {faceData ? 'Available' : 'Not Available'}</div>
                                <div>Using: face-api.js</div>
                            </div>

                            <button
                                onClick={() => setShowCamera(true)}
                                disabled={disabled}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center mx-auto transition-colors text-sm"
                            >
                                <Camera className="w-4 h-4 mr-2" />
                                Re-register Face
                            </button>
                        </div>
                    )}

                    {showCamera && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="text-sm font-medium text-gray-800">
                                    {mode === 'register' ? 'Register Face' : 'Verify Face'}
                                </h4>
                                <button
                                    onClick={() => setShowCamera(false)}
                                    disabled={disabled}
                                    className="text-gray-600 hover:text-gray-800 disabled:text-gray-400"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Models Loading Status */}
                            {!isModelLoaded && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center">
                                        <Loader className="w-4 h-4 text-blue-600 mr-2 animate-spin" />
                                        <span className="text-blue-700 font-medium text-sm">Loading face-api.js AI models...</span>
                                    </div>
                                </div>
                            )}

                            {/* Camera Controls */}
                            <div className="flex justify-center space-x-3 mb-4">
                                {!isCameraOn ? (
                                    <button
                                        onClick={async () => {
                                            if (!videoRef.current) {
                                                await new Promise(resolve => setTimeout(resolve, 500));
                                            }
                                            startCamera();
                                        }}
                                        disabled={!isModelLoaded || disabled}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center transition-colors text-sm"
                                    >
                                        <Camera className="w-4 h-4 mr-2" />
                                        Start Camera
                                    </button>
                                ) : (
                                    <button
                                        onClick={stopCamera}
                                        disabled={disabled}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center transition-colors text-sm"
                                    >
                                        <CameraOff className="w-4 h-4 mr-2" />
                                        Stop Camera
                                    </button>
                                )}

                                <button
                                    onClick={resetComponent}
                                    disabled={disabled}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center transition-colors text-sm"
                                >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Reset
                                </button>
                            </div>

                            {/* Camera Video */}
                            <div className="relative mb-4">
                                <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video">
                                    <video
                                        ref={videoRef}
                                        className="w-full h-full object-cover"
                                        autoPlay
                                        muted
                                        playsInline
                                        style={{ display: 'block' }}
                                    />
                                    <canvas
                                        ref={canvasRef}
                                        className="absolute top-0 left-0 w-full h-full pointer-events-none"
                                        width="640"
                                        height="480"
                                    />

                                    {/* Placeholder when camera is off */}
                                    {!isCameraOn && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                                            <div className="text-white text-center">
                                                <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm opacity-75">Camera Preview</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Face Detection Indicator */}
                                {isCameraOn && (
                                    <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${faceDetected
                                            ? 'bg-green-100 text-green-700 border border-green-200'
                                            : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                        }`}>
                                        <div className="flex items-center">
                                            {faceDetected ? (
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                            ) : (
                                                <User className="w-3 h-3 mr-1" />
                                            )}
                                            {faceDetected ? 'Face Detected' : 'Looking for face...'}
                                        </div>
                                    </div>
                                )}

                                {/* Processing Indicator */}
                                {isProcessing && (
                                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium border border-blue-200">
                                        <div className="flex items-center">
                                            <Loader className="w-3 h-3 mr-1 animate-spin" />
                                            Processing...
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Register Button */}
                            {mode === 'register' && faceDetected && faceDescriptor && (
                                <div className="text-center">
                                    <button
                                        onClick={handleRegisterFace}
                                        disabled={disabled || isProcessing}
                                        className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center mx-auto transition-colors text-sm"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Register Face
                                    </button>
                                </div>
                            )}

                            {/* Status Messages */}
                            {status === 'success' && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center">
                                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                                        <span className="text-green-700 font-medium text-sm">Success!</span>
                                    </div>
                                    {errorMessage && <p className="text-xs text-green-600 mt-1">{errorMessage}</p>}
                                </div>
                            )}

                            {status === 'error' && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-center">
                                        <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                                        <span className="text-red-700 font-medium text-sm">Error</span>
                                    </div>
                                    {errorMessage && <p className="text-xs text-red-600 mt-1 whitespace-pre-line">{errorMessage}</p>}
                                </div>
                            )}

                            {errorMessage && status === 'idle' && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center">
                                        <Loader className="w-4 h-4 text-blue-600 mr-2" />
                                        <span className="text-blue-700 font-medium text-sm">{errorMessage}</span>
                                    </div>
                                </div>
                            )}

                            {/* Instructions */}
                            <div className="text-center text-xs text-gray-500 space-y-1">
                                <p>• Position your face clearly in the camera frame</p>
                                <p>• Ensure good lighting for better detection</p>
                                <p>• Keep your face steady during registration</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Error message */}
            {error && errormsg && (
                <p className="mt-1 text-sm text-red-500">{errormsg}</p>
            )}
        </div>
    );
};

export default FaceDetection;
