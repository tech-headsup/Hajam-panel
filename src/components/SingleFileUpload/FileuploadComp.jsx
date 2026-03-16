import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Upload, File, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { uploadSingleNew, projectKey, secretKey } from '../../constant/Constant';
import { getAcessToken } from '../../storage/Storage';
import { setApiJson } from '../../redux/Actions/ApiAction';
import { HitApiFormData } from '../../Api/ApiHit';
import { setDataAction } from '../../redux/Actions/SetDataAction';

// Redux action to save file URL


const saveFileUrl = (name, url, fileInfo) => ({
    type: 'SAVE_FILE_URL',
    payload: { name, url, fileInfo }
});

function FileuploadComp({ title, name, allowed = [], multiple, index, error = false, errormsg = '' }) {
    const dispatch = useDispatch();
    const ApiReducer = useSelector(state => state.ApiReducer);

    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const fileInputRef = useRef(null);

    // Get current file URL from Redux if exists
    const currentFileUrl = ApiReducer?.fileUrls?.[name];

    // Also check in apiJson for existing data (useful in edit mode)
    const apiJsonFileUrl = ApiReducer?.apiJson?.[name];

    // Helper function to extract filename from URL
    const getFileNameFromUrl = (url) => {
        if (!url) return null;
        try {
            const urlParts = url.split('/');
            return urlParts[urlParts.length - 1] || null;
        } catch (error) {
            return null;
        }
    };

    // Convert allowed types to proper mime types and extensions
    const getAllowedTypes = () => {
        if (!allowed || allowed.length === 0) return null;

        const extensionMap = {
            'pdf': '.pdf',
            'img': '.jpg,.jpeg,.png,.gif,.bmp,.webp,.svg',
            'image': '.jpg,.jpeg,.png,.gif,.bmp,.webp,.svg',
            'video': '.mp4,.avi,.mov,.mkv,.webm',
            'audio': '.mp3,.wav,.ogg',
            'doc': '.doc,.docx',
            'excel': '.xls,.xlsx'
        };

        return allowed
            .map(type => extensionMap[type.toLowerCase()] || `.${type}`)
            .join(',');
    };


    const isFileTypeAllowed = (file) => {
        if (!allowed || allowed.length === 0) return true;

        const fileName = file.name.toLowerCase();
        const fileType = file.type.toLowerCase();

        return allowed.some(allowedType => {
            const type = allowedType.toLowerCase();

            // Check by mime type first (more reliable)
            if (type === 'pdf' && fileType.includes('pdf')) return true;
            if ((type === 'img' || type === 'image') && fileType.startsWith('image/')) return true;
            if (type === 'video' && fileType.startsWith('video/')) return true;
            if (type === 'audio' && fileType.startsWith('audio/')) return true;
            if (type === 'doc' && (fileType.includes('word') || fileType.includes('document'))) return true;
            if (type === 'excel' && (fileType.includes('excel') || fileType.includes('spreadsheet'))) return true;

            // Check by extension for common image formats when type is 'img'
            if (type === 'img' || type === 'image') {
                const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
                if (imageExtensions.some(ext => fileName.endsWith(ext))) return true;
            }

            // Check by extension for other specific types
            if (type === 'pdf' && fileName.endsWith('.pdf')) return true;
            if (type === 'doc' && (fileName.endsWith('.doc') || fileName.endsWith('.docx'))) return true;
            if (type === 'excel' && (fileName.endsWith('.xls') || fileName.endsWith('.xlsx'))) return true;

            // For other types, check if extension matches
            if (fileName.endsWith(`.${type}`)) return true;

            return false;
        });
    };

    // Check if file is an image
    const isImageFile = (file) => {
        if (file?.type) {
            return file.type.startsWith('image/');
        }
        if (file?.name) {
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
            return imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
        }
        if (file?.url || typeof file === 'string') {
            // If it's a URL, check the extension
            const url = file?.url || file;
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
            return imageExtensions.some(ext => url.toLowerCase().includes(ext));
        }
        return false;
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFile(files[0]); // Only handle first file
        }
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            handleFile(files[0]);
        }
    };

    const handleFile = async (file) => {
        // Check if file type is allowed
        if (!isFileTypeAllowed(file)) {
            setUploadError(`File type not allowed. Allowed types: ${allowed.join(', ')}`);
            return;
        }

        setIsUploading(true);
        setUploadError(null);

        try {
            const result = await uploadSingleFile(file);

            if (result.success && result.data?.file?.s3Url) {
                const fileInfo = {
                    name: file.name,
                    size: formatFileSize(file.size),
                    type: file.type,
                    uploadedAt: new Date().toISOString()
                };

                // Get file URL from new API response format
                const fileUrl = result.data.file.s3Url;

                setUploadedFile({
                    ...fileInfo,
                    url: fileUrl,
                    status: 'uploaded'
                });

                // Save to Redux
                dispatch(saveFileUrl(name, fileUrl, fileInfo));

            } else {
                setUploadError(result.error || 'Upload failed');
                setUploadedFile({
                    name: file.name,
                    size: formatFileSize(file.size),
                    type: file.type,
                    status: 'failed',
                    error: result.error
                });
            }

        } catch (error) {
            setUploadError('Failed to upload file. Please try again.');
            console.error('Upload error:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const uploadSingleFile = async (file) => {
        try {
            const token = getAcessToken();

            // Prepare data object for new upload API
            const uploadData = {
                file: file,
                userId: secretKey,
                projectKey: projectKey
            };

            console.log("Upload data:", uploadData);

            const response = await HitApiFormData(
                uploadData,          // data object
                uploadSingleNew,     // URL - new upload endpoint
                'POST',              // method
                { 'Authorization': `Bearer ${token}` }
            );

            console.log("response", response);

            if (response?.success && response?.file?.s3Url) {
                // Get file URL from new API response format
                const fileUrl = response.file.s3Url;
                console.log(`Setting Redux [${name}]:`, fileUrl);

                let oldJson = ApiReducer?.apiJson || {};
                let newJson = {
                    ...oldJson,
                    [name]: fileUrl
                };
                console.log("Updated apiJson:", newJson);
                dispatch(setApiJson(newJson));
            }
            return { success: true, data: response };

        } catch (error) {
            console.error('File upload error:', error);
            return { success: false, error: error.message };
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const removeFile = () => {
        setUploadedFile(null);
        setUploadError(null);

        // Clear from Redux - both fileUrls and apiJson
        dispatch(saveFileUrl(name, null, null));

        // Also clear from apiJson in Redux
        let oldJson = ApiReducer?.apiJson || {};
        let newJson = { ...oldJson };
        newJson[name] = ""; // Set to empty string to maintain the field
        dispatch(setApiJson(newJson));
    };

    const openFileDialog = () => {
        fileInputRef.current?.click();
    };

    const displayFile = uploadedFile ||
        (currentFileUrl ? { url: currentFileUrl, status: 'uploaded' } : null) ||
        (apiJsonFileUrl ? {
            url: apiJsonFileUrl,
            status: 'uploaded',
            name: getFileNameFromUrl(apiJsonFileUrl) || 'Existing File'
        } : null);

    return (
        <div className="w-full">
            {title && (
                <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                        {title}
                    </label>
                </div>
            )}

            {uploadError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-700 text-sm">{uploadError}</span>
                </div>
            )}

            {!displayFile && (
                <div
                    className={`
                        relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300
                        ${isDragOver
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                        }
                        ${isUploading ? 'pointer-events-none opacity-70' : 'cursor-pointer'}
                    `}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={openFileDialog}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileSelect}
                        className="hidden"
                        accept={getAllowedTypes()}
                    />

                    <div className="flex flex-col items-center space-y-3">
                        <div className={`
                            p-3 rounded-full transition-colors duration-300
                            ${isDragOver ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}
                        `}>
                            {isUploading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <Upload className="w-6 h-6" />
                            )}
                        </div>

                        <div>
                            <p className="text-sm text-gray-600 mb-1">
                                <span className="font-medium">Drag & Drop your file</span> or{' '}
                                <span className="text-blue-500 font-medium underline cursor-pointer">
                                    Browse
                                </span>
                            </p>
                            {allowed && allowed.length > 0 && (
                                <p className="text-xs text-gray-400">
                                    Allowed: {allowed.join(', ')}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {displayFile && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">

                    {console.log("displayFile",displayFile)
                    }
                    {isImageFile(displayFile) && displayFile.url && (
                        <div className="relative">
                            <img
                                src={displayFile.url}
                                alt={displayFile.name || 'Uploaded image'}
                                className="w-full h-48 object-cover"
                                onError={(e) => {
                                    // Hide image if it fails to load
                                    e.target.style.display = 'none';
                                }}
                            />
                            {/* Delete button overlay for images */}
                            <button
                                onClick={removeFile}
                                className="absolute top-2 right-2 p-1 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full shadow-sm transition-all"
                            >
                                <X className="w-4 h-4 text-gray-600 hover:text-red-500" />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center justify-between p-4 bg-white">
                        <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-full ${displayFile.status === 'uploaded' ? 'bg-green-100' : 'bg-red-100'
                                }`}>
                                <File className={`w-4 h-4 ${displayFile.status === 'uploaded' ? 'text-green-600' : 'text-red-600'
                                    }`} />
                            </div>

                            <div>
                                <p className="font-medium text-gray-800 text-sm">
                                    {displayFile.name || 'Uploaded File'}
                                </p>
                                {displayFile.size && (
                                    <p className="text-xs text-gray-500">{displayFile.size}</p>
                                )}
                                {displayFile.error && (
                                    <p className="text-xs text-red-500">{displayFile.error}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <div className={`flex items-center space-x-1 ${displayFile.status === 'uploaded' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {displayFile.status === 'uploaded' ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <AlertCircle className="w-4 h-4" />
                                )}
                            </div>

                            {(!isImageFile(displayFile) || !displayFile.url) && (
                                <button
                                    onClick={removeFile}
                                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Validation error message from Redux */}
            {error && ApiReducer?.apiJsonError?.[name] && (
                <p className="mt-2 text-sm text-red-500">{ApiReducer.apiJsonError[name]}</p>
            )}
        </div>
    );
}

export default FileuploadComp;
