
/**
 * The page itself declares the metadata now, so the two cannot drift apart.
 * The old copy here promised 4,800 plays a month, which counted days the
 * restaurant is closed.
 */

export default function AdvertiseLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
