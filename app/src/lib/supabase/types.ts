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
