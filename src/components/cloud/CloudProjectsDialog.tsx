import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CLOUD_PROJECT_LIMIT } from "@/lib/cloud/contracts";
import type { CloudProjectsState } from "@/lib/cloud/useBuilderCloud";

function formatUpdated(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
}

// Minimal My Projects: names, updated times and Open. No delete, rename or sharing.
export function CloudProjectsDialog({
  open,
  projects,
  userId,
  busy,
  canSaveAsNew,
  onOpenProject,
  onLoadMore,
  onSaveAsNew,
  onSignOut,
  onClose,
}: {
  open: boolean;
  projects: CloudProjectsState;
  userId: string | null;
  busy: boolean;
  canSaveAsNew: boolean;
  onOpenProject: (id: string) => void;
  onLoadMore: () => void;
  onSaveAsNew: () => void;
  onSignOut: () => void;
  onClose: () => void;
}) {
  // Items are shown only for the account they were loaded for.
  const items =
    userId !== null && projects.ownerId === userId ? projects.items : [];
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>My projects</DialogTitle>
          <DialogDescription>
            {items.length} of {CLOUD_PROJECT_LIMIT} cloud projects
          </DialogDescription>
        </DialogHeader>
        {projects.error && (
          <p role="alert" className="text-sm text-destructive">
            {projects.error}
          </p>
        )}
        {projects.loaded && !projects.error && items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No cloud projects yet. Use Save to cloud to create one.
          </p>
        )}
        {items.length > 0 && (
          <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">
            {items.map((project) => (
              <li
                key={project.id}
                className="flex items-center justify-between gap-3 rounded-md border p-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{project.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Updated {formatUpdated(project.updatedAt)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => onOpenProject(project.id)}
                >
                  Open
                </Button>
              </li>
            ))}
          </ul>
        )}
        {projects.nextOffset !== null && (
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={onLoadMore}
          >
            Load more
          </Button>
        )}
        <div className="flex flex-wrap justify-between gap-2 border-t pt-3">
          <div className="flex flex-wrap gap-2">
            {canSaveAsNew && (
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={onSaveAsNew}
              >
                Save current as new project
              </Button>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onSignOut}>
            Sign out
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
