/**
 * Madat24 Backend Models/Schema
 * This file contains all the TypeScript interfaces representing the database schema
 * Use these types throughout your frontend for type-safe development
 */

// ============================================
// ENUMS
// ============================================

export type UserType = 'customer' | 'mechanic';

export type ServiceStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export type VehicleType = 'car' | 'bike' | 'electric' | 'battery' | 'tyre' | 'general';

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
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
}

// ============================================
// MECHANIC RELATED
// ============================================

export interface MechanicShop {
  id: string;                    // UUID
  mechanic_id: string;           // References profiles.id
  shop_name: string;
  shop_description: string | null;
  shop_address: string;
  whatsapp_number: string | null;
  gst_number: string | null;
  latitude: number | null;
  longitude: number | null;
  hourly_rate: number | null;
  years_of_experience: number;   // Default: 0
  is_online: boolean;            // Default: false
  total_earnings: number;        // Default: 0
  jobs_completed: number;        // Default: 0
  average_rating: number;        // Default: 0
  total_reviews: number;         // Default: 0
  response_rate: number;         // Default: 0
  created_at: string;
  updated_at: string;
}

export interface MechanicService {
  id: string;                    // UUID
  mechanic_id: string;           // References profiles.id
  service_type_id: string;       // References service_types.id
  created_at: string;
}

export interface MechanicSettings {
  id: string;                    // UUID
  mechanic_id: string;           // References profiles.id (unique)
  push_notifications: boolean;   // Default: true
  location_sharing: boolean;     // Default: true
  dark_mode: boolean;            // Default: false
  created_at: string;
  updated_at: string;
}

export interface MechanicAchievement {
  id: string;                    // UUID
  mechanic_id: string;           // References profiles.id
  achievement_type: string;
  achievement_name: string;
  count: number;                 // Default: 0
  earned_at: string;
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
  is_default: boolean;           // Default: false
  created_at: string;
}

// ============================================
// SERVICE MANAGEMENT
// ============================================

export interface ServiceType {
  id: string;                    // UUID
  name: string;
  icon: string | null;           // Emoji or icon identifier
  created_at: string;
}

export interface ServiceRequest {
  id: string;                    // UUID
  customer_id: string;           // References profiles.id
  mechanic_id: string | null;    // References profiles.id (null until accepted)
  service_type_id: string;       // References service_types.id
  vehicle_type: VehicleType;
  status: ServiceStatus;         // Default: 'pending'
  description: string | null;
  customer_address: string;
  customer_latitude: number | null;
  customer_longitude: number | null;
  estimated_cost: number | null;
  final_cost: number | null;
  created_at: string;
  accepted_at: string | null;    // Set when mechanic accepts
  completed_at: string | null;   // Set when job is done
  updated_at: string;
}

// ============================================
// COMMUNICATION
// ============================================

export interface ChatMessage {
  id: string;                    // UUID
  service_request_id: string;    // References service_requests.id
  sender_id: string;             // References profiles.id
  message: string;
  is_read: boolean;              // Default: false
  created_at: string;
}

export interface Notification {
  id: string;                    // UUID
  user_id: string;               // References profiles.id
  title: string;
  message: string;
  type: string;                  // Default: 'info' (info, success, warning, error)
  is_read: boolean;              // Default: false
  related_request_id: string | null;  // References service_requests.id
  created_at: string;
}

// ============================================
// BILLING & PAYMENTS
// ============================================

export interface Invoice {
  id: string;                    // UUID
  invoice_number: string;        // Auto-generated unique number
  service_request_id: string;    // References service_requests.id
  customer_id: string;           // References profiles.id
  mechanic_id: string;           // References profiles.id
  subtotal: number;              // Before tax
  tax_rate: number;              // Default: 18 (GST)
  tax_amount: number;            // Calculated tax
  total_amount: number;          // subtotal + tax_amount
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
  service_request_id: string;    // References service_requests.id (unique)
  customer_id: string;           // References profiles.id
  mechanic_id: string;           // References profiles.id
  rating: number;                // 1-5 stars
  review: string | null;         // Customer's written review
  mechanic_response: string | null;  // Mechanic's reply
  mechanic_response_at: string | null;
  created_at: string;
}

// ============================================
// MEDIA & FILES
// ============================================

export interface WorkMedia {
  id: string;                    // UUID
  service_request_id: string;    // References service_requests.id
  mechanic_id: string;           // References profiles.id
  file_url: string;              // Storage URL
  file_type: string;             // 'image' or 'video'
  media_stage: string;           // 'before', 'during', 'after'
  caption: string | null;
  created_at: string;
}

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
}

export interface MechanicWithShop extends Profile {
  mechanic_shop?: MechanicShop;
  services?: ServiceType[];
}

export interface InvoiceWithItems extends Invoice {
  items?: InvoiceItem[];
  customer?: Profile;
  mechanic?: Profile;
  service_request?: ServiceRequest;
}

// ============================================
// FORM INPUT TYPES (For Creating/Updating)
// ============================================

export interface CreateServiceRequestInput {
  service_type_id: string;
  vehicle_type: VehicleType;
  customer_address: string;
  customer_latitude?: number;
  customer_longitude?: number;
  description?: string;
}

export interface CreateRatingInput {
  service_request_id: string;
  mechanic_id: string;
  rating: number;
  review?: string;
}

export interface UpdateProfileInput {
  full_name?: string;
  phone_number?: string;
  avatar_url?: string;
}

export interface CreateInvoiceItemInput {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface UpdateMechanicShopInput {
  shop_name?: string;
  shop_description?: string;
  shop_address?: string;
  whatsapp_number?: string;
  gst_number?: string;
  hourly_rate?: number;
  years_of_experience?: number;
  is_online?: boolean;
}
