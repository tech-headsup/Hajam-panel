import { searchCoupon, searchWallet } from "../../../constant/Constant";
import {
    addChild,
    addMembership,
    addPackage,
    addParent,
    addProduct,
    addRole,
    addStaff,
    addUser,
    addCart,
    addBooking,
    addAdvertisement,
    addMedia,
    deleteChild,
    deleteMembership,
    deletePackage,
    deleteParent,
    deleteProduct,
    deleteRole,
    deleteStaff,
    deleteUser,
    deleteCart,
    deleteAdvertisement,
    deleteMedia,
    deleteFile,
    searchChild,
    searchMembership,
    searchPackage,
    searchParent,
    searchProduct,
    searchRole,
    searchStaff,
    searchUser,
    searchCart,
    searchBooking,
    searchAdvertisement,
    searchMedia,
    searchFiles,
    searchSpecialists,
    updateChild,
    updateMembership,
    updatePackage,
    updateParent,
    updateProduct,
    updateRole,
    updateStaff,
    updateUser,
    updateAdvertisement,
    updateMedia,
    uploadSingle,
    login,
    sendOtp,
    verifyOtp,
    ProductBulkUpload,
    MembershipBulkUpload,
    ParentBulkUpload,
    StaffBulkUpload,
    searchGeneralMaster,
    addGeneralMaster,
    deleteGeneralMaster,
    updateGeneralMaster,
    searchClient,
    addClient,
    updateClient,
    deleteClient,
    searchUnit,
    addUnit,
    updateUnit,
    deleteUnit,
    searchVendor,
    addVendor,
    updateVendor,
    deleteVendor,
    searchSeat,
    addSeat,
    updateSeat,
    deleteSeat,
    graphql,
    searchAttendance,
    addAttendance,
    updateAttendance,
    deleteAttendance,
    searchInventory,
    searchOrder,
    addInventory,
    addOrder,
    updateOrder,
    updateInventory,
    deleteOrder,
    deleteInventory,
    searchBilling,
    addBilling,
    updateBilling,
    deleteBilling,
    addSurvey,
    updateSurvey,
    deleteSurvey,
    searchSurvey,
    addClientSurvey,
    updateClientSurvey,
    deleteClientSurvey,
    searchClientSurvey,
    searchTask,
    searchEvidence,
    updateTaskEvidence,
    updateTask,
    createTask,
    deleteTask,
    searchBill,
    addBill,
    updateBill,
    deleteBill,
    searchClientFollowUp,
    addClientFollowUp,
    updateClientFollowUp,
    deleteClientFollowUp
} from "./Endpoints";

export const AllPermissionList = [
    {
        value: "dashboard",
        url: [],
        permission: [
            {
                read: { allowed: false, url: [searchBilling, searchRole, searchGeneralMaster] },
                write: { allowed: false, url: [searchBilling, searchRole, searchGeneralMaster] },
                delete: { allowed: false, url: [searchBilling, searchRole, searchGeneralMaster] },
            }
        ],
        child: []
    },
    {
        value: "quicksale",
        url: [],
        permission: [
            {
                read: { allowed: false, url: [searchUser, searchRole, searchUnit, searchGeneralMaster, searchProduct, searchClient, searchBill, updateClient, addBilling, updateBilling, searchChild, searchParent, searchMembership, searchPackage] },
                write: { allowed: false, url: [searchRole, searchUnit, searchGeneralMaster, searchBilling, searchClient] },
                delete: { allowed: false, url: [searchRole, searchUnit, searchGeneralMaster, searchBilling, searchClient] },
            }
        ],
        child: []
    },
    {
        value: "bills",
        url: [],
        permission: [
            {
                read: { allowed: false, url: [searchRole, searchUnit, searchGeneralMaster, searchBilling, searchBill, searchClient] },
                write: { allowed: false, url: [searchRole, searchUnit, searchGeneralMaster, searchBilling, searchClient, updateBill] },
                delete: { allowed: false, url: [searchRole, searchUnit, searchGeneralMaster, searchBilling, searchClient] },
            }
        ],
        child: []
    },
    {
        value: "staffBilling",
        url: [],
        permission: [
            {
                read: { allowed: false, url: [searchRole, searchUnit, searchGeneralMaster, searchBilling, searchUser, searchBill, addBill] },
                write: { allowed: false, url: [searchRole, searchUnit, searchGeneralMaster, searchBilling, searchUser, updateBill, searchProduct, searchUser, searchCoupon, searchParent, searchChild] },
                delete: { allowed: false, url: [searchRole, searchUnit, searchGeneralMaster, searchBilling, searchUser, deleteBill] },
            }
        ],
        child: []
    },
    {
        value: "autoBilling",
        url: [],
        permission: [
            {
                read: { allowed: false, url: [searchRole, searchUnit, searchGeneralMaster, searchBilling, searchUser, searchBill, addBill] },
                write: { allowed: false, url: [searchRole, searchUnit, searchGeneralMaster, searchBilling, searchUser, updateBill, searchProduct, searchUser, searchCoupon, searchParent, searchChild, searchWallet, searchMembership, searchPackage, searchParent, searchChild] },
                delete: { allowed: false, url: [searchRole, searchUnit, searchGeneralMaster, searchBilling, searchUser, deleteBill] },
            }
        ],
        child: []
    },

    {
        value: "expense",
        url: [],
        permission: [
            {
                read: { allowed: false, url: [searchRole, searchUnit, searchGeneralMaster, searchBilling, searchUser, searchBill, addBill] },
                write: { allowed: false, url: [searchRole, searchUnit, searchGeneralMaster, searchBilling, searchUser, updateBill, searchProduct, searchUser, searchCoupon, searchParent, searchChild, searchWallet, searchMembership, searchPackage, searchParent, searchChild] },
                delete: { allowed: false, url: [searchRole, searchUnit, searchGeneralMaster, searchBilling, searchUser, deleteBill] },

            }
        ],
        child: []
    },
    {
        value: "ngb",
        url: [],
        permission: [
            {
                read: { allowed: false, url: [searchRole, searchUnit, searchGeneralMaster, searchBilling, searchClient, searchSurvey, searchClientSurvey] },
                write: { allowed: false, url: [searchRole, searchUnit, searchGeneralMaster, searchBilling, searchClient, updateSurvey, addSurvey, addClientSurvey, updateClientSurvey] },
                delete: { allowed: false, url: [searchRole, searchUnit, searchGeneralMaster, searchBilling, searchClient, deleteSurvey, deleteClientSurvey] },
            }
        ],
        child: []
    },
    {
        value: "reports",
        url: [],
        permission: [
            {
                read: { allowed: false, url: [searchRole, searchUnit, searchGeneralMaster, searchBilling, searchBill, searchClient, searchUser, searchBill, searchProduct, searchParent, searchChild, searchMembership, searchPackage, searchParent, searchChild] },
                write: { allowed: false, url: [searchRole, searchUnit, searchGeneralMaster, searchBilling, searchClient, updateBill, searchProduct, searchParent, searchChild, searchMembership, searchPackage, searchParent, searchChild, updateBill, updateClient, addBill, updateClient, deleteBill] },
                delete: { allowed: false, url: [searchRole, searchUnit, searchGeneralMaster, searchBilling, searchClient, deleteBill, deleteClient, deleteUser, deleteRole, deleteUnit, deleteProduct, deleteParent, deleteChild, deleteMembership, deletePackage, deleteSurvey, deleteClientSurvey] },
            }
        ],
        child: []
    },
    {
        value: "rolesAndPermissions",
        url: [],
        permission: [
            {
                read: { allowed: false, url: [searchRole, searchUnit] },
                write: { allowed: false, url: [addRole, updateRole] },
                delete: { allowed: false, url: [deleteRole] },
            }
        ],
        child: []
    },
    {
        value: "user",
        url: [],
        permission: [
            {
                read: { allowed: false, url: [searchUser, searchRole, searchUnit] },
                write: { allowed: false, url: [addUser, updateUser, searchGeneralMaster, uploadSingle] },
                delete: { allowed: false, url: [deleteUser] },
            }
        ],
        child: []
    },

    {
        value: "unit",
        url: [],
        permission: [
            {
                read: { allowed: false, url: [searchUnit, searchRole] },
                write: { allowed: false, url: [addUnit, updateUnit, searchGeneralMaster, uploadSingle] },
                delete: { allowed: false, url: [deleteUnit] },
            }
        ],
        child: []
    },
    {
        value: "client",
        url: [],
        permission: [
            {
                read: { allowed: false, url: [searchClient, searchRole, searchUnit] },
                write: { allowed: false, url: [addClient, updateClient, searchGeneralMaster, uploadSingle] },
                delete: { allowed: false, url: [deleteClient] },
            }
        ],
        child: []
    },
    {
        value: "followup",
        url: [],
        permission: [
            {
                read: { allowed: false, url: [searchClientFollowUp, searchRole, searchUnit, searchClient, searchGeneralMaster, searchUnit] },
                write: { allowed: false, url: [addClientFollowUp, updateClientFollowUp, searchGeneralMaster, uploadSingle] },
                delete: { allowed: false, url: [deleteClientFollowUp] },
            }
        ],
        child: []
    },
    {
        value: "vendor",
        url: [],
        permission: [
            {
                read: { allowed: false, url: [searchVendor, searchRole, searchUnit] },
                write: { allowed: false, url: [addVendor, updateVendor, searchGeneralMaster, uploadSingle] },
                delete: { allowed: false, url: [deleteVendor] },
            }
        ],
        child: []
    },

    {
        value: "seat",
        url: [],
        permission: [
            {
                read: { allowed: false, url: [searchSeat, searchRole, searchUnit] },
                write: { allowed: false, url: [addSeat, updateSeat, graphql, searchGeneralMaster, uploadSingle] },
                delete: { allowed: false, url: [deleteSeat] },
            }
        ],
        child: []
    },
    {
        value: "staff",
        url: [],
        permission: [
            {
                read: { allowed: false, url: [searchAttendance, addAttendance, updateAttendance, searchUnit, searchRole, searchGeneralMaster, searchBilling, searchTask, searchEvidence, updateTaskEvidence] },
                write: { allowed: false, url: [searchAttendance, addAttendance, updateAttendance] },
                delete: { allowed: false, url: [deleteAttendance] },
            }
        ],
        child: []
    },
    {
        value: "floor",
        url: [],
        permission: [
            {
                read: { allowed: false, url: [searchSeat, searchRole, searchUnit, searchClient, searchGeneralMaster] },
                write: { allowed: false, url: [addSeat, updateSeat, graphql, searchGeneralMaster, uploadSingle, addClient] },
                delete: { allowed: false, url: [deleteSeat] },
            }
        ],
        child: []
    },
    {
        value: "task",
        url: [],
        permission: [
            {
                read: { allowed: false, url: [searchUnit, searchRole, searchGeneralMaster, searchTask] },
                write: { allowed: false, url: [updateTask, createTask] },
                delete: { allowed: false, url: [deleteTask] },
            }
        ],
        child: []
    },
    {
        value: "product",
        url: [],
        permission: [
            {
                read: { allowed: false, url: [searchProduct, searchRole, searchUnit] },
                write: { allowed: false, url: [addProduct, updateProduct, ProductBulkUpload, uploadSingle, searchGeneralMaster, uploadSingle] },
                delete: { allowed: false, url: [deleteProduct] },
            }
        ],
        child: []
    },

    {
        value: "services",
        url: [],
        permission: [
            {
                read: { allowed: false, url: [searchParent, searchChild, searchRole, searchUnit] },
                write: { allowed: false, url: [addParent, updateParent, ParentBulkUpload, addChild, updateChild, searchGeneralMaster, searchUser, uploadSingle, searchProduct] },
                delete: { allowed: false, url: [deleteParent, deleteChild] },
            }
        ],
        child: []
    },


    {
        value: "inventory",
        url: [],
        permission: [
            {
                read: { allowed: false, url: [searchInventory, searchOrder, searchRole, searchUnit, searchGeneralMaster] },
                write: { allowed: false, url: [addInventory, addOrder, updateOrder, updateInventory, uploadSingle] },
                delete: { allowed: false, url: [deleteOrder, deleteInventory] },
            }
        ],
        child: []
    },

    {
        value: "advertisement",
        url: [],
        permission: [
            {
                read: { allowed: false, url: [searchMedia, searchRole, searchUnit, searchGeneralMaster, searchAdvertisement] },
                write: { allowed: false, url: [updateAdvertisement, updateMedia] },
                delete: { allowed: false, url: [deleteAdvertisement, deleteMedia] },
            }
        ],
        child: []
    },




];
