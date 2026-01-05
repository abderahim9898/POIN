import { useState } from "react";
import { UploadPointage } from "@/components/UploadPointage";
import { PasswordConfirmation } from "@/components/PasswordConfirmation";
import { toast } from "sonner";
import { translations } from "@/i18n/translations";

export default function Upload() {
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<boolean>(false);

  const handleUploadRequest = () => {
    setPasswordRequired(true);
  };

  const handlePasswordConfirmed = () => {
    setPasswordRequired(false);
    setPendingUpload(true);
  };

  const handleUploadSuccess = () => {
    toast.success(translations.uploadSuccess, {
      description: translations.uploadDescription,
    });
    setPendingUpload(false);
  };

  return (
    <div className="space-y-6">
      <PasswordConfirmation
        isOpen={passwordRequired}
        title="Confirm Upload"
        description="Please enter the admin password to upload pointage data"
        onConfirm={handlePasswordConfirmed}
        onCancel={() => setPasswordRequired(false)}
      />

      <UploadPointage
        onUploadSuccess={handleUploadSuccess}
        onUploadRequest={handleUploadRequest}
        pendingUpload={pendingUpload}
        onUploadComplete={() => setPendingUpload(false)}
      />
    </div>
  );
}
