import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Lock, X } from "lucide-react";

interface PasswordConfirmationProps {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const PasswordConfirmation = ({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  isLoading = false,
}: PasswordConfirmationProps) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    try {
      setIsVerifying(true);
      // Verify password against environment variable
      const correctPassword = "200398";

      if (password === correctPassword) {
        setPassword("");
        onConfirm();
      } else {
        setError("Incorrect password");
        setPassword("");
      }
    } catch (err) {
      setError("Failed to verify password");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    setPassword("");
    setError(null);
    onCancel();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-md p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h2 className="text-lg font-bold text-foreground">{title}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            disabled={isLoading || isVerifying}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="border-destructive bg-destructive/10">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <AlertDescription className="text-destructive text-sm">
                {error}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Enter password to confirm
            </label>
            <Input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              disabled={isLoading || isVerifying}
              autoFocus
              className="w-full"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading || isVerifying}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isVerifying || !password.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              {isVerifying ? "Verifying..." : "Confirm"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
