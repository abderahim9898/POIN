import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, X } from "lucide-react";
import { useState } from "react";

interface ErrorAlertProps {
  error: string;
  onClose?: () => void;
}

export const ErrorAlert = ({ error, onClose }: ErrorAlertProps) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  return (
    <Alert className="border-destructive bg-destructive/10">
      <AlertCircle className="h-4 w-4 text-destructive" />
      <AlertDescription className="text-destructive flex items-center justify-between">
        <span>{error}</span>
        <button
          onClick={handleClose}
          className="ml-4 p-1 hover:bg-destructive/20 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </AlertDescription>
    </Alert>
  );
};
