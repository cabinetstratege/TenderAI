
import { supabase } from './supabaseClient';
import { UserProfile } from '../types';

const DEMO_PROFILE_KEY = 'tenderai_demo_profile';

export const userService = {
    isDemoMode: (): boolean => {
        return localStorage.getItem('tenderai_auth_mode') === 'demo';
    },

    setDemoMode: (enabled: boolean) => {
        if (enabled) localStorage.setItem('tenderai_auth_mode', 'demo');
        else localStorage.removeItem('tenderai_auth_mode');
    },

    getCurrentUserId: async (): Promise<string | null> => {
        if (userService.isDemoMode()) return 'demo-user';
        const { data: { session } } = await supabase.auth.getSession();
        return session?.user?.id || null;
    },

    getCurrentProfile: async (): Promise<UserProfile | null> => {
        // --- DEMO MODE LOGIC ---
        if (userService.isDemoMode()) {
            const local = localStorage.getItem(DEMO_PROFILE_KEY);
            let profile: UserProfile;

            // Ensure we use the correct structure even if old data exists
            if (local) {
                profile = JSON.parse(local);
                // FORCE status to Demo to avoid picking up 'Trial' from previous tests
                if (profile.subscriptionStatus !== 'Active') {
                    profile.subscriptionStatus = 'Demo';
                    profile.trialStartedAt = undefined;
                }
            } else {
                // Initialize default demo profile
                profile = {
                    id: 'demo-user',
                    companyName: 'BatiRénov Expert',
                    specialization: 'Rénovation Énergétique BTP',
                    cpvCodes: '45000000',
                    scope: 'France',
                    subscriptionStatus: 'Demo', 
                    trialStartedAt: undefined 
                } as UserProfile;
                localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(profile));
            }
            return profile;
        }

        // --- REAL DB LOGIC ---
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

        // Logic to initialize trial if missing (Frontend Polyfill if DB column missing/empty)
        let trialStart = data.trial_started_at;
        let subStatus = data.subscription_status || "Trial";

        // Only start trial logic if not already Active/Expired
        if (subStatus === 'Trial' && !trialStart) {
            // First time seeing this REAL user without trial start -> set it to now
            trialStart = new Date().toISOString();
            // Try to update DB if possible (might fail if column doesn't exist yet)
            userService.saveProfile({ trialStartedAt: trialStart } as any).catch(e => {});
        }

        // Check Expiration for Real Users
        if (subStatus === 'Trial' && trialStart) {
             const now = new Date();
             const start = new Date(trialStart);
             const diffMs = now.getTime() - start.getTime();
             if (diffMs > 86400000) { // 24h
                 subStatus = 'Expired';
             }
        }

        return {
            id: data.id,
            companyName: data.company_name || "",
            contactEmail: session.user.email || "", 
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
            scope: "France",
            subscriptionStatus: subStatus,
            trialStartedAt: trialStart,
            savedDashboardFilters: data.saved_dashboard_filters || undefined
        } as UserProfile;
    },

    getAllProfiles: async (): Promise<UserProfile[]> => {
        if (userService.isDemoMode()) return [];

        const { data, error } = await supabase.from('profiles').select('*');
        if (error) return [];

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
        if (userService.isDemoMode()) {
            // Merge with existing
            const current = await userService.getCurrentProfile();
            const updated = { ...current, ...profile };
            localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(updated));
            return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !session.user) throw new Error("User not authenticated");

        const userId = session.user.id;
        
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
            ...(profile.trialStartedAt !== undefined && { trial_started_at: profile.trialStartedAt }),
            ...(profile.savedDashboardFilters !== undefined && { saved_dashboard_filters: profile.savedDashboardFilters })
        };

        const { error } = await supabase.from('profiles').upsert(dbPayload);
        if (error) throw new Error(error.message || "Erreur de sauvegarde base de données");
    },
    
    // New Method to Simulate Payment
    upgradeSubscription: async (): Promise<void> => {
        if (userService.isDemoMode()) {
            const current = JSON.parse(localStorage.getItem(DEMO_PROFILE_KEY) || '{}');
            current.subscriptionStatus = 'Active';
            localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(current));
            return;
        }
        
        // In real app, this would be a webhook from Stripe
        await userService.saveProfile({ subscriptionStatus: 'Active' });
    },

    resetLocalUser: async () => {
        if (userService.isDemoMode()) {
            userService.setDemoMode(false);
            window.location.reload();
            return;
        }
        await supabase.auth.signOut();
    }
};
