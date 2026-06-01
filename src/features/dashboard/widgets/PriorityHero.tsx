import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, CalendarClock, RotateCcw } from "lucide-react";
import { Button, Card } from "@/components/ui";
import type { TodayPriority } from "@/lib/todayPriority";
import { nodeIdFromHref, useFocusSession } from "@/stores/focusSession";

interface Props {
  priority: TodayPriority;
}

function iconFor(priority: TodayPriority) {
  if (priority.surface === "college") return <CalendarClock size={18} aria-hidden />;
  if (priority.surface === "continue" || priority.kind === "catch_up") {
    return <RotateCcw size={18} aria-hidden />;
  }
  return <BookOpen size={18} aria-hidden />;
}

export function PriorityHero({ priority }: Props) {
  const navigate = useNavigate();
  const startSession = useFocusSession((s) => s.startSession);

  const start = () => {
    const nodeId = nodeIdFromHref(priority.href);
    startSession({
      label: priority.detail,
      href: priority.href,
      nodeId,
      focus: Boolean(nodeId),
    });
    navigate(priority.href);
  };

  const shouldStartSession =
    priority.surface === "continue" || priority.kind === "catch_up" || priority.kind === "urgent_college";
  const action = !shouldStartSession ? (
      <Link to={priority.href} className="w-full sm:w-auto">
        <Button className="w-full touch-manipulation sm:w-auto">
          {priority.buttonLabel}
          <ArrowRight size={14} aria-hidden />
        </Button>
      </Link>
    ) : (
      <Button onClick={start} className="w-full touch-manipulation sm:w-auto">
        {priority.kind === "urgent_college" ? "Start focus session" : priority.buttonLabel}
        <ArrowRight size={14} aria-hidden />
      </Button>
    );

  return (
    <Card variant="primary" density="roomy" className="min-w-0">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius)] bg-[var(--accent-bg)] text-[var(--accent)]">
          {iconFor(priority)}
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="eyebrow-mono text-[var(--accent)]">{priority.headline}</p>
            <h2 className="mt-1 text-[length:var(--text-hero)] font-semibold leading-snug tracking-tight text-[var(--text-heading)]">
              {priority.detail}
            </h2>
          </div>
          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center">
            {action}
            {priority.kind === "urgent_college" ? (
              <Link
                to={priority.href}
                className="text-sm font-medium text-[var(--accent)] hover:underline"
              >
                {priority.buttonLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}
