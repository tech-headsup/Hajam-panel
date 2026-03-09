import axios from "axios";
import { getAcessToken, getSelectedUnit } from "../storage/Storage";

// ===== EXISTING REST API FUNCTIONS (Keep as is) =====


const getUnitId = () => {
  const selectedUnit = getSelectedUnit();
  return selectedUnit?.unitIds || null;
};

export const HitApi = (json, api) => {
  return new Promise(function (resolve, reject) {
    const headers = { 'Content-Type': 'application/json' };
    var bearerToken = getAcessToken();
    if (bearerToken) {
      headers['Authorization'] = `Bearer ${bearerToken}`;
    }
    const requestPayload = {
      ...json,// Only add unitId if it exists
    };

    console.log("Request payload with unitId:", requestPayload);

    const requestOptions = {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestPayload)
    };

    fetch(api, requestOptions)
      .then(res => res.json())
      .then(
        (result) => {
          console.log('result----', result);
          resolve(result);
        },
        (error) => {
          console.log('error----', error);
          reject(error);
        }
      ).catch((err) => {
        reject(err);
      })
  });
}

export const HitPublicApi = (json, api) => {
  return new Promise(function (resolve, reject) {
    const headers = { 'Content-Type': 'application/json' };

    const requestPayload = {
      ...json,
    };

    console.log("Public API Request payload:", requestPayload);

    const requestOptions = {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestPayload)
    };

    fetch(api, requestOptions)
      .then(res => res.json())
      .then(
        (result) => {
          console.log('Public API result----', result);
          resolve(result);
        },
        (error) => {
          console.log('Public API error----', error);
          reject(error);
        }
      ).catch((err) => {
        reject(err);
      })
  });
}

export const HitApiFormData = async (data, url, method = 'POST', additionalHeaders = {}) => {
  // Debug logging

  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value instanceof File || value instanceof Blob) {
      formData.append(key, value, value.name || 'file');
    } else {
      formData.append(key, value);
    }
  });

  try {
    // Ensure method is a string and handle potential issues
    const httpMethod = String(method).toUpperCase();

    console.log('Making axios request with method:', httpMethod);

    const response = await axios({
      url: url,
      method: httpMethod,
      data: formData,
      headers: {
        // Don't set Content-Type manually for FormData, let axios handle it
        ...additionalHeaders,
      },
    });

    return response.data;
  } catch (error) {
    console.error('HitApiFormData error:', error);
    throw error;
  }
};

export const bulkApiHit = async (file, url, additionalHeaders = {}) => {
  try {
    console.log("Uploading file:", file?.name || 'Unknown file');
    console.log("API URL:", url);

    const formData = new FormData();
    formData.append('file', file);

    const response = await axios({
      url,
      method: 'POST',
      data: formData,
      headers: {
        ...additionalHeaders,
      },
      timeout: 30000,
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`Upload Progress: ${percentCompleted}%`);
      }
    });

    console.log('Bulk upload successful:', response.data);
    return response.data;

  } catch (error) {
    console.error('Bulk upload failed:', error);

    if (error.response) {
      throw {
        status: error.response.status,
        message: error.response.data?.message || 'Server error occurred',
        data: error.response.data
      };
    } else if (error.request) {
      throw {
        status: 0,
        message: 'Network error - no response from server',
        data: null
      };
    } else {
      throw {
        status: -1,
        message: error.message || 'Unknown error occurred',
        data: null
      };
    }
  }
};

export const bulkApiHitAdvanced = async (file, url, options = {}) => {
  const {
    fieldName = 'file',
    method = 'POST',
    timeout = 30000,
    additionalHeaders = {},
    additionalData = {},
    onProgress = null
  } = options;

  try {
    console.log(`Uploading file: ${file?.name || 'Unknown file'}`);
    console.log(`API URL: ${url}`);

    const formData = new FormData();
    formData.append(fieldName, file);

    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const config = {
      url,
      method,
      data: formData,
      headers: {
        ...additionalHeaders,
      },
      timeout,
    };

    if (onProgress && typeof onProgress === 'function') {
      config.onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted, progressEvent);
      };
    }

    const response = await axios(config);

    console.log('Bulk upload successful:', response.data);
    return {
      success: true,
      data: response.data,
      status: response.status
    };

  } catch (error) {
    console.error('Bulk upload failed:', error);

    return {
      success: false,
      error: {
        status: error.response?.status || 0,
        message: error.response?.data?.message || error.message || 'Upload failed',
        data: error.response?.data || null
      }
    };
  }
};
