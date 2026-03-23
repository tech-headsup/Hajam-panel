import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, User, Phone, X, Loader2, UserPlus, Wallet } from 'lucide-react';
import { HitApi } from '../../Api/ApiHit';
import { searchClient } from '../../constant/Constant';
import toast from 'react-hot-toast';
import AddClient from './AddClient';

function ClientSearch({ onClientSelect, selectedClient, onClear }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [clients, setClients] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
    const [isClientSelected, setIsClientSelected] = useState(false);
    const [page] = useState(1);
    const [limit] = useState(10);
    const searchInputRef = useRef(null);
    const searchRequestRef = useRef(null);
    const [noResultsAfterDigits, setNoResultsAfterDigits] = useState(null);

    // Clear search term when selectedClient becomes null (bill completed)
    useEffect(() => {
        if (!selectedClient) {
            setSearchTerm('');
            setClients([]);
            setIsDropdownOpen(false);
            setNoResultsAfterDigits(null);
        }
    }, [selectedClient]);

    // Parallel search function that doesn't block typing
    const performParallelSearch = useCallback(async (term) => {
        // Cancel previous request if still pending
        if (searchRequestRef.current) {
            searchRequestRef.current.cancel = true;
        }

        // Create new request tracker
        const currentRequest = { cancel: false };
        searchRequestRef.current = currentRequest;

        try {
            const json = {
                page: page,
                limit: limit,
                search: {
                    $or: [
                        { name: { $regex: term, $options: 'i' } },
                        { phoneNumber: { $regex: term, $options: 'i' } }
                    ]
                }
            };

            // Use Promise to make truly async request
            const res = await HitApi(json, searchClient);

            // Check if request was cancelled while in flight
            if (currentRequest.cancel) {
                console.log('Search request cancelled for:', term);
                return;
            }

            if (res?.statusCode === 200) {
                const clientData = Array.isArray(res?.data?.docs) ? res.data.docs : [];
                
                // Only update if this is still the latest request
                if (searchRequestRef.current === currentRequest) {
                    setClients(clientData);
                    setIsLoading(false);
                    
                    // Track no results for numeric input (phone numbers)
                    const isNumericInput = /^\d+$/.test(term);
                    if (isNumericInput && clientData.length === 0 && term.length >= 5) {
                        setNoResultsAfterDigits(term.length);
                        console.log(`No results found after ${term.length} digits: "${term}" - stopping further searches`);
                    } else if (clientData.length > 0) {
                        setNoResultsAfterDigits(null); // Reset if we found results
                    }
                    
                }
            } else {
                if (searchRequestRef.current === currentRequest) {
                    setClients([]);
                    setIsLoading(false);
                    
                    // Track no results for numeric input
                    const isNumericInput = /^\d+$/.test(term);
                    if (isNumericInput && term.length >= 5) {
                        setNoResultsAfterDigits(term.length);
                    }
                }
            }
        } catch (error) {
            console.error('Parallel search error:', error);
            if (searchRequestRef.current === currentRequest && !currentRequest.cancel) {
                setClients([]);
                setIsLoading(false);
            }
        }
    }, [page, limit]);

    // Handle Enter key press to trigger search
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            // Don't search if client was just selected
            if (isClientSelected) {
                setIsClientSelected(false);
                return;
            }

            if (searchTerm.length >= 2) {
                // Start loading and show dropdown
                setIsLoading(true);
                setIsDropdownOpen(true);

                // Fire search
                performParallelSearch(searchTerm);
            } else {
                toast.error('Please enter at least 2 characters to search');
            }
        }
    };




    // Cleanup on unmount
    useEffect(() => {
        return () => {
            // Cancel any pending requests on unmount
            if (searchRequestRef.current) {
                searchRequestRef.current.cancel = true;
            }
        };
    }, []);

    const handleSelectClient = (client) => {
        if (onClientSelect) {
            onClientSelect(client);
        }
        setIsClientSelected(true); // Mark that client was selected
        setSearchTerm(client.name || client.phoneNumber);
        setIsDropdownOpen(false);
        setClients([]);
    };

    const handleClearSelection = () => {
        setSearchTerm('');
        setClients([]);
        setIsDropdownOpen(false);
        if (onClear) {
            onClear();
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);

        if (value.length < 2) {
            setClients([]);
            setIsDropdownOpen(false);
            setIsLoading(false);
            setNoResultsAfterDigits(null);

            // Cancel any pending searches
            if (searchRequestRef.current) {
                searchRequestRef.current.cancel = true;
            }
        }
        // Search is now triggered only on Enter key press
    };

    const handleOpenAddClientModal = () => {
        setIsDropdownOpen(false);
        setIsAddClientModalOpen(true);
    };

    const handleClientAdded = (newClient) => {
        if (onClientSelect && newClient) {
            onClientSelect(newClient);
            setIsClientSelected(true); // Mark that client was selected
            setSearchTerm(newClient.name || '');
        }
        toast.success('Client added and selected');
    };

    return (
        <div className="relative w-full">
            <div className="relative">
                <div className="flex items-center">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchTerm}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Search by name or phone number (Press Enter to search)..."
                            className="block w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isLoading}
                            autoComplete="off"
                        />
                        {(searchTerm || selectedClient) && (
                            <button
                                onClick={handleClearSelection}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                type="button"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                    {isLoading && (
                        <div className="ml-3 flex items-center">
                            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                        </div>
                    )}
                </div>

                {/* Search hint */}
                {!searchTerm && (
                    <p className="mt-1 text-xs text-gray-500">
                        Type at least 2 characters and press <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">Enter</kbd> to search
                    </p>
                )}
                {searchTerm.length > 0 && searchTerm.length < 2 && (
                    <p className="mt-1 text-xs text-amber-600">
                        Enter at least 2 characters, then press Enter to search
                    </p>
                )}
                {searchTerm.length >= 2 && !isLoading && clients.length === 0 && !isDropdownOpen && (
                    <p className="mt-1 text-xs text-blue-600">
                        Press <kbd className="px-1 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">Enter</kbd> to search for "{searchTerm}"
                    </p>
                )}
                {isLoading && (
                    <p className="mt-1 text-xs text-green-600">
                        Searching...
                    </p>
                )}
            </div>

            {/* Dropdown with search results or "Add Client" button */}
            {isDropdownOpen && (
                <div 
                    className="client-dropdown absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto"
                    onMouseDown={(e) => {
                        // Prevent dropdown clicks from removing focus from search input
                        e.preventDefault();
                    }}
                >
                    {isLoading && clients.length === 0 ? (
                        <div className="p-6 text-center">
                            <div className="flex flex-col items-center">
                                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                                <p className="text-sm text-gray-500">Searching clients...</p>
                                <p className="text-xs text-gray-400 mt-1">Please wait</p>
                            </div>
                        </div>
                    ) : clients.length > 0 ? (
                        <div className="p-2">
                            <div className="text-xs font-medium text-gray-500 px-3 py-2">
                                Found {clients.length} client{clients.length !== 1 ? 's' : ''}
                            </div>
                            {clients.map((client, index) => (
                                <button
                                    key={client._id || index}
                                    onClick={() => handleSelectClient(client)}
                                    onMouseDown={(e) => {
                                        // Prevent this specific button from preventing default
                                        e.stopPropagation();
                                    }}
                                    className="w-full text-left px-3 py-3 hover:bg-gray-50 rounded-lg transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                                >
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                <User className="h-5 w-5 text-blue-600" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {client.name || 'N/A'}
                                                </p>
                                                {client.customerType && (
                                                    <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-600 rounded">
                                                        {client.customerType}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-1 space-y-1">
                                                {client.phoneNumber && (
                                                    <div className="flex items-center text-xs text-gray-500">
                                                        <Phone className="h-3 w-3 mr-1" />
                                                        {client.phoneNumber}
                                                    </div>
                                                )}
                                                {client.ageGroup && (
                                                    <div className="text-xs text-gray-500">
                                                        Age Group: {client.ageGroup}
                                                    </div>
                                                )}
                                            </div>
                                            {client.gender && (
                                                <div className="mt-1">
                                                    <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                                                        {client.gender}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center">
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                    <User className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-sm font-medium text-gray-900 mb-1">No clients found</h3>
                                <p className="text-xs text-gray-500 mb-4">
                                    No results for "{searchTerm}"
                                    {noResultsAfterDigits && /^\d+$/.test(searchTerm) && (
                                        <span className="block mt-1 text-blue-600">
                                            Search stopped after {noResultsAfterDigits} digits - no matches found
                                        </span>
                                    )}
                                </p>
                                <button
                                    onClick={handleOpenAddClientModal}
                                    onMouseDown={(e) => {
                                        // Prevent this specific button from preventing default
                                        e.stopPropagation();
                                    }}
                                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <UserPlus className="h-4 w-4" />
                                    <span>Add New Client</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Selected client display */}
            {selectedClient && (
                <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start space-x-3 flex-1">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                    <User className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                    <h3 className="text-sm font-semibold text-gray-900">
                                        {selectedClient.name || 'N/A'}
                                    </h3>
                                    {selectedClient.customerType && (
                                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-600 rounded">
                                            {selectedClient.customerType}
                                        </span>
                                    )}
                                </div>
                                <div className="mt-2 space-y-1">
                                    {selectedClient.phoneNumber && (
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Phone className="h-4 w-4 mr-2" />
                                            {selectedClient.phoneNumber}
                                        </div>
                                    )}
                                    <div className="flex items-center space-x-3 text-xs text-gray-600">
                                        {selectedClient.gender && <span>Gender: {selectedClient.gender}</span>}
                                        {selectedClient.ageGroup && <span>Age: {selectedClient.ageGroup}</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleClearSelection}
                            className="ml-3 text-gray-400 hover:text-gray-600"
                            type="button"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Wallet Information - Integrated */}
                    {selectedClient.walletId && (
                        <div className="pt-3 border-t border-blue-200">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <Wallet className="h-4 w-4 text-green-600" />
                                    <span className="text-xs font-semibold text-gray-900">Wallet Balance: <span className="text-gray-900 font-bold">₹{selectedClient.walletId.balance?.toFixed(2) || '0.00'}</span></span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    {selectedClient.walletId.isFrozen && (
                                        <span className="px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-600 rounded">
                                            Frozen
                                        </span>
                                    )}
                                    {!selectedClient.walletId.isActive && (
                                        <span className="px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                                            Inactive
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-600">
                                <span>Credits: <span className="font-medium text-green-600">₹{selectedClient.walletId.totalCredits?.toFixed(2) || '0.00'}</span></span>
                                <span>Debits: <span className="font-medium text-red-600">₹{selectedClient.walletId.totalDebits?.toFixed(2) || '0.00'}</span></span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Add Client Modal */}
            <AddClient
                isOpen={isAddClientModalOpen}
                onClose={() => setIsAddClientModalOpen(false)}
                onClientAdded={handleClientAdded}
                prefilledData={searchTerm.trim() || null}
            />
        </div>
    );
}

export default ClientSearch;
