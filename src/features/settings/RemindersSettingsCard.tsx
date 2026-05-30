import { useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button, Card, Field, Input, Tag } from "@/components/ui";
import {
  getLastReminderDate,
  getNotificationPermission,
  loadReminderPrefs,
  notificationsSupported,
  requestNotificationPermission,
  saveReminderPrefs,
  sendTestNotification,
  type ReminderPrefs,
} from "@/lib/reminders";
import { usePreferences, type AccountabilityLevel } from "@/stores/preferences";

const LEVELS: { id: AccountabilityLevel; label: string; hint: string }[] = [
  { id: "gentle", label: "Gentle", hint: "Daily nudge only, no evening nag." },
  { id: "standard", label: "Standard", hint: "Daily nudge + evening streak-save." },
  { id: "strict", label: "Strict", hint: "Firmer copy + evening don't-break-the-chain." },
];

interface Props {
  onMessage: (message: string) => void;
}

export function RemindersSettingsCard({ onMessage }: Props) {
  const accountabilityLevel = usePreferences((s) => s.accountabilityLevel);
  const setAccountabilityLevel = usePreferences((s) => s.setAccountabilityLevel);
  const [prefs, setPrefs] = useState<ReminderPrefs>(() => loadReminderPrefs());
  const [permission, setPermission] = useState(() => getNotificationPermission());
  const supported = notificationsSupported();
  const lastReminderDate = getLastReminderDate();

  const update = (next: Partial<ReminderPrefs>) => {
    const merged = { ...prefs, ...next };
    setPrefs(merged);
    saveReminderPrefs(merged);
  };

  const handleEnable = async () => {
    if (prefs.enabled) {
      update({ enabled: false });
      onMessage("Reminders turned off.");
      return;
    }
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === "granted") {
      update({ enabled: true });
      onMessage("Desktop reminders on. They fire while a Learn v2 tab is open.");
    } else if (result === "denied") {
      onMessage("Notifications are blocked in your browser settings — enable them there first.");
    } else {
      onMessage("Notification permission was not granted.");
    }
  };

  return (
    <Card variant="default" density="normal" className="min-w-0 space-y-4">
      <Field
        label="Desktop reminders"
        inline
        hint={
          supported
            ? "A daily 'time to study' nudge and an optional evening streak-save."
            : "This browser does not support notifications."
        }
      >
        {() => (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={prefs.enabled ? "primary" : "secondary"}
              size="sm"
              disabled={!supported}
              aria-pressed={prefs.enabled}
              onClick={handleEnable}
            >
              {prefs.enabled ? <Bell size={14} aria-hidden /> : <BellOff size={14} aria-hidden />}
              {prefs.enabled ? "On" : "Off"}
            </Button>
            {permission === "denied" ? (
              <Tag tone="danger" size="sm" mono>
                Blocked
              </Tag>
            ) : permission === "granted" && prefs.enabled ? (
              <Tag tone="success" size="sm" mono>
                Active
              </Tag>
            ) : null}
          </div>
        )}
      </Field>

      {prefs.enabled ? (
        <div className="space-y-4 border-t border-[var(--rule)] pt-3">
          <Field label="Study time" inline hint="When the daily nudge fires if you haven't studied.">
            {(id) => (
              <Input
                id={id}
                type="time"
                value={prefs.dailyTime}
                onChange={(e) => update({ dailyTime: e.target.value })}
                className="w-32"
              />
            )}
          </Field>
          <div className="border-t border-[var(--rule)] pt-3">
            <Field
              label="Evening streak-save"
              inline
              hint={
                accountabilityLevel === "gentle"
                  ? "Off in Gentle mode — raise accountability below to enable."
                  : "A last-call nudge if the minimum is still unmet."
              }
            >
              {() => (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant={prefs.eveningSave && accountabilityLevel !== "gentle" ? "primary" : "secondary"}
                    size="sm"
                    disabled={accountabilityLevel === "gentle"}
                    aria-pressed={prefs.eveningSave && accountabilityLevel !== "gentle"}
                    onClick={() => update({ eveningSave: !prefs.eveningSave })}
                  >
                    {prefs.eveningSave ? "On" : "Off"}
                  </Button>
                  {prefs.eveningSave && accountabilityLevel !== "gentle" ? (
                    <Input
                      type="time"
                      aria-label="Evening reminder time"
                      value={prefs.eveningTime}
                      onChange={(e) => update({ eveningTime: e.target.value })}
                      className="w-32"
                    />
                  ) : null}
                </div>
              )}
            </Field>
          </div>
          <div className="border-t border-[var(--rule)] pt-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-[var(--text-muted)]">
                Reminders fire only while a Learn v2 tab is open.
                {lastReminderDate ? ` Last fired ${lastReminderDate}.` : " None fired yet."}
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  const ok = await sendTestNotification();
                  onMessage(ok ? "Test notification sent." : "Couldn't send — check notification permission.");
                }}
              >
                Send test
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="border-t border-[var(--rule)] pt-3">
        <Field label="Accountability" inline hint="How hard the app pushes you to keep the chain.">
          {() => (
            <div className="flex flex-wrap gap-1.5">
              {LEVELS.map((level) => (
                <Button
                  key={level.id}
                  variant={accountabilityLevel === level.id ? "primary" : "secondary"}
                  size="sm"
                  aria-pressed={accountabilityLevel === level.id}
                  title={level.hint}
                  onClick={() => {
                    setAccountabilityLevel(level.id);
                    onMessage(`Accountability set to ${level.label.toLowerCase()}.`);
                  }}
                >
                  {level.label}
                </Button>
              ))}
            </div>
          )}
        </Field>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          {LEVELS.find((l) => l.id === accountabilityLevel)?.hint}
        </p>
      </div>
    </Card>
  );
}
