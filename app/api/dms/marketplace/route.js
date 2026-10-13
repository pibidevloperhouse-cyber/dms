import { db } from '../../../../db';
import { dmsTeasers, dmsProjects, users, companies, buyerProfiles } from '../../../../db/schema';
import { eq, or, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const activeTeasersPromise = db
      .select({
        id: dmsTeasers.id,
        projectId: dmsTeasers.projectId,
        projectName: dmsProjects.name,
        projectType: dmsProjects.projectType,
        projectDescription: dmsProjects.description,
        name: dmsTeasers.businessSummary,
        sector: dmsTeasers.industry,
        industry: dmsTeasers.industry,
        subIndustry: dmsTeasers.subIndustry,
        geography: dmsTeasers.headquarters,
        headquarters: dmsTeasers.headquarters,
        businessModel: dmsTeasers.businessModel,
        yearFounded: dmsTeasers.yearFounded,
        legalStructure: dmsTeasers.legalStructure,
        overview: dmsTeasers.businessSummary,
        businessSummary: dmsTeasers.businessSummary,
        revenue: dmsTeasers.revenue,
        ebitda: dmsTeasers.ebitdaBand,
        ebitdaBand: dmsTeasers.ebitdaBand,
        profitabilityEbitdaPercent: dmsTeasers.profitabilityEbitdaPercent,
        grossMarginPercent: dmsTeasers.grossMarginPercent,
        netProfit: dmsTeasers.netProfit,
        recurringRevenuePercent: dmsTeasers.recurringRevenuePercent,
        growth: dmsTeasers.growthRatePercent,
        growthRatePercent: dmsTeasers.growthRatePercent,
        employees: dmsTeasers.employees,
        debtOnBusiness: dmsTeasers.debtOnBusiness,
        workingCapital: dmsTeasers.workingCapital,
        addBacks: dmsTeasers.addBacks,
        revenueBand: dmsTeasers.revenueBand,
        keyHighlights: dmsTeasers.keyHighlights,
        investmentMandate: dmsTeasers.investmentMandate,
        askingPrice: dmsTeasers.askingPrice,
        valuationExpectation: dmsTeasers.valuationExpectation,
        preferredBuyerTypes: dmsTeasers.preferredBuyerTypes,
        reasonForSale: dmsTeasers.reasonForSale,
        profitAndLossUrl: dmsTeasers.profitAndLossUrl,
        balanceSheetUrl: dmsTeasers.balanceSheetUrl,
        status: dmsTeasers.status
      })
      .from(dmsTeasers)
      .innerJoin(dmsProjects, eq(dmsTeasers.projectId, dmsProjects.id))
      .where(or(eq(dmsTeasers.status, 'active'), eq(dmsTeasers.status, 'Active')));

    const activeBuyersPromise = db
      .select({
        id: users.id,
        name: companies.name,
        userName: users.name,
        companyName: companies.name,
        investorType: companies.operationType,
        investmentRange: users.investmentRange,
        companyType: companies.companyType,
        jobTitle: users.jobTitle,
        verificationStatus: users.verificationStatus,
        email: users.email,
        phone: users.phoneNumber,
        city: companies.city,
        country: companies.country,
        stateRegion: companies.stateRegion,
        websiteUrl: companies.websiteUrl,
        linkedinUrl: companies.linkedinUrl,
        licenseNumber: companies.licenseNumber,
        proofOfAuthorityUrl: companies.proofOfAuthorityUrl,
        createdAt: companies.createdAt,
        companyDescription: buyerProfiles.companyDescription,
        foundedYear: buyerProfiles.foundedYear,
        headquarters: buyerProfiles.headquarters,
        capitalValue: buyerProfiles.capitalValue,
        teamSize: buyerProfiles.teamSize,
        timelineToCloseDays: buyerProfiles.timelineToCloseDays,
        dealBreakers: buyerProfiles.dealBreakers
      })
      .from(users)
      .leftJoin(companies, eq(users.companyId, companies.id))
      .leftJoin(buyerProfiles, or(eq(users.id, buyerProfiles.userId), eq(companies.id, buyerProfiles.companyId)))
      .where(
        and(
          or(eq(companies.dmsRole, 'buyer'), eq(companies.dmsRole, 'Buyer')),
          eq(users.role, 'guest_admin')
        )
      );

    const [activeTeasers, activeBuyersRaw] = await Promise.all([activeTeasersPromise, activeBuyersPromise]);

    const activeBuyers = activeBuyersRaw.map(buyer => ({
      ...buyer,
      verificationStatus: buyer.verificationStatus || 'verified',
      location: [buyer.city, buyer.stateRegion, buyer.country].filter(Boolean).join(', ')
    }));

    return NextResponse.json({ teasers: activeTeasers, buyers: activeBuyers }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch marketplace deals:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
