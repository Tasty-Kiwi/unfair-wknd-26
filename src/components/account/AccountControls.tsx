import { Button } from "@/components/ui/button";
import type { CloudSession } from "@/lib/cloud/useBuilderCloud";

// The only account control: GitHub sign-in, or the signed-in actions.
export function AccountControls({
  session,
  busy,
  onSignIn,
  onSignOut,
  onMyProjects,
  onSaveToCloud,
}: {
  session: CloudSession;
  busy: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onMyProjects: () => void;
  onSaveToCloud: () => void;
}) {
  if (session.kind !== "signed-in") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onSignIn}
        disabled={busy !== null}
      >
        Sign in with GitHub
      </Button>
    );
  }
  return (
    <>
      <span className="text-sm text-muted-foreground">
        Signed in as {session.user.name}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={onMyProjects}
        disabled={busy !== null}
      >
        My projects
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onSaveToCloud}
        disabled={busy !== null}
      >
        Save to cloud
      </Button>
      <Button variant="ghost" size="sm" onClick={onSignOut}>
        Sign out
      </Button>
    </>
  );
}
