import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UnifiedFilter } from "@/components/UnifiedFilter";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorAlert } from "@/components/ErrorAlert";
import { useWorkerStats, usePointages } from "@/hooks/usePointages";
import { Users, BarChart3, Download, X } from "lucide-react";
import {
  exportDailyGroupEffectif,
  generateEffectifFilename,
} from "@/lib/effectifExporter";
import { translations } from "@/i18n/translations";

export default function GroupsOverview() {
  const [filters, setFilters] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});
  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [exportStartDate, setExportStartDate] = useState<string>("");
  const [exportEndDate, setExportEndDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedQZ, setSelectedQZ] = useState<"all" | "QZ1" | "QZ2">("all");
  const [exportYear, setExportYear] = useState<string>(
    String(new Date().getFullYear()),
  );
  const [exportMonth, setExportMonth] = useState<string>("01");
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  // Set the indeterminate property on the checkbox
  useEffect(() => {
    if (
      selectAllCheckboxRef.current &&
      showExportModal &&
      Object.keys(stats.groups).length > 0
    ) {
      const filteredGroups = getFilteredGroups();
      const allSelected = filteredGroups.every((g) => selectedGroups.has(g));
      const someSelected =
        filteredGroups.some((g) => selectedGroups.has(g)) && !allSelected;

      selectAllCheckboxRef.current.checked = allSelected;
      selectAllCheckboxRef.current.indeterminate = someSelected;
    }
  }, [
    selectedGroups,
    searchQuery,
    selectedQZ,
    exportYear,
    exportMonth,
    showExportModal,
  ]);

  const {
    stats,
    loading: statsLoading,
    error: statsError,
  } = useWorkerStats(filters);
  const { pointages, loading: pointagesLoading } = usePointages(filters);

  const handleFilterChange = (startDate?: string, endDate?: string) => {
    setFilters({ startDate, endDate });
  };

  const handleDownloadEffectif = () => {
    setSelectedGroups(new Set(Object.keys(stats.groups)));
    setExportStartDate("");
    setExportEndDate("");
    setSearchQuery("");
    setSelectedQZ("all");
    setExportYear(String(new Date().getFullYear()));
    setExportMonth("01");
    setShowExportModal(true);
  };

  const handleConfirmDownload = async () => {
    try {
      if (selectedGroups.size === 0) {
        alert(translations.selectAtLeastOneGroup);
        return;
      }

      let startDate = exportStartDate;
      let endDate = exportEndDate;

      // If QZ is selected, use year/month/QZ to determine date range
      if (selectedQZ !== "all") {
        const dateRange = getDateRangeFromYearMonthQZ();
        startDate = dateRange.start;
        endDate = dateRange.end;
      }

      if (!startDate || !endDate) {
        alert(translations.pleaseSelectBothDates);
        return;
      }

      if (startDate > endDate) {
        alert(translations.startDateMustBeforeEndDate);
        return;
      }

      setExporting(true);

      // Filter pointages by selected groups and dates
      const filteredPointages = pointages.filter(
        (p) =>
          selectedGroups.has(p.group) &&
          p.date >= startDate &&
          p.date <= endDate,
      );

      if (filteredPointages.length === 0) {
        alert(translations.noDataFoundForSelectedGroups);
        return;
      }

      const filename = generateEffectifFilename(startDate, endDate);
      exportDailyGroupEffectif(filteredPointages, filename);

      setShowExportModal(false);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : translations.failedToExportEffectif,
      );
    } finally {
      setExporting(false);
    }
  };

  const toggleGroupSelection = (groupName: string) => {
    const newSelected = new Set(selectedGroups);
    if (newSelected.has(groupName)) {
      newSelected.delete(groupName);
    } else {
      newSelected.add(groupName);
    }
    setSelectedGroups(newSelected);
  };

  const calculateGroupStats = (groupName: string) => {
    const groupPointages = pointages.filter((p) => p.group === groupName);
    const totalHours = groupPointages.reduce((sum, p) => sum + p.hours, 0);
    const uniqueWorkers = new Set(groupPointages.map((p) => p.matricule)).size;
    const workingDays = new Set(groupPointages.map((p) => p.date)).size;

    return {
      totalHours,
      uniqueWorkers,
      workingDays,
      recordCount: groupPointages.length,
    };
  };

  const getDateRangeFromYearMonthQZ = () => {
    const year = exportYear;
    const month = exportMonth;

    if (selectedQZ === "QZ1") {
      return {
        start: `${year}-${month}-01`,
        end: `${year}-${month}-15`,
      };
    } else if (selectedQZ === "QZ2") {
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      return {
        start: `${year}-${month}-16`,
        end: `${year}-${month}-${String(lastDay).padStart(2, "0")}`,
      };
    }
    return { start: "", end: "" };
  };

  const getFilteredGroups = () => {
    let filtered = Object.keys(stats.groups);

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((group) =>
        group.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Filter by QZ if selected
    if (selectedQZ !== "all") {
      const dateRange = getDateRangeFromYearMonthQZ();
      if (dateRange.start && dateRange.end) {
        filtered = filtered.filter((group) => {
          const groupPointages = pointages.filter((p) => p.group === group);
          const hasQZData = groupPointages.some((p) => {
            const day = parseInt(p.date.split("-")[2]);
            if (selectedQZ === "QZ1") {
              return day >= 1 && day <= 15;
            } else {
              return day >= 16;
            }
          });
          return hasQZData;
        });
      }
    }

    return filtered.sort();
  };

  if (statsError) {
    return (
      <div className="p-6">
        <ErrorAlert error={statsError} />
      </div>
    );
  }

  const loading = statsLoading || pointagesLoading;

  return (
    <div className="space-y-6">
      {/* Download Button */}
      <div className="flex justify-end mb-6">
        <Button
          onClick={handleDownloadEffectif}
          disabled={exporting || pointages.length === 0}
          className="bg-primary hover:bg-primary/90"
        >
          <Download className="w-4 h-4 mr-2" />
          {exporting
            ? translations.exporting
            : translations.downloadDailyEffectif}
        </Button>
      </div>

      {/* Unified Filter */}
      <UnifiedFilter onFilterChange={handleFilterChange} />

      {/* Groups List */}
      {loading ? (
        <LoadingSpinner text={translations.loadingGroupsData} />
      ) : Object.keys(stats.groups).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(stats.groups)
            .sort(([, a], [, b]) => b.count - a.count)
            .map(([groupName, groupData]) => {
              const groupStats = calculateGroupStats(groupName);

              return (
                <Card
                  key={groupName}
                  className="p-6 hover:shadow-lg transition-shadow border-l-4 border-l-primary"
                >
                  <div className="space-y-4">
                    {/* Group Name and Worker Count */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-primary">
                          {groupName}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {translations.teamEncargado}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg">
                        <Users className="w-5 h-5 text-primary" />
                        <span className="text-2xl font-bold text-primary">
                          {groupStats.uniqueWorkers}
                        </span>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          {translations.totalHoursLabel}
                        </p>
                        <p className="text-xl font-bold">
                          {groupStats.totalHours.toFixed(1)}h
                        </p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          {translations.workingDaysLabel}
                        </p>
                        <p className="text-xl font-bold">
                          {groupStats.workingDays}
                        </p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          {translations.totalRecords}
                        </p>
                        <p className="text-xl font-bold">
                          {groupStats.recordCount}
                        </p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          {translations.avgHoursPerDay}
                        </p>
                        <p className="text-xl font-bold">
                          {groupStats.workingDays > 0
                            ? (
                                groupStats.totalHours / groupStats.workingDays
                              ).toFixed(1)
                            : 0}
                          h
                        </p>
                      </div>
                    </div>

                    {/* Efficiency Bar */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          {translations.averageWorkerUtilization}
                        </span>
                        <span className="text-sm font-semibold text-primary">
                          {groupStats.uniqueWorkers > 0
                            ? (
                                (groupStats.totalHours /
                                  (groupStats.workingDays *
                                    groupStats.uniqueWorkers *
                                    8)) *
                                100
                              ).toFixed(0)
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                          style={{
                            width: `${
                              groupStats.uniqueWorkers > 0
                                ? Math.min(
                                    100,
                                    (groupStats.totalHours /
                                      (groupStats.workingDays *
                                        groupStats.uniqueWorkers *
                                        8)) *
                                      100,
                                  )
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">{translations.noGroupsFound2}</p>
        </Card>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between sticky top-0 bg-card pb-4">
              <h2 className="text-lg sm:text-2xl font-bold">
                {translations.downloadDailyEffectifModal}
              </h2>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1 hover:bg-muted rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search and Filter Controls */}
            <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  {translations.searchGroups}
                </label>
                <input
                  type="text"
                  placeholder={translations.searchByGroupName}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    {translations.year}
                  </label>
                  <select
                    value={exportYear}
                    onChange={(e) => setExportYear(e.target.value)}
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
                  <label className="block text-sm font-semibold mb-2">
                    {translations.month}
                  </label>
                  <select
                    value={exportMonth}
                    onChange={(e) => setExportMonth(e.target.value)}
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
                  <label className="block text-sm font-semibold mb-2">
                    {translations.period}
                  </label>
                  <select
                    value={selectedQZ}
                    onChange={(e) =>
                      setSelectedQZ(e.target.value as "all" | "QZ1" | "QZ2")
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
                  >
                    <option value="all">{translations.allPeriods}</option>
                    <option value="QZ1">{translations.qz1Days}</option>
                    <option value="QZ2">{translations.qz2Days}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Automatic Date Range Display */}
            {selectedQZ !== "all" && (
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-semibold mb-3 text-foreground">
                  {translations.dateRangeFor} {exportMonth}/{exportYear}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {translations.startDate}
                    </p>
                    <p className="text-lg font-bold text-foreground">
                      {`${selectedQZ === "QZ1" ? "1" : "16"}/${exportMonth}/${exportYear}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {translations.endDate}
                    </p>
                    <p className="text-lg font-bold text-foreground">
                      {selectedQZ === "QZ1"
                        ? `15/${exportMonth}/${exportYear}`
                        : `${new Date(parseInt(exportYear), parseInt(exportMonth), 0).getDate()}/${exportMonth}/${exportYear}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Manual Date Range (shown when "All Periods" is selected) */}
            {selectedQZ === "all" && (
              <div className="space-y-3">
                <p className="font-semibold">{translations.dateRangeFor}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {translations.startDate}
                    </label>
                    <input
                      type="date"
                      value={exportStartDate}
                      onChange={(e) => setExportStartDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={exportEndDate}
                      onChange={(e) => setExportEndDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Groups Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold">
                  Select Groups:{" "}
                  <span className="text-muted-foreground font-normal text-sm">
                    ({getFilteredGroups().length} available)
                  </span>
                </p>
                {getFilteredGroups().length > 0 && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      ref={selectAllCheckboxRef}
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          // Select all filtered groups
                          const newSelected = new Set(selectedGroups);
                          getFilteredGroups().forEach((g) =>
                            newSelected.add(g),
                          );
                          setSelectedGroups(newSelected);
                        } else {
                          // Unselect all filtered groups
                          const newSelected = new Set(selectedGroups);
                          getFilteredGroups().forEach((g) =>
                            newSelected.delete(g),
                          );
                          setSelectedGroups(newSelected);
                        }
                      }}
                      className="w-4 h-4 rounded border-input"
                    />
                    <span className="text-sm font-medium">Select All</span>
                  </label>
                )}
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto bg-muted p-3 rounded-lg">
                {getFilteredGroups().length > 0 ? (
                  getFilteredGroups().map((groupName) => (
                    <label
                      key={groupName}
                      className="flex items-center gap-3 p-2 hover:bg-background rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedGroups.has(groupName)}
                        onChange={() => toggleGroupSelection(groupName)}
                        className="w-4 h-4 rounded border-input"
                      />
                      <span className="text-sm">{groupName}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No groups match your search criteria
                  </p>
                )}
              </div>
            </div>

            {/* Selection Summary */}
            {selectedGroups.size > 0 && (
              <div className="bg-primary/10 p-3 rounded-lg text-sm">
                <p className="text-foreground">
                  <strong>Summary:</strong> {selectedGroups.size} group
                  {selectedGroups.size !== 1 ? "s" : ""} selected
                  {selectedQZ !== "all" &&
                    ` • ${exportMonth}/${exportYear} ${selectedQZ}`}
                  {exportStartDate &&
                    exportEndDate &&
                    !selectedQZ &&
                    ` • ${exportStartDate} to ${exportEndDate}`}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowExportModal(false)}
                disabled={exporting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDownload}
                disabled={
                  exporting ||
                  selectedGroups.size === 0 ||
                  (selectedQZ === "all" && (!exportStartDate || !exportEndDate))
                }
                className="bg-primary hover:bg-primary/90"
              >
                {exporting ? "Exporting..." : "Download Effectif"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
