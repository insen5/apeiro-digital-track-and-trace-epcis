"use client";

import React from "react";
import { Button } from "./ui/button";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonText?: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  buttonText = "Thank You!",
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    // Backdrop
    <div className="fixed inset-0 bg-black/[.75] z-50 flex justify-center items-center p-4">
      {/* Modal Panel */}
      <div className="bg-white rounded-[15px] display-flex flex-col justify-center items-center shadow-xl min-w-[452px] max-w-md relative text-center p-[51px] gap-[28px]">
        {/* Icon */}
        <div className="relative flex justify-center items-center w-[40px] h-[39px] mx-auto">
          {/* <FaCheckCircle className="text-green-500 text-6xl" /> */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="39"
            viewBox="0 0 40 39"
            fill="none"
            className="absolute top-0 left-0"
          >
            <circle
              cx="19.9999"
              cy="19.2529"
              r="19.2529"
              fill="#0077B6"
              fillOpacity="0.5"
            />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="25"
            height="25"
            viewBox="0 0 25 25"
            fill="none"
            className="absolute top-[7px] left-[7.5px]"
          >
            <circle cx="12.2872" cy="12.5402" r="12.069" fill="#0077B6" />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className="absolute top-[13.5px] left-[14px]"
          >
            <g clipPath="url(#clip0_1460_147)">
              <path
                d="M10.7856 2.39416L4.10778 9.07152C4.06289 9.11659 4.00953 9.15236 3.95078 9.17676C3.89203 9.20116 3.82903 9.21373 3.76541 9.21373C3.70179 9.21373 3.6388 9.20116 3.58005 9.17676C3.52129 9.15236 3.46794 9.11659 3.42304 9.07152L0.840628 6.48669C0.795731 6.44161 0.742375 6.40585 0.683622 6.38144C0.624869 6.35704 0.561875 6.34448 0.498255 6.34448C0.434636 6.34448 0.371642 6.35704 0.312889 6.38144C0.254136 6.40585 0.20078 6.44161 0.155883 6.48669C0.110808 6.53158 0.0750428 6.58494 0.0506386 6.64369C0.0262344 6.70245 0.0136719 6.76544 0.0136719 6.82906C0.0136719 6.89268 0.0262344 6.95567 0.0506386 7.01443C0.0750428 7.07318 0.110808 7.12654 0.155883 7.17143L2.73926 9.75433C3.01178 10.0263 3.38109 10.1791 3.76614 10.1791C4.15118 10.1791 4.52049 10.0263 4.79301 9.75433L11.4704 3.07843C11.5154 3.03354 11.5511 2.98021 11.5754 2.9215C11.5998 2.8628 11.6123 2.79986 11.6123 2.7363C11.6123 2.67273 11.5998 2.6098 11.5754 2.55109C11.5511 2.49238 11.5154 2.43905 11.4704 2.39416C11.4255 2.34909 11.3721 2.31332 11.3134 2.28892C11.2546 2.26452 11.1916 2.25195 11.128 2.25195C11.0644 2.25195 11.0014 2.26452 10.9426 2.28892C10.8839 2.31332 10.8305 2.34909 10.7856 2.39416Z"
                fill="#F6F6F6"
              />
            </g>
            <defs>
              <clipPath id="clip0_1460_147">
                <rect
                  width="11.5977"
                  height="11.5977"
                  fill="white"
                  transform="translate(0 0.25293)"
                />
              </clipPath>
            </defs>
          </svg>
        </div>

        {/* Content */}
        <h3 className="text-black text-center text-[25px] font-normal leading-normal self-stretch mb-3 mt-4">{title}</h3>
        <p className="ttext-black text-center text-base font-normal leading-normal self-stretch mb-8">{message}</p>
        <div className="flex justify-center">
          <Button
            onClick={onClose}
            className="flex px-[30px] py-[10px] justify-center items-center gap-[10px] bg-[#0077B6] hover:bg-[#0077B6]/90 text-white font-normal rounded-full cursor-pointer"
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </div>
  );
};
