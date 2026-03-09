import React from 'react';
import { Button } from 'rizzui';
import Colors from '../../constant/Colors';

function AppButton({
  buttontext,
  onClick,
  variant = "solid",
  size = "md",
  color,
  backgroundColor,
  borderColor,
  textColor,
  useCustomColors = false,
  className = "",
  icon: Icon,
  iconPosition = 'right',
  isLoading = false,
  ...props
}) {
  const shouldUseCustomStyling = useCustomColors || (!color && backgroundColor);

  const customStyle = shouldUseCustomStyling ? {
    backgroundColor: backgroundColor || Colors.BLACK,
    borderColor: borderColor || backgroundColor || Colors.BLACK,
    color: textColor || 'white'
  } : {};

  const buttonClassName = `flex items-center gap-2 font-semibold ${className}`;

  return (
    <Button
      variant={variant}
      size={size}
      color={color}
      onClick={onClick}
      className={buttonClassName}
      style={shouldUseCustomStyling ? customStyle : {}}
      isLoading={isLoading}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon size={18} />}
      {buttontext}
      {Icon && iconPosition === 'right' && <Icon size={18} />}
    </Button>
  );
}

export default AppButton;
