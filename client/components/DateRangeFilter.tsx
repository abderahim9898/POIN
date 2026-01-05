import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Calendar, X } from "lucide-react";

interface DateRangeFilterProps {
  onFilterChange: (startDate?: string, endDate?: string) => void;
  showClear?: boolean;
}

export const DateRangeFilter = ({
  onFilterChange,
  showClear = true,
}: DateRangeFilterProps) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleApply = () => {
    onFilterChange(startDate || undefined, endDate || undefined);
  };

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    onFilterChange(undefined, undefined);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Date Range Filter</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">From Date</label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">To Date</label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <Button
          onClick={handleApply}
          className="bg-primary hover:bg-primary/90"
        >
          Apply Filter
        </Button>
        {showClear && (
          <Button variant="outline" onClick={handleClear}>
            <X className="w-4 h-4 mr-2" />
            Clear
          </Button>
        )}
      </div>
    </Card>
  );
};
