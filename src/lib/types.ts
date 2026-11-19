export type Role = 'SUPER_ADMIN' | 'BUSINESS_OWNER' | 'BUSINESS_STAFF';
export type ProgramType = 'POINTS' | 'STAMPS';
export type TransactionType = 'EARN' | 'REDEEM' | 'ADJUST';

export interface User {
  id: string;
  email: string;
  role: Role;
  businessId: string | null;
  business: { id: string; name: string; slug: string } | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  iconUrl: string | null;
  stripImageUrl: string | null;
  backgroundColor: string;
  foregroundColor: string;
  labelColor: string;
  isActive: boolean;
  createdAt: string;
}

export interface LabeledValue {
  label: string;
  value: string;
}

export interface DesignLink {
  label: string;
  url: string;
}

export interface ProgramDesign {
  logoText?: string;
  frontFields?: LabeledValue[];
  backFields?: LabeledValue[];
  links?: DesignLink[];
  phone?: string;
  address?: string;
  website?: string;
}

export interface Program {
  id: string;
  businessId: string;
  name: string;
  type: ProgramType;
  stampsRequired: number;
  pointsPerCurrency: string | number;
  rewardDescription: string;
  terms: string;
  cardTitle: string;
  isActive: boolean;
  design: ProgramDesign | null;
  publishedAt: string | null;
  _count?: { cards: number };
}

export interface PublishResult {
  google: { status: 'ok' | 'mock' | 'error'; updatedObjects: number; error?: string };
  apple: { status: 'ok' | 'mock' | 'error'; pushedDevices: number; error?: string };
}

export interface CardSummary {
  id: string;
  serialNumber: string;
  balance: number;
  stamps: number;
  status: 'ACTIVE' | 'INACTIVE';
  updatedAt: string;
  program: { id: string; name: string; type: ProgramType; stampsRequired: number };
}

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  cards: CardSummary[];
}

export interface Paginated<T> {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  note: string | null;
  createdAt: string;
  staffUser: { email: string } | null;
}

export interface CustomerDetail extends Omit<Customer, 'cards'> {
  cards: (CardSummary & {
    program: CardSummary['program'] & { rewardDescription: string };
    transactions: Transaction[];
    _count: { appleRegistrations: number; pushSubscriptions: number };
    googleObjectId: string | null;
  })[];
}

export interface CardView {
  id: string;
  serialNumber: string;
  balance: number;
  stamps: number;
  status: string;
  rewardAvailable: boolean;
  rewardsAvailable: number;
  customer: { id: string; name: string; email: string | null; phone: string | null };
  program: {
    id: string;
    name: string;
    type: ProgramType;
    stampsRequired: number;
    pointsPerCurrency: number;
    rewardDescription: string;
  };
}

export interface PublicBusiness {
  name: string;
  slug: string;
  logoUrl: string | null;
  iconUrl: string | null;
  stripImageUrl: string | null;
  backgroundColor: string;
  foregroundColor: string;
  labelColor: string;
  program: {
    name: string;
    type: ProgramType;
    stampsRequired: number;
    pointsPerCurrency: number;
    rewardDescription: string;
    terms: string;
    cardTitle: string;
    design: ProgramDesign;
  };
}

export interface JoinResult {
  isNew: boolean;
  serialNumber: string;
  customerName: string;
  balance: number;
  stamps: number;
  links: { google: string | null; apple: string | null; googleConfigured: boolean; appleConfigured: boolean };
}

export interface AnalyticsSummary {
  range: { from: string; to: string; days: number };
  totals: {
    cardsIssued: number;
    activeCards: number;
    pointsAwarded: number;
    stampsAwarded: number;
    redemptions: number;
    customers: number;
    appleDevices: number;
    googleCards: number;
  };
  period: { cardsIssued: number; earned: number; redemptions: number };
  daily: { date: string; cardsIssued: number; earned: number; redemptions: number }[];
}

export interface AdminBusiness extends Business {
  ownerEmail: string | null;
  _count: { customers: number; programs: number; users: number };
}

export interface TeamMember {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
}

export type NotificationKind = 'EARN' | 'REWARD' | 'REDEEM' | 'BROADCAST' | 'DIRECT';

export interface NotificationSettings {
  notifyOnEarn: boolean;
  notifyOnReward: boolean;
  notifyOnRedeem: boolean;
}

export interface WalletNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  recipients: number;
  googleSent: number;
  appleSent: number;
  webSent: number;
  failed: number;
  createdAt: string;
  customer?: { id: string; name: string } | null;
}

export interface NotificationsOverview {
  settings: NotificationSettings;
  reachableCards: number;
  webPushConfigured: boolean;
  items: WalletNotification[];
}

export interface DirectNotificationResult {
  cards: number;
  googleSent: number;
  appleSent: number;
  webSent: number;
  failed: number;
  delivered: boolean;
}
