import React from 'react';
import { ActionIcon } from "rizzui";
import { PencilIcon } from "@heroicons/react/24/outline";

function EditButton({ onEdit, itemName = "user" }) {
  return (
    <span onClick={(e) => e.stopPropagation()}>
      <ActionIcon
        variant="outline"
        rounded="md"
        size="xs"
        className="border-gray-200 !w-7 !h-7"
        onClick={() => {
          if (onEdit) onEdit();
        }}
      >
        <PencilIcon className="w-3 h-3" />
      </ActionIcon>
    </span>
  );
}

export default EditButton;
