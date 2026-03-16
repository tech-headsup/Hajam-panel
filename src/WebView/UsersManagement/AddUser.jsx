import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../PageHeader/PageHeader'
import AppButton from '../../components/AppButton/AppButton';
import AppInput from '../../components/AppInput/AppInput';
import { useDispatch, useSelector } from 'react-redux';
import { User, Shield, Smartphone, AlertTriangle } from 'lucide-react';
import { UserValidationScheema } from '../../validationscheema/UserValidation';
import { setApiErrorJson, setApiJson } from '../../redux/Actions/ApiAction';
import { HitApi } from '../../Api/ApiHit';
import { addUser, updateUser, searchRole, searchUser, searchUnit } from '../../constant/Constant';
import AppSelect from '../../components/AppSelect/AppSelect';
import { CheckDropdownValue, genderOptions, getUserType, weekOff, workingHours, statusOptions, sectionOptions, designationOptions } from '../../constant/Options';
import { getElevateUser, getSelectedUnit } from '../../storage/Storage';
import SearchableSelect from '../../components/AppSelect/SearchableSelect';
import FileuploadComp from '../../components/SingleFileUpload/FileuploadComp';
import toast from 'react-hot-toast';
import MultiSelect from '../../components/AppSelect/MultiSelect';
import { getErrorMsg, hasError } from '../../utils/utils';
import FaceDetection from '../../components/FaceDetection/FaceDetection';
import AppSwitch from '../../components/Switch/AppSwitch';

function AddUser() {
    const [isEditMode, setIsEditMode] = useState(false);
    const [roleOptions, setRoleOptions] = useState([]);
    const [unitOptions, setUnitOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [revokeLoading, setRevokeLoading] = useState(false);
    const [selectSearch, searchSlelect] = useState('')

    const user = getElevateUser()

    const ApiReducer = useSelector((state) => state.ApiReducer);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const getUnit = getSelectedUnit()

    const url = window.location.pathname;
    const urlId = url.split('/')[3];

    useEffect(() => {
        if (urlId && urlId !== 'add') {
            setIsEditMode(true);
            loadData();
        } else {
            dispatch(setApiJson({ status: 'Active' })); // Set default status for new users
            dispatch(setApiErrorJson({}));
        }



    }, [urlId]);


    console.log("ApiReducer", ApiReducer);


    useEffect(() => {
        fetchRoles();
        fetchUnit()

    }, [selectSearch]);

    const handleSubmit = () => {
        // setSubmitLoading(true);
        UserValidationScheema(ApiReducer?.apiJson, isEditMode).then((errors) => {

            dispatch(setApiErrorJson(errors));

            console.log("errors____", errors);


            if (Object.keys(errors).length === 0) {
                const userDataAddUser = { ...ApiReducer.apiJson, createdBy: getElevateUser()?._id, updatedBy: getElevateUser()?._id };
                const userDataupdateUser = { ...ApiReducer.apiJson, updatedBy: getElevateUser()?._id, _id: urlId };
                if (isEditMode) {
                    userDataAddUser._id = urlId;
                    HitApi(userDataupdateUser, updateUser).then((res) => {
                        setSubmitLoading(false);
                        if (res?.statusCode === 200) {
                            toast.success('User updated successfully!');
                            setTimeout(() => {
                                navigate('/users');
                            }, 1000);
                        } else {
                            toast.error(res?.message || 'Failed to update user. Please try again.');
                        }
                    }).catch((error) => {
                        setSubmitLoading(false);
                        toast.error('Error updating user. Please try again.');
                    });
                } else {
                    HitApi(userDataAddUser, addUser).then((res) => {
                        setSubmitLoading(false);
                        if (res.statusCode === 201) {
                            toast.success('User created successfully!');
                            setTimeout(() => {
                                navigate('/users');
                            }, 1000);
                        } else {
                            toast.error(res?.error || 'Failed to create user. Please try again.');
                        }
                    }).catch((error) => {
                        setSubmitLoading(false);
                        toast.error('Error creating user. Please try again.');
                    });
                }
            } else {
                setSubmitLoading(false);
            }
        }).catch((error) => {
            setSubmitLoading(false);
        });
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const json = {
                page: 1,
                limit: 1,
                search: {
                    _id: urlId,

                }
            };

            const res = await HitApi(json, searchUser);

            if (res?.statusCode == 200) {
                const userData = res.data?.docs?.[0];


                dispatch(setApiJson({
                    name: userData.name || '',
                    email: userData.email || '',
                    roleId: userData.roleId?._id || userData.roleId || '',
                    phoneNumber: userData.phoneNumber || '',
                    username: userData.username || '',
                    gender: userData.gender || '',
                    img: userData.img || '',
                    userType: userData?.userType,
                    unitIds: userData?.unitIds,
                    salary: userData?.salary,
                    weekOff: userData?.weekOff,
                    workingHours: userData?.workingHours,
                    target: userData?.target,
                    deviceMacAddress: userData?.deviceMacAddress,
                    pin: userData?.pin || '',
                    status: userData?.status || 'Active',
                    tdsEligible: userData?.tdsEligible || false,
                    tdsPercentage: userData?.tdsPercentage || '',
                    section: userData?.section || '',
                    designation: userData?.designation || '',

                }));

                dispatch(setApiErrorJson({}));
            } else {
            }
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        const roleTypeOptions = CheckDropdownValue();
        try {
            const json = {
                page: 1,
                limit: 50,
                search: {
                    roleType: roleTypeOptions.map(option => option.value)
                }
            };
            const res = await HitApi(json, searchRole);



            if (res && res.data.docs && Array.isArray(res.data.docs)) {
                const options = res.data.docs.map(role => ({
                    value: role._id,
                    label: role.roleName
                }));
                setRoleOptions(options);
            }
        } catch (error) {
        }
    };

    const fetchUnit = async () => {
        console.log("user", user);

        const options = user?.unitIds?.map(role => ({
            value: role._id,
            label: role.unitName
        }));
        setUnitOptions(options);
    }

    const handleRevokeMacAddress = async () => {
        if (!window.confirm('Are you sure you want to revoke the MAC address? The user will need to register their device again.')) {
            return;
        }

        setRevokeLoading(true);
        try {
            const revokeData = {
                _id: urlId,
                deviceMacAddress: null
            };

            const response = await HitApi(revokeData, updateUser);

            if (response?.statusCode === 200) {
                toast.success('MAC address revoked successfully!');
                // Update the local state
                dispatch(setApiJson({
                    ...ApiReducer.apiJson,
                    deviceMacAddress: null
                }));
            } else {
                toast.error(response?.message || 'Failed to revoke MAC address.');
            }
        } catch (error) {
            console.error('Error revoking MAC address:', error);
            toast.error('Error revoking MAC address. Please try again.');
        } finally {
            setRevokeLoading(false);
        }
    };

    if (loading && isEditMode) {
        return (
            <div className='p-5'>
                <div className="flex justify-center items-center h-64">
                    <div className="text-lg">Loading user data...</div>
                </div>
            </div>
        );
    }



    return (
        <div className='p-5'>
            <PageHeader
                title={isEditMode ? 'Update User' : 'Add New User'}
                description={isEditMode ? 'Update user account information' : 'Create a new user account in the system'}
            />
            <div className="bg-white p-8 border rounded-xl mb-6">
                <div className="text-lg font-medium mb-5 flex justify-between items-center">
                    <span>User Information</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                        title="Email"
                        placeholder="Enter email address"
                        name="email"
                        important={true}
                        error={hasError('email', ApiReducer)}
                        errormsg={getErrorMsg('email', ApiReducer)}
                        type="email"
                        disabled={submitLoading}
                    />
                    <AppInput
                        title="Username"
                        placeholder="Enter Username"
                        name="username"
                        disabled={submitLoading}
                    />

                    <AppSelect
                        title="Gender"
                        name="gender"
                        options={genderOptions}
                        placeholder="Select gender"
                        disabled={submitLoading}
                    />
                    <AppInput
                        title="Contact Number"
                        placeholder="Enter contact number"
                        name="phoneNumber"
                        important={true}
                        error={hasError('phoneNumber', ApiReducer)}
                        errormsg={getErrorMsg('phoneNumber', ApiReducer)}
                        disabled={submitLoading}
                    />
                    <SearchableSelect
                        title="Role"
                        name="roleId"
                        options={roleOptions}
                        important={true}
                        error={hasError('roleId', ApiReducer)}
                        errormsg={getErrorMsg('roleId', ApiReducer)}
                        icon={<Shield size={18} />}
                        placeholder="Select a role"
                        searchSlelect={searchSlelect}
                        disabled={submitLoading}
                    />
                    <SearchableSelect
                        title="User Type"
                        name="userType"
                        options={getUserType()}
                        important={true}
                        error={hasError('userType', ApiReducer)}
                        errormsg={getErrorMsg('userType', ApiReducer)}
                        icon={<Shield size={18} />}
                        placeholder="Select a user type"
                        searchSlelect={searchSlelect}
                        disabled={submitLoading}
                    />
                    <MultiSelect
                        title="Units"
                        name="unitIds"
                        options={unitOptions}
                        important={true}
                        searchSlelect={searchSlelect}
                        error={hasError('unitIds', ApiReducer)}
                        errormsg={getErrorMsg('unitIds', ApiReducer)}
                        placeholder="Select units"
                    />
                    <AppInput
                        title="Salary Amount (₹)"
                        placeholder="Enter salary amount (₹)"
                        name="salary"
                        error={hasError('salary', ApiReducer)}
                        errormsg={getErrorMsg('salary', ApiReducer)}
                        disabled={submitLoading}
                        type={"number"}
                        num
                    />
                    <AppSelect
                        title="Week off"
                        name="weekOff"
                        options={weekOff}
                        placeholder="Select off day"
                        disabled={submitLoading}
                    />
                    <AppSelect
                        title="Working Hours"
                        name="workingHours"
                        options={workingHours}
                        placeholder="Select working hrs"
                        disabled={submitLoading}
                    />
                    <AppInput
                        title="Target"
                        placeholder="Enter target"
                        name="target"
                        error={hasError('target', ApiReducer)}
                        errormsg={getErrorMsg('target', ApiReducer)}
                        disabled={submitLoading}
                        type={"number"}
                        num
                    />

                    <AppInput
                        title="6-Digit PIN"
                        placeholder="Enter 6-digit PIN"
                        name="pin"
                        error={hasError('pin', ApiReducer)}
                        errormsg={getErrorMsg('pin', ApiReducer)}
                        disabled={submitLoading}
                        type={"password"}
                        maxLength={6}
                        num
                    />

                    <AppSelect
                        title="Status"
                        name="status"
                        options={statusOptions}
                        placeholder="Select status"
                        important={true}
                        error={hasError('status', ApiReducer)}
                        errormsg={getErrorMsg('status', ApiReducer)}
                        disabled={submitLoading}
                    />

                    <div className='flex items-center gap-2'>
                        <AppSwitch
                            title="TDS Eligible"
                            name="tdsEligible"
                            disabled={submitLoading}
                        />
                    </div>

                    {ApiReducer?.apiJson?.tdsEligible && (
                        <AppInput
                            title="TDS Percentage"
                            placeholder="Enter TDS percentage"
                            name="tdsPercentage"
                            error={hasError('tdsPercentage', ApiReducer)}
                            errormsg={getErrorMsg('tdsPercentage', ApiReducer)}
                            disabled={submitLoading}
                            type={"number"}
                            num
                        />
                    )}


                    {!isEditMode && (
                        <AppInput
                            title="Password"
                            placeholder="Enter password"
                            name="password"
                            important={true}
                            disabled={submitLoading}
                            error={hasError('password', ApiReducer)}
                            errormsg={getErrorMsg('password', ApiReducer)}
                        />
                    )}

                    <AppSelect
                        title="Section"
                        name="section"
                        options={sectionOptions}
                        placeholder="Select Section"
                        disabled={submitLoading}
                    />
                    <AppSelect
                        title="Designation"
                        name="designation"
                        options={designationOptions}
                        placeholder="Select Designation"
                        disabled={submitLoading}
                    />
                </div>
                <FileuploadComp
                    title="Profile URL"
                    name="img"
                    allowed={["img"]}
                    disabled={submitLoading}
                />



                {isEditMode && (
                    <div className="border-t pt-6 mt-6">
                        <div className="text-lg font-medium mb-4 flex items-center gap-2">
                            <Smartphone size={20} />
                            <span>Device Management</span>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h4 className="font-medium text-gray-900 mb-2">Registered Device</h4>
                                    {ApiReducer?.apiJson?.deviceMacAddress ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <span className="text-sm text-gray-600">Device is registered</span>
                                            </div>
                                            <div className="bg-white rounded p-3 border">
                                                <div className="text-xs text-gray-500 mb-1">MAC Address:</div>
                                                <div className="font-mono text-sm text-gray-900">
                                                    {ApiReducer?.apiJson?.deviceMacAddress}
                                                </div>
                                            </div>
                                            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                                                <div className="flex items-start gap-2">
                                                    <AlertTriangle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                                                    <div className="text-sm text-yellow-800">
                                                        <p className="font-medium mb-1">Revoke Device Access</p>
                                                        <p className="text-xs">
                                                            This will remove the registered device and require the user to register their device again for attendance tracking.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                                <span className="text-sm text-gray-600">No device registered</span>
                                            </div>
                                            <div className="bg-blue-50 border border-blue-200 rounded p-3">
                                                <div className="text-sm text-blue-800">
                                                    User needs to register their device for attendance tracking.
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {ApiReducer?.apiJson?.deviceMacAddress && (
                                    <div className="ml-4">
                                        <button
                                            onClick={handleRevokeMacAddress}
                                            disabled={revokeLoading || submitLoading}
                                            className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                        >
                                            {revokeLoading ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    <span>Revoking...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <AlertTriangle size={16} />
                                                    <span>Revoke Device</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className='mt-5 flex justify-end'>
                    <AppButton
                        buttontext={submitLoading ? "Processing..." : (isEditMode ? "Update User" : "Add User")}
                        onClick={handleSubmit}
                        disabled={submitLoading}
                        isLoading={submitLoading}
                    />
                </div>
            </div>
        </div>
    );
}

export default AddUser;
