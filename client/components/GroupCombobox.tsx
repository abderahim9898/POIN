import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface GroupComboboxProps {
  value: string;
  onChange: (value: string) => void;
  availableGroups: string[];
  placeholder?: string;
  disabled?: boolean;
}

export const GroupCombobox = ({
  value,
  onChange,
  availableGroups,
  placeholder = "Select or type group...",
  disabled = false,
}: GroupComboboxProps) => {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);

  // Filter groups based on input
  const filteredGroups = availableGroups.filter((group) =>
    group.toLowerCase().includes(inputValue.toLowerCase()),
  );

  // Show all groups if input is empty, otherwise show filtered
  const displayGroups =
    inputValue.length === 0 ? availableGroups : filteredGroups;

  const handleSelect = (group: string) => {
    onChange(group);
    setInputValue(group);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setOpen(true);
  };

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <span className="truncate text-sm">
            {inputValue || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <div className="flex flex-col p-2 gap-2">
          <Input
            placeholder="Type to search or create..."
            value={inputValue}
            onChange={handleInputChange}
            className="h-8"
            autoFocus
          />

          <div className="max-h-48 overflow-y-auto">
            {displayGroups.length > 0 ? (
              <div className="space-y-1">
                {displayGroups.map((group) => (
                  <button
                    key={group}
                    onClick={() => handleSelect(group)}
                    className={cn(
                      "w-full text-left px-2 py-2 rounded-sm text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                      value === group && "bg-accent text-accent-foreground",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Check
                        className={cn(
                          "h-4 w-4",
                          value === group ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span>{group}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : inputValue ? (
              <div className="p-2 text-sm text-muted-foreground">
                Press Enter to create: <strong>{inputValue}</strong>
              </div>
            ) : (
              <div className="p-2 text-sm text-muted-foreground">
                No groups found
              </div>
            )}
          </div>

          {inputValue &&
            !availableGroups.includes(inputValue) &&
            displayGroups.length === 0 && (
              <button
                onClick={() => {
                  onChange(inputValue);
                  setOpen(false);
                }}
                className="w-full px-2 py-2 rounded-sm text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Create "{inputValue}"
              </button>
            )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
