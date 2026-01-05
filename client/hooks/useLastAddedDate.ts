import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Pointage } from "./usePointages";

export const useLastAddedDate = () => {
  const [lastPointage, setLastPointage] = useState<Pointage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLastAddedDate = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, "pointages"),
          orderBy("createdAt", "desc"),
          limit(1),
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const data = doc.data();
          setLastPointage({
            id: doc.id,
            matricule: data.matricule,
            name: data.name,
            group: data.group,
            date: data.date,
            hours: data.hours,
            createdAt: data.createdAt,
          } as Pointage);
        }
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch last added date",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLastAddedDate();
  }, []);

  return { lastPointage, loading, error };
};
