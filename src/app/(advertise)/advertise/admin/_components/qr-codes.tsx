/**
 * The link registry. Each code is a short link on our own domain that counts
 * the scan and forwards on, so a printed ad can be re-pointed later.
 */

import { saveLinkAction, toggleLinkActiveAction } from "../actions";
import type { LinkView } from "./types";
import { tabHref } from "./types";
import {
  Card,
  Empty,
  Pill,
  btnPrimary,
  inputClass,
  labelClass,
  linkAction,
  linkQuiet,
} from "./ui";

function Artwork({ code }: { code: string }) {
  return (
    <>
      <a href={`/api/ads/qr/${code}?format=svg`} className={linkAction}>
        SVG
      </a>
      <a href={`/api/ads/qr/${code}?format=png`} className={`ml-3 ${linkAction}`}>
        PNG
      </a>
    </>
  );
}

function Controls({ link }: { link: LinkView }) {
  return (
    <>
      <a href={`${tabHref("qr", { editLink: link.code })}#qr`} className={linkQuiet}>
        Edit
      </a>
      <form action={toggleLinkActiveAction} className="inline">
        <input type="hidden" name="code" value={link.code} />
        <input type="hidden" name="active" value={link.active ? "0" : "1"} />
        <button type="submit" className={`ml-4 ${linkQuiet}`}>
          {link.active ? "Retire" : "Restore"}
        </button>
      </form>
    </>
  );
}

function LinkRow({ link }: { link: LinkView }) {
  return (
    <tr className="border-t border-white/[0.06] align-top hover:bg-white/[0.02] transition-colors">
      <td className="px-4 py-4">
        <p className="font-mono text-[#f87171]">/go/{link.code}</p>
        <p className="text-xs text-white/35 mt-0.5">{link.label}</p>
        {!link.active && (
          <span className="inline-block mt-1.5">
            <Pill>Retired</Pill>
          </span>
        )}
      </td>
      <td className="px-4 py-4">
        <p className="text-white/60 break-all">
          {link.destination.replace(/^https?:\/\//, "")}
        </p>
        {link.logoDataUri && (
          <p className="text-xs text-white/30 mt-0.5">logo in the middle</p>
        )}
      </td>
      <td className="px-4 py-4 text-right tabular-nums text-white">
        {link.scans.toLocaleString()}
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <Artwork code={link.code} />
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <Controls link={link} />
      </td>
    </tr>
  );
}

function LinkCard({ link }: { link: LinkView }) {
  return (
    <li className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[#f87171]">/go/{link.code}</p>
          <p className="text-xs text-white/35 mt-0.5">{link.label}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-white tabular-nums leading-none">
            {link.scans.toLocaleString()}
          </p>
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/30 font-semibold mt-1">
            scans
          </p>
        </div>
      </div>

      <p className="mt-3 text-sm text-white/55 break-all">
        {link.destination.replace(/^https?:\/\//, "")}
      </p>
      {!link.active && (
        <span className="inline-block mt-2">
          <Pill>Retired</Pill>
        </span>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
        <Artwork code={link.code} />
        <span className="whitespace-nowrap">
          <Controls link={link} />
        </span>
      </div>
    </li>
  );
}

export function QrTab({
  links,
  editing,
}: {
  links: LinkView[];
  editing?: LinkView;
}) {
  return (
    <>
      <Card
        title="QR codes"
        lede="Each code is a short link on our own domain that counts the scan, then forwards to the advertiser. Because we own the link, you can change where an ad points long after the artwork is printed."
        className="mb-5"
      >
        {links.length === 0 ? (
          <Empty>No codes yet. Create the first one below.</Empty>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto -mx-6 sm:-mx-8 px-6 sm:px-8">
              <table className="w-full text-sm min-w-[48rem]">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-[0.16em] text-white/35">
                    <th className="px-4 py-2 font-semibold">Code</th>
                    <th className="px-4 py-2 font-semibold">Sends people to</th>
                    <th className="px-4 py-2 font-semibold text-right">Scans</th>
                    <th className="px-4 py-2 font-semibold">Artwork</th>
                    <th className="px-4 py-2 font-semibold" />
                  </tr>
                </thead>
                <tbody>
                  {links.map((link) => (
                    <LinkRow key={link.code} link={link} />
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="md:hidden space-y-3">
              {links.map((link) => (
                <LinkCard key={link.code} link={link} />
              ))}
            </ul>
          </>
        )}
      </Card>

      <details
        id="qr"
        open={Boolean(editing) || links.length === 0}
        className="group rounded-3xl border border-white/[0.07] bg-[#131313] overflow-hidden"
      >
        <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 sm:px-8 py-5 list-none [&::-webkit-details-marker]:hidden hover:bg-white/[0.02] transition-colors">
          <span className="text-white font-semibold">
            {editing ? `Edit /go/${editing.code}` : "New QR code"}
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35 group-open:hidden">
            Open
          </span>
          <span className="hidden text-xs font-semibold uppercase tracking-[0.14em] text-white/35 group-open:inline">
            Close
          </span>
        </summary>

        <div className="px-6 sm:px-8 pb-8 pt-2 border-t border-white/[0.06]">
          {editing && (
            <a href={tabHref("qr")} className={`${linkQuiet} inline-block mb-5`}>
              Cancel edit
            </a>
          )}

          <form
            action={saveLinkAction}
            encType="multipart/form-data"
            className="space-y-5"
          >
            <input type="hidden" name="isNew" value={editing ? "0" : "1"} />

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass} htmlFor="code">
                  Code <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  id="code"
                  name="code"
                  defaultValue={editing?.code}
                  readOnly={Boolean(editing)}
                  placeholder="plumb"
                  className={`${inputClass} ${editing ? "text-white/40" : ""}`}
                />
                <p className="mt-1.5 text-xs text-white/30">
                  {editing
                    ? "Can't change — it's already printed."
                    : "Short and permanent. Becomes smartscaleagent.com/go/…"}
                </p>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="label">
                  What it&apos;s for
                </label>
                <input
                  id="label"
                  name="label"
                  defaultValue={editing?.label}
                  placeholder="Rio Grande Plumbing"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="destination">
                Sends people to <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="destination"
                name="destination"
                type="url"
                defaultValue={editing?.destination}
                placeholder="https://riograndeplumbing.com"
                className={inputClass}
              />
              <p className="mt-1.5 text-xs text-white/30">
                Change this any time — the printed code keeps working.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="logo">
                  Logo in the middle (optional)
                </label>
                <input
                  id="logo"
                  name="logo"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="w-full text-sm text-white/55 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#0A0A0A] hover:file:bg-white/85"
                />
                <p className="mt-1.5 text-xs text-white/30">
                  PNG, JPEG, WebP or SVG, under 200KB. A square logo on a transparent
                  or white background works best.
                </p>
                {editing?.logoDataUri && (
                  <label className="mt-3 flex items-center gap-2 text-xs text-white/55">
                    <input
                      type="checkbox"
                      name="removeLogo"
                      value="1"
                      className="accent-[#DC2626]"
                    />
                    Remove the current logo
                  </label>
                )}
              </div>

              {editing?.logoDataUri && (
                <div>
                  <p className={labelClass}>Current logo</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={editing.logoDataUri}
                    alt=""
                    className="h-16 w-16 object-contain rounded-lg border border-white/10 bg-white p-1"
                  />
                </div>
              )}
            </div>

            <label className="flex items-center gap-2.5 text-sm text-white/55">
              <input
                type="checkbox"
                name="tagDestination"
                value="1"
                defaultChecked={editing ? editing.tagDestination : true}
                className="accent-[#DC2626]"
              />
              Tag the link so the advertiser sees this traffic in their own analytics
            </label>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <button type="submit" className={`${btnPrimary} px-6 py-3`}>
                {editing ? "Save changes" : "Create QR code"}
              </button>
              <p className="text-xs text-white/30 max-w-md">
                Adding a logo makes the code denser, so print it larger. Always scan the
                artwork with your own phone before it goes on a screen.
              </p>
            </div>
          </form>
        </div>
      </details>
    </>
  );
}
