import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { translations } from "@/i18n/translations";

interface UnifiedFilterProps {
  onFilterChange: (startDate: string, endDate: string) => void;
}

const months = [
  { value: "01", label: translations.january },
  { value: "02", label: translations.february },
  { value: "03", label: translations.march },
  { value: "04", label: translations.april },
  { value: "05", label: translations.may },
  { value: "06", label: translations.june },
  { value: "07", label: translations.july },
  { value: "08", label: translations.august },
  { value: "09", label: translations.september },
  { value: "10", label: translations.october },
  { value: "11", label: translations.november },
  { value: "12", label: translations.december },
];

export const UnifiedFilter = ({ onFilterChange }: UnifiedFilterProps) => {
  const currentYear = new Date().getFullYear();
  const [filterMode, setFilterMode] = useState<"quick" | "custom">("quick");
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [selectedMonth, setSelectedMonth] = useState<string>("01");
  const [selectedQuarter, setSelectedQuarter] = useState<"QZ1" | "QZ2" | "all">(
    "QZ1",
  );
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  const handleApplyFilter = () => {
    let startDate: string;
    let endDate: string;

    if (filterMode === "quick") {
      const year = selectedYear;
      const month = selectedMonth;

      if (selectedQuarter === "QZ1") {
        startDate = `${year}-${month}-01`;
        endDate = `${year}-${month}-15`;
      } else if (selectedQuarter === "QZ2") {
        startDate = `${year}-${month}-16`;
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        endDate = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;
      } else {
        // All QZ - entire month
        startDate = `${year}-${month}-01`;
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        endDate = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;
      }
    } else {
      if (!customStartDate || !customEndDate) {
        alert(translations.pleaseSelectBothDates);
        return;
      }
      if (customStartDate > customEndDate) {
        alert(translations.startDateMustBeforeEndDate);
        return;
      }
      startDate = customStartDate;
      endDate = customEndDate;
    }

    onFilterChange(startDate, endDate);
  };

  const handleClear = () => {
    onFilterChange("", "");
    setSelectedYear(String(currentYear));
    setSelectedMonth("01");
    setSelectedQuarter("all");
    setCustomStartDate("");
    setCustomEndDate("");
  };

  return (
    <div className="bg-card rounded-lg border p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Calendar className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-lg">{translations.filterData}</h3>
      </div>

      {/* Filter Mode Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setFilterMode("quick")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            filterMode === "quick"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {translations.quickQZ}
        </button>
        <button
          onClick={() => setFilterMode("custom")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            filterMode === "custom"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {translations.customDateRange}
        </button>
      </div>

      {/* Quick Filter Section */}
      {filterMode === "quick" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {translations.year}
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
            >
              {[
                currentYear - 2,
                currentYear - 1,
                currentYear,
                currentYear + 1,
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
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {translations.period}
            </label>
            <select
              value={selectedQuarter}
              onChange={(e) =>
                setSelectedQuarter(e.target.value as "QZ1" | "QZ2" | "all")
              }
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
            >
              <option value="all">All QZ</option>
              <option value="QZ1">{translations.qz1}</option>
              <option value="QZ2">{translations.qz2}</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <Button
              onClick={handleApplyFilter}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {translations.apply}
            </Button>
            <Button onClick={handleClear} variant="outline" className="flex-1">
              {translations.clear}
            </Button>
          </div>
        </div>
      )}

      {/* Custom Date Range Section */}
      {filterMode === "custom" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {translations.fromDate}
            </label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {translations.toDate}
            </label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
            />
          </div>

          <div className="flex items-end gap-2">
            <Button
              onClick={handleApplyFilter}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {translations.applyFilter}
            </Button>
            <Button onClick={handleClear} variant="outline" className="flex-1">
              {translations.clear}
            </Button>
          </div>
        </div>
      )}

      {/* Info Text */}
      <div className="text-xs text-muted-foreground">
        {filterMode === "quick" ? (
          <p>{translations.qz1Description}</p>
        ) : (
          <p>{translations.customDateDescription}</p>
        )}
      </div>
    </div>
  );
};
