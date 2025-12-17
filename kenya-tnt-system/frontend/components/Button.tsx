"use client";

import React from "react";

interface ButtonProps {
  onClick?: () => void;
  backgroundColor?: string;
  textColor?: string;
  value: string;
  className?: string;
  icon?: React.ReactNode;
  paddingX?: string;
  paddingY?: string;
  gap?: string;
  iconPosition?: "left" | "right";
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  // backgroundColor = '#005C28',
  // textColor = 'white',
  value,
  className = "",
  icon,
  paddingX = "20px",
  paddingY = "10px",
  gap = "10px",
  iconPosition = "left", // Default position is left
}) => {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center cursor-pointer gap-[${gap}] px-[${paddingX}] py-[${paddingY}] ${className}`}
      //  style={{ backgroundColor, color: textColor }}
    >
      {iconPosition === "left" && icon && <span>{icon}</span>}
      <span>{value}</span>
      {iconPosition === "right" && icon && <span>{icon}</span>}
    </button>
  );
};

export default Button;
