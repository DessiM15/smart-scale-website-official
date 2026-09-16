"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSignedIn, signIn, signOut } from "@/lib/ads/auth";
import { currentWho, setWho } from "@/lib/ads/who";
import {
  isEmailConfigured,
  keyFingerprint,
  sendEmail,
  testEmail,
  type TestKind,
} from "@/lib/ads/email";
import { runBackup } from "@/lib/ads/backup";
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
  ARTWORK_STATUSES,
  categoryConflict,
  deleteAdvertiser,
  deleteProspect,
  findProspectByAdvertiser,
  getAdvertiser,
  getProspect,
  listAdvertisers,
  patchProspect,
  saveAdvertiser,
  saveProspect,
  today,
  type Advertiser,
  type AdvertiserStatus,
  type ArtworkStatus,
  type PlanId,
  type Prospect,
  type ProspectInput,
  type ProspectStatus,
  PLANS,
  atVenue,
  venueIdOf,
} from "@/lib/ads/roster";
import { lowestFreeSlot } from "@/lib/ads/board";
import { listVenues, saveVenue, setVenueStatus, venueOf, WEEKDAYS, type DayHours, type VenueStatus, VENUE_STATUSES } from "@/lib/ads/venues";
import { currentVenue, setCurrentVenue } from "@/lib/ads/current-venue";
import { venueDocumentOwner } from "@/lib/ads/venue-dues";
import {
  addPlacement,
  getCampaign,
  getPlacement,
  listAllPlacements,
  listCampaigns,
  MEDIA,
  mediumOf,
  removePlacement,
  saveCampaign,
  saveCampaignClient,
  setCampaignStatus,
  updatePlacement,
  CAMPAIGN_STATUSES,
  SMART_SCALE_CLIENT_ID,
  type CampaignMedium,
  type CampaignStatus,
} from "@/lib/ads/campaigns";
import { deleteDocument, getDocument, uploadDocument } from "@/lib/ads/documents";
import { recordPayment, type PaymentMethod } from "@/lib/ads/payments";
import {
  addTask,
  clearDone,
  completeTask,
  deleteTask,
  markDone,
  recordHistory,
  type HistoryKind,
} from "@/lib/ads/tasks";

const ADMIN = "/advertise/admin";
const PAGES = {
  today: ADMIN,
  pipeline: `${ADMIN}/pipeline`,
  advertisers: `${ADMIN}/advertisers`,
  payments: `${ADMIN}/payments`,
  artwork: `${ADMIN}/artwork`,
  qr: `${ADMIN}/qr`,
  reports: `${ADMIN}/reports`,
  locations: `${ADMIN}/locations`,
  campaigns: `${ADMIN}/campaigns`,
  setup: `${ADMIN}/setup`,
  history: `${ADMIN}/history`,
} as const;

const field = (data: FormData, name: string) => String(data.get(name) ?? "").trim();

/**
 * A money or term field that is allowed to be left blank.
 *
 * Blank means "use the package price", which is not the same as zero. A free
 * spot is a deliberate $0 override, so an empty box must never become one.
 */
function optionalNumber(data: FormData, name: string): number | null {
  const raw = field(data, name).replace(/[$,\s]/g, "");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** True when the box had something in it, whether or not it parsed. */
const wasFilled = (data: FormData, name: string) => field(data, name).replace(/[$,\s]/g, "").length > 0;

/**
 * The value only if the form actually carried the field.
 *
 * Records are merged on save rather than replaced, so a field a form never
 * rendered keeps whatever it already held. `field()` returns "" for both
 * "left blank" and "not on this form", and those mean opposite things.
 */
const present = (data: FormData, name: string): string | undefined =>
  data.has(name) ? field(data, name) : undefined;

/** Every mutation re-checks the session. An action is a public endpoint. */
async function requireAdmin() {
  if (!(await isSignedIn())) redirect(`${ADMIN}/signin`);
}

/**
 * Where to go afterwards.
 *
 * Every form can carry a `returnTo` so an action taken from the Today list
 * lands back on Today rather than on the page the action "belongs" to. Only
 * paths inside the portal are honoured; anything else falls back.
 */
function returnPath(data: FormData, fallback: string): string {
  const wanted = field(data, "returnTo");
  return wanted.startsWith(ADMIN) && !wanted.includes("//") ? wanted.split("?")[0].split("#")[0] : fallback;
}

/**
 * Back to a page with the result.
 *
 * `anchor` matters more than it looks: the result banner sits at the top of
 * the page, and an action taken from a form halfway down reloads to a
 * restored scroll position where nothing appears to have changed.
 */
function back(path: string, params: Record<string, string>, anchor?: string): never {
  const hash = anchor ? `#${anchor}` : "";
  const query = Object.keys(params).length ? `?${new URLSearchParams(params)}` : "";
  revalidatePath(path);
  redirect(`${path}${query}${hash}`);
}

/** Who is doing this, for log lines. Blank if nobody has picked a name. */
async function who(): Promise<string> {
  return currentWho();
}

async function log(kind: HistoryKind, text: string, href?: string) {
  await recordHistory({ who: await who(), kind, text, href });
}

/* ---------------------------------- auth ---------------------------------- */

export async function signInAction(data: FormData) {
  const ok = await signIn(field(data, "key"));
  if (!ok) redirect(`${ADMIN}/signin?err=badkey`);
  redirect(ADMIN);
}

export async function signOutAction() {
  await signOut();
  redirect(`${ADMIN}/signin`);
}

export async function setWhoAction(data: FormData) {
  await requireAdmin();
  const name = field(data, "who");
  const to = returnPath(data, PAGES.today);
  if (!(await setWho(name))) back(to, { err: "who" });
  back(to, { msg: "whoSet", detail: name });
}

/* ------------------------------- advertisers ------------------------------ */

/**
 * What the advertiser form shows when a save is refused.
 *
 * Returned rather than redirected. A redirect on a validation failure throws
 * away everything typed and leaves the reason in a banner above the fold,
 * which reads, correctly, as a button that does nothing.
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

  const [roster, venues] = await Promise.all([listAdvertisers(), listVenues()]);

  /* ---------------------------- the location ---------------------------- */

  // The form names a location once there is more than one to name. Before
  // that, an edit keeps the record's own and a new client goes on the one
  // the portal is looking at.
  const existingRecord = id ? roster.find((v) => v.id === id) : undefined;
  const venue = data.has("venueId")
    ? venueOf(venues, field(data, "venueId"))
    : existingRecord
      ? venueOf(venues, existingRecord.venueId)
      : await currentVenue(venues);
  if (status !== "ended" && venue.status !== "live") return { err: "venuelive", detail: venue.name };

  // Category exclusivity is the product. Verify it rather than trust the form.
  // Per location: the same category can be held at each.
  if (status === "active") {
    const clash = categoryConflict(roster, category, id, venue.id);
    if (clash) return { err: "category", clash: clash.business };
  }

  /* ---------------------------- the deal ---------------------------- */

  const customMonthly = optionalNumber(data, "customMonthly");
  const customSetup = optionalNumber(data, "customSetup");
  const customMonths = optionalNumber(data, "customMonths");
  const customTotal = optionalNumber(data, "customTotal");
  const dealNote = field(data, "dealNote");

  for (const name of ["customMonthly", "customSetup", "customMonths", "customTotal"] as const) {
    if (wasFilled(data, name) && optionalNumber(data, name) === null) {
      return { err: "dealnumber", detail: field(data, name) };
    }
  }
  if (customMonths !== null && customMonths < 1) return { err: "dealmonths" };

  const hasOverride =
    customMonthly !== null || customSetup !== null || customMonths !== null || customTotal !== null;
  if (hasOverride && !dealNote) return { err: "dealnote" };

  /* ----------------------------- the slot ----------------------------- */

  let slot: number | null = null;
  if (wasFilled(data, "slot")) {
    const n = optionalNumber(data, "slot");
    if (n === null || n < 1 || n > venue.sellable || !Number.isInteger(n)) return { err: "slot" };
    slot = n;
  } else if (status !== "ended") {
    // Keep the one they have; give a newcomer the lowest free number.
    // The slot is per location: moving a client to another venue gives them
    // a fresh number there.
    const keep = existingRecord && venueIdOf(existingRecord) === venue.id ? existingRecord.slot : undefined;
    slot =
      keep ??
      lowestFreeSlot(
        atVenue(roster, venue.id).filter((v) => v.id !== id && v.status !== "ended").map((v) => v.slot),
        venue.sellable,
      );
  }

  /* ------------------------- their first QR code ------------------------- */

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
    if (takenCodes.includes(autoCode)) return { err: "codetaken", detail: autoCode };
  }

  const carried: { fromProspectId?: string; campaign?: string; source?: string } = {};
  const prospectId = field(data, "prospectId");
  if (prospectId) {
    carried.fromProspectId = prospectId;
    const campaign = present(data, "prospectCampaign");
    const source = present(data, "prospectSource");
    if (campaign) carried.campaign = campaign;
    if (source) carried.source = source;
  }

  const artworkStatus = field(data, "artworkStatus") as ArtworkStatus;
  const artwork: Partial<Advertiser> = ARTWORK_STATUSES.some((s) => s.id === artworkStatus)
    ? { artworkStatus }
    : {};

  const { ok, id: savedId } = await saveAdvertiser(
    {
      ...carried,
      ...artwork,
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
      slot,
      venueId: venue.id,
    },
    id,
  );

  if (!ok) return { err: "save" };

  // The prospect turns into a client here and nowhere else.
  if (prospectId) {
    const prospect = await getProspect(prospectId);
    if (prospect) {
      await patchProspect(prospectId, {
        status: "won",
        advertiserId: savedId,
        followUpDate: "",
        log: appendUpdate(prospect, {
          at: new Date().toISOString(),
          from: prospect.status,
          to: "won",
          text: `Signed up as an advertiser${status === "pending" ? ", not live yet" : ""}.`,
          who: await who(),
        }),
      });
      await log("advertiser", `Signed up ${business} as an advertiser.`, `${PAGES.advertisers}?open=${savedId}`);
    }
  } else {
    await log("advertiser", id ? `Edited ${business}.` : `Added ${business} to the rotation.`, `${PAGES.advertisers}?open=${savedId}`);
  }

  if (autoCode) {
    const linked = await saveLink({
      code: autoCode,
      label: business,
      destination: newDestination,
      active: true,
      tagDestination: true,
      advertiserId: savedId,
      utmSource: venue.utmSource,
    });
    if (!linked) back(PAGES.advertisers, { msg: "addedNoCode", open: savedId });
  }

  if (chosenCode && chosenCode !== autoCode) {
    const link = await getLink(chosenCode);
    if (link && link.advertiserId !== savedId) {
      await saveLink({ ...link, advertiserId: savedId, logoDataUri: link.logoDataUri ?? null });
    }
  }

  if (autoCode) back(PAGES.advertisers, { msg: "addedWithCode", open: savedId, detail: autoCode });
  back(PAGES.advertisers, { msg: id ? "updated" : "added", open: savedId });
}

export async function deleteAdvertiserAction(data: FormData) {
  await requireAdmin();
  const id = field(data, "id");
  if (!id) back(PAGES.advertisers, { err: "missing" });

  const record = await getAdvertiser(id);
  const prospect = await findProspectByAdvertiser(id);

  if (!(await deleteAdvertiser(id))) back(PAGES.advertisers, { err: "save" });

  if (prospect) {
    await patchProspect(prospect.id, {
      status: "hot",
      advertiserId: "",
      log: appendUpdate(prospect, {
        at: new Date().toISOString(),
        from: "won",
        to: "hot",
        text: "Their advertiser record was deleted, so they are back on the list.",
        who: await who(),
      }),
    });
  }
  await log("advertiser", `Removed ${record?.business ?? id} from the rotation.`);

  back(PAGES.advertisers, { msg: prospect ? "removedBackToList" : "removed" });
}

/** Moves a slide along: requested, received, approved, on screen. */
export async function setArtworkStatusAction(data: FormData) {
  await requireAdmin();
  const id = field(data, "id");
  const status = field(data, "status") as ArtworkStatus;
  const to = returnPath(data, PAGES.artwork);
  const step = ARTWORK_STATUSES.find((s) => s.id === status);
  if (!id || !step) back(to, { err: "missing" });

  const advertiser = await getAdvertiser(id);
  if (!advertiser) back(to, { err: "missing" });

  const { ok } = await saveAdvertiser({ ...advertiser, artworkStatus: status }, id);
  if (!ok) back(to, { err: "save" });

  await log("artwork", `${advertiser.business}: artwork ${step.label.toLowerCase()}.`, `${PAGES.advertisers}?open=${id}&panel=artwork`);
  back(to, { msg: "artworkStatus", detail: step.label.toLowerCase() }, `client-${id}`);
}

/* -------------------------------- prospects ------------------------------- */

const PICKABLE_STATUS: ProspectStatus[] = ["new", "contacted", "hot", "review", "passed"];

/** A date field that has to be a real YYYY-MM-DD, or nothing at all. */
function optionalDate(data: FormData, name: string): string | null {
  const raw = field(data, name);
  if (!raw) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  return raw;
}

const prospectAnchor = (id: string) => `prospect-${id}`;

export async function saveProspectAction(data: FormData) {
  await requireAdmin();
  const to = returnPath(data, PAGES.pipeline);

  const business = field(data, "business");
  if (!business) back(to, { err: "business" });

  const id = field(data, "id") || undefined;

  const optional: Partial<ProspectInput> = {};
  for (const name of ["campaign", "budget"] as const) {
    const value = present(data, name);
    if (value !== undefined) optional[name] = value;
  }
  // The location boxes only exist once there are two locations; a form
  // without them leaves the answer alone rather than clearing it.
  if (field(data, "venueIdsPresent") === "1") {
    const venues = await listVenues();
    const known = new Set(venues.map((v) => v.id));
    optional.venueIds = data
      .getAll("venueIds")
      .map((v) => String(v))
      .filter((v) => known.has(v));
  }

  const chosen = field(data, "status") as ProspectStatus;
  const status: ProspectStatus | undefined = id
    ? undefined
    : PICKABLE_STATUS.includes(chosen)
      ? chosen
      : "new";

  const existing = id ? await getProspect(id) : null;
  if (id && !existing) back(to, { err: "prospectmissing" });

  const { ok, id: savedId } = await saveProspect(
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

  if (!ok) back(to, { err: "save" });
  if (!id) await log("prospect", `Added ${business} to the pipeline.`, `${PAGES.pipeline}#prospect-${savedId}`);
  if (id) back(to, { msg: "prospectEdited" }, prospectAnchor(id));
  back(to, { msg: "prospect" }, prospectAnchor(savedId));
}

/**
 * One thing that happened, written to the timeline.
 *
 * The status and the note are recorded together on purpose. A status that
 * moves with no reason attached is what makes a pipeline useless three weeks
 * later, when nobody can remember what "contacted" meant for this one.
 */
export async function logProspectUpdateAction(data: FormData) {
  await requireAdmin();
  const to = returnPath(data, PAGES.pipeline);

  const id = field(data, "id");
  if (!id) back(to, { err: "missing" });

  const prospect = await getProspect(id);
  if (!prospect) back(to, { err: "prospectmissing" });

  const note = field(data, "note").slice(0, 1200);
  const followUp = optionalDate(data, "followUp");
  if (followUp === null) back(to, { err: "followupdate" }, prospectAnchor(id));

  const chosen = field(data, "status");
  const by = await who();

  if (chosen === "convert") {
    if (note) {
      await patchProspect(id, {
        log: appendUpdate(prospect, { at: new Date().toISOString(), from: "", to: prospect.status, text: note, who: by }),
      });
    }
    back(PAGES.advertisers, { from: id }, "editor");
  }

  const status = PICKABLE_STATUS.includes(chosen as ProspectStatus) ? (chosen as ProspectStatus) : prospect.status;

  // The date box is blank by default now, so an unchanged empty box means
  // "leave the follow-up alone", not "clear it".
  const keepDate = !data.has("followUp") || (followUp === "" && !field(data, "clearFollowUp"));
  const nextFollowUp = keepDate ? (prospect.followUpDate ?? "") : followUp;

  if (!note && status === prospect.status && nextFollowUp === (prospect.followUpDate ?? "")) {
    back(to, { err: "emptyupdate" }, prospectAnchor(id));
  }

  const moved = status !== prospect.status;
  const text =
    note ||
    (!moved && nextFollowUp !== (prospect.followUpDate ?? "")
      ? nextFollowUp
        ? "Follow-up date set."
        : "Follow-up cleared."
      : "");

  const ok = await patchProspect(id, {
    status,
    followUpDate: nextFollowUp,
    log: appendUpdate(prospect, {
      at: new Date().toISOString(),
      from: moved ? prospect.status : "",
      to: status,
      text,
      followUp: nextFollowUp || undefined,
      who: by,
    }),
  });

  if (!ok) back(to, { err: "save" });
  if (moved) await log("prospect", `${prospect.business}: moved to ${status}.${note ? ` ${note}` : ""}`, `${PAGES.pipeline}#prospect-${id}`);
  else if (note) await log("prospect", `${prospect.business}: ${note}`, `${PAGES.pipeline}#prospect-${id}`);
  back(to, { msg: "prospectUpdated" }, prospectAnchor(id));
}

/**
 * The follow-up is done. The date comes off the prospect, a line goes on
 * their timeline, and the row leaves the Today list.
 */
export async function completeFollowUpAction(data: FormData) {
  await requireAdmin();
  const to = returnPath(data, PAGES.today);
  const id = field(data, "id");
  const prospect = id ? await getProspect(id) : null;
  if (!prospect) back(to, { err: "prospectmissing" });

  const by = await who();
  const note = field(data, "note");
  const ok = await patchProspect(id, {
    followUpDate: "",
    log: appendUpdate(prospect, {
      at: new Date().toISOString(),
      from: "",
      to: prospect.status,
      text: note || "Follow-up done.",
      who: by,
    }),
  });
  if (!ok) back(to, { err: "save" });
  await log("followup", `Followed up with ${prospect.business}.${note ? ` ${note}` : ""}`, `${PAGES.pipeline}#prospect-${id}`);
  back(to, { msg: "done" });
}

/** Moves the follow-up date without logging a conversation. */
export async function rescheduleFollowUpAction(data: FormData) {
  await requireAdmin();
  const to = returnPath(data, PAGES.pipeline);
  const id = field(data, "id");
  const prospect = id ? await getProspect(id) : null;
  if (!prospect) back(to, { err: "prospectmissing" });

  const date = optionalDate(data, "followUp");
  if (date === null || date === "") back(to, { err: "followupdate" }, prospectAnchor(id));

  const ok = await patchProspect(id, {
    followUpDate: date,
    log: appendUpdate(prospect, {
      at: new Date().toISOString(),
      from: "",
      to: prospect.status,
      text: "Follow-up moved.",
      followUp: date,
      who: await who(),
    }),
  });
  if (!ok) back(to, { err: "save" });
  back(to, { msg: "prospectUpdated" }, prospectAnchor(id));
}

export async function toggleProspectGateAction(data: FormData) {
  await requireAdmin();
  const to = returnPath(data, PAGES.pipeline);

  const id = field(data, "id");
  const gate = field(data, "gate");
  const on = field(data, "on") === "1";

  const GATES = {
    mockupApproved: "the mockup approved",
    agreementSigned: "the agreement signed",
    paymentReceived: "payment received",
  } as const;

  if (!(gate in GATES)) back(to, { err: "missing" });
  const key = gate as keyof typeof GATES;

  const prospect = await getProspect(id);
  if (!prospect) back(to, { err: "prospectmissing" });

  const ok = await patchProspect(id, {
    [key]: on,
    log: appendUpdate(prospect, {
      at: new Date().toISOString(),
      from: "",
      to: prospect.status,
      text: on ? `Marked ${GATES[key]}.` : `Unmarked ${GATES[key]}.`,
      who: await who(),
    }),
  } as Partial<Prospect>);

  if (!ok) back(to, { err: "save" });
  back(to, { msg: "prospectUpdated" }, prospectAnchor(id));
}

export async function deleteProspectAction(data: FormData) {
  await requireAdmin();
  const to = returnPath(data, PAGES.pipeline);
  const id = field(data, "id");
  if (!id) back(to, { err: "missing" });
  const prospect = await getProspect(id);
  if (!(await deleteProspect(id))) back(to, { err: "save" });
  if (prospect) await log("prospect", `Removed ${prospect.business} from the pipeline.`);
  back(to, { msg: "prospectRemoved" });
}

/* ----------------------------- the Today list ----------------------------- */

/**
 * Marks a computed row done: a renewal call made, paperwork chased. The
 * marker is keyed to the term, so it comes back when the next one ends.
 */
export async function markDoneAction(data: FormData) {
  await requireAdmin();
  const to = returnPath(data, PAGES.today);
  const key = field(data, "key");
  const title = field(data, "title");
  if (!/^(renewal|paperwork|reply|reports|vault|filing):/.test(key)) back(to, { err: "missing" });

  const by = await who();
  if (!(await markDone(key, by))) back(to, { err: "save" });

  const prefix = key.split(":")[0];
  const kind = (prefix === "vault" || prefix === "filing" ? "books" : prefix) as HistoryKind;
  const verb =
    prefix === "renewal"
      ? "Renewal handled"
      : prefix === "paperwork"
        ? "Paperwork chased"
        : prefix === "reply"
          ? "Reply handled"
          : prefix === "vault"
            ? "Document renewed"
            : prefix === "filing"
              ? "Filing done"
              : "Done";
  await log(kind, `${verb}: ${title || key}.`, field(data, "href") || undefined);
  back(to, { msg: "done" });
}

export async function undoDoneAction(data: FormData) {
  await requireAdmin();
  const to = returnPath(data, PAGES.history);
  const key = field(data, "key");
  if (!key) back(to, { err: "missing" });
  if (!(await clearDone(key))) back(to, { err: "save" });
  back(to, { msg: "undone" });
}

export async function addTaskAction(data: FormData) {
  await requireAdmin();
  const to = returnPath(data, PAGES.today);
  const title = field(data, "title");
  if (!title) back(to, { err: "tasktitle" }, "add-task");
  const dueDate = optionalDate(data, "dueDate");
  if (dueDate === null) back(to, { err: "taskdate" }, "add-task");

  const { ok } = await addTask({
    title,
    detail: field(data, "detail"),
    dueDate: dueDate || today(),
    who: await who(),
    advertiserId: field(data, "advertiserId") || undefined,
    prospectId: field(data, "prospectId") || undefined,
  });
  if (!ok) back(to, { err: "save" });
  back(to, { msg: "taskAdded" });
}

export async function completeTaskAction(data: FormData) {
  await requireAdmin();
  const to = returnPath(data, PAGES.today);
  const id = field(data, "id");
  const by = await who();
  const task = await completeTask(id, by);
  if (!task) back(to, { err: "save" });
  await log("task", `Done: ${task.title}.`);
  back(to, { msg: "taskDone" });
}

export async function deleteTaskAction(data: FormData) {
  await requireAdmin();
  const to = returnPath(data, PAGES.today);
  if (!(await deleteTask(field(data, "id")))) back(to, { err: "save" });
  back(to, { msg: "taskRemoved" });
}

/* -------------------------------- payments -------------------------------- */

/**
 * Money landed against a particular month's expected payment. Records the
 * payment the way the client profile does, tagged with the period so the
 * schedule puts it exactly where it was meant.
 */
export async function markPaidAction(data: FormData) {
  await requireAdmin();
  const to = returnPath(data, PAGES.payments);
  const advertiserId = field(data, "advertiserId");
  const advertiser = advertiserId ? await getAdvertiser(advertiserId) : null;
  if (!advertiser) back(to, { err: "missing" });

  const amount = Number(field(data, "amount").replace(/[$,\s]/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) back(to, { err: "amount" });
  const receivedOn = /^\d{4}-\d{2}-\d{2}$/.test(field(data, "receivedOn")) ? field(data, "receivedOn") : today();
  const method = (field(data, "method") || "stripe") as PaymentMethod;
  const period = /^\d{4}-\d{2}$/.test(field(data, "period")) ? field(data, "period") : undefined;

  const result = await recordPayment({
    advertiserId,
    business: advertiser.business,
    amount,
    receivedOn,
    method,
    reference: field(data, "reference"),
    note: field(data, "note"),
    period,
    who: await who(),
  });
  if (!result.ok) back(to, { err: "payment", detail: result.error ?? "" });

  const label = `$${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })} from ${advertiser.business}`;
  await log("payment", `Marked paid: ${label} by ${method}.`, `${PAGES.payments}?month=${period ?? receivedOn.slice(0, 7)}`);
  back(to, { msg: "paid", detail: label, ...(period ? { month: period } : {}) });
}

export async function runAlertsAction(data: FormData) {
  await requireAdmin();
  const to = returnPath(data, PAGES.setup);
  const result = await runRenewalCheck("manual");
  back(to, {
    msg: "alerts",
    sent: String(result.sent),
    checked: String(result.checked),
    failed: String(result.failed),
  });
}

export async function clearResponseAction(data: FormData) {
  await requireAdmin();
  const to = returnPath(data, PAGES.today);
  const advertiserId = field(data, "advertiserId");
  const endDate = field(data, "endDate");
  if (!advertiserId || !endDate) back(to, { err: "missing" });
  if (!(await clearResponse(advertiserId, endDate))) back(to, { err: "save" });
  await log("reply", `Handled ${field(data, "business") || "an advertiser"}'s reply about the term ending ${endDate}.`);
  back(to, { msg: "replyCleared" });
}

/* ------------------------------- QR codes -------------------------------- */

const LOGO_MAX_BYTES = 200 * 1024;
const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

async function readLogo(data: FormData): Promise<{ dataUri?: string; error?: string }> {
  const file = data.get("logo");
  if (!(file instanceof File) || file.size === 0) return {};
  if (!LOGO_TYPES.includes(file.type)) return { error: "logotype" };
  if (file.size > LOGO_MAX_BYTES) return { error: "logosize" };
  const buffer = Buffer.from(await file.arrayBuffer());
  return { dataUri: `data:${file.type};base64,${buffer.toString("base64")}` };
}

export async function saveLinkAction(data: FormData) {
  await requireAdmin();
  const to = PAGES.qr;

  const isNew = field(data, "isNew") === "1";
  const code = normalizeCode(field(data, "code"));
  const destination = field(data, "destination");
  const label = field(data, "label");

  const codeError = validateCode(code);
  if (codeError) back(to, { err: "code", detail: codeError }, "qr");

  const destError = validateDestination(destination);
  if (destError) back(to, { err: "destination", detail: destError }, "qr");

  const existing = await getLink(code);
  if (isNew && existing) back(to, { err: "codetaken", detail: code }, "qr");
  if (!isNew && !existing) back(to, { err: "codemissing", detail: code }, "qr");

  const logo = await readLogo(data);
  if (logo.error) back(to, { err: logo.error }, "qr");

  const removeLogo = field(data, "removeLogo") === "1";

  const ok = await saveLink({
    code,
    label: label || code,
    destination,
    active: field(data, "active") !== "0",
    tagDestination: field(data, "tagDestination") !== "0",
    logoDataUri: removeLogo ? null : logo.dataUri,
    advertiserId: existing?.advertiserId,
  });

  if (!ok) back(to, { err: "save" }, "qr");
  back(to, { msg: isNew ? "linkAdded" : "linkSaved", detail: code });
}

export async function toggleLinkActiveAction(data: FormData) {
  await requireAdmin();
  const code = normalizeCode(field(data, "code"));
  const active = field(data, "active") === "1";
  if (!(await setLinkActive(code, active))) back(PAGES.qr, { err: "save" });
  back(PAGES.qr, { msg: active ? "linkOn" : "linkOff", detail: code });
}

export async function markScansAsTestsAction(data: FormData) {
  await requireAdmin();
  const to = returnPath(data, PAGES.qr);
  const code = normalizeCode(field(data, "code"));
  if (!(await getLink(code))) back(to, { err: "codemissing", detail: code });
  const { ok, excluded } = await markScansAsTests(code);
  if (!ok) back(to, { err: "save" });
  back(to, { msg: "testsExcluded", detail: code, sent: String(excluded) });
}

export async function clearTestScansAction(data: FormData) {
  await requireAdmin();
  const to = returnPath(data, PAGES.qr);
  const code = normalizeCode(field(data, "code"));
  if (!(await clearTestBaseline(code))) back(to, { err: "save" });
  back(to, { msg: "testsRestored", detail: code });
}

/* ---------------------------- monthly reports ---------------------------- */

export async function generateReportsAction(data: FormData) {
  await requireAdmin();
  const month = field(data, "month") || undefined;
  const result = await generateReports(month);
  back(PAGES.reports, { msg: "reportsDrafted", sent: String(result.created), checked: String(result.skipped) });
}

export async function sendReportAction(data: FormData) {
  await requireAdmin();
  const result = await sendReport(field(data, "advertiserId"), field(data, "month"));
  if (!result.ok) back(PAGES.reports, { err: "reportsend", detail: result.error ?? "" });
  await log("report", `Sent the ${field(data, "month")} report to ${field(data, "business") || "an advertiser"}.`, PAGES.reports);
  back(PAGES.reports, { msg: "reportSent" });
}

export async function skipReportAction(data: FormData) {
  await requireAdmin();
  if (!(await skipReport(field(data, "advertiserId"), field(data, "month")))) back(PAGES.reports, { err: "save" });
  back(PAGES.reports, { msg: "reportSkipped" });
}

export async function recalculateReportAction(data: FormData) {
  await requireAdmin();
  const result = await recalculateReport(field(data, "advertiserId"), field(data, "month"));
  if (!result.ok) back(PAGES.reports, { err: "reportfigures", detail: result.error ?? "" });
  back(PAGES.reports, {
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
  if (!result.ok) back(PAGES.reports, { err: "reportfigures", detail: result.error ?? "" });
  back(PAGES.reports, { msg: "reportDeleted" });
}

export async function editReportAction(data: FormData) {
  await requireAdmin();
  const ok = await updateNarrative(
    field(data, "advertiserId"),
    field(data, "month"),
    field(data, "headline"),
    field(data, "body"),
  );
  if (!ok) back(PAGES.reports, { err: "save" });
  back(PAGES.reports, { msg: "reportEdited" });
}

/* ------------------------------- test send -------------------------------- */

const TEST_ANCHOR = "test-email";

export async function sendTestEmailAction(data: FormData) {
  await requireAdmin();

  const to = field(data, "to");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) back(PAGES.setup, { err: "testaddress" }, TEST_ANCHOR);
  if (!isEmailConfigured()) back(PAGES.setup, { err: "testunconfigured" }, TEST_ANCHOR);

  const kind = (field(data, "kind") || "delivery") as TestKind;
  const message = testEmail(kind === "renewal" ? "renewal" : "delivery");

  const result = await sendEmail({ to, ...message });
  if (!result.ok) {
    const note = /401|unauthor|token/i.test(result.error ?? "")
      ? ` (the key this deployment is using: ${keyFingerprint()})`
      : "";
    back(PAGES.setup, { err: "testsend", detail: `${result.error ?? ""}${note}` }, TEST_ANCHOR);
  }

  back(PAGES.setup, { msg: "testSent", detail: to, sent: result.detail ?? "" }, TEST_ANCHOR);
}

/* -------------------------------- backups --------------------------------- */

export async function runBackupAction() {
  await requireAdmin();
  const result = await runBackup();
  if (result.skipped) back(PAGES.setup, { err: "backupoff" }, "backups");
  if (!result.ok) back(PAGES.setup, { err: "backupfailed", detail: result.error ?? "" }, "backups");
  back(
    PAGES.setup,
    { msg: "backupDone", detail: `${result.entry?.advertisers ?? 0} advertisers, ${result.entry?.prospects ?? 0} prospects` },
    "backups",
  );
}

/* -------------------------------- locations ------------------------------- */

/** The sidebar switcher. Which location the Board, categories and roster show. */
export async function setCurrentVenueAction(data: FormData) {
  await requireAdmin();
  const to = returnPath(data, PAGES.today);
  if (!(await setCurrentVenue(field(data, "venueId")))) back(to, { err: "venuemissing" });
  back(to, {});
}

/** A whole number field, or null when blank or not a number. */
function wholeNumber(data: FormData, name: string): number | null {
  const raw = field(data, name).replace(/[,\s]/g, "");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isInteger(n) ? n : null;
}

export async function saveVenueAction(data: FormData) {
  await requireAdmin();
  const to = PAGES.locations;
  const id = field(data, "id") || undefined;

  const hours: DayHours[] = WEEKDAYS.map((_, i) =>
    field(data, `closed_${i}`) === "1" ? null : { open: field(data, `open_${i}`), close: field(data, `close_${i}`) },
  );

  const status = field(data, "status") as VenueStatus;
  const rent = optionalNumber(data, "rentMonthly");
  const share = optionalNumber(data, "sharePercent");
  if ((wasFilled(data, "rentMonthly") && rent === null) || (wasFilled(data, "sharePercent") && share === null)) {
    back(to, { err: "venue", detail: "Rent and share have to be numbers, or left blank." }, "editor");
  }

  const result = await saveVenue({
    id,
    name: field(data, "name"),
    place: field(data, "place"),
    address: field(data, "address"),
    status: VENUE_STATUSES.some((s) => s.id === status) ? status : "pending",
    screens: wholeNumber(data, "screens") ?? 1,
    slides: wholeNumber(data, "slides") ?? 0,
    sellable: wholeNumber(data, "sellable") ?? 0,
    slideSeconds: wholeNumber(data, "slideSeconds") ?? 10,
    hours,
    ownerName: field(data, "ownerName"),
    ownerEmail: field(data, "ownerEmail"),
    ownerPhone: field(data, "ownerPhone"),
    deal: {
      rentMonthly: rent ?? 0,
      sharePercent: share ?? 0,
      dueDay: wholeNumber(data, "dueDay") ?? 1,
      note: field(data, "dealNote"),
    },
    utmSource: field(data, "utmSource"),
    notes: field(data, "notes"),
  });

  if (!result.ok) back(to, { err: result.error ? "venue" : "save", detail: result.error ?? "" }, "editor");
  await log("other", id ? `Edited the ${field(data, "name")} location.` : `Added ${field(data, "name")} as a location.`, `${to}#venue-${result.id}`);
  back(to, { msg: id ? "venueUpdated" : "venueAdded", detail: field(data, "name") }, `venue-${result.id}`);
}

export async function setVenueStatusAction(data: FormData) {
  await requireAdmin();
  const to = PAGES.locations;
  const id = field(data, "id");
  const status = field(data, "status") as VenueStatus;
  if (!id || !VENUE_STATUSES.some((s) => s.id === status)) back(to, { err: "missing" });
  if (!(await setVenueStatus(id, status))) back(to, { err: "save" });
  const label = VENUE_STATUSES.find((s) => s.id === status)!.label.toLowerCase();
  await log("other", `${id}: location marked ${label}.`, `${to}#venue-${id}`);
  back(to, { msg: "venueStatus", detail: label }, `venue-${id}`);
}

/** The signed agreement with the venue, kept privately like a client's. */
export async function uploadVenueDocumentAction(data: FormData) {
  await requireAdmin();
  const to = PAGES.locations;
  const venueId = field(data, "venueId");
  const venues = await listVenues();
  if (!venues.some((v) => v.id === venueId)) back(to, { err: "venuemissing" });

  const file = data.get("file");
  if (!(file instanceof File) || file.size === 0) back(to, { err: "docmissing" }, `venue-${venueId}`);

  const stored = await uploadDocument(venueDocumentOwner(venueId), file, {
    kind: "agreement",
    label: field(data, "label") || "Venue agreement",
  });
  if (!stored.ok) back(to, { err: "docupload", detail: stored.error }, `venue-${venueId}`);
  await log("other", `Filed a document on the ${venueOf(venues, venueId).name} location.`, `${to}#venue-${venueId}`);
  back(to, { msg: "venueDoc" }, `venue-${venueId}`);
}

export async function deleteVenueDocumentAction(data: FormData) {
  await requireAdmin();
  const to = PAGES.locations;
  const venueId = field(data, "venueId");
  const id = field(data, "id");
  const doc = await getDocument(id);
  // Only a document that belongs to this location; the id alone is not enough.
  if (!doc || doc.advertiserId !== venueDocumentOwner(venueId)) back(to, { err: "missing" });
  if (!(await deleteDocument(id))) back(to, { err: "save" });
  back(to, { msg: "venueDocRemoved" }, `venue-${venueId}`);
}

/* -------------------------------- campaigns ------------------------------- */

export async function saveCampaignAction(data: FormData) {
  await requireAdmin();
  const to = PAGES.campaigns;
  const id = field(data, "id") || undefined;
  const medium = field(data, "medium") as CampaignMedium;
  const status = field(data, "status") as CampaignStatus;

  const destError = validateDestination(field(data, "destination"));
  if (destError) back(to, { err: "campaign", detail: destError }, "campaign-form");

  const result = await saveCampaign(
    {
      name: field(data, "name"),
      clientId: field(data, "clientId") || SMART_SCALE_CLIENT_ID,
      medium: MEDIA.some((m) => m.id === medium) ? medium : "other",
      status: CAMPAIGN_STATUSES.some((s) => s.id === status) ? status : "draft",
      startDate: field(data, "startDate"),
      endDate: field(data, "endDate"),
      destination: field(data, "destination"),
      tagDestination: field(data, "tagDestination") === "1",
      notes: field(data, "notes"),
    },
    id,
  );
  if (!result.ok) back(to, { err: "campaign", detail: result.error ?? "That didn't save." }, "campaign-form");

  await log("other", id ? `Edited the ${field(data, "name")} campaign.` : `Started the ${field(data, "name")} campaign.`, `${to}/${result.id}`);
  if (id) back(`${to}/${id}`, { msg: "campaignUpdated" });
  back(`${to}/${result.id}`, { msg: "campaignAdded" });
}

export async function setCampaignStatusAction(data: FormData) {
  await requireAdmin();
  const id = field(data, "id");
  const status = field(data, "status") as CampaignStatus;
  if (!id || !CAMPAIGN_STATUSES.some((s) => s.id === status)) back(PAGES.campaigns, { err: "missing" });
  if (!(await setCampaignStatus(id, status))) back(PAGES.campaigns, { err: "save" });
  const label = CAMPAIGN_STATUSES.find((s) => s.id === status)!.label.toLowerCase();
  back(`${PAGES.campaigns}/${id}`, { msg: "campaignStatus", detail: label });
}

export async function saveCampaignClientAction(data: FormData) {
  await requireAdmin();
  const to = PAGES.campaigns;
  const name = field(data, "name");
  if (!name) back(to, { err: "business" }, "campaign-client-form");
  const { ok } = await saveCampaignClient({
    name,
    contactName: field(data, "contactName"),
    email: field(data, "email"),
    phone: field(data, "phone"),
    notes: field(data, "notes"),
  });
  if (!ok) back(to, { err: "save" }, "campaign-client-form");
  back(to, { msg: "cclientAdded", detail: name }, "campaign-form");
}

/**
 * A placement gets its code the moment it is saved: a new one named off the
 * campaign, or one already in the registry for something already printed.
 * The link carries the campaign's destination and tags, so every code in a
 * campaign lands in the same place and reads the same way in analytics.
 */
export async function addPlacementAction(data: FormData) {
  await requireAdmin();
  const campaignId = field(data, "campaignId");
  const campaign = await getCampaign(campaignId);
  if (!campaign) back(PAGES.campaigns, { err: "campaignmissing" });
  const to = `${PAGES.campaigns}/${campaignId}`;

  const label = field(data, "label");
  if (!label) back(to, { err: "placementlabel" });

  const quantity = optionalNumber(data, "quantity");
  const cost = optionalNumber(data, "cost");
  if ((wasFilled(data, "quantity") && quantity === null) || (wasFilled(data, "cost") && cost === null)) {
    back(to, { err: "dealnumber", detail: field(data, "cost") || field(data, "quantity") });
  }

  const links = await listLinks();
  const taken = links.map((l) => l.code);
  const existingCode = normalizeCode(field(data, "existingCode"));
  const medium = mediumOf(campaign.medium);

  let code: string;
  if (existingCode) {
    const link = links.find((l) => l.code === existingCode);
    if (!link) back(to, { err: "codemissing", detail: existingCode });
    // Already in a campaign is the one thing that stops it: a code counts once.
    const everywhere = await listAllPlacements(await listCampaigns());
    if ([...everywhere.values()].flat().some((p) => p.code === existingCode)) back(to, { err: "codeinuse", detail: existingCode });
    code = existingCode;
  } else {
    const requested = normalizeCode(field(data, "code"));
    code = requested || suggestCode(`${campaign.name} ${label}`, taken);
    const codeError = validateCode(code);
    if (codeError) back(to, { err: "code", detail: codeError });
    if (taken.includes(code)) back(to, { err: "codetaken", detail: code });
  }

  const logo = await readLogo(data);
  if (logo.error) back(to, { err: logo.error });

  const placed = await addPlacement({
    campaignId,
    label,
    code,
    quantity: quantity !== null ? Math.round(quantity) : null,
    cost,
    note: field(data, "note"),
  });
  if (!placed.ok) back(to, { err: "save" });

  const existing = existingCode ? links.find((l) => l.code === existingCode) : undefined;
  const linked = await saveLink({
    code,
    label: existing?.label || `${campaign.name} · ${label}`,
    // An existing code keeps where it already points; the campaign's
    // destination is for codes made here.
    destination: existing?.destination || campaign.destination,
    active: existing?.active ?? true,
    tagDestination: existing ? existing.tagDestination : campaign.tagDestination,
    logoDataUri: logo.dataUri,
    utmSource: existing?.utmSource ?? "smart-scale",
    utmMedium: existing?.utmMedium ?? medium.utmMedium,
    campaignId,
    placementId: placed.id,
  });
  if (!linked) {
    await removePlacement(placed.id);
    back(to, { err: "save" });
  }

  await log("other", `${campaign.name}: added the ${label} placement as /go/${code}.`, `${to}#placement-${placed.id}`);
  back(to, { msg: "placementAdded", detail: code }, `placement-${placed.id}`);
}

export async function updatePlacementAction(data: FormData) {
  await requireAdmin();
  const campaignId = field(data, "campaignId");
  const to = `${PAGES.campaigns}/${campaignId}`;
  const id = field(data, "id");
  const placement = await getPlacement(id);
  if (!placement || placement.campaignId !== campaignId) back(to, { err: "placementmissing" });

  const label = field(data, "label");
  if (!label) back(to, { err: "placementlabel" }, `placement-${id}`);
  const quantity = optionalNumber(data, "quantity");
  const cost = optionalNumber(data, "cost");
  if ((wasFilled(data, "quantity") && quantity === null) || (wasFilled(data, "cost") && cost === null)) {
    back(to, { err: "dealnumber", detail: field(data, "cost") || field(data, "quantity") }, `placement-${id}`);
  }

  const ok = await updatePlacement(id, {
    label,
    quantity: quantity !== null ? Math.round(quantity) : null,
    cost,
    note: field(data, "note"),
  });
  if (!ok) back(to, { err: "save" }, `placement-${id}`);
  back(to, { msg: "placementSaved" }, `placement-${id}`);
}

export async function removePlacementAction(data: FormData) {
  await requireAdmin();
  const campaignId = field(data, "campaignId");
  const to = `${PAGES.campaigns}/${campaignId}`;
  const id = field(data, "id");
  const placement = await getPlacement(id);
  if (!placement || placement.campaignId !== campaignId) back(to, { err: "placementmissing" });

  const removed = await removePlacement(id);
  if (!removed) back(to, { err: "save" });
  // The code stays, with its history; it just stops being this campaign's.
  const link = await getLink(removed.code);
  if (link) await saveLink({ ...link, logoDataUri: link.logoDataUri ?? null, advertiserId: link.advertiserId ?? null, campaignId: null, placementId: null });
  back(to, { msg: "placementRemoved", detail: removed.label });
}
