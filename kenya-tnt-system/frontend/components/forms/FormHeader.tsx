"use client";

// import { Button } from "@/components/ui/button";
// import { ArrowLeft } from "lucide-react";

interface FormHeaderProps {
  showHeader: boolean;
  headerTitle: string;
  headerDescription: string;
  onCancel?: () => void;
}

export const FormHeader = ({
  showHeader,
  headerTitle,
  headerDescription,
}: // onCancel,
FormHeaderProps) => {
  if (!showHeader) return null;

  return (
    <div className="bg-gradient-to-r from-[#0077B6] to-[#005A8B] px-6 py-4">
      <div className="flex items-center gap-4">
        {/* {onCancel && (
          <>
            <Button
              onClick={onCancel}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-white/10 hover:bg-white/20 border-0 transition-all duration-200 group cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 group-hover:translate-x-[-2px] transition-transform duration-200" />
              <span className="font-medium">Back</span>
            </Button>
            <div className="h-8 w-px bg-white/30"></div>
          </>
        )} */}
        <div>
          <h1 className="text-2xl font-bold text-white">{headerTitle}</h1>
          <p className="text-white/80 text-sm">{headerDescription}</p>
        </div>
      </div>
    </div>
  );
};

export default FormHeader;
