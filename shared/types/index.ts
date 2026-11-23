export type Language = "en" | "gu";

export type QueueStatus =
  | "Waiting"
  | "Called"
  | "In chair"
  | "Done"
  | "Cancelled"
  | "No-show";

export interface Barber {
  id: number;
  name: string;
  onDuty: boolean;
  onBreak: boolean;
  photoUrl?: string;
}

export interface Service {
  id: number;
  nameEn: string;
  nameGu: string;
  minutes: number;
  price: number;
  enabled: boolean;
}

export interface BarberSummary {
  id: number;
  name: string;
  status: "busy" | "free" | "break";
}

export interface HomeSummary {
  isOpen: boolean;
  joinEnabled: boolean;
  joinMessage: string | null;
  waitingCount: number;
  estimatedWaitMinutes: number | null;
  barbers: BarberSummary[];
}

export interface JoinPreview {
  totalMinutes: number;
  totalPrice: number;
  expectedWaitMinutes: number | null;
  preferredBarberName: string | null;
}

export interface QueueStatusView {
  id: number;
  token: string;
  name: string;
  phone: string;
  status: QueueStatus;
  position: number | null;
  waitMinutes: number | null;
  ownMinutes: number;
  totalPrice: number;
  preferredBarberId: number | null;
  preferredBarberName: string | null;
  assignedBarberName: string | null;
  services: Array<{
    id: number;
    nameEn: string;
    nameGu: string;
    minutes: number;
    price: number;
  }>;
}

export interface StaffWaitingEntry {
  id: number;
  token: string;
  name: string;
  phone: string;
  preferredBarberId: number | null;
  preferredBarberName: string | null;
  joinedAt: string;
  status: QueueStatus;
  totalMinutes: number;
  services: Array<{
    nameEn: string;
    nameGu: string;
    minutes: number;
    price: number;
  }>;
}

export interface StaffBarber {
  id: number;
  name: string;
  onDuty: boolean;
  onBreak: boolean;
  photoUrl: string | null;
  currentEntryId: number | null;
  currentToken: string | null;
  currentCustomer: string | null;
  startedAt: string | null;
  currentMinutes: number;
  calledCount: number;
}

export interface StaffOverview {
  barbers: StaffBarber[];
  waiting: StaffWaitingEntry[];
  called: Array<{
    id: number;
    token: string;
    name: string;
    barberId: number;
    barberName: string;
    calledAt: string;
  }>;
}

export interface DisplaySnapshot {
  barbers: Array<{
    id: number;
    name: string;
    photoUrl: string | null;
    currentEntryId: number | null;
    currentToken: string | null;
    currentCustomer: string | null;
  }>;
  upNext: Array<{
    token: string;
    estimatedMinutes: number | null;
  }>;
}

export interface AdminSnapshot {
  isOpen: boolean;
  services: Service[];
  barbers: Barber[];
  stats: {
    served: number;
    averageWait: number;
    noShows: number;
  };
}
