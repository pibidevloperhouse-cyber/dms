import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useOnboardingStore = create(
  persist(
    (set) => ({
      step: 1,
      formData: {
        // Step 1: Basics
        sellerType: 'individual',
        isBroker: false,
        referralSource: '',
        linkedinUrl: '',
        
        // Step 2: Startup Details
        companyName: '',
        websiteUrl: '',
        country: 'India',
        businessModel: [],
        technologies: [],
        teamSize: 'Solo',
        
        // Step 3: Financials
        ttmRevenue: '',
        ttmProfit: '',
        arr: '',
        customerCount: '',
        churnRate: '',
        churnTrend: 'Stable',
        
        // Step 4: Context
        competitors: '',
        growthOpportunities: '',
        reasonForSelling: '',
        
        // Step 5: Pricing
        askingPrice: '',
        priceJustification: '',
      },
      setStep: (step) => set({ step }),
      nextStep: () => set((state) => ({ step: state.step + 1 })),
      prevStep: () => set((state) => ({ step: Math.max(1, state.step - 1) })),
      updateFormData: (data) =>
        set((state) => ({
          formData: { ...state.formData, ...data },
        })),
      reset: () =>
        set({
          step: 1,
          formData: {
            sellerType: 'individual',
            isBroker: false,
            referralSource: '',
            linkedinUrl: '',
            companyName: '',
            websiteUrl: '',
            country: 'India',
            businessModel: [],
            technologies: [],
            teamSize: 'Solo',
            ttmRevenue: '',
            ttmProfit: '',
            arr: '',
            customerCount: '',
            churnRate: '',
            churnTrend: 'Stable',
            competitors: '',
            growthOpportunities: '',
            reasonForSelling: '',
            askingPrice: '',
            priceJustification: '',
          },
        }),
    }),
    {
      name: 'dms-onboarding-storage', // Persist to local storage so users don't lose data on refresh
    }
  )
);
