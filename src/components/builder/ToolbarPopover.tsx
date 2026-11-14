import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * A small disclosure attached to a toolbar button. Closes on Escape (returning
 * focus to the trigger) and on a pointer press outside. Content is only
 * rendered while open, so hidden controls never take keyboard focus.
 */
export function ToolbarPopover({
  label,
  title,
  children,
  className = "",
  align = "end",
}: {
  label: ReactNode;
  title?: string;
  children: (close: () => void) => ReactNode;
  className?: string;
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const close = () => setOpen(false);
  return (
    <div className={`toolbar-popover ${className}`} ref={root}>
      <Button
        ref={trigger}
        variant="outline"
        size="sm"
        aria-expanded={open}
        aria-controls={id}
        title={title}
        onClick={() => setOpen((value) => !value)}
      >
        {label}
        <ChevronDown data-icon="inline-end" aria-hidden="true" />
      </Button>
      {open && (
        <div
          id={id}
          className={`toolbar-popover__panel is-${align}`}
          role="group"
        >
          {children(close)}
        </div>
      )}
    </div>
  );
}
