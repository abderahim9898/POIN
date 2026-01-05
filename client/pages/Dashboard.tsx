import { useState } from "react";
import { Users, Calendar, Clock, GitBranch } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { UnifiedFilter } from "@/components/UnifiedFilter";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorAlert } from "@/components/ErrorAlert";
import { useWorkerStats } from "@/hooks/usePointages";
import { translations } from "@/i18n/translations";

export default function Dashboard() {
  const [filters, setFilters] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});
  const { stats, loading, error } = useWorkerStats(filters);

  const handleFilterChange = (startDate?: string, endDate?: string) => {
    setFilters({ startDate, endDate });
  };

  if (error) {
    return (
      <div className="p-6">
        <ErrorAlert error={error} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Unified Filter */}
      <UnifiedFilter onFilterChange={handleFilterChange} />

      {/* Stats Grid */}
      {loading ? (
        <LoadingSpinner text={translations.loadingStatistics} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={translations.totalWorkers}
            value={stats.totalWorkers}
            icon={<Users className="w-6 h-6" />}
            description={translations.uniqueWorkers}
          />
          <StatCard
            title={translations.workingDays}
            value={stats.totalDays}
            icon={<Calendar className="w-6 h-6" />}
            description={translations.daysWithRecords}
          />
          <StatCard
            title={translations.totalHours}
            value={stats.totalHours.toFixed(1)}
            icon={<Clock className="w-6 h-6" />}
            description={translations.hoursWorked}
          />
          <StatCard
            title={translations.totalGroups}
            value={stats.totalGroups}
            icon={<GitBranch className="w-6 h-6" />}
            description={translations.teamsEncargados}
          />
        </div>
      )}

      {/* Groups Breakdown */}
      <div className="bg-card rounded-lg border p-6">
        {loading ? (
          <LoadingSpinner text={translations.loadingGroups} />
        ) : Object.keys(stats.groups).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stats.groups).map(([groupName, groupData]) => (
              <div
                key={groupName}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-lg text-primary">
                  {groupName}
                </h3>
                <p className="text-3xl font-bold mt-2">{groupData.count}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {translations.uniqueWorkers}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>{translations.noGroupsFound}</p>
          </div>
        )}
      </div>
    </div>
  );
}
