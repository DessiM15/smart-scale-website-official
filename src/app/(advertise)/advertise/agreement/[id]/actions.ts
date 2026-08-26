"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAgreement, signAgreement } from "@/lib/ads/agreements";
import { agreementText } from "@/lib/ads/agreement-template";
import { agreementCopyEmail, isEmailConfigured, sendEmail } from "@/lib/ads/email";
import { verifyAgreementToken } from "@/lib/ads/links";
import { sendTeamSms } from "@/lib/ads/notify";
import { formatDate } from "@/lib/ads/roster";

const field = (data: FormData, name: string) =>
  String(data.get(name) ?? "").trim();

function back(id: string, token: string, params: Record<string, string>): never {
  redirect(
    `/advertise/agreement/${encodeURIComponent(id)}?${new URLSearchParams({
      t: token,
      ...params,
    })}`,
  );
}

/**
 * The client signs.
 *
 * A signature is only worth what can be said about it later, so the evidence is
 * gathered here rather than trusted from the form: the address the request came
 * from, the browser that sent it, the moment it arrived, and the hash of the
 * exact words on the page. The only thing the form supplies is the name they
 * typed and the box they ticked, which is the part that has to be theirs.
 */
export async function signAgreementAction(data: FormData) {
  const id = field(data, "id");
  const token = field(data, "t");

  // The link is the credential. Re-checked here because a server action is a
  // public endpoint of its own, not something protected by the page that
  // rendered it.
  if (!id || !verifyAgreementToken(id, token)) redirect("/advertise");

  if (field(data, "consent") !== "1") back(id, token, { err: "consent" });

  const head = await headers();
  const forwarded = head.get("x-forwarded-for");

  const result = await signAgreement(id, {
    name: field(data, "signerName"),
    ip: forwarded ? forwarded.split(",")[0].trim() : (head.get("x-real-ip") ?? ""),
    userAgent: head.get("user-agent") ?? "",
  });

  if (!result.ok) back(id, token, { err: result.error ?? "save" });

  // Everything past this point is courtesy. The signature is recorded; a failed
  // email or text must not make the client think it didn't take.
  const agreement = await getAgreement(id);
  if (agreement?.signature) {
    const signedOn = formatDate(agreement.signature.at.slice(0, 10));

    if (agreement.terms.email && isEmailConfigured()) {
      const copy = agreementCopyEmail(
        agreement.terms.business,
        agreement.signature.name,
        signedOn,
        agreementText(agreement.terms),
      );
      await sendEmail({ to: agreement.terms.email, ...copy });
    }

    await sendTeamSms(
      `Mex Taco ads · SIGNED: ${agreement.terms.business} agreement signed by ${agreement.signature.name}. Countersign it: smartscaleagent.com/advertise/admin/client/${agreement.advertiserId}`,
    );
  }

  back(id, token, { msg: "signed" });
}
