import { useState, useCallback } from 'react';
import BarcodeModal from './BarcodeModal';
import { CirclePlus, PlusSquare } from 'lucide-react';
import Colors from '../../constant/Colors';
import { ActionIcon } from 'rizzui/action-icon';

/**
 * BarcodeManager Component
 * 
 * This component manages all barcode-related modal functionality:
 * - Modal state management
 * - Product selection handling
 * - Barcode update callbacks
 * - Integration with parent components
 */
function BarcodeManager({ onBarcodeUpdate }) {
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    /**
     * Open barcode management modal for a specific product
     * @param {Object} product - The product object to manage barcodes for
     */
    const openBarcodeModal = useCallback((product) => {
        if (!product || !product._id) {
            console.error('Invalid product provided to barcode manager');
            return;
        }

        console.log('Opening barcode modal for product:', product.productName);
        setSelectedProduct(product);
        setIsModalOpen(true);
    }, []);

    /**
     * Close the barcode management modal
     */
    const closeBarcodeModal = useCallback(() => {
        console.log('Closing barcode modal');
        setIsModalOpen(false);
        setSelectedProduct(null);
    }, []);

    /**
     * Handle barcode update from modal
     * @param {string} productId - The ID of the updated product
     * @param {Array} newBarcodes - Array of updated barcodes
     */
    const handleBarcodeUpdate = useCallback((productId, newBarcodes) => {
        console.log(`Barcodes updated for product ${productId}:`, newBarcodes);

        // Call parent callback if provided
        if (onBarcodeUpdate) {
            onBarcodeUpdate(productId, newBarcodes);
        }

        // Close modal after successful update
        closeBarcodeModal();
    }, [onBarcodeUpdate, closeBarcodeModal]);

    /**
     * Check if modal is currently open
     * @returns {boolean} Whether the modal is open
     */
    const isModalVisible = () => {
        return isModalOpen && selectedProduct !== null;
    };

    /**
     * Get current selected product
     * @returns {Object|null} Currently selected product
     */
    const getCurrentProduct = () => {
        return selectedProduct;
    };

    /**
     * Create barcode management button component
     * @param {Object} product - Product object
     * @param {Object} options - Button customization options
     * @returns {JSX.Element} Barcode management button
     */
    const createBarcodeButton = useCallback((product, options = {}) => {
        const {
            variant = 'default', // 'default', 'compact', 'icon-only'
            disabled = false,
            className = '',
            showCount = true
        } = options;

        const baseClasses = "inline-flex items-center font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

        let buttonClasses;
        let content;

        switch (variant) {
            case 'compact':
                buttonClasses = `${baseClasses}   ${className}`;
                content = (
                    <>

                        <ActionIcon
                            variant="outline"
                            rounded="md"
                            size="sm"
                            className="border-gray-200"

                        >
                            <CirclePlus className="w-4 h-4" />
                        </ActionIcon>
                    </>
                );
                break;

            case 'icon-only':
                buttonClasses = `${baseClasses} p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded ${className}`;
                content = (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.99c.28 0 .52-.21.52-.49V9.51c0-.28-.24-.49-.52-.49H12m0 3v3m0 0h-1.99c-.28 0-.52-.21-.52-.49V12.51c0-.28.24-.49.52-.49H12m-2-3h2m0-1V7a1 1 0 011-1h1m-1 4h.01" />
                    </svg>
                );
                break;

            default: // 'default'
                buttonClasses = `${baseClasses} px-3 py-2 text-sm text-white bg-purple-600 rounded-md hover:bg-purple-700 ${className}`;
                content = (
                    <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.99c.28 0 .52-.21.52-.49V9.51c0-.28-.24-.49-.52-.49H12m0 3v3m0 0h-1.99c-.28 0-.52-.21-.52-.49V12.51c0-.28.24-.49.52-.49H12m-2-3h2m0-1V7a1 1 0 011-1h1m-1 4h.01" />
                        </svg>
                        Manage Barcodes
                        {showCount && product.barcodes && product.barcodes.length > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-purple-500 rounded-full">
                                {product.barcodes.length}
                            </span>
                        )}
                    </>
                );
        }

        return (
            <button
                onClick={() => openBarcodeModal(product)}
                className={buttonClasses}
                title={`Manage barcodes for ${product.productName}`}
                disabled={disabled}
            >
                {content}
            </button>
        );
    }, [openBarcodeModal]);

    /**
     * Create barcode count indicator component
     * @param {Object} product - Product object
     * @param {Object} options - Display options
     * @returns {JSX.Element|null} Barcode count indicator
     */
    const createBarcodeIndicator = useCallback((product, options = {}) => {
        const {
            showIcon = true,
            className = '',
            variant = 'default' // 'default', 'badge', 'minimal'
        } = options;

        if (!product.barcodes || product.barcodes.length === 0) {
            return null;
        }

        const count = product.barcodes.length;
        const text = `${count} barcode${count !== 1 ? 's' : ''}`;

        switch (variant) {
            case 'badge':
                return (
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full ${className}`}>
                        {showIcon && (
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.99c.28 0 .52-.21.52-.49V9.51c0-.28-.24-.49-.52-.49H12m0 3v3m0 0h-1.99c-.28 0-.52-.21-.52-.49V12.51c0-.28.24-.49.52-.49H12m-2-3h2m0-1V7a1 1 0 011-1h1m-1 4h.01" />
                            </svg>
                        )}
                        {text}
                    </span>
                );

            case 'minimal':
                return (
                    <span className={`text-xs text-blue-600 font-medium ${className}`}>
                        {count}
                    </span>
                );

            default: // 'default'
                return (
                    <div className={`flex items-center space-x-1 ${className}`}>
                        {showIcon && (
                            <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.99c.28 0 .52-.21.52-.49V9.51c0-.28-.24-.49-.52-.49H12m0 3v3m0 0h-1.99c-.28 0-.52-.21-.52-.49V12.51c0-.28.24-.49.52-.49H12m-2-3h2m0-1V7a1 1 0 011-1h1m-1 4h.01" />
                            </svg>
                        )}
                        <span className="text-xs text-blue-600 font-medium">
                            {text}
                        </span>
                    </div>
                );
        }
    }, []);

    return {
        // Modal component
        ModalComponent: () => (
            <BarcodeModal
                isOpen={isModalVisible()}
                onClose={closeBarcodeModal}
                product={getCurrentProduct()}
                onBarcodeUpdate={handleBarcodeUpdate}
            />
        ),

        // Public methods
        openBarcodeModal,
        closeBarcodeModal,
        isModalVisible,
        getCurrentProduct,

        // UI Components
        createBarcodeButton,
        createBarcodeIndicator,

        // State
        isModalOpen,
        selectedProduct
    };
}

export default BarcodeManager;