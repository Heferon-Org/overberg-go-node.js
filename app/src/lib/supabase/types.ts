export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          role: "customer" | "driver" | "vendor" | "admin";
          address: string | null;
          area: string;
          smart_shopper_points: number;
          wallet_balance: number;
          fcm_token: string | null;
          email_notifications: boolean;
          sms_notifications: boolean;
          push_notifications: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      restaurants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          emoji: string | null;
          image_url: string | null;
          bg_gradient: string | null;
          rating: number;
          review_count: number;
          delivery_time: string | null;
          delivery_fee: number;
          tag: string | null;
          subtitle: string | null;
          location: string | null;
          area: string;
          is_open: boolean;
          opens_at: string | null;
          closes_at: string | null;
          owner_id: string | null;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["restaurants"]["Row"]> & { name: string; slug: string };
        Update: Partial<Database["public"]["Tables"]["restaurants"]["Row"]>;
      };
      menu_items: {
        Row: {
          id: string;
          restaurant_id: string;
          name: string;
          description: string | null;
          price: number;
          emoji: string | null;
          image_url: string | null;
          category: string;
          available: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["menu_items"]["Row"]> & {
          restaurant_id: string;
          name: string;
          price: number;
          category: string;
        };
        Update: Partial<Database["public"]["Tables"]["menu_items"]["Row"]>;
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_id: string;
          restaurant_id: string;
          driver_id: string | null;
          items: OrderItem[];
          subtotal: number;
          delivery_fee: number;
          service_fee: number;
          total: number;
          status: OrderStatus;
          delivery_address: string | null;
          delivery_latitude: number | null;
          delivery_longitude: number | null;
          surge_multiplier: number;
          surge_zone_id: string | null;
          dispatch_status: "idle" | "searching" | "assigned" | "failed";
          delivery_code: string | null;
          payment_method: string | null;
          payment_status: "pending" | "paid" | "failed" | "refunded";
          notes: string | null;
          estimated_delivery: string | null;
          delivered_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["orders"]["Row"]> & {
          customer_id: string;
          restaurant_id: string;
          items: OrderItem[];
          subtotal: number;
          total: number;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Row"]>;
      };
      drivers: {
        Row: {
          id: string;
          vehicle_reg: string | null;
          vehicle_type: string;
          is_online: boolean;
          current_area: string;
          latitude: number | null;
          longitude: number | null;
          rating: number;
          total_trips: number;
          acceptance_rate: number;
          completion_rate: number;
          kyc_status: "pending" | "verified" | "rejected" | "suspended";
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["drivers"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["drivers"]["Row"]>;
      };
      driver_earnings: {
        Row: {
          id: string;
          driver_id: string;
          order_id: string | null;
          amount: number;
          type: "trip" | "bonus" | "tip";
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["driver_earnings"]["Row"]> & {
          driver_id: string;
          amount: number;
        };
        Update: Partial<Database["public"]["Tables"]["driver_earnings"]["Row"]>;
      };
      experiences: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          emoji: string | null;
          image_url: string | null;
          bg_gradient: string | null;
          badge: string | null;
          duration: string | null;
          price: string | null;
          button_text: string;
          section: string;
          section_color: string | null;
          section_emoji: string | null;
          area: string;
          rating: number | null;
          available: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["experiences"]["Row"]> & { name: string; section: string };
        Update: Partial<Database["public"]["Tables"]["experiences"]["Row"]>;
      };
      stays: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          emoji: string | null;
          image_url: string | null;
          bg_gradient: string | null;
          location: string | null;
          area: string | null;
          rating: number | null;
          tag: string | null;
          meta: string | null;
          price: string | null;
          available: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["stays"]["Row"]> & { name: string };
        Update: Partial<Database["public"]["Tables"]["stays"]["Row"]>;
      };
      reviews: {
        Row: {
          id: string;
          user_id: string;
          restaurant_id: string | null;
          order_id: string | null;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["reviews"]["Row"]> & {
          user_id: string;
          rating: number;
        };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Row"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: "order" | "promo" | "system" | "driver";
          title: string;
          message: string | null;
          emoji: string | null;
          read: boolean;
          data: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]> & {
          user_id: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
      };
      payments: {
        Row: {
          id: string;
          order_id: string | null;
          user_id: string | null;
          amount: number;
          currency: string;
          provider: "payfast" | "wallet" | "cash" | "card";
          provider_ref: string | null;
          status: "pending" | "processing" | "completed" | "failed" | "refunded" | "cancelled";
          payload: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["payments"]["Row"]> & { amount: number };
        Update: Partial<Database["public"]["Tables"]["payments"]["Row"]>;
      };
      dispatch_logs: {
        Row: {
          id: string;
          order_id: string;
          driver_id: string | null;
          attempt_number: number;
          action: "offered" | "accepted" | "rejected" | "timed_out" | "cancelled" | "completed";
          distance_km: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["dispatch_logs"]["Row"]> & {
          order_id: string;
          action: Database["public"]["Tables"]["dispatch_logs"]["Row"]["action"];
        };
        Update: Partial<Database["public"]["Tables"]["dispatch_logs"]["Row"]>;
      };
      surge_zones: {
        Row: {
          id: string;
          name: string;
          area: string;
          lat_min: number;
          lat_max: number;
          lng_min: number;
          lng_max: number;
          multiplier: number;
          active: boolean;
          starts_at: string | null;
          ends_at: string | null;
          reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["surge_zones"]["Row"]> & {
          name: string;
          area: string;
          lat_min: number;
          lat_max: number;
          lng_min: number;
          lng_max: number;
        };
        Update: Partial<Database["public"]["Tables"]["surge_zones"]["Row"]>;
      };
      driver_ratings: {
        Row: {
          id: string;
          driver_id: string;
          customer_id: string | null;
          order_id: string | null;
          rating: number;
          tags: string[];
          comment: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["driver_ratings"]["Row"]> & {
          driver_id: string;
          rating: number;
        };
        Update: Partial<Database["public"]["Tables"]["driver_ratings"]["Row"]>;
      };
      merchant_ratings: {
        Row: {
          id: string;
          restaurant_id: string;
          customer_id: string | null;
          order_id: string | null;
          rating: number;
          food_quality: number | null;
          packaging: number | null;
          comment: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["merchant_ratings"]["Row"]> & {
          restaurant_id: string;
          rating: number;
        };
        Update: Partial<Database["public"]["Tables"]["merchant_ratings"]["Row"]>;
      };
      promo_codes: {
        Row: {
          id: string;
          code: string;
          description: string | null;
          discount_type: "percent" | "fixed" | "free_delivery";
          discount_value: number;
          min_order_amount: number;
          max_discount: number | null;
          applies_to: "all" | "food" | "ride" | "shop" | "sea" | "stays";
          usage_limit: number | null;
          usage_count: number;
          per_user_limit: number;
          starts_at: string;
          ends_at: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["promo_codes"]["Row"]> & {
          code: string;
          discount_value: number;
        };
        Update: Partial<Database["public"]["Tables"]["promo_codes"]["Row"]>;
      };
      support_tickets: {
        Row: {
          id: string;
          ticket_number: string;
          user_id: string | null;
          order_id: string | null;
          subject: string;
          description: string | null;
          category:
            | "general"
            | "order_issue"
            | "payment_issue"
            | "driver_issue"
            | "merchant_issue"
            | "app_bug"
            | "refund_request";
          priority: "low" | "normal" | "high" | "urgent";
          status: "open" | "in_progress" | "waiting_user" | "resolved" | "closed";
          assigned_to: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["support_tickets"]["Row"]> & {
          subject: string;
        };
        Update: Partial<Database["public"]["Tables"]["support_tickets"]["Row"]>;
      };
      wallet_transactions: {
        Row: {
          id: string;
          user_id: string;
          type: "topup" | "payment" | "refund" | "cashback" | "referral" | "withdrawal" | "adjustment";
          amount: number;
          balance_after: number;
          description: string;
          reference: string | null;
          payment_id: string | null;
          order_id: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["wallet_transactions"]["Row"]> & {
          user_id: string;
          type: Database["public"]["Tables"]["wallet_transactions"]["Row"]["type"];
          amount: number;
          balance_after: number;
          description: string;
        };
        Update: Partial<Database["public"]["Tables"]["wallet_transactions"]["Row"]>;
      };
      kyc_documents: {
        Row: {
          id: string;
          user_id: string;
          applicant_role: "driver" | "vendor";
          document_type:
            | "sa_id"
            | "drivers_license"
            | "vehicle_registration"
            | "vehicle_photo"
            | "business_registration"
            | "owner_id"
            | "bank_proof"
            | "tax_clearance"
            | "food_handlers_cert"
            | "insurance";
          file_url: string;
          verification_status: "pending" | "approved" | "rejected" | "expired";
          rejection_reason: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["kyc_documents"]["Row"]> & {
          user_id: string;
          applicant_role: "driver" | "vendor";
          document_type: Database["public"]["Tables"]["kyc_documents"]["Row"]["document_type"];
          file_url: string;
        };
        Update: Partial<Database["public"]["Tables"]["kyc_documents"]["Row"]>;
      };
    };
  };
};

export type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  emoji: string;
};

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "preparing"
  | "ready"
  | "picked_up"
  | "on_the_way"
  | "delivered"
  | "cancelled";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Restaurant = Database["public"]["Tables"]["restaurants"]["Row"];
export type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type Driver = Database["public"]["Tables"]["drivers"]["Row"];
export type Experience = Database["public"]["Tables"]["experiences"]["Row"];
export type Stay = Database["public"]["Tables"]["stays"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type DispatchLog = Database["public"]["Tables"]["dispatch_logs"]["Row"];
export type SurgeZone = Database["public"]["Tables"]["surge_zones"]["Row"];
export type DriverRating = Database["public"]["Tables"]["driver_ratings"]["Row"];
export type MerchantRating = Database["public"]["Tables"]["merchant_ratings"]["Row"];
export type PromoCode = Database["public"]["Tables"]["promo_codes"]["Row"];
export type SupportTicket = Database["public"]["Tables"]["support_tickets"]["Row"];
export type KycDocument = Database["public"]["Tables"]["kyc_documents"]["Row"];
export type WalletTransaction = Database["public"]["Tables"]["wallet_transactions"]["Row"];
