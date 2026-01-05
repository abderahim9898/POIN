import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UnifiedFilter } from "@/components/UnifiedFilter";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorAlert } from "@/components/ErrorAlert";
import { EditWorkerModal } from "@/components/EditWorkerModal";
import { ManageAttendanceModal } from "@/components/ManageAttendanceModal";
import { useWorkerSearch, usePointages } from "@/hooks/usePointages";
import {
  Search,
  User,
  Calendar,
  Clock,
  GitBranch,
  ChevronDown,
  ChevronUp,
  Download,
  ChevronLeft,
  ChevronRight,
  Edit2,
  CheckCircle,
} from "lucide-react";
import { exportWorkerPointage } from "@/lib/effectifExporter";
import { translations } from "@/i18n/translations";

const WORKERS_PER_PAGE = 20;

export default function WorkerSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});
  const [expandedWorker, setExpandedWorker] = useState<string | null>(null);
  const [downloadingWorker, setDownloadingWorker] = useState<string | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [selectedWorkerMatricule, setSelectedWorkerMatricule] = useState<
    string | null
  >(null);
  const [selectedWorkerName, setSelectedWorkerName] = useState<string | null>(
    null,
  );
  const [selectedWorkerGroup, setSelectedWorkerGroup] = useState<string | null>(
    null,
  );
  const [selectedWorkerAttendances, setSelectedWorkerAttendances] = useState<
    any[]
  >([]);
  const {
    results: searchResults,
    loading: searchLoading,
    error: searchError,
  } = useWorkerSearch(searchQuery, filters);
  const { pointages, loading: pointagesLoading } = usePointages(filters);

  const handleDownloadWorkerPointage = async (
    matricule: string,
    workerName: string,
    attendances: typeof pointages,
  ) => {
    try {
      setDownloadingWorker(matricule);
      exportWorkerPointage(attendances, workerName, matricule);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to download worker pointage",
      );
    } finally {
      setDownloadingWorker(null);
    }
  };

  const handleOpenEditModal = (
    matricule: string,
    name: string,
    group: string,
  ) => {
    setSelectedWorkerMatricule(matricule);
    setSelectedWorkerName(name);
    setSelectedWorkerGroup(group);
    setEditModalOpen(true);
  };

  const handleOpenAttendanceModal = (
    matricule: string,
    name: string,
    attendances: any[],
  ) => {
    setSelectedWorkerMatricule(matricule);
    setSelectedWorkerName(name);
    setSelectedWorkerAttendances(attendances);
    setAttendanceModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
  };

  const handleCloseAttendanceModal = () => {
    setAttendanceModalOpen(false);
  };

  const handleCloseAllModals = () => {
    setEditModalOpen(false);
    setAttendanceModalOpen(false);
    setSelectedWorkerMatricule(null);
    setSelectedWorkerName(null);
    setSelectedWorkerGroup(null);
    setSelectedWorkerAttendances([]);
  };

  const handleEditModalSuccess = () => {
    // Keep edit modal open, just refresh data
    setSearchQuery("");
    setFilters({});
  };

  const handleAttendanceModalSuccess = () => {
    // Keep attendance modal open, just refresh data
    setSearchQuery("");
    setFilters({});
  };

  // Show all workers by default, or filtered results if searching
  const getWorkerResults = () => {
    if (searchQuery.trim().length > 0) {
      return searchResults;
    }

    // Show all workers grouped by matricule
    const groupedByWorker: Record<
      string,
      { name: string; attendances: typeof pointages }
    > = {};

    pointages.forEach((p) => {
      if (!groupedByWorker[p.matricule]) {
        groupedByWorker[p.matricule] = { name: p.name, attendances: [] };
      }
      groupedByWorker[p.matricule].attendances.push(p);
    });

    return groupedByWorker;
  };

  const allWorkers = Object.entries(getWorkerResults());
  const hasSearched = searchQuery.trim().length > 0;
  const isLoading = searchLoading || pointagesLoading;

  // Pagination calculations
  const totalPages = Math.ceil(allWorkers.length / WORKERS_PER_PAGE);
  const startIndex = (currentPage - 1) * WORKERS_PER_PAGE;
  const endIndex = startIndex + WORKERS_PER_PAGE;
  const workerList = allWorkers.slice(startIndex, endIndex);

  // Handle filter/search changes with pagination reset
  const onFilterChange = (startDate?: string, endDate?: string) => {
    setFilters({ startDate, endDate });
    setCurrentPage(1);
  };

  const onSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Search Box */}
      <Card className="p-6">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">
              {translations.searchByMatriculeOrName}
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder={translations.enterWorkerIdOrName}
                  value={searchQuery}
                  onChange={(e) => onSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchQuery && (
                <Button
                  variant="outline"
                  onClick={() => onSearch("")}
                  className="px-4"
                >
                  {translations.clear}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Unified Filter */}
      <UnifiedFilter onFilterChange={onFilterChange} />

      {/* Error */}
      {searchError && <ErrorAlert error={searchError} />}

      {/* Results */}
      {isLoading ? (
        <LoadingSpinner
          text={
            hasSearched
              ? translations.searchingWorkers
              : translations.loadingWorkers
          }
        />
      ) : workerList.length === 0 && allWorkers.length === 0 ? (
        <Card className="p-12 text-center">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">
            {hasSearched
              ? `${translations.noWorkersMatching} "${searchQuery}"`
              : translations.noWorkersFound}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {workerList.map(([matricule, worker]) => {
            const totalHours = worker.attendances.reduce(
              (sum, a) => sum + a.hours,
              0,
            );
            const totalDays = worker.attendances.length;
            const avgHoursPerDay = totalDays > 0 ? totalHours / totalDays : 0;
            const groups = new Set(worker.attendances.map((a) => a.group));
            const isExpanded = expandedWorker === matricule;

            return (
              <div key={matricule}>
                {/* Worker Summary Card - Clickable */}
                <Card
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary"
                  onClick={() =>
                    setExpandedWorker(isExpanded ? null : matricule)
                  }
                >
                  <div className="space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-primary truncate">
                        {worker.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        ID: {matricule}
                      </p>
                    </div>

                    {/* Summary Stats - Responsive */}
                    <div className="grid grid-cols-3 gap-4 md:flex md:items-center md:gap-6 md:mr-4">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Days</p>
                        <p className="text-lg font-bold">{totalDays}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Hours</p>
                        <p className="text-lg font-bold">
                          {totalHours.toFixed(1)}h
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Groups</p>
                        <p className="text-lg font-bold">{groups.size}</p>
                      </div>
                    </div>

                    {/* Action Buttons - Responsive */}
                    <div className="flex items-center gap-2 md:gap-2 flex-wrap md:flex-nowrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(matricule, worker.name, Array.from(groups)[0] || "");
                        }}
                        className="flex gap-2 flex-1 md:flex-none justify-center"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span className="hidden sm:inline">
                          {translations.edit}
                        </span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAttendanceModal(
                            matricule,
                            worker.name,
                            worker.attendances,
                          );
                        }}
                        className="flex gap-2 flex-1 md:flex-none justify-center"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">
                          {translations.attendance}
                        </span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadWorkerPointage(
                            matricule,
                            worker.name,
                            worker.attendances,
                          );
                        }}
                        disabled={downloadingWorker === matricule}
                        className="flex gap-2 flex-1 md:flex-none justify-center"
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">
                          {downloadingWorker === matricule
                            ? translations.downloading
                            : "Télécharger"}
                        </span>
                      </Button>
                      <div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Expanded Details */}
                {isExpanded && (
                  <Card className="mt-2 p-6 border-l-4 border-l-secondary">
                    <div className="space-y-6">
                      {/* Groups Badges */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2">
                          {translations.groupsAssigned}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {Array.from(groups).map((group) => (
                            <span
                              key={group}
                              className="px-3 py-1 bg-secondary/20 text-secondary text-sm font-medium rounded-full"
                            >
                              {group}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Detailed Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            <p className="text-xs font-medium text-muted-foreground">
                              {translations.workingDaysLabel}
                            </p>
                          </div>
                          <p className="text-2xl font-bold">{totalDays}</p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-primary" />
                            <p className="text-xs font-medium text-muted-foreground">
                              {translations.totalHours}
                            </p>
                          </div>
                          <p className="text-2xl font-bold">
                            {totalHours.toFixed(1)}h
                          </p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-primary" />
                            <p className="text-xs font-medium text-muted-foreground">
                              {translations.avgHoursPerDay}
                            </p>
                          </div>
                          <p className="text-2xl font-bold">
                            {avgHoursPerDay.toFixed(1)}h
                          </p>
                        </div>
                      </div>

                      {/* Attendance Table / Card List */}
                      <div>
                        <h4 className="font-semibold mb-4">
                          {translations.attendanceRecords} ({totalDays})
                        </h4>
                        {/* Desktop Table */}
                        <div className="hidden md:block border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted">
                                <TableHead>{translations.date}</TableHead>
                                <TableHead>{translations.groups}</TableHead>
                                <TableHead className="text-right">
                                  {translations.hours}
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {worker.attendances
                                .sort((a, b) => b.date.localeCompare(a.date))
                                .map((attendance) => (
                                  <TableRow
                                    key={`${matricule}-${attendance.date}`}
                                  >
                                    <TableCell className="font-medium">
                                      {new Date(
                                        attendance.date,
                                      ).toLocaleDateString("fr-FR", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </TableCell>
                                    <TableCell>{attendance.group}</TableCell>
                                    <TableCell className="text-right font-semibold">
                                      {attendance.hours}h
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Mobile Card List */}
                        <div className="md:hidden space-y-2">
                          {worker.attendances
                            .sort((a, b) => b.date.localeCompare(a.date))
                            .map((attendance) => (
                              <div
                                key={`${matricule}-${attendance.date}`}
                                className="p-4 border rounded-lg bg-muted/30 space-y-2"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                      {translations.date}
                                    </p>
                                    <p className="font-semibold text-foreground">
                                      {new Date(
                                        attendance.date,
                                      ).toLocaleDateString("fr-FR", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs font-medium text-muted-foreground">
                                      {translations.hours}
                                    </p>
                                    <p className="text-lg font-bold text-primary">
                                      {attendance.hours}h
                                    </p>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">
                                    {translations.groups}
                                  </p>
                                  <p className="text-sm text-foreground">
                                    {attendance.group}
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            );
          })}

          {/* Pagination Controls */}
          {allWorkers.length > WORKERS_PER_PAGE && (
            <div className="flex items-center justify-between mt-8 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {translations.previous}
                </Button>
                <div className="px-4 py-2 text-sm font-medium">
                  {translations.pageOf} {currentPage} {translations.of}{" "}
                  {totalPages}
                </div>
                <Button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                >
                  {translations.next}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                {translations.showingOf} {startIndex + 1}-
                {Math.min(endIndex, allWorkers.length)} {translations.of}{" "}
                {allWorkers.length} {translations.workers}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {selectedWorkerMatricule && selectedWorkerName && (
        <>
          <EditWorkerModal
            open={editModalOpen}
            onOpenChange={handleCloseEditModal}
            matricule={selectedWorkerMatricule}
            name={selectedWorkerName}
            group={selectedWorkerGroup || ""}
            onSuccess={handleEditModalSuccess}
          />

          <ManageAttendanceModal
            open={attendanceModalOpen}
            onOpenChange={handleCloseAttendanceModal}
            matricule={selectedWorkerMatricule}
            name={selectedWorkerName}
            attendances={selectedWorkerAttendances}
            onSuccess={handleAttendanceModalSuccess}
          />
        </>
      )}
    </div>
  );
}
