
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
            .maybeSingle();

        if (error) {
            console.error("Error fetching profile:", error);
            return null;
        }

        if (!data) {
            return null;
        }

        // Map snake_case DB columns to camelCase UserProfile type
        return {
            id: data.id,
            companyName: data.company_name || "",
            siret: data.siret || "",
            address: data.address || "",
            website: data.website || "",
            companySize: data.company_size || "PME",
            
            specialization: data.specialization || "",
            cpvCodes: data.cpv_codes || "",
            targetSectors: data.target_sectors || "",
            certifications: data.certifications || "",
            negativeKeywords: data.negative_keywords || "",
            
            targetDepartments: data.target_departments || "",
            scope: "France", // Hardcoded per user request
            
            subscriptionStatus: data.subscription_status || "Trial",
            savedDashboardFilters: data.saved_dashboard_filters || undefined
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
            scope: "France",
            subscriptionStatus: d.subscription_status || "Trial"
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
            ...(profile.companyName !== undefined && { company_name: profile.companyName }),
            ...(profile.siret !== undefined && { siret: profile.siret }),
            ...(profile.address !== undefined && { address: profile.address }),
            ...(profile.website !== undefined && { website: profile.website }),
            ...(profile.companySize !== undefined && { company_size: profile.companySize }),
            
            ...(profile.specialization !== undefined && { specialization: profile.specialization }),
            ...(profile.cpvCodes !== undefined && { cpv_codes: profile.cpvCodes }),
            ...(profile.targetSectors !== undefined && { target_sectors: profile.targetSectors }),
            ...(profile.certifications !== undefined && { certifications: profile.certifications }),
            ...(profile.negativeKeywords !== undefined && { negative_keywords: profile.negativeKeywords }),
            
            ...(profile.targetDepartments !== undefined && { target_departments: profile.targetDepartments }),
            
            ...(profile.subscriptionStatus !== undefined && { subscription_status: profile.subscriptionStatus }),
            ...(profile.savedDashboardFilters !== undefined && { saved_dashboard_filters: profile.savedDashboardFilters })
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
        await supabase.auth.signOut();
    }
};
