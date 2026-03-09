import React, { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import { HitApi } from '../../Api/ApiHit';
import { searchRole } from '../../constant/Constant';
import { useDispatch } from 'react-redux';
import { setApiJson } from '../../redux/Actions/ApiAction';
import AddRole from './AddRole';

function EditRole() {
    const dispatch = useDispatch()
    const { id: urlId } = useParams();
    useEffect(() => {
        if (urlId) {
            fetchRole()
        }
    }, [])

    const fetchRole = () => {
        let json = {
            page: 1,
            limit: 1,
            search: {
                _id: urlId
            }
        }
        HitApi(json, searchRole).then((res) => {
            if (res?.data?.docs?.length > 0) {
                let temp = {
                    role: res?.data?.docs?.[0]?.roleName,
                    roleType: res?.data?.docs?.[0]?.roleType,
                    status: "active"
                }
                dispatch(setApiJson(temp))


            }


        })

    }


    return (
        <div>
            <AddRole editMode={true} />
        </div>
    )
}

export default EditRole
