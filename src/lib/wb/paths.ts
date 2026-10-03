import { SITE_URL } from "@/lib/business";

/** The Website Business section of the portal. */
export const WB_ADMIN = "/advertise/admin/website-business";

/** The full address of a lead in the portal, for an alert email's button. */
export const ADMIN_LEAD_URL = (leadId?: string) => `${SITE_URL}${WB_ADMIN}${leadId ? `/${leadId}` : ""}`;
