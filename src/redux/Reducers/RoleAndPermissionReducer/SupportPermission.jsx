import { addAttendance, addUser, deleteAttendance, deleteUser, searchAttendance, searchUser, updateAttendance, updateUser } from "./Endpoints";

export const CheckSupportPermission = (permissions = []) => {
    if (!Array.isArray(permissions) || permissions.length === 0) return [];

    return permissions.map((perm) => {
        const result = {};

        if (perm.value === "user" && Array.isArray(perm.permission)) {
            const userPerm = perm.permission[0];
            if (userPerm.read) {
                result.read = true;
                result.endpoints = [searchUser];
            }
            if (userPerm.write) {
                result.write = true;
                result.endpoints = [updateUser, addUser];
            }
            if (userPerm.delete) {
                result.delete = true;
                result.endpoints = [deleteUser];
            }
        }
        if (perm.value === "staff" && Array.isArray(perm.permission)) {
            const userPerm = perm.permission[0];
            if (userPerm.read) {
                result.read = true;
                result.endpoints = [searchAttendance,addAttendance,updateAttendance];
            }
            if (userPerm.write) {
                result.write = true;
                result.endpoints = [updateAttendance];
            }
            if (userPerm.delete) {
                result.delete = true;
                result.endpoints = [deleteAttendance];
            }
        }


        return result;
    }).filter(obj => Object.keys(obj).length > 0);
};
