import { redirect } from "next/navigation";

/**
 * A client's details open on their row of the advertisers page now. Anything
 * still linking to the old profile address lands in the right place.
 */
export default async function ClientRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/advertise/admin/advertisers?open=${encodeURIComponent(id)}#client-${id}`);
}
