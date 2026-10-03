/**
 * The notice lines under the two forms. Shown to the visitor and stored on
 * the lead exactly as shown, so there is a record of what they were told.
 * Kept in a file with no server code so the forms can import it.
 */

export const NOTICE_TEXT = "We'll email your report and a couple of follow-ups. Unsubscribe anytime.";
export const NO_WEBSITE_NOTICE_TEXT = "We'll call or email you about getting your business online. Unsubscribe anytime.";

export const NEEDS = ["Website", "Google Business Profile", "Logo and branding", "Not sure"] as const;
export const BEST_TIMES = ["Morning", "Afternoon", "Evening"] as const;
