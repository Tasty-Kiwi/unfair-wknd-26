import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Asks for a name before the first cloud save, or before Save as new project.
export function ProjectNameDialog({
  open,
  mode,
  initialName,
  error,
  busy,
  onSubmit,
  onClose,
}: {
  open: boolean;
  mode: "create" | "copy";
  initialName: string;
  error: string | null;
  busy: boolean;
  onSubmit: (name: string) => Promise<boolean>;
  onClose: () => void;
}) {
  const [name, setName] = useState(initialName);

  // Each opening starts from the suggested name.
  useEffect(() => {
    if (open) setName(initialName);
  }, [open, initialName]);

  const title = mode === "copy" ? "Save as new project" : "Save to cloud";
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Creates a cloud project from this workspace.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit(name.trim());
          }}
        >
          <label
            className="flex flex-col gap-1 text-sm font-medium"
            htmlFor="cloud-project-name"
          >
            Project name
            <Input
              id="cloud-project-name"
              className="font-normal"
              value={name}
              autoFocus
              aria-invalid={error ? true : undefined}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {title}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
