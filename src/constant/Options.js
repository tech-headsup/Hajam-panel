import { addAdvertisement, addAttendance, addBilling, addBooking, addCart, addChild, addClient, addGeneralMaster, addInventory, addMedia, addMembership, addOrder, addPackage, addParent, addProduct, addRole, addSeat, addStaff, addUnit, addUser, addVendor, deleteAdvertisement, deleteAttendance, deleteBilling, deleteCart, deleteChild, deleteClient, deleteFile, deleteGeneralMaster, deleteInventory, deleteMedia, deleteMembership, deleteOrder, deletePackage, deleteParent, deleteProduct, deleteRole, deleteSeat, deleteStaff, deleteUnit, deleteUser, deleteVendor, graphql, login, MembershipBulkUpload, ParentBulkUpload, ProductBulkUpload, searchAdvertisement, searchAttendance, searchBilling, searchBooking, searchCart, searchChild, searchClient, searchFiles, searchGeneralMaster, searchInventory, searchMedia, searchMembership, searchOrder, searchPackage, searchParent, searchProduct, searchRole, searchSeat, searchSpecialists, searchStaff, searchUnit, searchUser, searchVendor, sendOtp, StaffBulkUpload, updateAdvertisement, updateAttendance, updateBilling, updateChild, updateClient, updateGeneralMaster, updateInventory, updateMedia, updateMembership, updateOrder, updatePackage, updateParent, updateProduct, updateRole, updateSeat, updateStaff, updateUnit, updateUser, updateVendor, uploadSingle, verifyOtp } from "../redux/Reducers/RoleAndPermissionReducer/Endpoints";
import { getElevateUser } from "../storage/Storage";

export const brandOptions = [
    { value: "loreal", label: "L'Oréal" },
    { value: "olaplex", label: "Olaplex" },
    { value: "redken", label: "Redken" },
    { value: "schwarzkopf", label: "Schwarzkopf" },
    { value: "wella", label: "Wella" },
    { value: "matrix", label: "Matrix" },
    { value: "paul-mitchell", label: "Paul Mitchell" },
    { value: "kerastase", label: "Kérastase" },
    { value: "tigi", label: "TIGI" },
    { value: "moroccan-oil", label: "Moroccan Oil" },
    { value: "other", label: "Other" }
];

export const genderOptions = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Other", label: "Other" }
];

export const sectionOptions = [
    { value: "1", label: "Section1" },
    { value: "2", label: "Section2" },
    { value: "3", label: "Section3" },
    { value: "4", label: "Section4" },
    { value: "5", label: "Section5" },
    { value: "6", label: "Section6" },
    { value: "7", label: "Section7" },
    { value: "8", label: "Section8" },
    { value: "9", label: "Section9" },
    { value: "10", label: "Section10" },
];

export const designationOptions = [
    { value: "manager", label: "Manager" },
    { value: "hair_dresser", label: "Hair Dresser" },
    { value: "senior_stylist", label: "Senior Stylist" },
    { value: "junior_stylist", label: "Junior Stylist" },
    { value: "beautician", label: "Beautician" },
    { value: "makeup_artist", label: "Makeup Artist" },
    { value: "nail_technician", label: "Nail Technician" },
    { value: "spa_therapist", label: "Spa Therapist" },
    { value: "receptionist", label: "Receptionist" },
    { value: "helper", label: "Helper" },
];

export const weekOff = [
    { value: "sunday", label: "Sunday" },
    { value: "monday", label: "Monday" },
    { value: "tuesday", label: "Tuesday" },
    { value: "wednesday", label: "Wednesday" },
    { value: "thursday", label: "Thursday" },
    { value: "friday", label: "Friday" },
    { value: "saturday", label: "Saturday" }
];

export const workingHours = [
    { value: "8", label: "8 Hours" },
    { value: "9", label: "9 Hours" },
    { value: "10", label: "10 Hours" },
    { value: "12", label: "12 Hours" }
];

export const statusOptions = [
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" }
];

export const userTypeOptions = [
    { value: "SuperAdmin", label: "Super Admin", },
    { value: "Admin", label: "Admin" },
    { value: "Manager", label: "Manager" },
    { value: "Staff", label: "Staff" }
];

export const roleTypeOptions = [
    { value: "SuperAdmin", label: "Super Admin", },
    { value: "Admin", label: "Admin" },
    { value: "Manager", label: "Manager" },
    { value: "Staff", label: "Staff" }
];

export const checkType = [
    { value: "SuperAdmin", label: "Super Admin", dropdownValue: ["Admin", "Manager", "Staff"] },
    { value: "Admin", label: "Admin", dropdownValue: ["Manager", "Staff"] },
    { value: "Manager", label: "Manager", dropdownValue: ["Staff"] },
]

export const CheckDropdownValue = () => {
    const loginRoleType = getElevateUser()?.roleData?.roleType;
    console.log("loginRoleType", loginRoleType);
    const dropdownRoles = checkType.find(
        (item) => item.value.toLowerCase() === loginRoleType?.toLowerCase()
    )?.dropdownValue || [];

    return dropdownRoles.map(role => ({ label: role, value: role }));
};

export const getUserType = () => {
    const loginUserType = getElevateUser()?.userType;
    console.log("loginUserType", loginUserType);

    const position = userTypeOptions.findIndex(obj => obj.value === loginUserType);

    if (position === -1 || position === userTypeOptions.length - 1) return [];

    return userTypeOptions.slice(position + 1);
};


export const SeperAdmiinPermission = () =>

    [
        {
            value: "dashboard",
            url: [],
            permission: [
                {
                    read: { allowed: true, url: [searchBilling, searchRole, searchGeneralMaster] },
                    write: { allowed: true, url: [searchBilling, searchRole, searchGeneralMaster] },
                    delete: { allowed: true, url: [searchBilling, searchRole, searchGeneralMaster] },
                }
            ],
            child: []
        },
        {
            value: "quicksale",
            url: [],
            permission: [
                {
                    read: { allowed: true, url: [searchUser, searchRole, searchUnit, searchGeneralMaster, searchProduct, searchClient, updateClient, addBilling, updateBilling, searchChild, searchParent, searchMembership, searchPackage] },
                    write: { allowed: true, url: [searchRole, searchUnit, searchGeneralMaster, searchBilling, searchClient] },
                    delete: { allowed: true, url: [searchRole, searchUnit, searchGeneralMaster, searchBilling, searchClient] },
                }
            ],
            child: []
        },
        {
            value: "bills",
            url: [],
            permission: [
                {
                    read: { allowed: true, url: [searchRole, searchUnit, searchGeneralMaster, searchBilling, searchClient] },
                    write: { allowed: true, url: [searchRole, searchUnit, searchGeneralMaster, searchBilling, searchClient] },
                    delete: { allowed: true, url: [searchRole, searchUnit, searchGeneralMaster, searchBilling, searchClient] },
                }
            ],
            child: []
        },
        {
            value: "user",
            url: [],
            permission: [
                {
                    read: { allowed: true, url: [searchUser, searchRole, searchUnit] },
                    write: { allowed: true, url: [addUser, updateUser, searchGeneralMaster, uploadSingle] },
                    delete: { allowed: true, url: [deleteUser] },
                }
            ],
            child: []
        },
        {
            value: "client",
            url: [],
            permission: [
                {
                    read: { allowed: true, url: [searchClient, searchRole, searchUnit] },
                    write: { allowed: true, url: [addClient, updateClient, searchGeneralMaster, uploadSingle] },
                    delete: { allowed: true, url: [deleteClient] },
                }
            ],
            child: []
        },
        {
            value: "unit",
            url: [],
            permission: [
                {
                    read: { allowed: true, url: [searchUnit, searchRole] },
                    write: { allowed: true, url: [addUnit, updateUnit, searchGeneralMaster, uploadSingle] },
                    delete: { allowed: true, url: [deleteUnit] },
                }
            ],
            child: []
        },
        {
            value: "vendor",
            url: [],
            permission: [
                {
                    read: { allowed: true, url: [searchVendor, searchRole, searchUnit] },
                    write: { allowed: true, url: [addVendor, updateVendor, searchGeneralMaster, uploadSingle] },
                    delete: { allowed: true, url: [deleteVendor] },
                }
            ],
            child: []
        },
        {
            value: "seat",
            url: [],
            permission: [
                {
                    read: { allowed: true, url: [searchSeat, searchRole, searchUnit] },
                    write: { allowed: true, url: [addSeat, updateSeat, graphql, searchGeneralMaster, uploadSingle] },
                    delete: { allowed: true, url: [deleteSeat] },
                }
            ],
            child: []
        },
        {
            value: "inventory",
            url: [],
            permission: [
                {
                    read: { allowed: true, url: [searchInventory, searchOrder, searchRole, searchUnit, searchGeneralMaster] },
                    write: { allowed: true, url: [addInventory, addOrder, updateOrder, updateInventory, uploadSingle] },
                    delete: { allowed: true, url: [deleteOrder, deleteInventory] },
                }
            ],
            child: []
        },
        {
            value: "rolesAndPermissions",
            url: [],
            permission: [
                {
                    read: { allowed: true, url: [searchRole, searchUnit] },
                    write: { allowed: true, url: [addRole, updateRole] },
                    delete: { allowed: true, url: [deleteRole] },
                }
            ],
            child: []
        },
        {
            value: "product",
            url: [],
            permission: [
                {
                    read: { allowed: true, url: [searchProduct, searchRole, searchUnit] },
                    write: { allowed: true, url: [addProduct, updateProduct, ProductBulkUpload, uploadSingle, searchGeneralMaster, uploadSingle] },
                    delete: { allowed: true, url: [deleteProduct] },
                }
            ],
            child: []
        },
        {
            value: "staff",
            url: [],
            permission: [
                {
                    read: { allowed: true, url: [searchAttendance, addAttendance, updateAttendance, searchUnit, searchRole, searchGeneralMaster] },
                    write: { allowed: true, url: [searchAttendance, addAttendance, updateAttendance,] },
                    delete: { allowed: true, url: [deleteAttendance] },
                }
            ],
            child: []
        },
        {
            value: "services",
            url: [],
            permission: [
                {
                    read: { allowed: true, url: [searchParent, searchChild, searchRole, searchUnit] },
                    write: { allowed: true, url: [addParent, updateParent, ParentBulkUpload, addChild, updateChild, searchGeneralMaster, searchUser, uploadSingle, searchProduct] },
                    delete: { allowed: true, url: [deleteParent, deleteChild] },
                }
            ],
            child: []
        },
    ];

export const dashboardOptions = [
    { value: 'today', label: 'Today' },
    { value: 'currentWeek', label: 'Weekly' },
    { value: 'currentMonth', label: 'Monthly' },
    { value: 'hourly', label: 'Hourly' },
];
