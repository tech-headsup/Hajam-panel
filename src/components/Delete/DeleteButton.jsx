import React from 'react';
import { Popover, Title, Text, Button, ActionIcon } from "rizzui";
import { TrashIcon, PencilIcon, EyeIcon } from "@heroicons/react/24/outline";

function DeleteButton({ onDelete, itemName = "user" }) {
  return (
    <span onClick={(e) => e.stopPropagation()}>
      <Popover placement="left-start">
        <Popover.Trigger>
          <ActionIcon variant="outline" rounded="md" size="xs" className="border-gray-200 !w-7 !h-7">
            <TrashIcon className="w-3 h-3" />
          </ActionIcon>
        </Popover.Trigger>
        <Popover.Content className="z-50 !bg-white !border !border-gray-200 !rounded-xl !shadow-xl !p-0">
          {({ setOpen }) => (
            <div className="w-56 p-4">
              <Title as="h6">Delete {itemName}</Title>
              <Text className="mt-2 text-sm text-gray-600">Are you sure you want to delete this {itemName}?</Text>
              <div className="mt-4 flex justify-end gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  No
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (onDelete) onDelete();
                    setOpen(false);
                  }}
                >
                  Yes
                </Button>
              </div>
            </div>
          )}
        </Popover.Content>
      </Popover>
    </span>
  );
}


// For a complete set of actions matching the image
export function ActionButtons({ onView, onEdit, onDelete, itemName = "item" }) {
  return (
    <div className="flex items-center gap-2">
      <ActionIcon
        variant="outline"
        rounded="md"
        size="sm"
        className="border-gray-200"
        onClick={(e) => {
          e.stopPropagation();
          if (onEdit) onEdit();
        }}
      >
        <PencilIcon className="w-4 h-4" />
      </ActionIcon>

      <ActionIcon
        variant="outline"
        rounded="md"
        size="sm"
        className="border-gray-200"
        onClick={(e) => {
          e.stopPropagation();
          if (onView) onView();
        }}
      >
        <EyeIcon className="w-4 h-4" />
      </ActionIcon>

      <DeleteButton onDelete={onDelete} itemName={itemName} />
    </div>
  );
}

export default DeleteButton;
