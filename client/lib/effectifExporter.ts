import * as XLSX from "xlsx";
import { Pointage } from "@/hooks/usePointages";

export interface DailyGroupEffectif {
  date: string;
  [groupName: string]: string | number;
}

export const exportDailyGroupEffectif = (
  pointages: Pointage[],
  filename: string = "daily_group_effectif.xlsx",
) => {
  if (pointages.length === 0) {
    throw new Error("No pointage records to export");
  }

  // Build daily group effectif (count of unique workers per group per day)
  const effectifMap: Record<string, Record<string, Set<string>>> = {};
  const allGroups = new Set<string>();

  pointages.forEach((p) => {
    if (!effectifMap[p.date]) {
      effectifMap[p.date] = {};
    }
    if (!effectifMap[p.date][p.group]) {
      effectifMap[p.date][p.group] = new Set();
    }
    effectifMap[p.date][p.group].add(p.matricule);
    allGroups.add(p.group);
  });

  // Convert to sorted array with group counts
  const groupsArray = Array.from(allGroups).sort();
  const excelData: DailyGroupEffectif[] = [];

  const sortedDates = Object.keys(effectifMap).sort();
  sortedDates.forEach((date) => {
    const row: DailyGroupEffectif = { date };
    groupsArray.forEach((group) => {
      row[group] = effectifMap[date][group]?.size || 0;
    });
    excelData.push(row);
  });

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  const columnWidths = [
    { wch: 12 }, // Date
    ...groupsArray.map(() => ({ wch: 15 })), // Groups
  ];
  worksheet["!cols"] = columnWidths;

  // Style header row (optional - XLSX has limited styling)
  // We'll just use bold formatting by freezing the first row
  worksheet["!freeze"] = ["1A"];

  XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Effectif");

  // Generate and download file
  XLSX.writeFile(workbook, filename);
};

export const generateEffectifFilename = (
  startDate?: string,
  endDate?: string,
): string => {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];

  if (startDate && endDate) {
    return `daily_effectif_${startDate}_to_${endDate}.xlsx`;
  }
  return `daily_effectif_${dateStr}.xlsx`;
};

export const exportWorkerPointage = (
  pointages: Pointage[],
  workerName: string,
  matricule: string,
) => {
  if (pointages.length === 0) {
    throw new Error("No attendance records to export");
  }

  // Sort by date (most recent first)
  const sortedPointages = [...pointages].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  // Convert to Excel format
  const excelData = sortedPointages.map((p) => ({
    Date: new Date(p.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    Group: p.group,
    Hours: p.hours,
  }));

  // Add summary row at the end
  const totalHours = pointages.reduce((sum, p) => sum + p.hours, 0);
  excelData.push({
    Date: "TOTAL",
    Group: "-",
    Hours: totalHours,
  });

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  worksheet["!cols"] = [
    { wch: 15 }, // Date
    { wch: 15 }, // Group
    { wch: 10 }, // Hours
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, "Pointage");

  // Generate filename
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const filename = `${workerName}_${matricule}_pointage_${dateStr}.xlsx`;

  // Download file
  XLSX.writeFile(workbook, filename);
};
