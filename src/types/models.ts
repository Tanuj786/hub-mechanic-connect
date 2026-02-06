/**
 * Madat24 Backend Models/Schema
 * Complete TypeScript interfaces representing the database schema
 * Use these types throughout your frontend/backend for type-safe development
 * 
 * Last Updated: 2026-02-06
 * Tables: 14 | Enums: 3 | Storage Buckets: 2
 */

// ============================================
// ENUMS (Database ENUM Types)
// ============================================

export type UserType = 'customer' | 'mechanic';

export type ServiceStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export type VehicleType = 'car' | 'bike' | 'electric' | 'battery' | 'tyre' | 'general';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'invoice' | 'request';

export type InvoiceStatus = 'pending' | 'paid' | 'cancelled';

export type MediaStage = 'before' | 'during' | 'after';

export type FileType = 'image' | 'video';

// ============================================
// USER & AUTHENTICATION
// ============================================

export interface Profile {
  id: string;                    // UUID - references auth.users
  full_name: string;
  email: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  user_type: UserType;
  created_at: string | null;     // ISO timestamp
  updated_at: string | null;     // ISO timestamp
}

// ============================================
// MECHANIC RELATED
// ============================================

export interface MechanicShop {
  id: string;                    // UUID
  mechanic_id: string;           // References profiles.id (unique - one shop per mechanic)
  shop_name: string;
  shop_description: string | null;
  shop_address: string;
  whatsapp_number: string | null;
  gst_number: string | null;
  latitude: number | null;
  longitude: number | null;
  hourly_rate: number | null;
  years_of_experience: number | null;  // Default: 0
  is_online: boolean | null;           // Default: false
  total_earnings: number | null;       // Default: 0
  jobs_completed: number | null;       // Default: 0
  average_rating: number | null;       // Default: 0 (auto-updated by trigger)
  total_reviews: number | null;        // Default: 0 (auto-updated by trigger)
  response_rate: number | null;        // Default: 0
  created_at: string | null;
  updated_at: string | null;
}

export interface MechanicService {
  id: string;                    // UUID
  mechanic_id: string;           // References profiles.id
  service_type_id: string;       // References service_types.id
  created_at: string | null;
}

export interface MechanicSettings {
  id: string;                    // UUID
  mechanic_id: string;           // References profiles.id (unique)
  push_notifications: boolean | null;  // Default: true
  location_sharing: boolean | null;    // Default: true
  dark_mode: boolean | null;           // Default: false
  created_at: string | null;
  updated_at: string | null;
}

export interface MechanicAchievement {
  id: string;                    // UUID
  mechanic_id: string;           // References profiles.id
  achievement_type: string;
  achievement_name: string;
  count: number | null;          // Default: 0
  earned_at: string | null;
}

// ============================================
// CUSTOMER RELATED
// ============================================

export interface CustomerAddress {
  id: string;                    // UUID
  customer_id: string;           // References profiles.id
  address: string;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean | null;    // Default: false
  created_at: string | null;
}

// ============================================
// SERVICE MANAGEMENT
// ============================================

export interface ServiceType {
  id: string;                    // UUID
  name: string;
  icon: string | null;           // Emoji or icon identifier
  created_at: string | null;
}

export interface ServiceRequest {
  id: string;                    // UUID
  customer_id: string;           // References profiles.id
  mechanic_id: string | null;    // References profiles.id (null until accepted)
  service_type_id: string;       // References service_types.id
  vehicle_type: VehicleType;
  status: ServiceStatus | null;  // Default: 'pending'
  description: string | null;
  customer_address: string;
  customer_latitude: number | null;
  customer_longitude: number | null;
  estimated_cost: number | null;
  final_cost: number | null;
  created_at: string | null;
  accepted_at: string | null;    // Set when mechanic accepts
  completed_at: string | null;   // Set when job is done
  updated_at: string | null;
}

// ============================================
// COMMUNICATION
// ============================================

export interface ChatMessage {
  id: string;                    // UUID
  service_request_id: string;    // References service_requests.id
  sender_id: string;             // References profiles.id
  message: string;
  is_read: boolean | null;       // Default: false
  created_at: string;
}

export interface Notification {
  id: string;                    // UUID
  user_id: string;               // References profiles.id
  title: string;
  message: string;
  type: string | null;           // Default: 'info' (info, success, warning, error, invoice, request)
  is_read: boolean | null;       // Default: false
  related_request_id: string | null;  // References service_requests.id
  created_at: string | null;
}

// ============================================
// BILLING & PAYMENTS
// ============================================

export interface Invoice {
  id: string;                    // UUID
  invoice_number: string;        // Auto-generated by trigger: INV-YYYYMMDD-XXXXXXXX
  service_request_id: string;    // References service_requests.id
  customer_id: string;           // References profiles.id
  mechanic_id: string;           // References profiles.id
  subtotal: number;              // Default: 0 (before tax)
  tax_rate: number | null;       // Default: 18 (GST percentage)
  tax_amount: number;            // Default: 0 (calculated tax)
  total_amount: number;          // Default: 0 (subtotal + tax_amount)
  status: string;                // Default: 'pending' (pending, paid, cancelled)
  notes: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;                    // UUID
  invoice_id: string;            // References invoices.id
  description: string;
  quantity: number;              // Default: 1
  unit_price: number;
  total_price: number;           // quantity * unit_price
  created_at: string;
}

// ============================================
// RATINGS & REVIEWS
// ============================================

export interface Rating {
  id: string;                    // UUID
  service_request_id: string;    // References service_requests.id (unique - one rating per request)
  customer_id: string;           // References profiles.id
  mechanic_id: string;           // References profiles.id
  rating: number;                // 1-5 stars (integer)
  review: string | null;         // Customer's written review
  mechanic_response: string | null;  // Mechanic's reply
  mechanic_response_at: string | null;
  created_at: string | null;
}

// ============================================
// MEDIA & FILES
// ============================================

export interface WorkMedia {
  id: string;                    // UUID
  service_request_id: string;    // References service_requests.id
  mechanic_id: string;           // References profiles.id
  file_url: string;              // Storage URL (work-media bucket)
  file_type: string;             // 'image' or 'video'
  media_stage: string;           // 'before', 'during', 'after'
  caption: string | null;
  created_at: string;
}

// ============================================
// STORAGE BUCKETS (Reference)
// ============================================
// Bucket: 'work-media' - Public, for mechanic work photos/videos
// Bucket: 'avatars' - Public, for user profile photos

// ============================================
// JOINED/EXTENDED TYPES (Common Query Results)
// ============================================

export interface ServiceRequestWithDetails extends ServiceRequest {
  service_type?: ServiceType;
  customer?: Profile;
  mechanic?: Profile;
  mechanic_shop?: MechanicShop;
  invoice?: Invoice;
  rating?: Rating;
  work_media?: WorkMedia[];
  chat_messages?: ChatMessage[];
}

export interface MechanicWithShop extends Profile {
  mechanic_shop?: MechanicShop;
  mechanic_services?: MechanicService[];
  services?: ServiceType[];
  achievements?: MechanicAchievement[];
  settings?: MechanicSettings;
}

export interface CustomerWithAddresses extends Profile {
  addresses?: CustomerAddress[];
}

export interface InvoiceWithItems extends Invoice {
  items?: InvoiceItem[];
  customer?: Profile;
  mechanic?: Profile;
  service_request?: ServiceRequest;
}

export interface RatingWithDetails extends Rating {
  customer?: Profile;
  mechanic?: Profile;
  service_request?: ServiceRequest;
}

// ============================================
// FORM INPUT TYPES (For Creating/Updating)
// ============================================

export interface CreateProfileInput {
  id: string;                    // From auth.users
  full_name: string;
  email?: string;
  phone_number?: string;
  user_type: UserType;
}

export interface UpdateProfileInput {
  full_name?: string;
  phone_number?: string;
  avatar_url?: string;
}

export interface CreateMechanicShopInput {
  shop_name: string;
  shop_address: string;
  shop_description?: string;
  whatsapp_number?: string;
  gst_number?: string;
  latitude?: number;
  longitude?: number;
  hourly_rate?: number;
  years_of_experience?: number;
}

export interface UpdateMechanicShopInput {
  shop_name?: string;
  shop_description?: string;
  shop_address?: string;
  whatsapp_number?: string;
  gst_number?: string;
  latitude?: number;
  longitude?: number;
  hourly_rate?: number;
  years_of_experience?: number;
  is_online?: boolean;
}

export interface CreateServiceRequestInput {
  service_type_id: string;
  vehicle_type: VehicleType;
  customer_address: string;
  customer_latitude?: number;
  customer_longitude?: number;
  description?: string;
}

export interface UpdateServiceRequestInput {
  mechanic_id?: string;
  status?: ServiceStatus;
  estimated_cost?: number;
  final_cost?: number;
  accepted_at?: string;
  completed_at?: string;
}

export interface CreateCustomerAddressInput {
  address: string;
  latitude?: number;
  longitude?: number;
  is_default?: boolean;
}

export interface CreateChatMessageInput {
  service_request_id: string;
  message: string;
}

export interface CreateNotificationInput {
  user_id: string;
  title: string;
  message: string;
  type?: NotificationType;
  related_request_id?: string;
}

export interface CreateInvoiceInput {
  service_request_id: string;
  customer_id: string;
  subtotal?: number;
  tax_rate?: number;
  notes?: string;
}

export interface CreateInvoiceItemInput {
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface UpdateInvoiceInput {
  status?: InvoiceStatus;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  paid_at?: string;
}

export interface CreateRatingInput {
  service_request_id: string;
  mechanic_id: string;
  rating: number;
  review?: string;
}

export interface UpdateRatingInput {
  mechanic_response?: string;
  mechanic_response_at?: string;
}

export interface CreateWorkMediaInput {
  service_request_id: string;
  file_url: string;
  file_type: FileType;
  media_stage: MediaStage;
  caption?: string;
}

export interface CreateMechanicServiceInput {
  service_type_id: string;
}

export interface UpdateMechanicSettingsInput {
  push_notifications?: boolean;
  location_sharing?: boolean;
  dark_mode?: boolean;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  count?: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================
// FILTER & SEARCH TYPES
// ============================================

export interface ServiceRequestFilters {
  status?: ServiceStatus | ServiceStatus[];
  vehicle_type?: VehicleType;
  mechanic_id?: string;
  customer_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface MechanicSearchFilters {
  service_type_id?: string;
  is_online?: boolean;
  min_rating?: number;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
}

export interface InvoiceFilters {
  status?: InvoiceStatus | InvoiceStatus[];
  customer_id?: string;
  mechanic_id?: string;
  date_from?: string;
  date_to?: string;
}

// ============================================
// DATABASE TRIGGERS (Reference)
// ============================================
// 1. generate_invoice_number() - Auto-generates invoice_number on insert
// 2. update_invoice_totals() - Recalculates totals when invoice_items change
// 3. handle_new_user() - Creates profile on auth.users insert
// 4. update_mechanic_rating() - Updates mechanic_shops.average_rating on new rating
// 5. update_mechanic_job_stats() - Updates jobs_completed & total_earnings on completion

// ============================================
// REALTIME ENABLED TABLES (Reference)
// ============================================
// Tables with realtime subscriptions enabled:
// - chat_messages
// - notifications
// - service_requests (for status updates)
