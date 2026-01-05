import { useLastAddedDate } from "@/hooks/useLastAddedDate";
import { Calendar } from "lucide-react";

export const LastAddedDate = () => {
  const { lastPointage } = useLastAddedDate();

  if (!lastPointage) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Calendar className="w-4 h-4 flex-shrink-0" />
      <span>{formatDate(lastPointage.date)}</span>
    </div>
  );
};
