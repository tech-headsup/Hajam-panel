import React from 'react'
import toast from 'react-hot-toast';
import { HitApi } from '../../../Api/ApiHit';
import { updateUser } from '../../../constant/Constant';
import { getElevateUser } from '../../../storage/Storage';

// Generate system-based unique device ID that remains consistent
function generateSystemDeviceId() {
    // Create fingerprint from system properties
    const screen = `${window.screen.width}x${window.screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    const platform = navigator.platform;
    const userAgent = navigator.userAgent;


    // Create consistent hash
    const systemInfo = `${screen}-${timezone}-${language}-${platform}-${userAgent}`;
    let hash = 0;
    for (let i = 0; i < systemInfo.length; i++) {
        const char = systemInfo.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }

    return `device_${Math.abs(hash).toString(36)}`;
}

function MapDevice() {
    const [deviceId, setDeviceId] = React.useState('');
    const [submitLoading, setSubmitLoading] = React.useState(false);

    const handleGenerateId = () => {
        const id = generateSystemDeviceId();
        setDeviceId(id);
    };
const handleMapDevice = () => {
  if (!deviceId) {
    toast.error('Please generate device ID first');
    return;
  }

  setSubmitLoading(true);

  const currentUser = getElevateUser() || {};

  // If you already have the face id string in currentUser.faceID or currentUser.faceId,
  // keep it; otherwise replace 'currentUser.faceID' with the actual face id value.
  const faceIdValue = currentUser?.faceID || currentUser?.faceId || null;

  const userDataupdateUser = {
    _id: currentUser?._id,
    faceId: {
      id: faceIdValue,      // existing face id string
      deviceId: deviceId    // <-- added key
    }
  };

  HitApi(userDataupdateUser, updateUser)
    .then((res) => {
      setSubmitLoading(false);
      if (res?.message === "User updated successfully") {
        toast.success('User updated successfully!');
      } else {
        toast.error(res?.message || 'Failed to update user. Please try again.');
      }
    })
    .catch((error) => {
      setSubmitLoading(false);
      toast.error('Error updating user. Please try again.');
    });
};


    return (
        <div>
            <button onClick={handleGenerateId}>Generate Device ID</button>
            {deviceId && <p>Device ID: {deviceId}</p>}
            <button onClick={handleMapDevice} disabled={submitLoading || !deviceId}>
                {submitLoading ? 'Mapping...' : 'Map Your Device'}
            </button>
        </div>
    )
}

export default MapDevice