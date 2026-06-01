import { Card } from "@/components/ui";

export function PlaceholderPage({ title, note }: { title: string; note: string }) {
  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8">
      <Card>
        <h1 className="text-2xl font-bold text-[var(--text-heading)]">{title}</h1>
        <p className="mt-2 text-[var(--text-muted)]">{note}</p>
      </Card>
    </div>
  );
}
