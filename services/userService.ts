import { supabase } from './supabaseClient';
import { UserProfile } from '../types';

const USER_ID_KEY = 'tenderai_user_id';

// Helper to get or create a stable User ID for this browser session
// In a full auth app, this would come from supabase.auth.user()
export const getUserId = (): string => {
    let id = localStorage.getItem(USER_ID_KEY);
    if (!id) {
        id = 'usr_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem(USER_ID_KEY, id);
    }
    return id;
};

export const userService = {
    getCurrentProfile: async (): Promise<UserProfile | null> => {
        const userId = getUserId();
        
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
            companyName: data.company_name,
            specialization: data.specialization,
            cpvCodes: data.cpv_codes,
            negativeKeywords: data.negative_keywords,
            targetDepartments: data.target_departments,
            scope: data.scope,
            subscriptionStatus: data.subscription_status,
            savedDashboardFilters: data.saved_dashboard_filters
        } as UserProfile;
    },

    saveProfile: async (profile: Partial<UserProfile>): Promise<void> => {
        const userId = getUserId();
        
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
        };

        const { error } = await supabase
            .from('profiles')
            .upsert(dbPayload);

        if (error) {
            console.error('Error saving profile:', error);
            throw error;
        }
    },

    resetLocalUser: () => {
        localStorage.removeItem(USER_ID_KEY);
        // We don't delete from DB in this demo reset, just generate a new ID to start fresh
    }
};