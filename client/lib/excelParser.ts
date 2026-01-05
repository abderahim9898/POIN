import * as XLSX from "xlsx";

export interface ParsedPointage {
  matricule: string;
  name: string;
  group: string;
  date: string;
  hours: number;
}

export interface ColumnMapping {
  matricule: number;
  name: number;
  group: number;
  date: number;
  hours: number;
}

// Column name aliases - supports multiple language/naming conventions
const COLUMN_ALIASES: Record<string, string[]> = {
  matricule: ["matricule", "codigi", "id", "worker_id", "employee_id"],
  name: ["name", "nombre", "full_name", "employee_name"],
  group: ["group", "encargado", "team", "department", "groupe"],
  date: ["date", "fecha", "date_work"],
  hours: ["hours", "rhhh", "h", "horas", "heures"],
};

const normalizeColumnName = (col: string): string | null => {
  const lowerCol = col.toLowerCase().trim();

  for (const [standard, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (aliases.includes(lowerCol)) {
      return standard;
    }
  }

  return null;
};

const mapColumns = (
  firstRow: Record<string, unknown>,
): Record<string, string> | null => {
  const columnMap: Record<string, string> = {};
  const requiredColumns = ["matricule", "name", "group", "date", "hours"];
  const foundColumns = new Set<string>();

  // Map Excel columns to standard column names
  for (const excelCol of Object.keys(firstRow)) {
    const normalized = normalizeColumnName(excelCol);
    if (normalized && requiredColumns.includes(normalized)) {
      columnMap[normalized] = excelCol;
      foundColumns.add(normalized);
    }
  }

  // Check if all required columns were found
  const missingColumns = requiredColumns.filter(
    (col) => !foundColumns.has(col),
  );
  if (missingColumns.length > 0) {
    return null;
  }

  return columnMap;
};

export const getExcelPreview = async (
  file: File,
): Promise<{ headers: string[]; rows: string[][] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        // Get raw data
        const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
        const headers: string[] = [];
        const rows: string[][] = [];

        // Extract headers (first row)
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
          const cell = worksheet[cellAddress];
          headers.push(cell?.v?.toString() || `Column ${col + 1}`);
        }

        // Extract first 5 data rows for preview
        for (let row = 1; row <= Math.min(5, range.e.r); row++) {
          const rowData: string[] = [];
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
            const cell = worksheet[cellAddress];
            rowData.push(cell?.v?.toString() || "");
          }
          rows.push(rowData);
        }

        resolve({ headers, rows });
      } catch (error) {
        reject(
          error instanceof Error ? error : new Error("Failed to read file"),
        );
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsBinaryString(file);
  });
};

export const getCSVPreview = async (
  file: File,
): Promise<{ headers: string[]; rows: string[][] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter((line) => line.trim());

        if (lines.length < 1) {
          reject(new Error("CSV file is empty"));
          return;
        }

        const headers = lines[0].split(",").map((h) => h.trim());
        const rows = lines
          .slice(1, 6)
          .map((line) => line.split(",").map((cell) => cell.trim()));

        resolve({ headers, rows });
      } catch (error) {
        reject(
          error instanceof Error ? error : new Error("Failed to read CSV"),
        );
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsText(file);
  });
};

export const parseExcelFileWithMapping = async (
  file: File,
  columnMapping: ColumnMapping,
  skipFirstRow: boolean = false,
): Promise<ParsedPointage[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");

        const parsed: ParsedPointage[] = [];

        // Parse rows using column indices
        const startRow = skipFirstRow ? 2 : 1;
        for (let row = startRow; row <= range.e.r; row++) {
          const matricule = getCellValue(
            worksheet,
            row,
            columnMapping.matricule,
          ).trim();
          const name = getCellValue(worksheet, row, columnMapping.name).trim();
          const group = getCellValue(
            worksheet,
            row,
            columnMapping.group,
          ).trim();
          const dateStr = getCellValue(
            worksheet,
            row,
            columnMapping.date,
          ).trim();
          const hoursStr = getCellValue(
            worksheet,
            row,
            columnMapping.hours,
          ).trim();
          const hours = parseFloat(hoursStr);

          if (!matricule || !name || !group || !dateStr || isNaN(hours)) {
            continue;
          }

          const formattedDate = formatDate(dateStr);
          if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
            continue;
          }

          parsed.push({
            matricule,
            name,
            group,
            date: formattedDate,
            hours: Math.round(hours * 100) / 100,
          });
        }

        if (parsed.length === 0) {
          reject(new Error("No valid pointage records found in the file"));
          return;
        }

        resolve(parsed);
      } catch (error) {
        reject(
          error instanceof Error
            ? error
            : new Error("Failed to parse Excel file"),
        );
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsBinaryString(file);
  });
};

const getCellValue = (
  worksheet: XLSX.WorkSheet,
  row: number,
  col: number,
): string => {
  const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
  const cell = worksheet[cellAddress];
  return cell?.v?.toString() || "";
};

export const parseExcelFile = async (
  file: File,
  skipFirstRow: boolean = false,
): Promise<ParsedPointage[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Validate required columns
        if (jsonData.length === 0) {
          reject(new Error("Excel file is empty"));
          return;
        }

        const firstRow = jsonData[0] as Record<string, unknown>;
        const columnMap = mapColumns(firstRow);

        if (!columnMap) {
          reject(
            new Error(
              `Missing required columns. Expected columns like: matricule/codigi, name/nombre, group/encargado, date/fecha, hours/rhhh`,
            ),
          );
          return;
        }

        // Parse and validate data
        const parsed: ParsedPointage[] = [];
        const startIndex = skipFirstRow ? 1 : 0;

        for (let i = startIndex; i < jsonData.length; i++) {
          const row = jsonData[i];
          const pointage = row as Record<string, unknown>;

          const matricule = String(pointage[columnMap.matricule] || "").trim();
          const name = String(pointage[columnMap.name] || "").trim();
          const group = String(pointage[columnMap.group] || "").trim();
          const dateStr = String(pointage[columnMap.date] || "").trim();
          const hours = parseFloat(String(pointage[columnMap.hours] || 0));

          if (!matricule || !name || !group || !dateStr || isNaN(hours)) {
            console.warn("Skipping invalid row:", pointage);
            continue;
          }

          // Validate date format (YYYY-MM-DD)
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          const formattedDate = formatDate(dateStr);

          if (!dateRegex.test(formattedDate)) {
            console.warn("Invalid date format for row:", pointage);
            continue;
          }

          parsed.push({
            matricule,
            name,
            group,
            date: formattedDate,
            hours: Math.round(hours * 100) / 100,
          });
        }

        if (parsed.length === 0) {
          reject(new Error("No valid pointage records found in the file"));
          return;
        }

        resolve(parsed);
      } catch (error) {
        reject(
          error instanceof Error
            ? error
            : new Error("Failed to parse Excel file"),
        );
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsBinaryString(file);
  });
};

const formatDate = (dateStr: string): string => {
  const trimmed = dateStr.trim();

  // Try YYYY-MM-DD format first (already correct)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Check if it's an Excel serial date (number)
  const excelDate = parseFloat(trimmed);
  if (!isNaN(excelDate) && excelDate > 0 && excelDate < 100000) {
    // Excel serial date: 1 = January 1, 1900
    // Convert to JavaScript Date
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    if (!isNaN(date.getTime())) {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }

  // Support MM/DD/YYYY or MM-DD-YYYY format
  const dateMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dateMatch) {
    const month = dateMatch[1].padStart(2, "0");
    const day = dateMatch[2].padStart(2, "0");
    const year = dateMatch[3];

    // Validate that this creates a valid date
    const testDate = new Date(`${year}-${month}-${day}`);
    if (!isNaN(testDate.getTime())) {
      return `${year}-${month}-${day}`;
    }
  }

  // If all else fails, return as-is (will be caught by validation)
  return trimmed;
};

export const parseCSVFileWithMapping = async (
  file: File,
  columnMapping: ColumnMapping,
  skipFirstRow: boolean = false,
): Promise<ParsedPointage[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter((line) => line.trim());

        if (lines.length < 2) {
          reject(new Error("CSV file has no data rows"));
          return;
        }

        const parsed: ParsedPointage[] = [];

        // Parse data rows using column indices
        const startIndex = skipFirstRow ? 2 : 1;
        for (let i = startIndex; i < lines.length; i++) {
          const values = lines[i].split(",").map((v) => v.trim());

          const matricule = values[columnMapping.matricule] || "";
          const name = values[columnMapping.name] || "";
          const group = values[columnMapping.group] || "";
          const dateStr = values[columnMapping.date] || "";
          const hoursStr = values[columnMapping.hours] || "";
          const hours = parseFloat(hoursStr);

          if (!matricule || !name || !group || !dateStr || isNaN(hours)) {
            continue;
          }

          const formattedDate = formatDate(dateStr);
          if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
            continue;
          }

          parsed.push({
            matricule,
            name,
            group,
            date: formattedDate,
            hours: Math.round(hours * 100) / 100,
          });
        }

        if (parsed.length === 0) {
          reject(new Error("No valid pointage records found in the file"));
          return;
        }

        resolve(parsed);
      } catch (error) {
        reject(
          error instanceof Error
            ? error
            : new Error("Failed to parse CSV file"),
        );
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsText(file);
  });
};

export const parseCSVFile = async (
  file: File,
  skipFirstRow: boolean = false,
): Promise<ParsedPointage[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter((line) => line.trim());

        if (lines.length < 2) {
          reject(new Error("CSV file is empty or has no data rows"));
          return;
        }

        // Parse header
        const headerLine = lines[0].split(",").map((h) => h.trim());
        const requiredColumns = ["matricule", "name", "group", "date", "hours"];

        // Create column index map with aliases support
        const columnIndexes: Record<string, number> = {};
        const foundColumns = new Set<string>();

        headerLine.forEach((header, index) => {
          const normalized = normalizeColumnName(header);
          if (normalized && requiredColumns.includes(normalized)) {
            columnIndexes[normalized] = index;
            foundColumns.add(normalized);
          }
        });

        // Check if all required columns were found
        const missingColumns = requiredColumns.filter(
          (col) => !foundColumns.has(col),
        );
        if (missingColumns.length > 0) {
          reject(
            new Error(
              `Missing required columns. Expected columns like: matricule/codigi, name/nombre, group/encargado, date/fecha, hours/rhhh`,
            ),
          );
          return;
        }

        // Parse data rows
        const parsed: ParsedPointage[] = [];
        const startIndex = skipFirstRow ? 2 : 1;

        for (let i = startIndex; i < lines.length; i++) {
          const values = lines[i].split(",").map((v) => v.trim());

          const matricule = values[columnIndexes.matricule] || "";
          const name = values[columnIndexes.name] || "";
          const group = values[columnIndexes.group] || "";
          const dateStr = values[columnIndexes.date] || "";
          const hours = parseFloat(values[columnIndexes.hours] || "0");

          if (!matricule || !name || !group || !dateStr || isNaN(hours)) {
            console.warn("Skipping invalid row:", lines[i]);
            continue;
          }

          const formattedDate = formatDate(dateStr);

          if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
            console.warn("Invalid date format for row:", lines[i]);
            continue;
          }

          parsed.push({
            matricule,
            name,
            group,
            date: formattedDate,
            hours: Math.round(hours * 100) / 100,
          });
        }

        if (parsed.length === 0) {
          reject(new Error("No valid pointage records found in the file"));
          return;
        }

        resolve(parsed);
      } catch (error) {
        reject(
          error instanceof Error
            ? error
            : new Error("Failed to parse CSV file"),
        );
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsText(file);
  });
};
