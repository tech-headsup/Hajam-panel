import { useState, useEffect } from 'react';
import { X, User, Phone } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { setApiJson, setApiErrorJson } from '../../redux/Actions/ApiAction';
import { HitApi } from '../../Api/ApiHit';
import { addClient } from '../../constant/Constant';
import AppInput from '../../components/AppInput/AppInput';
import AppButton from '../../components/AppButton/AppButton';
import SearchableSelect from '../../components/AppSelect/SearchableSelect';
import toast from 'react-hot-toast';
import { getErrorMsg, hasError } from '../../utils/utils';
import { customerTypeOptions, genderOptions,ageGroupOptions } from '../../constant/Options';

function AddClient({ isOpen, onClose, onClientAdded, prefilledData = null }) {
    const [submitLoading, setSubmitLoading] = useState(false);
    const ApiReducer = useSelector((state) => state.ApiReducer);
    const dispatch = useDispatch();

    // const genderOptions = [
    //     { label: 'Male', value: 'Male' },
    //     { label: 'Female', value: 'Female' },
    //     { label: 'Other', value: 'Other' }
    // ];

    // const customerTypeOptions = [
    //     { label: 'Walk In', value: 'Walk In' },
    //     { label: 'Regular', value: 'Regular' },
    //     { label: 'VIP', value: 'VIP' }
    // ];

    // const ageGroupOptions = [
    //     { label: 'Child (0-12)', value: 'Child' },
    //     { label: 'Teen (13-19)', value: 'Teen' },
    //     { label: 'Adult (20-59)', value: 'Adult' },
    //     { label: 'Senior (60+)', value: 'Senior' }
    // ];

    useEffect(() => {
        if (isOpen) {
            // Function to detect if a string is a phone number
            const isPhoneNumber = (str) => {
                // Check if string contains mostly digits and is reasonable phone length
                const cleanStr = str.replace(/[\s\-\(\)\+]/g, ''); // Remove common phone formatting
                return /^\d{7,15}$/.test(cleanStr); // 7-15 digits is reasonable phone range
            };

            const initialClientData = {
                name: "",
                phoneNumber: "",
                gender: "",
                img: "",
                ageGroup: "",
                customerType: "Walk In"
            };

            // If prefilledData is provided, use it to populate fields
            if (prefilledData) {
                if (isPhoneNumber(prefilledData)) {
                    // If the prefilled data looks like a phone number, put it in phoneNumber field
                    initialClientData.phoneNumber = prefilledData;
                } else {
                    // Otherwise, put it in the name field
                    initialClientData.name = prefilledData;
                }
            }

            dispatch(setApiJson(initialClientData));
            dispatch(setApiErrorJson({}));
        }
    }, [isOpen, dispatch, prefilledData]);

    const validateForm = () => {
        const errors = {};
        const clientData = ApiReducer?.apiJson;

        if (!clientData?.name || clientData.name.trim() === '') {
            errors.name = 'Name is required';
        }

        if (!clientData?.phoneNumber || clientData.phoneNumber.trim() === '') {
            errors.phoneNumber = 'Phone number is required';
        } else if (!/^\d{10}$/.test(clientData.phoneNumber)) {
            errors.phoneNumber = 'Phone number must be 10 digits';
        }

        if (!clientData?.customerType || clientData.customerType.trim() === '') {
            errors.customerType = 'Customer type is required';
        }

        return errors;
    };

    const handleSubmit = async () => {
        setSubmitLoading(true);

        const errors = validateForm();
        dispatch(setApiErrorJson(errors));

        if (Object.keys(errors).length === 0) {
            try {
                const clientData = { ...ApiReducer.apiJson };
                const res = await HitApi(clientData, addClient);

                if (res?.statusCode === 201 || res?.statusCode === 200) {
                    toast.success('Client added successfully!');

                    // Call the callback with the newly created client
                    if (onClientAdded && res?.data) {
                        onClientAdded(res.data);
                    }

                    // Reset form and close modal
                    dispatch(setApiJson({}));
                    dispatch(setApiErrorJson({}));
                    onClose();
                } else {
                    toast.error(res?.message || "Failed to add client. Please try again.");
                }
            } catch (error) {
                console.error('Error adding client:', error);
                toast.error("Error adding client. Please try again.");
            }
        } else {
            toast.error("Please fix the errors in the form");
        }

        setSubmitLoading(false);
    };

    const handleClose = () => {
        if (!submitLoading) {
            dispatch(setApiJson({}));
            dispatch(setApiErrorJson({}));
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={handleClose}
            ></div>

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Add New Client</h2>
                            <p className="text-sm text-gray-500 mt-1">Create a new client profile</p>
                        </div>
                        <button
                            onClick={handleClose}
                            disabled={submitLoading}
                            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                        {/* Basic Information */}
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4">Basic Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <AppInput
                                    title="Full Name"
                                    placeholder="Enter full name"
                                    name="name"
                                    important={true}
                                    error={hasError('name', ApiReducer)}
                                    errormsg={getErrorMsg('name', ApiReducer)}
                                    icon={<User size={18} />}
                                    disabled={submitLoading}
                                />
                                <AppInput
                                    title="Phone Number"
                                    placeholder="10-digit phone number"
                                    name="phoneNumber"
                                    type="tel"
                                    important={true}
                                    error={hasError('phoneNumber', ApiReducer)}
                                    errormsg={getErrorMsg('phoneNumber', ApiReducer)}
                                    icon={<Phone size={18} />}
                                    disabled={submitLoading}
                                />
                            </div>
                        </div>

                        {/* Personal Details */}
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4">Personal Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SearchableSelect
                                    title="Gender"
                                    name="gender"
                                    options={genderOptions}
                                    error={hasError('gender', ApiReducer)}
                                    errormsg={getErrorMsg('gender', ApiReducer)}
                                    disabled={submitLoading}
                                    placeholder="Select gender"
                                />
                                <SearchableSelect
                                    title="Age Group"
                                    name="ageGroup"
                                    options={ageGroupOptions}
                                    error={hasError('ageGroup', ApiReducer)}
                                    errormsg={getErrorMsg('ageGroup', ApiReducer)}
                                    disabled={submitLoading}
                                    placeholder="Select age group"
                                />
                            </div>
                        </div>

                        {/* Customer Type */}
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4">Customer Type</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SearchableSelect
                                    title="Customer Type"
                                    name="customerType"
                                    options={customerTypeOptions}
                                    important={true}
                                    error={hasError('customerType', ApiReducer)}
                                    errormsg={getErrorMsg('customerType', ApiReducer)}
                                    disabled={submitLoading}
                                    placeholder="Select customer type"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
                        <button
                            onClick={handleClose}
                            disabled={submitLoading}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <AppButton
                            buttontext={submitLoading ? "Adding Client..." : "Add Client"}
                            onClick={handleSubmit}
                            disabled={submitLoading}
                            isLoading={submitLoading}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AddClient;
