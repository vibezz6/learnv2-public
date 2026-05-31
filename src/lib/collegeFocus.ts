import { ROUTES } from "@/app/navigation";

/** True when a focus session href is campus / admissions work (not SAT). */
export function isCollegeFocusHref(href: string): boolean {
  if (isSatFocusHref(href)) return false;
  return (
    href === ROUTES.college ||
    href.startsWith(`${ROUTES.college}/`) ||
    href.startsWith(ROUTES.applicationPackage) ||
    href === ROUTES.collegeChecklist ||
    href.startsWith(ROUTES.collegeChecklist) ||
    href === ROUTES.essayTracker ||
    href.startsWith(ROUTES.essayTracker) ||
    href === ROUTES.campusPrintSummary ||
    href.startsWith(ROUTES.campusPrintSummary)
  );
}

function isSatFocusHref(href: string): boolean {
  return (
    href.startsWith("/subjects/sat-prep") ||
    href.startsWith("/sat/") ||
    href === ROUTES.sat ||
    href.startsWith(`${ROUTES.sat}#`)
  );
}

export function collegeNameFromPackageHref(href: string): string | null {
  try {
    const url = new URL(href, "http://local");
    if (!url.pathname.startsWith(ROUTES.applicationPackage)) return null;
    const raw = url.searchParams.get("college");
    if (!raw) return null;
    return decodeURIComponent(raw);
  } catch {
    return null;
  }
}

export interface CollegeSessionNextStep {
  label: string;
  href: string;
}

export function getCollegeSessionNextSteps(href: string): CollegeSessionNextStep[] {
  const college = collegeNameFromPackageHref(href);
  if (college) {
    return [
      {
        label: `Open ${college} package`,
        href: `${ROUTES.applicationPackage}?college=${encodeURIComponent(college)}`,
      },
      { label: "Open essay tracker", href: ROUTES.essayTracker },
    ];
  }
  if (href.includes("essay-tracker") || href === ROUTES.essayTracker) {
    return [{ label: "Open essay tracker", href: ROUTES.essayTracker }];
  }
  if (href.includes("college-checklist") || href === ROUTES.collegeChecklist) {
    return [{ label: "Open checklist", href: ROUTES.collegeChecklist }];
  }
  if (href === ROUTES.college || href.startsWith(`${ROUTES.college}`)) {
    return [{ label: "Open Campus", href: ROUTES.college }];
  }
  return [{ label: "Open Campus", href: ROUTES.college }];
}
