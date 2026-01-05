import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorAlert } from "@/components/ErrorAlert";
import { Pointage, usePointages } from "@/hooks/usePointages";
import { translations } from "@/i18n/translations";
import { Trash2, Edit2 } from "lucide-react";

interface ManageAttendanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matricule: string;
  name: string;
  attendances: Pointage[];
  onSuccess?: () => void;
}

interface FormData {
  date: string;
  hours: number | string;
  group: string;
}

export const ManageAttendanceModal = ({
  open,
  onOpenChange,
  matricule,
  name,
  attendances,
  onSuccess,
}: ManageAttendanceModalProps) => {
  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split("T")[0],
    hours: "",
    group: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { addPointages, updatePointage, deletePointage } = usePointages();

  const handleAddOrEdit = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!formData.date || !formData.hours || !formData.group) {
        setError(translations.selectDate + " - All fields required");
        return;
      }

      const hours = parseFloat(String(formData.hours));
      if (isNaN(hours) || hours <= 0) {
        setError("Hours must be a valid positive number");
        return;
      }

      if (editingId) {
        // Update existing
        await updatePointage(editingId, {
          date: formData.date,
          hours,
          group: formData.group,
        });
      } else {
        // Add new
        await addPointages([
          {
            matricule,
            name,
            date: formData.date,
            hours,
            group: formData.group,
          },
        ]);
      }

      setFormData({
        date: new Date().toISOString().split("T")[0],
        hours: "",
        group: "",
      });
      setEditingId(null);
      onSuccess?.();
      // Modal stays open after save - no onOpenChange(false)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save attendance",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditRecord = (attendance: Pointage) => {
    setFormData({
      date: attendance.date,
      hours: attendance.hours,
      group: attendance.group,
    });
    setEditingId(attendance.id);
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await deletePointage(id);
      setDeleteConfirmId(null);
      onSuccess?.();
      // Modal stays open after delete - no onOpenChange(false)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete attendance",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      hours: "",
      group: "",
    });
    setEditingId(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{translations.manageAttendance}</DialogTitle>
            <DialogDescription>
              {translations.attendanceRecordsList} - {name} ({matricule})
            </DialogDescription>
          </DialogHeader>

          {error && <ErrorAlert error={error} />}

          <div className="space-y-6 py-4">
            {/* Form Section */}
            <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
              <h3 className="font-semibold">
                {editingId
                  ? translations.editAttendance
                  : translations.addNewAttendance}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">{translations.date}</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hours">{translations.hours}</Label>
                  <Input
                    id="hours"
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="8"
                    value={formData.hours}
                    onChange={(e) =>
                      setFormData({ ...formData, hours: e.target.value })
                    }
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="group">{translations.group}</Label>
                  <Input
                    id="group"
                    placeholder={translations.group}
                    value={formData.group}
                    onChange={(e) =>
                      setFormData({ ...formData, group: e.target.value })
                    }
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading || (!editingId && !formData.hours)}
                >
                  {translations.cancel}
                </Button>
                <Button onClick={handleAddOrEdit} disabled={loading}>
                  {loading
                    ? translations.processing
                    : editingId
                      ? translations.editAttendance
                      : translations.addAttendance}
                </Button>
              </div>
            </div>

            {/* Records List */}
            <div className="space-y-3">
              <h3 className="font-semibold">
                {translations.attendanceRecords} ({attendances.length})
              </h3>

              {attendances.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  {translations.noAttendanceRecords}
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {attendances
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((attendance) => (
                      <div
                        key={attendance.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="text-sm font-medium">
                                {new Date(attendance.date).toLocaleDateString(
                                  "fr-FR",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  },
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {attendance.group}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-primary">
                                {attendance.hours}h
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 ml-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditRecord(attendance)}
                            disabled={loading}
                            className="gap-1"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span className="hidden sm:inline text-xs">
                              {translations.edit}
                            </span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteConfirmId(attendance.id)}
                            disabled={loading}
                            className="gap-1 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline text-xs">
                              {translations.delete}
                            </span>
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                handleCancel();
              }}
              disabled={loading}
            >
              {translations.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteConfirmId !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setDeleteConfirmId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translations.deleteAttendance}</AlertDialogTitle>
            <AlertDialogDescription>
              {translations.permanentDeleteConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>
              {translations.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmId) {
                  handleDeleteRecord(deleteConfirmId);
                }
              }}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? translations.processing : translations.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
