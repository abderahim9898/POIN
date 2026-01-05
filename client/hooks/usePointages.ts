import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  Timestamp,
  QueryConstraint,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Pointage {
  id: string;
  matricule: string;
  name: string;
  group: string;
  date: string;
  hours: number;
  createdAt?: Timestamp;
}

export const usePointages = (filters?: {
  startDate?: string;
  endDate?: string;
}) => {
  const [pointages, setPointages] = useState<Pointage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPointages = async () => {
      try {
        setLoading(true);
        const constraints: QueryConstraint[] = [];

        if (filters?.startDate) {
          constraints.push(where("date", ">=", filters.startDate));
        }
        if (filters?.endDate) {
          constraints.push(where("date", "<=", filters.endDate));
        }

        const q = query(collection(db, "pointages"), ...constraints);
        const snapshot = await getDocs(q);
        const data: Pointage[] = [];

        snapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() } as Pointage);
        });

        setPointages(data);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch pointages",
        );
        setPointages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPointages();
  }, [filters?.startDate, filters?.endDate]);

  const addPointages = async (newPointages: Omit<Pointage, "id">[]) => {
    try {
      const existingPointages = await getDocs(collection(db, "pointages"));
      const existing = new Set();

      existingPointages.forEach((doc) => {
        const data = doc.data();
        existing.add(`${data.matricule}-${data.date}`);
      });

      const toAdd = [];
      const duplicates = [];

      for (const p of newPointages) {
        const key = `${p.matricule}-${p.date}`;
        if (existing.has(key)) {
          duplicates.push(p);
        } else {
          toAdd.push(p);
        }
      }

      for (const p of toAdd) {
        await addDoc(collection(db, "pointages"), {
          ...p,
          createdAt: Timestamp.now(),
        });
      }

      return { added: toAdd.length, duplicates: duplicates.length };
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Failed to add pointages",
      );
    }
  };

  const deletePointagesByDateRange = async (
    startDate: string,
    endDate: string,
  ) => {
    try {
      const constraints: QueryConstraint[] = [];

      if (startDate) {
        constraints.push(where("date", ">=", startDate));
      }
      if (endDate) {
        constraints.push(where("date", "<=", endDate));
      }

      const q = query(collection(db, "pointages"), ...constraints);
      const snapshot = await getDocs(q);

      let deletedCount = 0;
      for (const docSnapshot of snapshot.docs) {
        await deleteDoc(doc(db, "pointages", docSnapshot.id));
        deletedCount++;
      }

      return deletedCount;
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Failed to delete pointages",
      );
    }
  };

  const updatePointage = async (
    pointageId: string,
    updates: Partial<Omit<Pointage, "id">>,
  ) => {
    try {
      const docRef = doc(db, "pointages", pointageId);
      await updateDoc(docRef, updates);
      return pointageId;
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Failed to update pointage",
      );
    }
  };

  const deletePointage = async (pointageId: string) => {
    try {
      await deleteDoc(doc(db, "pointages", pointageId));
      return pointageId;
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Failed to delete pointage",
      );
    }
  };

  const updateWorkerDetails = async (
    matricule: string,
    updates: { name?: string; group?: string },
  ) => {
    try {
      const q = query(
        collection(db, "pointages"),
        where("matricule", "==", matricule),
      );
      const snapshot = await getDocs(q);

      let updatedCount = 0;
      for (const docSnapshot of snapshot.docs) {
        await (docSnapshot.ref as any).update(updates);
        updatedCount++;
      }

      return updatedCount;
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Failed to update worker details",
      );
    }
  };

  return {
    pointages,
    loading,
    error,
    addPointages,
    deletePointagesByDateRange,
    updatePointage,
    deletePointage,
    updateWorkerDetails,
  };
};

export const useWorkerStats = (filters?: {
  startDate?: string;
  endDate?: string;
}) => {
  const { pointages, loading, error } = usePointages(filters);

  const stats = {
    totalWorkers: new Set(pointages.map((p) => p.matricule)).size,
    totalDays: new Set(pointages.map((p) => p.date)).size,
    totalHours: pointages.reduce((sum, p) => sum + (p.hours || 0), 0),
    totalGroups: new Set(pointages.map((p) => p.group)).size,
    groups: {} as Record<string, { count: number; workers: Set<string> }>,
  };

  pointages.forEach((p) => {
    if (!stats.groups[p.group]) {
      stats.groups[p.group] = { count: 0, workers: new Set() };
    }
    stats.groups[p.group].workers.add(p.matricule);
    stats.groups[p.group].count = stats.groups[p.group].workers.size;
  });

  return { stats, loading, error };
};

export const useWorkerSearch = (
  matriculeOrName: string,
  filters?: { startDate?: string; endDate?: string },
) => {
  const { pointages, loading, error } = usePointages(filters);

  const results = pointages.filter(
    (p) =>
      p.matricule.toLowerCase().includes(matriculeOrName.toLowerCase()) ||
      p.name.toLowerCase().includes(matriculeOrName.toLowerCase()),
  );

  const groupedByWorker: Record<
    string,
    { name: string; attendances: Pointage[] }
  > = {};

  results.forEach((p) => {
    if (!groupedByWorker[p.matricule]) {
      groupedByWorker[p.matricule] = { name: p.name, attendances: [] };
    }
    groupedByWorker[p.matricule].attendances.push(p);
  });

  return { results: groupedByWorker, loading, error };
};
