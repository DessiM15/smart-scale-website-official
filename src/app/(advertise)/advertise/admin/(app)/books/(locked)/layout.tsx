import { redirect } from "next/navigation";
import { isSignedIn } from "@/lib/ads/auth";
import { booksAccess } from "@/lib/books/passkeys";

export const dynamic = "force-dynamic";

/**
 * Every page under here is the books proper. The shared key gets you to the
 * door; once anyone has enrolled a passkey, only a passkey session gets you
 * through it. The actions check again on every write, so this is the front
 * door and not the only lock.
 */
export default async function LockedBooksLayout({ children }: { children: React.ReactNode }) {
  if (!(await isSignedIn())) redirect("/advertise/admin/signin");
  const access = await booksAccess();
  if (!access.ok) redirect("/advertise/admin/books/unlock");
  return <>{children}</>;
}
