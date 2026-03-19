import React, { useState } from 'react';
import { Popover, Title, Text, Button, ActionIcon } from "rizzui";
import { QrCodeIcon } from "@heroicons/react/24/outline";

function QRGridSizeSelector({ barcode, onGenerate, name = "item", productId, disabled = false }) {
    const [gridSize, setGridSize] = useState('4'); // Default to 4 QRs per page

    // Grid size options optimized for A4 paper printing
    const gridSizeOptions = [
        { value: '56', label: '56' },
        { value: '84', label: '84' },

    ];

    const handleGenerateQR = (setOpen) => {

        const url = `/product-qrcode/id=${barcode}name=${name}?gridSize=${gridSize}`;
        window.location.href = url;

        // if (barcode && productId) {
        //     // Redirect to the product QR code page with props passed through URL
        //     const url = `/product-qrcode/${productId}${itemName}?gridSize=${gridSize}&barcode=${encodeURIComponent(barcode)}`;
        //     window.location.href = url;
        //     setOpen(false);
        // } else if (barcode) {
        //     // Fallback: use callback if productId is not provided
        //     const qrData = {
        //         data: barcode,
        //         qrCount: parseInt(gridSize),
        //         isBarcode: true,
        //         itemName: itemName
        //     };

        //     if (onGenerate) {
        //         onGenerate(qrData);
        //     }

        //     setOpen(false);
        // }
    };

    return (
        <span onClick={(e) => e.stopPropagation()}>
            <Popover>
                <Popover.Trigger>
                    <ActionIcon
                        variant="outline"
                        rounded="md"
                        size="sm"
                        className="border-gray-200"
                        disabled={disabled}
                    >
                        <QrCodeIcon className="w-4 h-4" />
                    </ActionIcon>
                </Popover.Trigger>
                <Popover.Content>
                    {({ setOpen }) => (
                        <div className="w-72">
                            <Title as="h6">Generate QR Code</Title>
                            <Text className="mb-3">
                                Generate QR code for {name} (ID: {barcode})
                            </Text>

                            {/* QR count selection */}
                            <div className="mb-4">
                                <Text className="mb-2 text-sm font-medium">QRs per A4 Page:</Text>
                                <select
                                    value={gridSize}
                                    onChange={(e) => setGridSize(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {gridSizeOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 mb-1">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    disabled={!barcode || disabled}
                                    onClick={() => handleGenerateQR()}
                                >
                                    Generate QR
                                </Button>
                            </div>
                        </div>
                    )}
                </Popover.Content>
            </Popover>
        </span>
    );
}

export default QRGridSizeSelector;