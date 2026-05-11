import { API_BASE } from "../constants/api";

/** After sign-in / sign-up: dashboard if Gmail (or other) already linked; otherwise link flow. */
export async function postAuthRoute(accessToken: string): Promise<"/dashboard" | "/link-account"> {
  try {
    const res = await fetch(`${API_BASE}/links/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return "/link-account";
    const data: unknown = await res.json();
    if (Array.isArray(data) && data.length > 0) return "/dashboard";
  } catch {
    /* network: still send user to link step */
  }
  return "/link-account";
}
