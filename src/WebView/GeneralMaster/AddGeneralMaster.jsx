import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../PageHeader/PageHeader';
import AppInput from '../../components/AppInput/AppInput';
import { useSelector, useDispatch } from 'react-redux';
import { setApiErrorJson, setApiJson } from '../../redux/Actions/ApiAction';
import AppButton from '../../components/AppButton/AppButton';
import { Database, Tag, Settings } from 'lucide-react';
import AppSelect from '../../components/AppSelect/AppSelect';
import { GeneralMasterValidationSchema } from '../../validationscheema/GeneralMasterValidation';
import { usedByOption } from '../../constant/usedByOptions';
import { HitApi } from '../../Api/ApiHit';
import { addGeneralMaster, searchGeneralMaster, updateGeneralMaster } from '../../constant/Constant';
import toast from 'react-hot-toast';

function AddGeneralMaster() {
  const ApiReducer = useSelector((state) => state.ApiReducer);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id: urlId } = useParams();

  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const initialGeneralMasterData = {
      label: "",
      value: "",
      usedBy: "",
    };

    if (urlId) {
      setIsEditMode(true);
      loadData();
    } else {
      dispatch(setApiJson(initialGeneralMasterData));
      dispatch(setApiErrorJson({}));
    }
  }, [dispatch, urlId]);

  const handleSubmit = () => {
    setIsSubmitting(true);

    GeneralMasterValidationSchema(ApiReducer?.apiJson).then((errors) => {
      dispatch(setApiErrorJson(errors));

      if (Object.keys(errors).length === 0) {
        const generalMasterData = { ...ApiReducer.apiJson };

        if (isEditMode) {
          HitApi(generalMasterData, updateGeneralMaster).then((res) => {
            if (res?.statusCode === 200) {
              toast.success('General Master updated successfully!');
              navigate('/generalmaster');
            } else {
              toast.error(res?.message || "Failed to update general master");
            }
          }).catch((error) => {
            console.error("Update error:", error);
            toast.error("Error updating general master. Please try again.");
          }).finally(() => {
            setIsSubmitting(false);
          });
        } else {
          HitApi(generalMasterData, addGeneralMaster).then((res) => {
            if (res?.message === "General created successfully" || res?.success) {
              toast.success('General Master created successfully!');
              navigate('/generalmaster');
            } else {
              toast.error(res?.message || "Failed to create general master");
            }
          }).catch((error) => {
            console.error("Create error:", error);
            toast.error("Error creating general master. Please try again.");
          }).finally(() => {
            setIsSubmitting(false);
          });
        }
      } else {
        setIsSubmitting(false);
      }
    }).catch((validationError) => {
      console.error("Validation error:", validationError);
      setIsSubmitting(false);
    });
  };

  const loadData = () => {
    setIsLoadingData(true);
    var json = {
      page: 1,
      limit: 10,
      search: {
        _id: urlId
      }
    };
    
    HitApi(json, searchGeneralMaster).then((res) => {
      if (res?.statusCode === 200) {
        const generalMasterData = res?.data?.docs?.[0];
       
        if (generalMasterData) {
          dispatch(setApiJson(generalMasterData));
        } else {
          toast.error('General Master not found');
          navigate('/generalmaster');
        }
      } else {
        toast.error('Failed to load general master data');
        navigate('/generalmaster');
      }
    }).catch((error) => {
      console.error("Error loading data:", error);
      toast.error('Error loading general master data. Please try again.');
      navigate('/generalmaster');
    }).finally(() => {
      setIsLoadingData(false);
    });
  };

  if (isLoadingData) {
    return (
      <div className="p-5">
        <PageHeader 
          title={isEditMode ? 'Edit General Master' : 'Add General Master'} 
          description={isEditMode ? 'Update Master Data Information' : 'Create new master data entries'} 
        />
      </div>
    );
  }

  return (
    <div className="p-5">
      <PageHeader 
        title={isEditMode ? 'Edit General Master' : 'Add General Master'} 
        description={isEditMode ? 'Update Master Data Information' : 'Create new master data entries'} 
      />
      
      <div className="bg-white p-8 border rounded-xl mb-6">
        <div className="text-lg font-medium mb-5 flex justify-between items-center">
          <span>General Information</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <AppInput 
            title="Label" 
            placeholder="Enter Label" 
            name="label" 
            important={true}
            error={!ApiReducer?.apiJson?.label}
            uppercase
            icon={<Tag size={18} />}
            disabled={isSubmitting}
          />
          
          <AppInput 
            title="Value" 
            placeholder="Enter value" 
            name="value" 
            uppercase
            important={true} 
            error={!ApiReducer?.apiJson?.value}
            icon={<Database size={18} />}
            disabled={isSubmitting}
          />
          
          <AppSelect
            title="Used by"
            name="usedBy"
            options={usedByOption}
            important={true}
            error={!ApiReducer?.apiJson?.usedBy}
            icon={<Settings size={18} />}
            disabled={isSubmitting}
          />
        </div>

        <div className='mt-5 flex justify-end'>
          <AppButton 
            buttontext={isSubmitting ? "Processing..." : (isEditMode ? "Update General Master" : "Add General Master")} 
            onClick={handleSubmit}
            disabled={isSubmitting}
            isLoading={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
}

export default AddGeneralMaster;