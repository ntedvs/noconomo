/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as bulletins from "../bulletins.js";
import type * as documents from "../documents.js";
import type * as email from "../email.js";
import type * as emails_event_email from "../emails/event_email.js";
import type * as events from "../events.js";
import type * as expenses from "../expenses.js";
import type * as families from "../families.js";
import type * as folders from "../folders.js";
import type * as guide from "../guide.js";
import type * as images from "../images.js";
import type * as reservations from "../reservations.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  bulletins: typeof bulletins;
  documents: typeof documents;
  email: typeof email;
  "emails/event_email": typeof emails_event_email;
  events: typeof events;
  expenses: typeof expenses;
  families: typeof families;
  folders: typeof folders;
  guide: typeof guide;
  images: typeof images;
  reservations: typeof reservations;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
