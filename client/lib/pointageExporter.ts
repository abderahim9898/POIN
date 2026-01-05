import * as XLSX from "xlsx";
import { Pointage } from "@/hooks/usePointages";

export const exportPointagesToExcel = (
  pointages: Pointage[],
  filename: string = "pointages.xlsx",
) => {
  if (pointages.length === 0) {
    throw new Error("No pointage records to export");
  }

  // Prepare data for Excel
  const excelData = pointages.map((p) => ({
    "Matricule/ID": p.matricule,
    Name: p.name,
    Group: p.group,
    Date: p.date,
    Hours: p.hours,
  }));

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  const columnWidths = [
    { wch: 15 }, // Matricule/ID
    { wch: 25 }, // Name
    { wch: 20 }, // Group
    { wch: 12 }, // Date
    { wch: 10 }, // Hours
  ];
  worksheet["!cols"] = columnWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, "Pointages");

  // Generate and download file
  XLSX.writeFile(workbook, filename);
};

export const generateExportFilename = (
  startDate?: string,
  endDate?: string,
): string => {
  const now = new Date();
  if (startDate && endDate && startDate !== endDate) {
    return `pointages_${startDate}_to_${endDate}.xlsx`;
  }
  const dateStr = startDate || now.toISOString().split("T")[0];
  return `pointages_${dateStr}.xlsx`;
};
