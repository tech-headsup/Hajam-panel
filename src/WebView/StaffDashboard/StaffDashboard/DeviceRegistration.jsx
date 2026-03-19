import React, { useState, useEffect } from 'react';
import { Smartphone, Shield, CheckCircle, AlertCircle, Wifi, Monitor } from 'lucide-react';
import { getElevateUser } from '../../../storage/Storage';
import { HitApi } from '../../../Api/ApiHit';
import { updateUser } from '../../../constant/Constant';
import { getDeviceInfo } from '../../../utils/utils';

function DeviceRegistration() {
  const [deviceName, setDeviceName] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState('pending'); // pending, success, error
  const [user, setUser] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState({
    type: 'Desktop',
    browser: 'Chrome',
    os: 'Unknown',
    deviceFingerprint: 'Generating...',
    deviceId: 'Generating...'
  });


  useEffect(() => {
    const userData = getElevateUser();
    setUser(userData);

    // Set device name to user's name if available
    if (userData?.name) {
      setDeviceName(userData.name);
    }

    // Detect device information using enhanced fingerprinting
    try {
      const deviceInfoArray = getDeviceInfo();
      const deviceData = deviceInfoArray[0]; // Get first element from array

      setDeviceInfo({
        type: deviceData.deviceType || 'Desktop',
        browser: deviceData.browser || 'Unknown',
        os: deviceData.operatingSystem || 'Unknown',
        deviceFingerprint: deviceData.deviceFingerprint || 'Unknown',
        deviceId: deviceData.deviceId || 'Unknown',
        hardwareInfo: deviceData.hardwareInfo || {},
        browserCapabilities: deviceData.browserCapabilities || {}
      });
    } catch (error) {
      console.error('Error getting device info:', error);
      setDeviceInfo(prev => ({
        ...prev,
        deviceFingerprint: 'Error generating fingerprint',
        deviceId: 'Error'
      }));
    }
  }, []);


  const getDeviceIcon = () => {
    if (deviceInfo.type === 'Mobile') return <Smartphone size={24} />;
    return <Monitor size={24} />;
  };

  const getStatusIcon = () => {
    switch (registrationStatus) {
      case 'success':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-600" />;
      default:
        return <Shield size={16} className="text-blue-600" />;
    }
  };

  const handleRegister = async () => {
    if (!user?._id || !deviceInfo?.deviceFingerprint || deviceInfo.deviceFingerprint === 'Generating...' || deviceInfo.deviceFingerprint === 'Error generating fingerprint') {
      console.error('Missing user ID or device fingerprint');
      return;
    }

    setLoading(true);

    try {
      const updateData = {
        _id: user._id,
        deviceMacAddress: deviceInfo.deviceFingerprint, // Use device fingerprint instead of MAC
        deviceFingerprint: deviceInfo.deviceFingerprint,
        deviceId: deviceInfo.deviceId,
        deviceType: deviceInfo.type,
        browser: deviceInfo.browser,
        operatingSystem: deviceInfo.os,
        hardwareInfo: deviceInfo.hardwareInfo,
        browserCapabilities: deviceInfo.browserCapabilities
      };

      console.log('Registering device with enhanced fingerprint:', updateData);

      const response = await HitApi(updateData, updateUser);

      if (response.success || response.statusCode === 200) {
        console.log('Device registered successfully:', response);
        setRegistrationStatus('success');
        setIsRegistered(true);
      } else {
        console.error('Device registration failed:', response.message);
        setRegistrationStatus('error');
      }
    } catch (error) {
      console.error('Device registration error:', error);
      setRegistrationStatus('error');
    } finally {
      setLoading(false);
    }
  };

  if (isRegistered) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-gradient-to-br from-white to-green-50 rounded-2xl border border-green-100 overflow-hidden">
          {/* Success Header */}
          <div className="h-1 w-full bg-gradient-to-r from-green-400 to-emerald-500" />

          {/* Content */}
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Device Registered!
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              Your device is now authorized for attendance tracking
            </p>

            <div className="bg-white rounded-lg p-4 border border-green-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Device Name:</span>
                <span className="font-medium text-gray-900">{deviceName}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-500">Status:</span>
                <span className="text-green-600 font-medium">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-100 overflow-hidden">

        {/* Header Strip */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-indigo-500" />

        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield size={32} className="text-blue-600" />
            </div>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
            Register Device
          </h2>

          <p className="text-sm text-gray-600 text-center">
            Secure your attendance with device registration
          </p>
        </div>

        {/* Device Info Card */}
        <div className="px-6 pb-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                {getDeviceIcon()}
                <span className="text-gray-600">{getDeviceIcon()}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">Current Device</span>
                  {getStatusIcon()}
                </div>
                <span className="text-xs text-gray-500">{deviceInfo.browser} on {deviceInfo.os}</span>
              </div>
            </div>

            {/* Device Details */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Type:</span>
                <span className="text-gray-700 font-medium">{deviceInfo.type}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Device ID:</span>
                <span className="text-gray-700 font-mono text-xs">{deviceInfo.deviceFingerprint?.slice(0, 16)}...</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Hardware:</span>
                <span className="text-gray-700 text-xs">
                  {deviceInfo.hardwareInfo?.cores || 'N/A'} cores, {deviceInfo.hardwareInfo?.screen || 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Security:</span>
                <div className="flex items-center space-x-1">
                  <Shield size={12} className="text-green-500" />
                  <span className="text-green-600 font-medium">Enhanced Fingerprint</span>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Register Button */}
        <div className="p-6 pt-0">
          <button
            onClick={handleRegister}
            disabled={loading}
            className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 active:scale-95'
              }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Registering...</span>
              </>
            ) : (
              <>
                <Shield size={16} />
                <span>Register Device</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeviceRegistration;