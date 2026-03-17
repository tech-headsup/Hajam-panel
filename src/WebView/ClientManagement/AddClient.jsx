import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../PageHeader/PageHeader'
import AppButton from '../../components/AppButton/AppButton';
import AppInput from '../../components/AppInput/AppInput';
import { useDispatch, useSelector } from 'react-redux';
import { User } from 'lucide-react';
import AppSelect from '../../components/AppSelect/AppSelect';
import { ageGroupOptions, customerTypeOptions, genderOptions } from '../../constant/Options';
import { ClientValidationScheema } from '../../validationscheema/ClientValidation';
import { addClient, updateClient, searchClient } from '../../constant/Constant';
import { HitApi } from '../../Api/ApiHit';
import { setApiErrorJson, setApiJson } from '../../redux/Actions/ApiAction';
import { getSelectedUnit } from '../../storage/Storage';
import SearchableSelect from '../../components/AppSelect/SearchableSelect';
import FileuploadComp from '../../components/SingleFileUpload/FileuploadComp';
import toast from 'react-hot-toast';
import { getErrorMsg, hasError } from '../../utils/utils';

function AddClient() {
    const [isEditMode, setIsEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const ApiReducer = useSelector((state) => state.ApiReducer);
    const getUnit = getSelectedUnit()

    const dispatch = useDispatch()
    const navigate = useNavigate();

    const url = window.location.pathname;
    const urlId = url.split('/')[3];

    useEffect(() => {
        const initialClientData = {
            name: "",
            phoneNumber: "",
            gender: "",
            ageGroup: "",
            img: ""
        };

        if (urlId) {
            setIsEditMode(true);
            loadData();
        } else {
            dispatch(setApiJson(initialClientData));
            dispatch(setApiErrorJson({}));
        }
    }, [dispatch, urlId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const json = {
                page: 1,
                limit: 10,
                search: {
                    _id: urlId
                }
            };

            const res = await HitApi(json, searchClient);

            if (res?.statusCode === 200) {
                const clientData = res?.data?.docs?.[0];

                if (clientData) {
                    dispatch(setApiJson(clientData));
                    dispatch(setApiErrorJson({}));
                } else {
                    toast.error('Client not found');
                }
            } else {
                toast.error('Failed to load client data');
            }
        } catch (error) {
            toast.error('Error loading client data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = () => {
        setSubmitLoading(true);

        ClientValidationScheema(ApiReducer?.apiJson, isEditMode).then((errors) => {
            dispatch(setApiErrorJson(errors));

            if (Object.keys(errors).length === 0) {
                const clientData = { ...ApiReducer.apiJson, unitIds: getUnit?._id };

                if (isEditMode) {
                    clientData._id = urlId;

                    HitApi(clientData, updateClient).then((res) => {
                        setSubmitLoading(false);
                        if (res?.statusCode === 200) {
                            toast.success('Client updated successfully!');
                            setTimeout(() => {
                                navigate('/client');
                            }, 1000);
                        } else {
                            toast.error(res?.message || 'Failed to update client. Please try again.');
                        }
                    }).catch((error) => {
                        setSubmitLoading(false);
                        toast.error('Error updating client. Please try again.');
                    });
                } else {
                    HitApi(clientData, addClient).then((res) => {
                        setSubmitLoading(false);
                        if (res?.statusCode === 201) {
                            toast.success('Client created successfully!');
                            setTimeout(() => {
                                navigate('/client');
                            }, 1000);
                        } else {
                            toast.error(res?.message || 'Failed to create client. Please try again.');
                        }
                    }).catch((error) => {
                        setSubmitLoading(false);
                        toast.error('Error creating client. Please try again.');
                    });
                }
            } else {
                setSubmitLoading(false);
            }
        }).catch((error) => {
            setSubmitLoading(false);
        });
    };

    if (loading && isEditMode) {
        return (
            <div className='p-5'>
                <div className="flex justify-center items-center h-64">
                    <div className="text-lg">Loading client data...</div>
                </div>
            </div>
        );
    }

    return (
        <div className='p-5'>
            <div>
                <PageHeader
                    title={isEditMode ? 'Update Client' : 'Add New Client'}
                    description={isEditMode ? 'Update client account information' : 'Create a new client account in the system'}
                />
                <div className="bg-white p-8 border rounded-xl mb-6">
                    <div className="text-lg font-medium mb-5 flex justify-between items-center">
                        <span>Client Information</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                        <AppInput
                            title="Full Name"
                            placeholder="Enter full name"
                            name="name"
                            important={true}
                            error={hasError('name', ApiReducer)}
                            errormsg={getErrorMsg('name', ApiReducer)}
                            icon={<User size={18} />}
                            disabled={submitLoading}
                            str
                        />
                        <AppInput
                            title="Contact Number"
                            placeholder="Enter contact number"
                            name="phoneNumber"
                            important={true}
                            error={hasError('phoneNumber', ApiReducer)}
                            disabled={submitLoading}
                            num
                            maxLength={10}
                        />
                        <AppSelect
                            title="Client Type"
                            name="customerType"
                            options={customerTypeOptions}
                            important={false}
                            error={hasError('customerType', ApiReducer)}
                            placeholder="Select client type"
                        />
                        <AppInput
                            title="Email"
                            placeholder="Enter email address"
                            name="email"
                            type="email"
                            disabled={submitLoading}
                            error={hasError('email', ApiReducer)}
                            errormsg={getErrorMsg('email', ApiReducer)}
                        />
                        <AppInput
                            title="Unpaid Amount"
                            placeholder="Enter unpaid amount"
                            name="unpaidAmt"
                            type="number"
                            disabled={submitLoading}
                            num
                        />
                        <AppInput
                            title="Total Visit"
                            placeholder="Enter number of visits"
                            name="totalVisit"
                            type="number"
                            min="0"
                            disabled={submitLoading}
                            num
                        />
                        <AppInput
                            title="Last Visit"
                            placeholder="Select last visit date"
                            name="lastVisit"
                            type="date"
                            disabled={submitLoading}
                        />
                        <AppInput
                            title="Reward points"
                            placeholder="Enter reward points"
                            name="points"
                            type="number"
                            min="0"
                            disabled={submitLoading}
                            num
                        />
                        <AppInput
                            title="Address"
                            placeholder="Enter address"
                            name="address"
                            disabled={submitLoading}
                        />
                        <SearchableSelect
                            title="Gender"
                            name="gender"
                            options={genderOptions}
                            important={false}
                            placeholder="Select gender"
                            disabled={submitLoading}
                        />
                        <SearchableSelect
                            title="Age Group"
                            name="ageGroup"
                            options={ageGroupOptions}
                            important={false}
                            placeholder="Select age group"
                            disabled={submitLoading}
                        />

                    </div>
                    <FileuploadComp
                        title="Profile URL"
                        name="img"
                        allowed={["img"]}
                        disabled={submitLoading}
                    />
                    <div className='mt-5 flex justify-end'>
                        <AppButton
                            buttontext={submitLoading ? "Processing..." : (isEditMode ? "Update Client" : "Add Client")}
                            onClick={handleSubmit}
                            disabled={submitLoading}
                            isLoading={submitLoading}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AddClient
