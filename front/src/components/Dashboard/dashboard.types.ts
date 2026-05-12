/** Shape returned by GET /links (ORM JSON may vary slightly by serializer). */
export type ApiLink = {
  id: number;
  compte_id?: number;
  Compte_id?: number;
  provider: string;
  account_email?: string | null;
};

/** Shape returned by GET /dashboard?link_id= */
export type DashboardMail = {
  link_id: number;
  provider_message_id?: string;
  sender_email?: string | null;
  subject?: string | null;
  received_at?: string | null;
  priority_score?: number | null;
  folder_label?: string | null;
  extras?: { snippet?: string; gmail_id?: string } | null;
  created_at?: string | null;
};
