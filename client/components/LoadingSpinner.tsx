export const LoadingSpinner = ({ text = "Loading..." }: { text?: string }) => {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
};
