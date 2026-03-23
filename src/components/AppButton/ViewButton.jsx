import React from 'react';
import { Popover, Title, Text, Button, ActionIcon } from "rizzui";
import { EyeIcon } from "@heroicons/react/24/outline";

function ViewButton({ onClick, itemName = "details" }) {
  return (
    <span onClick={(e) => e.stopPropagation()}>
      <ActionIcon 
        variant="outline" 
        rounded="md" 
        size="sm" 
        className="border-gray-200"
        onClick={onClick}
      >
        <EyeIcon className="w-4 h-4" />
      </ActionIcon>
    </span>
  );
}

export default ViewButton;