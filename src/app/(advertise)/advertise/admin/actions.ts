"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSignedIn, signIn, signOut } from "@/lib/ads/auth";
import {
  isEmailConfigured,
  keyFingerprint,
  sendEmail,
  testEmail,
  type TestKind,
} from "@/lib/ads/email";
import { runBackup } from "@/lib/ads/backup";
import {
  getSettings,
  saveSettings,
  validateSharePercent,
} from "@/lib/ads/settings";
import { runRenewalCheck } from "@/lib/ads/renewals";
import { clearResponse } from "@/lib/ads/responses";
import {
  deleteReport,
  generateReports,
  recalculateReport,
  sendReport,
  skipReport,
  updateNarrative,
} from "@/lib/ads/reports";
import { clearTestBaseline, markScansAsTests } from "@/lib/ads/scan-store";
import {
  getLink,
  listLinks,
  normalizeCode,
  saveLink,
  setLinkActive,
  suggestCode,
  validateCode,
  validateDestination,
} from "@/lib/ads/link-store";
import {
  appendUpdate,
  categoryConflict,
  deleteAdvertiser,
  deleteProspect,
  findProspectByAdvertiser,
  getProspect,
  listAdvertisers,
  patchProspect,
  saveAdvertiser,
  saveProspect,
  type AdvertiserStatus,
  type PlanId,
  type Prospect,
  type ProspectInput,
  type ProspectStatus,
  PLANS,
} from "@/lib/ads/roster";

const PAGE = "/advertise/admin";

const field = (data: FormData, name: string) =>
  String(data.get(name) ?? "").trim();

/**
 * A money or term field that is allowed to be left blank.
 *
 * Blank means "use the package price", which is not the same as zero — a free
 * spot is a deliberate $0 override, so an empty box must never become one.
 */
function optionalNumber(data: FormData, name: string): number | null {
  const raw = field(data, name).replace(/[$,\s]/g, "");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** True when the box had something in it, whether or not it parsed. */
const wasFilled = (data: FormData, name: string) =>
  field(data, name).replace(/[$,\s]/g, "").length > 0;

/**
 * The value only if the form actually carried the field.
 *
 * Records are now merged on save rather than replaced, so a field a form never
 * rendered keeps whatever it already held. `field()` can't express that — it
 * returns "" for both "left blank" and "not on this form", and those mean
 * opposite things: one clears the value, the other must leave it alone.
 */
const present = (data: FormData, name: string): string | undefined =>
  data.has(name) ? field(data, name) : undefined;

/** Every mutation re-checks the session — an action is a public endpoint. */
async function requireAdmin() {
  if (!(await isSignedIn())) redirect(PAGE);
}

/**
 * Back to the tracker with the result.
 *
 * `anchor` matters more than it looks: the result banner sits at the top of the
 * page, and an action taken from a form halfway down reloads to a restored
 * scroll position where nothing appears to have changed. Sending the reader
 * back to the thing they just used is the difference between "it worked" and
 * "nothing happened".
 */
function back(params: Record<string, string>, anchor?: string): never {
  const hash = anchor ? `#${anchor}` : "";
  redirect(`${PAGE}?${new URLSearchParams(params)}${hash}`);
}

export async function signInAction(data: FormData) {
  const ok = await signIn(field(data, "key"));
  if (!ok) back({ err: "badkey" });
  redirect(PAGE);
}

export async function signOutAction() {
  await signOut();
  redirect(PAGE);
}

/**
 * What the advertiser form shows when a save is refused.
 *
 * Returned rather than redirected. A redirect on a validation failure throws
 * away everything typed, collapses the form it came from, and leaves the reason
 * in a banner above the fold — which reads, correctly, as a button that does
 * nothing.
 */
export type AdvertiserFormState = {
  err: string;
  detail?: string;
  clash?: string;
} | null;

export async function saveAdvertiserAction(
  _previous: AdvertiserFormState,
  data: FormData,
): Promise<AdvertiserFormState> {
  await requireAdmin();

  const id = field(data, "id") || undefined;
  const business = field(data, "business");
  const category = field(data, "category");
  const plan = field(data, "plan") as PlanId;
  const startDate = field(data, "startDate");
  const status = (field(data, "status") || "active") as AdvertiserStatus;

  if (!business) return { err: "business" };
  if (!PLANS[plan]) return { err: "plan" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return { err: "startdate" };

  // Category exclusivity is the product — verify it rather than trust the form.
  if (status === "active") {
    const clash = categoryConflict(await listAdvertisers(), category, id);
    if (clash) return { err: "category", clash: clash.business };
  }

  /* ---------------------------- the deal ---------------------------- */

  const customMonthly = optionalNumber(data, "customMonthly");
  const customSetup = optionalNumber(data, "customSetup");
  const customMonths = optionalNumber(data, "customMonths");
  const customTotal = optionalNumber(data, "customTotal");
  const dealNote = field(data, "dealNote");

  // A number that was typed but didn't parse would silently fall back to list
  // price, which is exactly the kind of quiet wrongness this whole change is
  // meant to remove.
  for (const name of ["customMonthly", "customSetup", "customMonths", "customTotal"] as const) {
    if (wasFilled(data, name) && optionalNumber(data, name) === null) {
      return { err: "dealnumber", detail: field(data, name) };
    }
  }
  if (customMonths !== null && customMonths < 1) return { err: "dealmonths" };

  // Six months from now nobody remembers why this client pays less. Requiring
  // the reason at the moment of the decision is the only time it's cheap.
  const hasOverride =
    customMonthly !== null ||
    customSetup !== null ||
    customMonths !== null ||
    customTotal !== null;
  if (hasOverride && !dealNote) return { err: "dealnote" };

  /* ------------------------- their first QR code ------------------------- */

  // Only offered when adding someone, so an existing client's codes are managed
  // from their profile rather than silently multiplying on every edit.
  const chosenCode = normalizeCode(field(data, "qrCode"));
  const newDestination = id ? "" : field(data, "newLinkDestination");
  let autoCode = "";

  if (newDestination) {
    const destError = validateDestination(newDestination);
    if (destError) return { err: "destination", detail: destError };

    const existingLinks = await listLinks();
    const takenCodes = existingLinks.map((l) => l.code);
    const requested = normalizeCode(field(data, "newLinkCode"));

    autoCode = requested || suggestCode(business, takenCodes);
    const codeError = validateCode(autoCode);
    if (codeError) return { err: "code", detail: codeError };
    // A printed code can never be reassigned, so a collision is a hard stop
    // rather than something to resolve by guessing.
    if (takenCodes.includes(autoCode)) return { err: "codetaken", detail: autoCode };
  }

  // Set only when converting, so an ordinary edit leaves them untouched rather
  // than blanking the attribution the merge is there to protect.
  const carried: {
    fromProspectId?: string;
    campaign?: string;
    source?: string;
  } = {};
  const prospectId = field(data, "prospectId");
  if (prospectId) {
    carried.fromProspectId = prospectId;
    const campaign = present(data, "prospectCampaign");
    const source = present(data, "prospectSource");
    if (campaign) carried.campaign = campaign;
    if (source) carried.source = source;
  }

  const { ok, id: savedId } = await saveAdvertiser(
    {
      ...carried,
      business,
      contactName: field(data, "contactName"),
      email: field(data, "email"),
      phone: field(data, "phone"),
      category,
      plan,
      startDate,
      status,
      qrCode: autoCode || chosenCode,
      notes: field(data, "notes"),
      customMonthly,
      customSetup,
      customMonths,
      customTotal,
      dealNote: hasOverride ? dealNote : "",
      paymentType: field(data, "paymentType") === "prepaid" ? "prepaid" : "monthly",
    },
    id,
  );

  if (!ok) return { err: "save" };

  // The prospect turns into a client here and nowhere else. Picking "advertiser"
  // on the prospect list only opens this form; abandoning it leaves them exactly
  // where they were, and a category clash above returns before reaching this
  // line. There is no state in which somebody is marked won without a record.
  if (prospectId) {
    const prospect = await getProspect(prospectId);
    if (prospect) {
      await patchProspect(prospectId, {
        status: "won",
        advertiserId: savedId,
        // Their follow-up belongs to the sale, and the sale is done.
        followUpDate: "",
        log: appendUpdate(prospect, {
          at: new Date().toISOString(),
          from: prospect.status,
          to: "won",
          text: `Signed up as an advertiser${
            status === "pending" ? ", not live yet" : ""
          }.`,
        }),
      });
    }
  }

  if (autoCode) {
    const linked = await saveLink({
      code: autoCode,
      label: business,
      destination: newDestination,
      active: true,
      tagDestination: true,
      advertiserId: savedId,
    });
    // The client is saved either way; say so plainly rather than pretending
    // the code exists when it doesn't.
    if (!linked) {
      revalidatePath(PAGE);
      back({ msg: "addedNoCode", who: savedId });
    }
  }

  // Picking an existing code from the dropdown claims it for this client, which
  // quietly migrates records made before codes had an owner. It runs even when a
  // code was just generated — a client is allowed more than one, so the pick is
  // kept rather than thrown away.
  if (chosenCode && chosenCode !== autoCode) {
    const link = await getLink(chosenCode);
    if (link && link.advertiserId !== savedId) {
      await saveLink({
        ...link,
        advertiserId: savedId,
        logoDataUri: link.logoDataUri ?? null,
      });
    }
  }

  revalidatePath(PAGE);
  if (autoCode) back({ msg: "addedWithCode", who: savedId, detail: autoCode });
  back({ msg: id ? "updated" : "added", who: savedId });
}

export async function deleteAdvertiserAction(data: FormData) {
  await requireAdmin();
  const id = field(data, "id");
  if (!id) back({ err: "missing" });

  // Read before the delete, while the link still exists to follow.
  const prospect = await findProspectByAdvertiser(id);

  if (!(await deleteAdvertiser(id))) back({ err: "save" });

  // A prospect pointing at a record that no longer exists is worse than one
  // still in the pipeline, so they go back to being somebody worth chasing.
  if (prospect) {
    await patchProspect(prospect.id, {
      status: "hot",
      advertiserId: "",
      log: appendUpdate(prospect, {
        at: new Date().toISOString(),
        from: "won",
        to: "hot",
        text: "Their advertiser record was deleted, so they are back on the list.",
      }),
    });
  }

  revalidatePath(PAGE);
  back({ msg: prospect ? "removedBackToList" : "removed" });
}

/* -------------------------------- prospects ------------------------------- */

/** Every status a person is allowed to choose. `won` is not one of them. */
const PICKABLE_STATUS: ProspectStatus[] = ["new", "contacted", "hot", "review", "passed"];

/** A date field that has to be a real YYYY-MM-DD, or nothing at all. */
function optionalDate(data: FormData, name: string): string | null {
  const raw = field(data, name);
  if (!raw) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  return raw;
}

/** Where a prospect action returns to: the card it was taken from. */
const prospectAnchor = (id: string) => `prospect-${id}`;

export async function saveProspectAction(data: FormData) {
  await requireAdmin();

  const business = field(data, "business");
  if (!business) back({ err: "business" });

  const id = field(data, "id") || undefined;

  // Only what this form actually rendered. The add form has no campaign or
  // budget box, and before records were merged on save, editing a web lead
  // through it erased which flyer sent them.
  const optional: Partial<ProspectInput> = {};
  for (const name of ["campaign", "budget"] as const) {
    const value = present(data, name);
    if (value !== undefined) optional[name] = value;
  }

  // An edit is a correction to the details, never a move along the pipeline —
  // that is what an update is for, and it leaves a record behind.
  const chosen = field(data, "status") as ProspectStatus;
  const status: ProspectStatus | undefined = id
    ? undefined
    : PICKABLE_STATUS.includes(chosen)
      ? chosen
      : "new";

  const existing = id ? await getProspect(id) : null;
  if (id && !existing) back({ err: "prospectmissing" });

  const { ok } = await saveProspect(
    {
      ...optional,
      business,
      contactName: field(data, "contactName"),
      email: field(data, "email"),
      phone: field(data, "phone"),
      category: field(data, "category"),
      source: field(data, "source"),
      status: status ?? existing!.status,
      notes: field(data, "notes"),
    },
    id,
  );

  if (!ok) back({ err: "save" });
  revalidatePath(PAGE);
  if (id) back({ msg: "prospectEdited" }, prospectAnchor(id));
  back({ msg: "prospect" }, "prospect-add");
}

/**
 * One thing that happened, written to the timeline.
 *
 * The status and the note are recorded together on purpose. A status that moves
 * with no reason attached is the thing that makes a pipeline useless three weeks
 * later, when nobody can remember what "contacted" meant for this one.
 */
export async function logProspectUpdateAction(data: FormData) {
  await requireAdmin();

  const id = field(data, "id");
  if (!id) back({ err: "missing" });

  const prospect = await getProspect(id);
  if (!prospect) back({ err: "prospectmissing" });

  const note = field(data, "note").slice(0, 1200);
  const followUp = optionalDate(data, "followUp");
  if (followUp === null) back({ err: "followupdate" }, prospectAnchor(id));

  const chosen = field(data, "status");

  // "Advertiser" isn't a status you can set. It's the start of a conversion:
  // the note is saved first so nothing typed is lost, then the prefilled
  // advertiser form opens. They stay where they are until that form saves.
  if (chosen === "convert") {
    if (note) {
      await patchProspect(id, {
        log: appendUpdate(prospect, {
          at: new Date().toISOString(),
          from: "",
          to: prospect.status,
          text: note,
        }),
      });
      revalidatePath(PAGE);
    }
    back({ tab: "advertisers", from: id }, "editor");
  }

  const status = PICKABLE_STATUS.includes(chosen as ProspectStatus)
    ? (chosen as ProspectStatus)
    : prospect.status;

  if (!note && status === prospect.status && followUp === (prospect.followUpDate ?? "")) {
    back({ err: "emptyupdate" }, prospectAnchor(id));
  }

  const moved = status !== prospect.status;

  // Changing only the date is a real update, and an entry with nothing in it
  // reads on the timeline as though something was lost.
  const text =
    note ||
    (!moved && followUp !== (prospect.followUpDate ?? "")
      ? followUp
        ? "Follow-up date set."
        : "Follow-up cleared."
      : "");

  const ok = await patchProspect(id, {
    status,
    followUpDate: followUp,
    log: appendUpdate(prospect, {
      at: new Date().toISOString(),
      from: moved ? prospect.status : "",
      to: status,
      text,
      followUp: followUp || undefined,
    }),
  });

  if (!ok) back({ err: "save" });
  revalidatePath(PAGE);
  back({ msg: "prospectUpdated" }, prospectAnchor(id));
}

/**
 * Ticks one of the three things a review-stage prospect is waiting on.
 *
 * Logged like any other update. "Payment received" is the kind of fact you
 * want a date against later, and a checkbox on its own has no date.
 */
export async function toggleProspectGateAction(data: FormData) {
  await requireAdmin();

  const id = field(data, "id");
  const gate = field(data, "gate");
  const on = field(data, "on") === "1";

  const GATES = {
    mockupApproved: "the mockup approved",
    agreementSigned: "the agreement signed",
    paymentReceived: "payment received",
  } as const;

  if (!(gate in GATES)) back({ err: "missing" });
  const key = gate as keyof typeof GATES;

  const prospect = await getProspect(id);
  if (!prospect) back({ err: "prospectmissing" });

  const ok = await patchProspect(id, {
    [key]: on,
    log: appendUpdate(prospect, {
      at: new Date().toISOString(),
      from: "",
      to: prospect.status,
      text: on ? `Marked ${GATES[key]}.` : `Unmarked ${GATES[key]}.`,
    }),
  } as Partial<Prospect>);

  if (!ok) back({ err: "save" });
  revalidatePath(PAGE);
  back({ msg: "prospectUpdated" }, prospectAnchor(id));
}

export async function deleteProspectAction(data: FormData) {
  await requireAdmin();
  const id = field(data, "id");
  if (!id) back({ err: "missing" });
  if (!(await deleteProspect(id))) back({ err: "save" });
  revalidatePath(PAGE);
  back({ msg: "prospectRemoved" });
}

export async function runAlertsAction() {
  await requireAdmin();
  const result = await runRenewalCheck("manual");
  revalidatePath(PAGE);
  back({
    msg: "alerts",
    sent: String(result.sent),
    checked: String(result.checked),
    failed: String(result.failed),
  });
}

export async function clearResponseAction(data: FormData) {
  await requireAdmin();
  const advertiserId = field(data, "advertiserId");
  const endDate = field(data, "endDate");
  if (!advertiserId || !endDate) back({ err: "missing" });
  if (!(await clearResponse(advertiserId, endDate))) back({ err: "save" });
  revalidatePath(PAGE);
  back({ msg: "replyCleared" });
}

/* ------------------------------- QR codes -------------------------------- */

const LOGO_MAX_BYTES = 200 * 1024;
const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

/**
 * Turns an uploaded logo into a data URI. Kept small deliberately — it is
 * embedded in every generated QR and stored alongside the link.
 */
async function readLogo(
  data: FormData,
): Promise<{ dataUri?: string; error?: string }> {
  const file = data.get("logo");
  if (!(file instanceof File) || file.size === 0) return {};
  if (!LOGO_TYPES.includes(file.type)) {
    return { error: "logotype" };
  }
  if (file.size > LOGO_MAX_BYTES) {
    return { error: "logosize" };
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  return { dataUri: `data:${file.type};base64,${buffer.toString("base64")}` };
}

export async function saveLinkAction(data: FormData) {
  await requireAdmin();

  const isNew = field(data, "isNew") === "1";
  const code = normalizeCode(field(data, "code"));
  const destination = field(data, "destination");
  const label = field(data, "label");

  const codeError = validateCode(code);
  if (codeError) back({ err: "code", detail: codeError });

  const destError = validateDestination(destination);
  if (destError) back({ err: "destination", detail: destError });

  const existing = await getLink(code);
  // The code is what gets printed, so it can never be reassigned to something
  // else — a new one must be a genuinely new name.
  if (isNew && existing) back({ err: "codetaken", detail: code });
  if (!isNew && !existing) back({ err: "codemissing", detail: code });

  const logo = await readLogo(data);
  if (logo.error) back({ err: logo.error });

  const removeLogo = field(data, "removeLogo") === "1";

  const ok = await saveLink({
    code,
    label: label || code,
    destination,
    active: field(data, "active") !== "0",
    tagDestination: field(data, "tagDestination") !== "0",
    logoDataUri: removeLogo ? null : logo.dataUri,
  });

  if (!ok) back({ err: "save" });
  revalidatePath(PAGE);
  back({ msg: isNew ? "linkAdded" : "linkSaved", who: code });
}

export async function toggleLinkActiveAction(data: FormData) {
  await requireAdmin();
  const code = normalizeCode(field(data, "code"));
  const active = field(data, "active") === "1";
  if (!(await setLinkActive(code, active))) back({ err: "save" });
  revalidatePath(PAGE);
  back({ msg: active ? "linkOn" : "linkOff", who: code });
}

/* -------------------------------- test scans ------------------------------- */

/**
 * Hold back everything counted so far on a code as testing.
 *
 * Nothing is deleted: the counters keep every scan and a baseline is stored
 * beside them, so the raw history stays auditable and this is reversible.
 */
export async function markScansAsTestsAction(data: FormData) {
  await requireAdmin();
  const code = normalizeCode(field(data, "code"));
  if (!(await getLink(code))) back({ err: "codemissing", detail: code });
  const { ok, excluded } = await markScansAsTests(code);
  if (!ok) back({ err: "save" });
  revalidatePath(PAGE);
  back({ msg: "testsExcluded", who: code, sent: String(excluded) });
}

export async function clearTestScansAction(data: FormData) {
  await requireAdmin();
  const code = normalizeCode(field(data, "code"));
  if (!(await clearTestBaseline(code))) back({ err: "save" });
  revalidatePath(PAGE);
  back({ msg: "testsRestored", who: code });
}

/* ---------------------------- monthly reports ---------------------------- */

export async function generateReportsAction(data: FormData) {
  await requireAdmin();
  const month = field(data, "month") || undefined;
  const result = await generateReports(month);
  revalidatePath(PAGE);
  back({ msg: "reportsDrafted", sent: String(result.created), checked: String(result.skipped) });
}

export async function sendReportAction(data: FormData) {
  await requireAdmin();
  const result = await sendReport(field(data, "advertiserId"), field(data, "month"));
  if (!result.ok) back({ err: "reportsend", detail: result.error ?? "" });
  revalidatePath(PAGE);
  back({ msg: "reportSent" });
}

export async function skipReportAction(data: FormData) {
  await requireAdmin();
  if (!(await skipReport(field(data, "advertiserId"), field(data, "month")))) {
    back({ err: "save" });
  }
  revalidatePath(PAGE);
  back({ msg: "reportSkipped" });
}

/**
 * Rebuilds a draft's figures. Offered as its own button rather than done on
 * every page load because a report is a document: it should change when someone
 * asks it to, not quietly underneath a reader.
 */
export async function recalculateReportAction(data: FormData) {
  await requireAdmin();
  const result = await recalculateReport(
    field(data, "advertiserId"),
    field(data, "month"),
  );
  if (!result.ok) back({ err: "reportfigures", detail: result.error ?? "" });
  revalidatePath(PAGE);
  back({
    msg:
      result.changed === false
        ? "reportAlreadyRight"
        : result.rewritten
          ? "reportRecalculatedRewritten"
          : "reportRecalculated",
  });
}

export async function deleteReportAction(data: FormData) {
  await requireAdmin();
  const result = await deleteReport(field(data, "advertiserId"), field(data, "month"));
  if (!result.ok) back({ err: "reportfigures", detail: result.error ?? "" });
  revalidatePath(PAGE);
  back({ msg: "reportDeleted" });
}

export async function editReportAction(data: FormData) {
  await requireAdmin();
  const ok = await updateNarrative(
    field(data, "advertiserId"),
    field(data, "month"),
    field(data, "headline"),
    field(data, "body"),
  );
  if (!ok) back({ err: "save" });
  revalidatePath(PAGE);
  back({ msg: "reportEdited" });
}

/* ------------------------------- test send -------------------------------- */

/** The id on the test-send card, so a result lands back in view. */
const TEST_ANCHOR = "test-email";

/**
 * Sends a sample to whoever asks for it. The only way to find out that email is
 * broken should not be a client not receiving their renewal notice.
 */
export async function sendTestEmailAction(data: FormData) {
  await requireAdmin();

  const to = field(data, "to");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) back({ err: "testaddress" }, TEST_ANCHOR);
  if (!isEmailConfigured()) back({ err: "testunconfigured" }, TEST_ANCHOR);

  const kind = (field(data, "kind") || "delivery") as TestKind;
  const message = testEmail(kind === "renewal" ? "renewal" : "delivery");

  const result = await sendEmail({ to, ...message });
  if (!result.ok) {
    // A refused key looks identical whether it is wrong, truncated, or simply
    // arrived with a newline attached. Describing the key the server is
    // actually holding is the difference between diagnosing that and guessing.
    const note = /401|unauthor|token/i.test(result.error ?? "")
      ? ` — the key this deployment is using: ${keyFingerprint()}`
      : "";
    back({ err: "testsend", detail: `${result.error ?? ""}${note}` }, TEST_ANCHOR);
  }

  // Carry back what the provider said, so a send that claims to have worked can
  // be matched against Plunk's own log rather than taken on trust.
  back({ msg: "testSent", detail: to, sent: result.detail ?? "" }, TEST_ANCHOR);
}

/* -------------------------------- backups --------------------------------- */

/** Runs the nightly snapshot on demand, so it can be proven rather than waited for. */
export async function runBackupAction() {
  await requireAdmin();
  const result = await runBackup();
  if (result.skipped) back({ err: "backupoff" });
  if (!result.ok) back({ err: "backupfailed", detail: result.error ?? "" });
  revalidatePath(PAGE);
  back({
    msg: "backupDone",
    detail: `${result.entry?.advertisers ?? 0} advertisers, ${result.entry?.prospects ?? 0} prospects`,
  });
}

/* ---------------------------------- venue --------------------------------- */

export async function saveVenueSettingsAction(data: FormData) {
  await requireAdmin();

  const raw = field(data, "venueSharePercent");
  // Blank clears the split rather than defaulting to something nobody agreed.
  const percent = raw ? validateSharePercent(raw) : 0;
  if (percent === null) back({ err: "sharepercent" }, "venue-split");

  const current = await getSettings();
  const ok = await saveSettings({
    ...current,
    venueSharePercent: percent,
    venueOwnerName: field(data, "venueOwnerName"),
    venueOwnerEmail: field(data, "venueOwnerEmail"),
  });

  if (!ok) back({ err: "save" }, "venue-split");
  revalidatePath(PAGE);
  back({ msg: "venueSaved" }, "venue-split");
}
