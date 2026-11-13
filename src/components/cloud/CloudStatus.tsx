import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { CloudConflict } from "@/lib/cloud/useBuilderCloud";

// One cloud status line, kept apart from the device save status.
// A version conflict offers exactly two safe actions and no overwrite.
export function CloudStatus({
  text,
  message,
  conflict,
  onKeepLocal,
  onSaveAsNew,
}: {
  text: string;
  message: string | null;
  conflict: CloudConflict | null;
  onKeepLocal: () => void;
  onSaveAsNew: () => void;
}) {
  return (
    <div className="flex w-full flex-col gap-2">
      <p
        role="status"
        aria-live="polite"
        className="text-sm text-muted-foreground"
      >
        {text}
        {message ? ` · ${message}` : ""}
      </p>
      {conflict && (
        <Alert variant="destructive">
          <AlertTitle>The cloud project has a newer version</AlertTitle>
          <AlertDescription>
            <p>Your work stays on this device. Choose one safe option.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={onKeepLocal}>
                Keep working locally
              </Button>
              <Button variant="outline" size="sm" onClick={onSaveAsNew}>
                Save as new project
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
