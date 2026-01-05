import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

interface QuarterFilterProps {
  onFilterChange: (startDate: string, endDate: string) => void;
}

const months = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export const QuarterFilter = ({ onFilterChange }: QuarterFilterProps) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [selectedMonth, setSelectedMonth] = useState<string>("01");
  const [selectedQuarter, setSelectedQuarter] = useState<"QZ1" | "QZ2">("QZ1");

  const handleApplyFilter = () => {
    const year = selectedYear;
    const month = selectedMonth;

    let startDate: string;
    let endDate: string;

    if (selectedQuarter === "QZ1") {
      // First half: 1-15
      startDate = `${year}-${month}-01`;
      endDate = `${year}-${month}-15`;
    } else {
      // Second half: 16-last day of month
      startDate = `${year}-${month}-16`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      endDate = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;
    }

    onFilterChange(startDate, endDate);
  };

  const handleClear = () => {
    onFilterChange("", "");
    setSelectedYear(String(currentYear));
    setSelectedMonth("01");
    setSelectedQuarter("QZ1");
  };

  return (
    <div className="bg-card rounded-lg border p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Calendar className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-lg">Quick Month Filter (QZ1/QZ2)</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Year Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Year</label>
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

        {/* Month Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Month</label>
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

        {/* Quarter Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Period</label>
          <select
            value={selectedQuarter}
            onChange={(e) =>
              setSelectedQuarter(e.target.value as "QZ1" | "QZ2")
            }
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
          >
            <option value="QZ1">QZ1 (1-15)</option>
            <option value="QZ2">QZ2 (16-31)</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex items-end gap-2">
          <Button
            onClick={handleApplyFilter}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            Apply
          </Button>
          <Button onClick={handleClear} variant="outline" className="flex-1">
            Clear
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        <p>
          <strong>QZ1:</strong> Days 1-15 | <strong>QZ2:</strong> Days 16-last
          day of month
        </p>
      </div>
    </div>
  );
};
