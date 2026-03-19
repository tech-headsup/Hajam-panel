import React, { useState, useEffect } from 'react';
import StaffPunchIn from '../StaffPunchIn/StaffPunchIn.jsx';
import DeviceRegistration from './DeviceRegistration.jsx';
import { getElevateUser } from '../../../storage/Storage';
import { AlertTriangle } from 'lucide-react';
import { getDeviceInfo } from '../../../utils/utils';

function StaffDashboard() {
  const [user, setUser] = useState(null);
  const [currentDeviceFingerprint, setCurrentDeviceFingerprint] = useState('');
  const [isDeviceAuthorized, setIsDeviceAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [workingTime, setWorkingTime] = useState('');

  useEffect(() => {
    const checkDeviceAuthorization = () => {
      try {
        const userData = getElevateUser();

        // Get current device fingerprint using enhanced utils
        const deviceInfoArray = getDeviceInfo();
        const currentDevice = deviceInfoArray[0];
        const currentFingerprint = currentDevice.deviceFingerprint;

        setUser(userData);
        setCurrentDeviceFingerprint(currentFingerprint);

        // Check if user has registered device fingerprint and it matches current device
        const registeredDeviceFingerprint = userData?.deviceMacAddress || userData?.deviceFingerprint;
        const deviceMatches = registeredDeviceFingerprint === currentFingerprint;

        console.log('Device authorization check:', {
          currentFingerprint,
          registeredDeviceFingerprint,
          deviceMatches,
          hasRegisteredDevice: !!registeredDeviceFingerprint
        });

        setIsDeviceAuthorized(registeredDeviceFingerprint && deviceMatches);
      } catch (error) {
        console.error('Error checking device authorization:', error);
        setIsDeviceAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkDeviceAuthorization();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Checking device authorization...</p>
        </div>
      </div>
    );
  }

  // Unauthorized device error
  if (!isDeviceAuthorized) {
    const hasRegisteredDevice = user?.deviceMacAddress || user?.deviceFingerprint;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="pt-8 pb-6 px-4">
          <div className="max-w-md mx-auto">
            {hasRegisteredDevice ? (
              // Device fingerprint mismatch - contact manager
              <div className="bg-white rounded-2xl border border-red-100 overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-red-400 to-red-500" />

                <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={32} className="text-red-600" />
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Device Not Authorized
                  </h3>

                  <p className="text-sm text-gray-600 mb-6">
                    This device is not registered for attendance. Please contact your salon manager to reset your device or use your registered device for punch in/out.
                  </p>

                  <div className="bg-red-50 rounded-lg p-4 border border-red-100 mb-4">
                    <div className="text-xs text-red-800">
                      <p className="mb-1"><strong>Current Device:</strong> {currentDeviceFingerprint?.slice(0, 16)}...</p>
                      <p><strong>Registered Device:</strong> {(user?.deviceMacAddress || user?.deviceFingerprint)?.slice(0, 16)}...</p>
                    </div>
                  </div>

                  <button
                    onClick={() => window.location.reload()}
                    className="w-full py-3 px-4 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600 transition-all"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : (
              // No device registered - show device registration
              <DeviceRegistration />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Authorized device - show normal dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Components */}
      <div className="pt-8 pb-6 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Punch In/Out Section */}
          <div className="flex justify-center">
            <StaffPunchIn workingTime={workingTime} setWorkingTime={setWorkingTime} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default StaffDashboard
