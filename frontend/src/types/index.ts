export interface User {
  id: string;
  email: string;
  display_name: string | null;
  phone: string | null;
  free_fire_ign: string | null;
  free_fire_uid: string | null;
  roles: string[];
}

export interface Tournament {
  id: string;
  title: string;
  description: string | null;
  game_title: string;
  game_mode: string;
  map_name: string;
  entry_fee: string | number;
  prize_pool: string | number;
  max_squads: number;
  registration_deadline: string;
  match_time: string;
  rules: string | null;
  status: 'Draft' | 'Published' | 'Registration Open' | 'Registration Closed' | 'Live' | 'Completed' | 'Cancelled';
  publication_status: 'Draft' | 'Published';
  registered_squads_count?: string | number;
  confirmed_squads_count?: string | number;
}

export interface SquadMember {
  id?: string;
  ign: string;
  uid: string;
  phone?: string;
  email?: string;
  is_captain?: boolean;
}

export interface Squad {
  id: string;
  name: string;
  captain_id: string;
  captain_email?: string;
  captain_display_name?: string;
  created_at: string;
}

export interface Registration {
  registration_id: string;
  tournament_id: string;
  tournament_title: string;
  entry_fee: string | number;
  prize_pool?: string | number;
  map_name?: string;
  match_time?: string;
  tournament_status?: string;
  squad_id: string;
  squad_name: string;
  registration_status: string;
  slot_number?: number | null;
  registered_at?: string;
  payment_id?: string | null;
  payment_status?: string | null;
  utr?: string | null;
  payment_amount?: string | number;
  rejection_reason?: string | null;
  captain_name?: string;
  captain_email?: string;
  captain_phone?: string;
}

export interface Payment {
  id: string;
  registration_id: string;
  tournament_id: string;
  tournament_title: string;
  squad_id: string;
  squad_name: string;
  captain_id: string;
  captain_name?: string;
  captain_email?: string;
  captain_phone?: string;
  amount: string | number;
  utr: string;
  status: 'Not Submitted' | 'Pending Verification' | 'Verified' | 'Rejected' | 'Refunded';
  notes?: string | null;
  rejection_reason?: string | null;
  submitted_at: string;
  reviewed_at?: string | null;
  reviewer_name?: string | null;
}

export interface MatchRoomInfo {
  match_id: string;
  match_number: number;
  scheduled_time: string;
  match_status: string;
  credentials_released: boolean;
  credentials_released_at: string | null;
  tournament_id: string;
  tournament_title: string;
  game_mode: string;
  map_name: string;
  squad_name: string;
  slot_number: number | null;
  room_id: string | null;
  room_password: string | null;
}

export interface TournamentResult {
  id: string;
  tournament_id: string;
  tournament_title?: string;
  game_mode?: string;
  map_name?: string;
  prize_pool?: string | number;
  match_time?: string;
  squad_id: string;
  squad_name: string;
  captain_name?: string;
  placement: number;
  kills: number;
  points: number;
  prize_won: string | number;
  is_winner: boolean;
  is_published: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface WebsiteSettings {
  id?: string;
  upi_id: string;
  upi_payee_name: string;
  upi_qr_image_url: string;
  support_email: string;
  support_phone?: string | null;
  support_telegram?: string | null;
  rules_text?: string | null;
  announcements?: string | null;
}
