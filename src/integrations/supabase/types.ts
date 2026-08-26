export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      complaints: {
        Row: {
          created_at: string;
          customer_id: string;
          description: string;
          id: string;
          reported_at: string;
          resolved_at: string | null;
          shop_id: string;
          status: string;
          unit_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          customer_id: string;
          description: string;
          id?: string;
          reported_at?: string;
          resolved_at?: string | null;
          shop_id: string;
          status?: string;
          unit_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          customer_id?: string;
          description?: string;
          id?: string;
          reported_at?: string;
          resolved_at?: string | null;
          shop_id?: string;
          status?: string;
          unit_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "complaints_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "complaints_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "complaints_unit_id_fkey";
            columns: ["unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["id"];
          },
        ];
      };
      connected_accounts: {
        Row: {
          charges_enabled: boolean;
          created_at: string;
          id: string;
          onboarding_complete: boolean;
          payouts_enabled: boolean;
          shop_id: string;
          status: string;
          stripe_account_id: string | null;
          updated_at: string;
        };
        Insert: {
          charges_enabled?: boolean;
          created_at?: string;
          id?: string;
          onboarding_complete?: boolean;
          payouts_enabled?: boolean;
          shop_id: string;
          status?: string;
          stripe_account_id?: string | null;
          updated_at?: string;
        };
        Update: {
          charges_enabled?: boolean;
          created_at?: string;
          id?: string;
          onboarding_complete?: boolean;
          payouts_enabled?: boolean;
          shop_id?: string;
          status?: string;
          stripe_account_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "connected_accounts_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: true;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      customers: {
        Row: {
          billing_address: string | null;
          company: string | null;
          created_at: string;
          email: string | null;
          gst_exempt: boolean;
          gst_number: string | null;
          gst_rate: number | null;
          id: string;
          labor_rate: number | null;
          name: string;
          parts_markup_pct: number | null;
          phone: string | null;
          pst_exempt: boolean;
          pst_number: string | null;
          pst_rate: number | null;
          shop_id: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          billing_address?: string | null;
          company?: string | null;
          created_at?: string;
          email?: string | null;
          gst_exempt?: boolean;
          gst_number?: string | null;
          gst_rate?: number | null;
          id?: string;
          labor_rate?: number | null;
          name: string;
          parts_markup_pct?: number | null;
          phone?: string | null;
          pst_exempt?: boolean;
          pst_number?: string | null;
          pst_rate?: number | null;
          shop_id: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          billing_address?: string | null;
          company?: string | null;
          created_at?: string;
          email?: string | null;
          gst_exempt?: boolean;
          gst_number?: string | null;
          gst_rate?: number | null;
          id?: string;
          labor_rate?: number | null;
          name?: string;
          parts_markup_pct?: number | null;
          phone?: string | null;
          pst_exempt?: boolean;
          pst_number?: string | null;
          pst_rate?: number | null;
          shop_id?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "customers_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      estimate_items: {
        Row: {
          created_at: string;
          description: string;
          estimate_id: string;
          gst_taxable: boolean;
          hours: number | null;
          id: string;
          item_type: string;
          line_total: number;
          markup_pct: number;
          part_id: string | null;
          pst_taxable: boolean;
          quantity: number;
          service_id: string | null;
          sort_order: number;
          technician: string | null;
          unit_price: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description: string;
          estimate_id: string;
          gst_taxable?: boolean;
          hours?: number | null;
          id?: string;
          item_type?: string;
          line_total?: number;
          markup_pct?: number;
          part_id?: string | null;
          pst_taxable?: boolean;
          quantity?: number;
          service_id?: string | null;
          sort_order?: number;
          technician?: string | null;
          unit_price?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          estimate_id?: string;
          gst_taxable?: boolean;
          hours?: number | null;
          id?: string;
          item_type?: string;
          line_total?: number;
          markup_pct?: number;
          part_id?: string | null;
          pst_taxable?: boolean;
          quantity?: number;
          service_id?: string | null;
          sort_order?: number;
          technician?: string | null;
          unit_price?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "estimate_items_estimate_id_fkey";
            columns: ["estimate_id"];
            isOneToOne: false;
            referencedRelation: "estimates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "estimate_items_part_id_fkey";
            columns: ["part_id"];
            isOneToOne: false;
            referencedRelation: "parts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "estimate_items_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      estimates: {
        Row: {
          converted_to_invoice_id: string | null;
          created_at: string;
          customer_id: string;
          due_date: string | null;
          estimate_number: string;
          fees_total: number;
          gst_amount: number;
          gst_rate: number;
          id: string;
          issue_date: string | null;
          labor_total: number;
          notes: string | null;
          odometer: number | null;
          parts_total: number;
          pst_amount: number;
          pst_rate: number;
          shop_id: string;
          status: string;
          subtotal: number;
          supplies_amount: number;
          supplies_cap: number | null;
          supplies_pct: number;
          total: number;
          unit_id: string | null;
          updated_at: string;
        };
        Insert: {
          converted_to_invoice_id?: string | null;
          created_at?: string;
          customer_id: string;
          due_date?: string | null;
          estimate_number: string;
          fees_total?: number;
          gst_amount?: number;
          gst_rate?: number;
          id?: string;
          issue_date?: string | null;
          labor_total?: number;
          notes?: string | null;
          odometer?: number | null;
          parts_total?: number;
          pst_amount?: number;
          pst_rate?: number;
          shop_id: string;
          status?: string;
          subtotal?: number;
          supplies_amount?: number;
          supplies_cap?: number | null;
          supplies_pct?: number;
          total?: number;
          unit_id?: string | null;
          updated_at?: string;
        };
        Update: {
          converted_to_invoice_id?: string | null;
          created_at?: string;
          customer_id?: string;
          due_date?: string | null;
          estimate_number?: string;
          fees_total?: number;
          gst_amount?: number;
          gst_rate?: number;
          id?: string;
          issue_date?: string | null;
          labor_total?: number;
          notes?: string | null;
          odometer?: number | null;
          parts_total?: number;
          pst_amount?: number;
          pst_rate?: number;
          shop_id?: string;
          status?: string;
          subtotal?: number;
          supplies_amount?: number;
          supplies_cap?: number | null;
          supplies_pct?: number;
          total?: number;
          unit_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "estimates_converted_to_invoice_id_fkey";
            columns: ["converted_to_invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoice_balances";
            referencedColumns: ["invoice_id"];
          },
          {
            foreignKeyName: "estimates_converted_to_invoice_id_fkey";
            columns: ["converted_to_invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "estimates_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "estimates_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "estimates_unit_id_fkey";
            columns: ["unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["id"];
          },
        ];
      };
      invoice_items: {
        Row: {
          created_at: string;
          description: string;
          gst_taxable: boolean;
          hours: number | null;
          id: string;
          invoice_id: string;
          item_type: string;
          line_total: number;
          markup_pct: number;
          part_id: string | null;
          pst_taxable: boolean;
          quantity: number;
          service_id: string | null;
          sort_order: number;
          technician: string | null;
          unit_price: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description: string;
          gst_taxable?: boolean;
          hours?: number | null;
          id?: string;
          invoice_id: string;
          item_type?: string;
          line_total?: number;
          markup_pct?: number;
          part_id?: string | null;
          pst_taxable?: boolean;
          quantity?: number;
          service_id?: string | null;
          sort_order?: number;
          technician?: string | null;
          unit_price?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          gst_taxable?: boolean;
          hours?: number | null;
          id?: string;
          invoice_id?: string;
          item_type?: string;
          line_total?: number;
          markup_pct?: number;
          part_id?: string | null;
          pst_taxable?: boolean;
          quantity?: number;
          service_id?: string | null;
          sort_order?: number;
          technician?: string | null;
          unit_price?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoice_balances";
            referencedColumns: ["invoice_id"];
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoice_items_part_id_fkey";
            columns: ["part_id"];
            isOneToOne: false;
            referencedRelation: "parts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoice_items_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          created_at: string;
          customer_id: string;
          due_date: string | null;
          fees_total: number;
          gst_amount: number;
          gst_rate: number;
          id: string;
          invoice_number: string;
          issue_date: string | null;
          labor_total: number;
          notes: string | null;
          odometer: number | null;
          parts_total: number;
          pst_amount: number;
          pst_rate: number;
          sent_at: string | null;
          shop_id: string;
          status: string;
          stripe_connected_account_id: string | null;
          subtotal: number;
          supplies_amount: number;
          supplies_cap: number | null;
          supplies_pct: number;
          total: number;
          unit_id: string | null;
          unit_number_snapshot: string | null;
          updated_at: string;
          vin_snapshot: string | null;
          work_status: string;
        };
        Insert: {
          created_at?: string;
          customer_id: string;
          due_date?: string | null;
          fees_total?: number;
          gst_amount?: number;
          gst_rate?: number;
          id?: string;
          invoice_number: string;
          issue_date?: string | null;
          labor_total?: number;
          notes?: string | null;
          odometer?: number | null;
          parts_total?: number;
          pst_amount?: number;
          pst_rate?: number;
          sent_at?: string | null;
          shop_id: string;
          status?: string;
          stripe_connected_account_id?: string | null;
          subtotal?: number;
          supplies_amount?: number;
          supplies_cap?: number | null;
          supplies_pct?: number;
          total?: number;
          unit_id?: string | null;
          unit_number_snapshot?: string | null;
          updated_at?: string;
          vin_snapshot?: string | null;
          work_status?: string;
        };
        Update: {
          created_at?: string;
          customer_id?: string;
          due_date?: string | null;
          fees_total?: number;
          gst_amount?: number;
          gst_rate?: number;
          id?: string;
          invoice_number?: string;
          issue_date?: string | null;
          labor_total?: number;
          notes?: string | null;
          odometer?: number | null;
          parts_total?: number;
          pst_amount?: number;
          pst_rate?: number;
          sent_at?: string | null;
          shop_id?: string;
          status?: string;
          stripe_connected_account_id?: string | null;
          subtotal?: number;
          supplies_amount?: number;
          supplies_cap?: number | null;
          supplies_pct?: number;
          total?: number;
          unit_id?: string | null;
          unit_number_snapshot?: string | null;
          updated_at?: string;
          vin_snapshot?: string | null;
          work_status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_unit_id_fkey";
            columns: ["unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["id"];
          },
        ];
      };
      parts: {
        Row: {
          active: boolean;
          cost: number;
          created_at: string;
          description: string | null;
          id: string;
          markup_pct: number;
          name: string;
          quantity_on_hand: number;
          reorder_level: number;
          retail_price: number;
          shop_id: string;
          sku: string | null;
          supplier: string | null;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          cost?: number;
          created_at?: string;
          description?: string | null;
          id?: string;
          markup_pct?: number;
          name: string;
          quantity_on_hand?: number;
          reorder_level?: number;
          retail_price?: number;
          shop_id: string;
          sku?: string | null;
          supplier?: string | null;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          cost?: number;
          created_at?: string;
          description?: string | null;
          id?: string;
          markup_pct?: number;
          name?: string;
          quantity_on_hand?: number;
          reorder_level?: number;
          retail_price?: number;
          shop_id?: string;
          sku?: string | null;
          supplier?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "parts_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_reminders: {
        Row: {
          balance_at_send: number | null;
          channel: string;
          id: string;
          invoice_id: string;
          message: string | null;
          sent_at: string;
          sent_by: string | null;
          status: string;
        };
        Insert: {
          balance_at_send?: number | null;
          channel?: string;
          id?: string;
          invoice_id: string;
          message?: string | null;
          sent_at?: string;
          sent_by?: string | null;
          status?: string;
        };
        Update: {
          balance_at_send?: number | null;
          channel?: string;
          id?: string;
          invoice_id?: string;
          message?: string | null;
          sent_at?: string;
          sent_by?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payment_reminders_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoice_balances";
            referencedColumns: ["invoice_id"];
          },
          {
            foreignKeyName: "payment_reminders_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          amount: number;
          created_at: string;
          failure_message: string | null;
          id: string;
          invoice_id: string;
          method: string | null;
          paid_at: string | null;
          reference: string | null;
          status: string;
          stripe_payment_intent_id: string | null;
          updated_at: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          failure_message?: string | null;
          id?: string;
          invoice_id: string;
          method?: string | null;
          paid_at?: string | null;
          reference?: string | null;
          status?: string;
          stripe_payment_intent_id?: string | null;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          failure_message?: string | null;
          id?: string;
          invoice_id?: string;
          method?: string | null;
          paid_at?: string | null;
          reference?: string | null;
          status?: string;
          stripe_payment_intent_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoice_balances";
            referencedColumns: ["invoice_id"];
          },
          {
            foreignKeyName: "payments_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      reminders: {
        Row: {
          completed_at: string | null;
          created_at: string;
          due_date: string | null;
          due_odometer: number | null;
          id: string;
          notes: string | null;
          reminder_type: string;
          shop_id: string;
          status: string;
          unit_id: string;
          updated_at: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          due_date?: string | null;
          due_odometer?: number | null;
          id?: string;
          notes?: string | null;
          reminder_type: string;
          shop_id: string;
          status?: string;
          unit_id: string;
          updated_at?: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          due_date?: string | null;
          due_odometer?: number | null;
          id?: string;
          notes?: string | null;
          reminder_type?: string;
          shop_id?: string;
          status?: string;
          unit_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reminders_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reminders_unit_id_fkey";
            columns: ["unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["id"];
          },
        ];
      };
      repair_updates: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          invoice_id: string;
          note: string | null;
          work_status: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          invoice_id: string;
          note?: string | null;
          work_status: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          invoice_id?: string;
          note?: string | null;
          work_status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "repair_updates_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoice_balances";
            referencedColumns: ["invoice_id"];
          },
          {
            foreignKeyName: "repair_updates_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      services: {
        Row: {
          active: boolean;
          created_at: string;
          description: string | null;
          estimated_hours: number | null;
          id: string;
          labor_rate: number;
          name: string;
          shop_id: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          description?: string | null;
          estimated_hours?: number | null;
          id?: string;
          labor_rate?: number;
          name: string;
          shop_id: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          description?: string | null;
          estimated_hours?: number | null;
          id?: string;
          labor_rate?: number;
          name?: string;
          shop_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "services_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      shops: {
        Row: {
          address: string | null;
          created_at: string;
          default_gst_rate: number;
          default_labor_rate: number;
          default_parts_markup_pct: number;
          default_pst_rate: number;
          default_supplies_cap: number | null;
          default_supplies_pct: number;
          email: string | null;
          id: string;
          invoice_terms_days: number;
          logo_path: string | null;
          name: string;
          phone: string | null;
          settings: Json;
          slug: string;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          default_gst_rate?: number;
          default_labor_rate?: number;
          default_parts_markup_pct?: number;
          default_pst_rate?: number;
          default_supplies_cap?: number | null;
          default_supplies_pct?: number;
          email?: string | null;
          id?: string;
          invoice_terms_days?: number;
          logo_path?: string | null;
          name: string;
          phone?: string | null;
          settings?: Json;
          slug: string;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          default_gst_rate?: number;
          default_labor_rate?: number;
          default_parts_markup_pct?: number;
          default_pst_rate?: number;
          default_supplies_cap?: number | null;
          default_supplies_pct?: number;
          email?: string | null;
          id?: string;
          invoice_terms_days?: number;
          logo_path?: string | null;
          name?: string;
          phone?: string | null;
          settings?: Json;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      units: {
        Row: {
          created_at: string;
          current_odometer: number | null;
          customer_id: string;
          id: string;
          license_plate: string | null;
          make: string | null;
          model: string | null;
          nickname: string | null;
          shop_id: string;
          unit_number: string | null;
          unit_type: string | null;
          updated_at: string;
          vin: string | null;
          year: number | null;
        };
        Insert: {
          created_at?: string;
          current_odometer?: number | null;
          customer_id: string;
          id?: string;
          license_plate?: string | null;
          make?: string | null;
          model?: string | null;
          nickname?: string | null;
          shop_id: string;
          unit_number?: string | null;
          unit_type?: string | null;
          updated_at?: string;
          vin?: string | null;
          year?: number | null;
        };
        Update: {
          created_at?: string;
          current_odometer?: number | null;
          customer_id?: string;
          id?: string;
          license_plate?: string | null;
          make?: string | null;
          model?: string | null;
          nickname?: string | null;
          shop_id?: string;
          unit_number?: string | null;
          unit_type?: string | null;
          updated_at?: string;
          vin?: string | null;
          year?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "units_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "units_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          shop_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          shop_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          shop_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      invoice_balances: {
        Row: {
          amount_paid: number | null;
          balance_due: number | null;
          customer_id: string | null;
          effective_status: string | null;
          invoice_id: string | null;
          shop_id: string | null;
          total: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      get_customer_id_for_user: {
        Args: { _shop_id: string; _user_id: string };
        Returns: string;
      };
      has_shop_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _shop_id: string;
          _user_id: string;
        };
        Returns: boolean;
      };
      is_shop_member: {
        Args: { _shop_id: string; _user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "owner" | "admin" | "mechanic" | "customer";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["owner", "admin", "mechanic", "customer"],
    },
  },
} as const;
