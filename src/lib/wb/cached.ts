import { cache } from "react";
import { listLeads } from "./store";

/** One read of the leads per request, shared by the page and the sidebar count. */
export const cachedWbLeads = cache(listLeads);
