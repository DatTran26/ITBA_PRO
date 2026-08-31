/** Cookie name shared between server reader and client writer.
 *  Kept in its own file so client components can import without pulling in
 *  next/headers via the server reader module. */
export const SIDEBAR_COLLAPSED_COOKIE = "sidebar_collapsed";
