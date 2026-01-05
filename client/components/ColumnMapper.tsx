import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, ChevronRight } from "lucide-react";

export interface ColumnMapping {
  matricule: number;
  name: number;
  group: number;
  date: number;
  hours: number;
}

interface ColumnMapperProps {
  fileHeaders: string[];
  onMappingConfirm: (mapping: ColumnMapping) => void;
  onCancel: () => void;
}

const COLUMN_FIELDS = [
  { key: "matricule", label: "Matricule/ID", description: "Worker ID" },
  { key: "name", label: "Name", description: "Worker name" },
  { key: "group", label: "Group", description: "Team/Encargado" },
  { key: "date", label: "Date", description: "Work date" },
  { key: "hours", label: "Hours", description: "Hours worked" },
] as const;

export const ColumnMapper = ({
  fileHeaders,
  onMappingConfirm,
  onCancel,
}: ColumnMapperProps) => {
  const [mapping, setMapping] = useState<ColumnMapping>({
    matricule: 0,
    name: 1,
    group: 2,
    date: 3,
    hours: 4,
  });

  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
    const colIndex = parseInt(value);
    if (colIndex >= 0 && colIndex < fileHeaders.length) {
      setMapping((prev) => ({ ...prev, [field]: colIndex }));
    }
  };

  const handleConfirm = () => {
    onMappingConfirm(mapping);
  };

  // Get all column indices that are mapped
  const mappedIndices = new Set(Object.values(mapping));
  const hasDuplicates = mappedIndices.size !== 5;

  return (
    <Card className="p-6 bg-blue-50 border-blue-200">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <MapPin className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="font-bold text-lg">Manual Column Mapping</h3>
            <p className="text-sm text-muted-foreground">
              Select which column (1-based index) contains each field
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {hasDuplicates && (
          <Alert className="border-destructive bg-destructive/10">
            <AlertDescription className="text-destructive">
              ⚠️ Each field must map to a unique column
            </AlertDescription>
          </Alert>
        )}

        {/* Column Headers Preview */}
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            Available columns:
          </p>
          <div className="flex flex-wrap gap-2">
            {fileHeaders.map((header, idx) => (
              <div
                key={idx}
                className={`px-3 py-1 rounded text-sm font-medium whitespace-nowrap ${
                  mappedIndices.has(idx)
                    ? "bg-green-100 text-green-700 border border-green-300"
                    : "bg-gray-100 text-gray-700 border border-gray-300"
                }`}
              >
                <span className="font-bold mr-1">{idx + 1}.</span>
                {header || `Column ${idx + 1}`}
              </div>
            ))}
          </div>
        </div>

        {/* Mapping Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COLUMN_FIELDS.map(({ key, label, description }) => (
            <div key={key} className="space-y-2">
              <label className="block">
                <p className="text-sm font-semibold mb-1">{label}</p>
                <p className="text-xs text-muted-foreground mb-2">
                  {description}
                </p>
                <select
                  value={mapping[key as keyof ColumnMapping]}
                  onChange={(e) =>
                    handleMappingChange(
                      key as keyof ColumnMapping,
                      e.target.value,
                    )
                  }
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {fileHeaders.map((header, idx) => (
                    <option key={idx} value={idx}>
                      Column {idx + 1} - {header || `(empty)`}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ))}
        </div>

        {/* Preview */}
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-xs font-semibold text-muted-foreground mb-3">
            Mapping Preview:
          </p>
          <div className="space-y-2 text-sm">
            {COLUMN_FIELDS.map(({ key, label }) => {
              const colIdx = mapping[key as keyof ColumnMapping];
              const header = fileHeaders[colIdx];
              return (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{label}:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                      Column {colIdx + 1}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{header || "(empty)"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleConfirm}
            disabled={hasDuplicates}
            className="bg-primary hover:bg-primary/90 flex-1"
          >
            Confirm Mapping
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
};
