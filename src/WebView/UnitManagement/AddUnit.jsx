import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../PageHeader/PageHeader'
import AppButton from '../../components/AppButton/AppButton';
import AppInput from '../../components/AppInput/AppInput';
import { useSelector, useDispatch } from 'react-redux';
import { Building, Hash, MapPin, Zap, Home, Mail, Phone, FileText, Navigation } from 'lucide-react';
import { setApiErrorJson, setApiJson } from '../../redux/Actions/ApiAction';
import { UnitValidationSchema } from '../../validationscheema/UnitValidation';
import { HitApi } from '../../Api/ApiHit';
import { statusOptions } from '../../constant/Options';
import { addUnit, searchUnit, updateUnit } from '../../constant/Constant';
import SearchableSelect from '../../components/AppSelect/SearchableSelect';
import toast from 'react-hot-toast';
import { getErrorMsg, hasError } from '../../utils/utils';

function AddUnit() {
    const [isEditMode, setIsEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);

    const ApiReducer = useSelector((state) => state.ApiReducer);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const url = window.location.pathname;
    const urlId = url.split('/')[3];

    const generateRandomUnitCode = () => {
        const randomNumber = Math.floor(Math.random() * 9999) + 1;
        const formattedNumber = randomNumber.toString().padStart(4, '0');
        return `UNIT${formattedNumber}`;
    };

    useEffect(() => {
        const initialUnitData = {
            unitName: "",
            unitCode: generateRandomUnitCode(),
            address: "",
            status: '',
            electricity: "",
            rent: "",
            gst: "",
            email: "",
            phone: "",
            priceAreInclusiveTaxes: true,
            gstPercentage: 5,
            lat: "",
            lng: "",
        };

        if (urlId) {
            setIsEditMode(true);
            loadData();
        } else {
            dispatch(setApiJson(initialUnitData));
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

            const res = await HitApi(json, searchUnit);

            if (res?.statusCode === 200) {
                const unitData = res?.data?.docs?.[0];

                if (unitData) {
                    dispatch(setApiJson(unitData));
                    dispatch(setApiErrorJson({}));
                } else {
                    toast.error('Unit not found');
                }
            } else {
                toast.error('Failed to load unit data');
            }
        } catch (error) {
            toast.error('Error loading unit data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = () => {
        setSubmitLoading(true);

        UnitValidationSchema(ApiReducer?.apiJson).then((errors) => {
            dispatch(setApiErrorJson(errors));

            if (Object.keys(errors).length === 0) {
                const unitData = { ...ApiReducer.apiJson };

                if (isEditMode) {
                    HitApi(unitData, updateUnit).then((res) => {
                        setSubmitLoading(false);
                        if (res?.statusCode === 200) {
                            toast.success('Unit updated successfully!');
                            setTimeout(() => {
                                navigate('/unit');
                            }, 1000);
                        } else {
                            toast.error(res?.message || "Failed to update unit. Please try again.");
                        }
                    }).catch((error) => {
                        setSubmitLoading(false);
                        toast.error("Error updating unit. Please try again.");
                    });
                } else {
                    HitApi(unitData, addUnit).then((res) => {
                        setSubmitLoading(false);
                        if (res?.statusCode === 201) {
                            toast.success('Unit created successfully!');
                            setTimeout(() => {
                                navigate('/unit');
                            }, 1000);
                        } else {
                            toast.error(res?.message || "Failed to create unit. Please try again.");
                        }
                    }).catch((error) => {
                        setSubmitLoading(false);
                    });
                }
            } else {
                setSubmitLoading(false);
            }
        }).catch((validationError) => {
            setSubmitLoading(false);
        });
    }

    if (loading && isEditMode) {
        return (
            <div className='p-5'>
                <div className="flex justify-center items-center h-64">
                    <div className="text-lg">Loading unit data...</div>
                </div>
            </div>
        );
    }

    return (
        <div className='p-5'>
            <PageHeader
                title={isEditMode ? 'Edit Unit' : 'Add Unit'}
                description={isEditMode ? 'Update existing unit configuration' : 'Create and configure new organizational unit'}
            />

            <div className="bg-white p-8 border rounded-xl mb-6">
                <div className="text-lg font-medium mb-5 flex justify-between items-center">
                    <span>Unit Information</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <AppInput
                        title="Unit Code"
                        placeholder="Auto-generated"
                        name="unitCode"
                        disabled={true}
                        important={true}
                        icon={<Hash size={18} />}
                    />
                    <AppInput
                        title="Unit Name"
                        placeholder="e.g., Marketing Department"
                        name="unitName"
                        important={true}
                        error={hasError('unitName', ApiReducer)}
                        errormsg={getErrorMsg('unitName', ApiReducer)}
                        icon={<Building size={18} />}
                        disabled={submitLoading}
                    />
                    <AppInput
                        title="Address"
                        placeholder="e.g., Building A, Floor 3"
                        name="address"
                        important={true}
                        error={hasError('address', ApiReducer)}
                        errormsg={getErrorMsg('address', ApiReducer)}
                        icon={<MapPin size={18} />}
                        disabled={submitLoading}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <AppInput
                        title="Electricity Cost"
                        placeholder="e.g., 5000"
                        name="electricity"
                        type="number"
                        important={true}
                        error={hasError('electricity', ApiReducer)}
                        errormsg={getErrorMsg('electricity', ApiReducer)}
                        icon={<Zap size={18} />}
                        disabled={submitLoading}
                    />
                    <AppInput
                        title="Rent Amount"
                        placeholder="e.g., 25000"
                        name="rent"
                        type="number"
                        important={true}
                        error={hasError('rent', ApiReducer)}
                        errormsg={getErrorMsg('rent', ApiReducer)}
                        icon={<Home size={18} />}
                        disabled={submitLoading}
                    />
                    <SearchableSelect
                        title="Status"
                        name="status"
                        options={statusOptions}
                        important={true}
                        error={hasError('status', ApiReducer)}
                        errormsg={getErrorMsg('status', ApiReducer)}
                        disabled={submitLoading}
                        placeholder="Select status"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <AppInput
                        title="GST Number"
                        placeholder="e.g., 22AAAAA0000A1Z5"
                        name="gst"
                        important={false}
                        error={hasError('gst', ApiReducer)}
                        errormsg={getErrorMsg('gst', ApiReducer)}
                        icon={<FileText size={18} />}
                        disabled={submitLoading}
                    />
                    <AppInput
                        title="Email"
                        placeholder="e.g., unit@company.com"
                        name="email"
                        type="email"
                        important={false}
                        error={hasError('email', ApiReducer)}
                        errormsg={getErrorMsg('email', ApiReducer)}
                        icon={<Mail size={18} />}
                        disabled={submitLoading}
                    />
                    <AppInput
                        title="Phone Number"
                        placeholder="e.g., +91 9876543210"
                        name="phone"
                        type="tel"
                        important={false}
                        error={hasError('phone', ApiReducer)}
                        errormsg={getErrorMsg('phone', ApiReducer)}
                        icon={<Phone size={18} />}
                        disabled={submitLoading}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <Zap size={18} className="mr-2" />
                            Prices Include Taxes
                        </label>
                        <div className="flex items-center mt-2">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={ApiReducer?.apiJson?.priceAreInclusiveTaxes || false}
                                    onChange={(e) => {
                                        dispatch(setApiJson({
                                            ...ApiReducer.apiJson,
                                            priceAreInclusiveTaxes: e.target.checked
                                        }));
                                    }}
                                    disabled={submitLoading}
                                    className="sr-only"
                                />
                                <div className={`w-11 h-6 rounded-full shadow-inner transition-colors duration-200 ease-in-out ${
                                    ApiReducer?.apiJson?.priceAreInclusiveTaxes ? 'bg-blue-600' : 'bg-gray-300'
                                } ${submitLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${
                                        ApiReducer?.apiJson?.priceAreInclusiveTaxes ? 'transform translate-x-5' : ''
                                    }`}></div>
                                </div>
                                <span className={`ml-3 text-sm ${ApiReducer?.apiJson?.priceAreInclusiveTaxes ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                                    {ApiReducer?.apiJson?.priceAreInclusiveTaxes ? 'Inclusive' : 'Exclusive'}
                                </span>
                            </label>
                        </div>
                    </div>

                    <SearchableSelect
                        title="GST Percentage"
                        name="gstPercentage"
                        options={[
                            { label: '5%', value: 5 },
                            { label: '12%', value: 12 },
                            { label: '18%', value: 18 }
                        ]}
                        important={false}
                        error={hasError('gstPercentage', ApiReducer)}
                        errormsg={getErrorMsg('gstPercentage', ApiReducer)}
                        disabled={submitLoading}
                        placeholder="Select GST percentage"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <AppInput
                        title="Latitude"
                        placeholder="e.g., 28.613917123456"
                        name="lat"
                        type="number"
                        step="0.000000000001"
                        important={false}
                        error={hasError('lat', ApiReducer)}
                        errormsg={getErrorMsg('lat', ApiReducer)}
                        icon={<Navigation size={18} />}
                        disabled={submitLoading}
                    />
                    <AppInput
                        title="Longitude"
                        placeholder="e.g., 77.209012345678"
                        name="lng"
                        type="number"
                        step="0.000000000001"
                        important={false}
                        error={hasError('lng', ApiReducer)}
                        errormsg={getErrorMsg('lng', ApiReducer)}
                        icon={<Navigation size={18} />}
                        disabled={submitLoading}
                    />
                </div>
                <div className='mt-5 flex justify-end'>
                    <AppButton
                        buttontext={submitLoading ? "Processing..." : (isEditMode ? "Update Unit" : "Add Unit")}
                        onClick={handleSubmit}
                        disabled={submitLoading}
                        isLoading={submitLoading}
                    />
                </div>
            </div>
        </div>
    )
}

export default AddUnit
