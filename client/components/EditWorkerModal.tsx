import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorAlert } from "@/components/ErrorAlert";
import { usePointages } from "@/hooks/usePointages";
import { translations } from "@/i18n/translations";

interface EditWorkerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matricule: string;
  name: string;
  group: string;
  onSuccess?: () => void;
}

export const EditWorkerModal = ({
  open,
  onOpenChange,
  matricule,
  name,
  group,
  onSuccess,
}: EditWorkerModalProps) => {
  const [editName, setEditName] = useState(name);
  const [editGroup, setEditGroup] = useState(group);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { updateWorkerDetails } = usePointages();

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      const updates: { name?: string; group?: string } = {};

      if (editName !== name) {
        updates.name = editName;
      }
      if (editGroup !== group) {
        updates.group = editGroup;
      }

      if (Object.keys(updates).length === 0) {
        return;
      }

      await updateWorkerDetails(matricule, updates);
      onSuccess?.();
      // Modal stays open after save - no onOpenChange(false)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update worker",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{translations.editWorker}</DialogTitle>
          <DialogDescription>
            {translations.editWorkerDetails}
          </DialogDescription>
        </DialogHeader>

        {error && <ErrorAlert error={error} />}

        {loading ? (
          <LoadingSpinner text={translations.processing} />
        ) : (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="worker-id">{translations.workerId}</Label>
              <Input
                id="worker-id"
                value={matricule}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="worker-name">{translations.workerName}</Label>
              <Input
                id="worker-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder={translations.workerName}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="worker-group">{translations.group}</Label>
              <Input
                id="worker-group"
                value={editGroup}
                onChange={(e) => setEditGroup(e.target.value)}
                placeholder={translations.group}
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {translations.cancel}
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? translations.processing : translations.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
