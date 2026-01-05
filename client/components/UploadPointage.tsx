import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";
import {
  parseExcelFile,
  parseCSVFile,
  ParsedPointage,
  getExcelPreview,
  getCSVPreview,
  parseExcelFileWithMapping,
  parseCSVFileWithMapping,
  ColumnMapping,
} from "@/lib/excelParser";
import { usePointages } from "@/hooks/usePointages";
import { LoadingSpinner } from "./LoadingSpinner";
import { ColumnMapper } from "./ColumnMapper";

interface UploadPointageProps {
  onUploadSuccess?: () => void;
  onUploadRequest?: () => void;
  pendingUpload?: boolean;
  onUploadComplete?: () => void;
}

export const UploadPointage = ({
  onUploadSuccess,
  onUploadRequest,
  pendingUpload = false,
  onUploadComplete,
}: UploadPointageProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedPointage[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [showColumnMapper, setShowColumnMapper] = useState(false);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [skipFirstRow, setSkipFirstRow] = useState(false);
  const { addPointages } = usePointages();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParsedData(null);
    setShowColumnMapper(false);
    setMessage(null);

    setLoading(true);
    try {
      const isExcel =
        selectedFile.name.endsWith(".xlsx") ||
        selectedFile.name.endsWith(".xls");
      const isCSV = selectedFile.name.endsWith(".csv");

      if (!isExcel && !isCSV) {
        setMessage({
          type: "error",
          text: "Please upload an Excel (.xlsx, .xls) or CSV file",
        });
        setLoading(false);
        return;
      }

      // Try automatic detection first
      try {
        const data = isExcel
          ? await parseExcelFile(selectedFile, skipFirstRow)
          : await parseCSVFile(selectedFile, skipFirstRow);

        setParsedData(data);
        setMessage({
          type: "success",
          text: `✓ ${data.length} valid records found. Click "Confirm Upload" to save to database.`,
        });
      } catch (autoError) {
        // Automatic detection failed, show column mapper
        const preview = isExcel
          ? await getExcelPreview(selectedFile)
          : await getCSVPreview(selectedFile);

        setFileHeaders(preview.headers);
        setShowColumnMapper(true);
        setMessage({
          type: "error",
          text: "Column names could not be automatically detected. Please map your columns manually below.",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to read file",
      });
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleColumnMappingConfirm = async (mapping: ColumnMapping) => {
    if (!file) return;

    setLoading(true);
    try {
      const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");

      const data = isExcel
        ? await parseExcelFileWithMapping(file, mapping, skipFirstRow)
        : await parseCSVFileWithMapping(file, mapping, skipFirstRow);

      setParsedData(data);
      setShowColumnMapper(false);
      setMessage({
        type: "success",
        text: `✓ ${data.length} valid records found. Click "Confirm Upload" to save to database.`,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to parse file with mapping",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleColumnMapperCancel = () => {
    setShowColumnMapper(false);
    setFile(null);
    setMessage(null);
  };

  const handleUpload = async () => {
    if (!parsedData || parsedData.length === 0) return;

    // If password not yet confirmed, request it first
    if (!pendingUpload) {
      onUploadRequest?.();
      return;
    }

    setUploading(true);
    try {
      const result = await addPointages(parsedData);
      setMessage({
        type: "success",
        text: `✓ Successfully added ${result.added} records. ${result.duplicates > 0 ? `${result.duplicates} duplicates were skipped.` : ""}`,
      });
      setParsedData(null);
      setFile(null);
      onUploadSuccess?.();
      onUploadComplete?.();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Failed to upload pointages",
      });
      onUploadComplete?.();
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setParsedData(null);
    setMessage(null);
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        {!showColumnMapper && (
          <div className="flex items-center gap-3">
            <Upload className="w-6 h-6 text-primary" />
            <div>
              <h2 className="font-bold text-lg">Upload Pointage</h2>
              <p className="text-sm text-muted-foreground">
                Upload Excel (.xlsx) or CSV files with pointage data
              </p>
            </div>
          </div>
        )}

        {/* Column Mapper */}
        {showColumnMapper && fileHeaders.length > 0 && (
          <ColumnMapper
            fileHeaders={fileHeaders}
            onMappingConfirm={handleColumnMappingConfirm}
            onCancel={handleColumnMapperCancel}
          />
        )}

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

        {/* File Input */}
        {!parsedData && !showColumnMapper && (
          <div>
            <label className="block">
              <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/60 transition-colors">
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="font-medium mb-1">
                  Click to select file or drag and drop
                </p>
                <p className="text-sm text-muted-foreground">
                  Supported: Excel (.xlsx) and CSV files
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </label>
            {file && (
              <div className="space-y-2 mt-3">
                <p className="text-sm text-primary font-medium">
                  Selected: {file.name}
                </p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipFirstRow}
                    onChange={(e) => setSkipFirstRow(e.target.checked)}
                    className="w-4 h-4 rounded border-input"
                  />
                  <span className="text-sm text-muted-foreground">
                    Skip first data row
                  </span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <LoadingSpinner
            text={
              showColumnMapper
                ? "Parsing file with custom mapping..."
                : "Parsing file..."
            }
          />
        )}

        {/* Preview */}
        {parsedData && !loading && !showColumnMapper && (
          <div>
            <h3 className="font-semibold mb-3">
              Preview ({parsedData.length} records)
            </h3>
            <div className="bg-muted p-4 rounded-lg max-h-64 overflow-y-auto">
              <div className="space-y-2 text-sm">
                {parsedData.slice(0, 10).map((row, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-2 hover:bg-muted-foreground/10 rounded"
                  >
                    <div>
                      <p className="font-medium">{row.name}</p>
                      <p className="text-xs text-muted-foreground">
                        ID: {row.matricule} | {row.date} | {row.group}
                      </p>
                    </div>
                    <p className="font-semibold">{row.hours}h</p>
                  </div>
                ))}
                {parsedData.length > 10 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    ... and {parsedData.length - 10} more records
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {parsedData && !loading && !showColumnMapper && (
          <div className="flex gap-3">
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="bg-primary hover:bg-primary/90 flex-1"
            >
              {uploading ? "Uploading..." : "Confirm Upload"}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={uploading}
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Required Columns Info */}
        {!showColumnMapper && (
          <div className="bg-muted p-4 rounded-lg text-sm space-y-3">
            <div>
              <p className="font-semibold mb-2">
                Required columns (supports multiple names):
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  • <strong>Matricule/ID:</strong> CODIGI, MATRICULE, ID,
                  WORKER_ID, EMPLOYEE_ID
                </li>
                <li>
                  • <strong>Name:</strong> NOMBRE, NAME, FULL_NAME,
                  EMPLOYEE_NAME
                </li>
                <li>
                  • <strong>Group:</strong> ENCARGADO, GROUP, TEAM, DEPARTMENT,
                  GROUPE
                </li>
                <li>
                  • <strong>Date:</strong> DATE, FECHA, DATE_WORK
                  <div className="ml-4 mt-1 text-xs">
                    Supported formats:
                    <div className="mt-1 space-y-1">
                      <div>
                        <code className="bg-background px-1 py-0.5 rounded">
                          MM/DD/YYYY
                        </code>{" "}
                        (e.g.{" "}
                        <code className="bg-background px-1 py-0.5 rounded">
                          12/24/2025
                        </code>
                        )
                      </div>
                      <div>
                        <code className="bg-background px-1 py-0.5 rounded">
                          Excel serial date
                        </code>{" "}
                        (e.g.{" "}
                        <code className="bg-background px-1 py-0.5 rounded">
                          45992
                        </code>
                        )
                      </div>
                    </div>
                  </div>
                </li>
                <li>
                  • <strong>Hours:</strong> RHHH, HOURS, H, HORAS, HEURES
                  (numeric)
                </li>
              </ul>
            </div>
            <p className="text-xs italic text-muted-foreground/70">
              Column names are case-insensitive. Use any of the variations
              listed above.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
