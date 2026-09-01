/** Businesses waiting on a slot or a category. */

import { deleteProspectAction, saveProspectAction } from "../actions";
import type { Prospect } from "@/lib/ads/roster";
import {
  Card,
  Empty,
  Field,
  Pill,
  btnPrimary,
  inputClass,
  labelClass,
  linkQuiet,
  selectClass,
  type Tone,
} from "./ui";

const PROSPECT_STATUS: Record<Prospect["status"], { label: string; tone: Tone }> = {
  hot: { label: "Hot", tone: "brand" },
  contacted: { label: "Contacted", tone: "warn" },
  new: { label: "New", tone: "neutral" },
  passed: { label: "Passed", tone: "neutral" },
};

function ProspectList({ prospects }: { prospects: Prospect[] }) {
  if (prospects.length === 0) {
    return (
      <Empty>
        Nobody on the list yet. Add businesses that ask about the screens — when a
        category opens up, this is who you call.
      </Empty>
    );
  }
  return (
    <ul className="divide-y divide-white/[0.06]">
      {prospects.map((p) => {
        const status = PROSPECT_STATUS[p.status];
        return (
          <li
            key={p.id}
            className="py-4 flex flex-wrap items-start justify-between gap-3"
          >
            <div>
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-white">{p.business}</span>
                <Pill tone={status.tone}>{status.label}</Pill>
              </p>
              <p className="text-xs text-white/35 mt-1">
                {[p.category, p.contactName, p.phone, p.email, p.source]
                  .filter(Boolean)
                  .join(" · ") || "no details"}
              </p>
              {p.notes && <p className="text-xs text-white/55 mt-1.5">{p.notes}</p>}
            </div>
            <form action={deleteProspectAction}>
              <input type="hidden" name="id" value={p.id} />
              <button type="submit" className={linkQuiet}>
                Remove
              </button>
            </form>
          </li>
        );
      })}
    </ul>
  );
}

export function ProspectsTab({ prospects }: { prospects: Prospect[] }) {
  return (
    <>
      <Card
        title="Interested list"
        lede="Businesses waiting on a slot or a category."
        className="mb-5"
      >
        <ProspectList prospects={prospects} />
      </Card>

      {/* Open on an empty list so a first visit isn't a dead end. */}
      <details
        open={prospects.length === 0}
        className="group rounded-3xl border border-white/[0.07] bg-[#131313] overflow-hidden"
      >
        <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 sm:px-8 py-5 list-none [&::-webkit-details-marker]:hidden hover:bg-white/[0.02] transition-colors">
          <span className="text-white font-semibold">Add to the list</span>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35 group-open:hidden">
            Open
          </span>
          <span className="hidden text-xs font-semibold uppercase tracking-[0.14em] text-white/35 group-open:inline">
            Close
          </span>
        </summary>

        <div className="px-6 sm:px-8 pb-8 pt-6 border-t border-white/[0.06]">
          <form action={saveProspectAction} className="grid sm:grid-cols-3 gap-4">
            <Field label="Business" name="business" id="prospect-business" required />
            <Field label="Category wanted" name="category" id="prospect-category" />
            <Field label="Contact name" name="contactName" id="prospect-contact" />
            <Field label="Phone" name="phone" id="prospect-phone" type="tel" />
            <Field label="Email" name="email" id="prospect-email" type="email" />
            <Field
              label="Source"
              name="source"
              id="prospect-source"
              placeholder="Walk-in, referral, QR scan…"
            />
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="prospect-notes">
                Notes
              </label>
              <input id="prospect-notes" name="notes" className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="prospect-status">
                Interest
              </label>
              <select
                id="prospect-status"
                name="status"
                defaultValue="new"
                className={selectClass}
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="hot">Hot</option>
                <option value="passed">Passed</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <button type="submit" className={`${btnPrimary} px-6 py-3`}>
                Add to list
              </button>
            </div>
          </form>
        </div>
      </details>
    </>
  );
}
