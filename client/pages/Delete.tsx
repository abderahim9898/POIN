import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Calendar, Trash2 } from "lucide-react";
import { PasswordConfirmation } from "@/components/PasswordConfirmation";
import { usePointages } from "@/hooks/usePointages";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorAlert } from "@/components/ErrorAlert";
import { translations } from "@/i18n/translations";

export default function DeletePage() {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordRequired, setPasswordRequired] = useState(false);

  // Fetch data for the selected date range
  const { deletePointagesByDateRange, loading, error } = usePointages();

  const handleDeleteRequest = () => {
    if (!startDate || !endDate) {
      setMessage({
        type: "error",
        text: translations.pleaseSelectBothDates,
      });
      return;
    }

    if (startDate > endDate) {
      setMessage({
        type: "error",
        text: translations.startDateMustBeforeEndDate,
      });
      return;
    }

    // Request password confirmation
    setPasswordRequired(true);
  };

  const handlePasswordConfirmed = async () => {
    setPasswordRequired(false);
    await handleDeleteConfirm();
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      const deletedCount = await deletePointagesByDateRange(startDate, endDate);

      setMessage({
        type: "success",
        text: `✓ ${translations.successfullyDeleted} ${deletedCount} ${deletedCount !== 1 ? translations.pointageRecordsDeleted : translations.pointageRecordDeleted} ${translations.deleteRecordsFromTo} ${startDate} à ${endDate}`,
      });

      setShowConfirm(false);
      setStartDate("");
      setEndDate("");
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : translations.failedToDelete,
      });
    } finally {
      setDeleting(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <ErrorAlert error={error} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PasswordConfirmation
        isOpen={passwordRequired}
        title="Confirm Delete"
        description="Please enter the admin password to delete pointage records"
        onConfirm={handlePasswordConfirmed}
        onCancel={() => setPasswordRequired(false)}
      />

      {/* Main Card */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Trash2 className="w-6 h-6 text-destructive" />
            <div>
              <h2 className="font-bold text-lg">
                {translations.deletePointageRecords}
              </h2>
              <p className="text-sm text-muted-foreground">
                {translations.permanentlyRemoveAttendanceRecords}
              </p>
            </div>
          </div>

          {/* Warning Alert */}
          <Alert className="border-destructive bg-destructive/10">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
              <AlertDescription className="text-destructive">
                {translations.warningPermanentAction}
              </AlertDescription>
            </div>
          </Alert>

          {/* Message */}
          {message && (
            <Alert
              className={
                message.type === "error"
                  ? "border-destructive bg-destructive/10"
                  : "border-green-200 bg-green-50"
              }
            >
              <div className="flex items-start gap-2">
                {message.type === "error" ? (
                  <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                )}
                <AlertDescription
                  className={
                    message.type === "error"
                      ? "text-destructive"
                      : "text-green-700"
                  }
                >
                  {message.text}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Date Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">
                    {translations.startDate}
                  </span>
                </div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setMessage(null);
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
                />
              </label>
            </div>

            <div>
              <label className="block mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">
                    {translations.endDate}
                  </span>
                </div>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setMessage(null);
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
                />
              </label>
            </div>
          </div>

          {/* Loading State */}
          {loading && <LoadingSpinner text={translations.processing} />}

          {/* Confirmation Dialog */}
          {showConfirm && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 space-y-3">
              <p className="font-semibold">
                {translations.deleteRecordsFromTo}{" "}
                <span className="text-destructive font-bold">{startDate}</span>{" "}
                à <span className="text-destructive font-bold">{endDate}</span>?
              </p>
              <p className="text-sm text-muted-foreground">
                {translations.permanentDeleteConfirm}
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleDeleteRequest}
                  disabled={deleting || passwordRequired}
                  className="bg-destructive hover:bg-destructive/90 flex-1"
                >
                  {deleting
                    ? translations.deleting
                    : translations.confirmDelete}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowConfirm(false)}
                  disabled={deleting}
                >
                  {translations.cancel}
                </Button>
              </div>
            </div>
          )}

          {/* Delete Button */}
          {!showConfirm && (
            <Button
              onClick={() => setShowConfirm(true)}
              disabled={!startDate || !endDate || deleting}
              className="bg-destructive hover:bg-destructive/90 w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {translations.deleteRecordsInDateRange}
            </Button>
          )}

          {/* Info Section */}
          <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
            <p className="font-semibold">{translations.deletionInformation}:</p>
            <ul className="space-y-1 text-muted-foreground text-xs">
              <li>• {translations.allPointageRecordsBetween}</li>
              <li>• {translations.thisActionPermanent}</li>
              <li>• {translations.confirmationDialogWillAppear}</li>
              <li>• {translations.bothStartAndEndDatesInclusive}</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
