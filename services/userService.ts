
import { supabase } from './supabaseClient';
import { UserProfile } from '../types';

export const userService = {
    // Helper to get current authenticated user ID
    getCurrentUserId: async (): Promise<string | null> => {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.user?.id || null;
    },

    getCurrentProfile: async (): Promise<UserProfile | null> => {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session || !session.user) {
            return null;
        }

        const userId = session.user.id;
        
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !data) {
            return null;
        }

        // Map snake_case DB columns to camelCase UserProfile type
        return {
            id: data.id,
            companyName: data.company_name || "",
            specialization: data.specialization || "",
            cpvCodes: data.cpv_codes || "",
            negativeKeywords: data.negative_keywords || "",
            targetDepartments: data.target_departments || "",
            scope: data.scope || "France",
            subscriptionStatus: data.subscription_status || "Trial",
            savedDashboardFilters: data.saved_dashboard_filters || undefined,
            isSuperAdmin: data.is_super_admin || false
        } as UserProfile;
    },

    // ADMIN ONLY: Get all profiles
    getAllProfiles: async (): Promise<UserProfile[]> => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*');

        if (error) {
            console.error("Error fetching all profiles", error);
            return [];
        }

        return data.map((d: any) => ({
            id: d.id,
            companyName: d.company_name || "N/A",
            specialization: d.specialization || "",
            cpvCodes: d.cpv_codes || "",
            negativeKeywords: d.negative_keywords || "",
            targetDepartments: d.target_departments || "",
            scope: d.scope || "France",
            subscriptionStatus: d.subscription_status || "Trial",
            isSuperAdmin: d.is_super_admin || false
        }));
    },

    saveProfile: async (profile: Partial<UserProfile>): Promise<void> => {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session || !session.user) {
            throw new Error("User not authenticated");
        }

        const userId = session.user.id;
        
        // Map camelCase to snake_case for DB
        const dbPayload: any = {
            id: userId,
            ...(profile.companyName && { company_name: profile.companyName }),
            ...(profile.specialization && { specialization: profile.specialization }),
            ...(profile.cpvCodes && { cpv_codes: profile.cpvCodes }),
            ...(profile.negativeKeywords && { negative_keywords: profile.negativeKeywords }),
            ...(profile.targetDepartments && { target_departments: profile.targetDepartments }),
            ...(profile.scope && { scope: profile.scope }),
            ...(profile.subscriptionStatus && { subscription_status: profile.subscriptionStatus }),
            ...(profile.savedDashboardFilters && { saved_dashboard_filters: profile.savedDashboardFilters })
            // is_super_admin is NEVER updated here for security
        };

        const { error } = await supabase
            .from('profiles')
            .upsert(dbPayload);

        if (error) {
            console.error('Error saving profile:', error);
            throw new Error(error.message);
        }
    },

    resetLocalUser: async () => {
        // Sign out from Supabase
        await supabase.auth.signOut();
    }
};
