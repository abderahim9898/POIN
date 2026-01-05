import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { usePointages } from "@/hooks/usePointages";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorAlert } from "@/components/ErrorAlert";
import {
  exportPointagesToExcel,
  generateExportFilename,
} from "@/lib/pointageExporter";
import { translations } from "@/i18n/translations";

export default function DownloadPage() {
  const [filterMode, setFilterMode] = useState<"day" | "period">("day");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    String(new Date().getFullYear()),
  );
  const [selectedMonth, setSelectedMonth] = useState<string>("01");
  const [selectedPeriod, setSelectedPeriod] = useState<"QZ1" | "QZ2" | "all">(
    "all",
  );
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [exporting, setExporting] = useState(false);

  // Calculate date range based on filter mode
  const getDateRange = () => {
    if (filterMode === "day") {
      return { startDate: selectedDate, endDate: selectedDate };
    }
    // Period mode
    if (selectedPeriod === "QZ1") {
      return {
        startDate: `${selectedYear}-${selectedMonth}-01`,
        endDate: `${selectedYear}-${selectedMonth}-15`,
      };
    } else if (selectedPeriod === "QZ2") {
      const lastDay = new Date(
        parseInt(selectedYear),
        parseInt(selectedMonth),
        0,
      ).getDate();
      return {
        startDate: `${selectedYear}-${selectedMonth}-16`,
        endDate: `${selectedYear}-${selectedMonth}-${String(lastDay).padStart(2, "0")}`,
      };
    } else {
      // All QZ - entire month
      const lastDay = new Date(
        parseInt(selectedYear),
        parseInt(selectedMonth),
        0,
      ).getDate();
      return {
        startDate: `${selectedYear}-${selectedMonth}-01`,
        endDate: `${selectedYear}-${selectedMonth}-${String(lastDay).padStart(2, "0")}`,
      };
    }
  };

  const dateRange = getDateRange();

  // Fetch data for the selected date range
  const { pointages, loading, error } = usePointages({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  // Get all available groups
  const availableGroups = useMemo(() => {
    return Array.from(new Set(pointages.map((p) => p.group))).sort();
  }, [pointages]);

  // Filter pointages by selected group
  const filteredPointages = useMemo(() => {
    if (selectedGroup === "all") {
      return pointages;
    }
    return pointages.filter((p) => p.group === selectedGroup);
  }, [pointages, selectedGroup]);

  const handleExport = async () => {
    try {
      setExporting(true);
      if (filteredPointages.length === 0) {
        setMessage({
          type: "error",
          text: translations.noPointageRecords,
        });
        return;
      }

      const filename = generateExportFilename(
        filterMode === "day" ? selectedDate : dateRange.startDate,
        filterMode === "day" ? undefined : dateRange.endDate,
      );
      exportPointagesToExcel(filteredPointages, filename);

      setMessage({
        type: "success",
        text: `✓ ${translations.pointageDataExported} ${filename}`,
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : translations.failedToExport,
      });
    } finally {
      setExporting(false);
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
      {/* Main Card */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Download className="w-6 h-6 text-primary" />
            <div>
              <h2 className="font-bold text-lg">
                {translations.exportPointageData}
              </h2>
              <p className="text-sm text-muted-foreground">
                {translations.selectDateForDownload}
              </p>
            </div>
          </div>

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

          {/* Filter Tabs */}
          <div className="flex gap-2 border-b">
            <button
              onClick={() => {
                setFilterMode("day");
                setMessage(null);
              }}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                filterMode === "day"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {translations.singleDay}
            </button>
            <button
              onClick={() => {
                setFilterMode("period");
                setMessage(null);
              }}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                filterMode === "period"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {translations.periodQz}
            </button>
          </div>

          {/* Date/Period Selection */}
          {filterMode === "day" ? (
            <div>
              <label className="block mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">
                    {translations.selectDate}
                  </span>
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setMessage(null);
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
                />
              </label>
              <p className="text-xs text-muted-foreground">
                {translations.chooseDate}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {translations.year}
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(e.target.value);
                      setMessage(null);
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
                  >
                    {[
                      new Date().getFullYear() - 2,
                      new Date().getFullYear() - 1,
                      new Date().getFullYear(),
                      new Date().getFullYear() + 1,
                    ].map((year) => (
                      <option key={year} value={String(year)}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {translations.month}
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => {
                      setSelectedMonth(e.target.value);
                      setMessage(null);
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
                  >
                    <option value="01">{translations.january}</option>
                    <option value="02">{translations.february}</option>
                    <option value="03">{translations.march}</option>
                    <option value="04">{translations.april}</option>
                    <option value="05">{translations.may}</option>
                    <option value="06">{translations.june}</option>
                    <option value="07">{translations.july}</option>
                    <option value="08">{translations.august}</option>
                    <option value="09">{translations.september}</option>
                    <option value="10">{translations.october}</option>
                    <option value="11">{translations.november}</option>
                    <option value="12">{translations.december}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {translations.period}
                  </label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => {
                      setSelectedPeriod(
                        e.target.value as "QZ1" | "QZ2" | "all",
                      );
                      setMessage(null);
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
                  >
                    <option value="all">All QZ</option>
                    <option value="QZ1">{translations.qz1Days}</option>
                    <option value="QZ2">{translations.qz2Days}</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                <strong>QZ1:</strong> 1-15 | <strong>QZ2:</strong> 16-
                {translations.month} | <strong>All QZ:</strong>{" "}
                {translations.month}
              </p>
            </div>
          )}

          {/* Group Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {translations.selectGroup}
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => {
                setSelectedGroup(e.target.value);
                setMessage(null);
              }}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
            >
              <option value="all">{translations.allGroups}</option>
              {availableGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-2">
              {translations.filterPointagesByGroup}
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <LoadingSpinner text={translations.loadingPointageData} />
          )}

          {/* Records Info */}
          {!loading && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium">
                {filteredPointages.length > 0
                  ? `${filteredPointages.length} ${filteredPointages.length !== 1 ? translations.pointageRecordsFound : translations.pointageRecordFound}`
                  : translations.noPointageRecords}
              </p>
              {filteredPointages.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {translations.workers}:{" "}
                    {new Set(filteredPointages.map((p) => p.matricule)).size}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {translations.groups}:{" "}
                    {new Set(filteredPointages.map((p) => p.group)).size}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {translations.totalHours}:{" "}
                    {filteredPointages
                      .reduce((sum, p) => sum + p.hours, 0)
                      .toFixed(1)}
                    h
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          {!loading && filteredPointages.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">{translations.preview}</h3>
              <div className="bg-muted p-4 rounded-lg max-h-64 overflow-y-auto">
                <div className="space-y-2 text-sm">
                  {filteredPointages.slice(0, 10).map((p, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-2 hover:bg-muted-foreground/10 rounded"
                    >
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ID: {p.matricule} | {p.group} |{" "}
                          {new Date(p.date).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <p className="font-semibold">{p.hours}h</p>
                    </div>
                  ))}
                  {filteredPointages.length > 10 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      ... et {filteredPointages.length - 10}{" "}
                      {translations.moreRecords}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          {!loading && (
            <div className="flex gap-3">
              <Button
                onClick={handleExport}
                disabled={exporting || filteredPointages.length === 0}
                className="bg-primary hover:bg-primary/90 flex-1"
              >
                {exporting
                  ? translations.exporting
                  : translations.downloadAsExcel}
              </Button>
            </div>
          )}

          {/* Info Section */}
          <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
            <p className="font-semibold">{translations.exportInformation}:</p>
            <ul className="space-y-1 text-muted-foreground text-xs">
              <li>• {translations.downloadFileIncludes}</li>
              <li>• {translations.filesExportedInExcel}</li>
              <li>• {translations.chooseSingleDay}</li>
              <li>• {translations.choosePeriodQz}</li>
              <li>• {translations.optionallyFilterByGroup}</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
