import { db } from '../../../../db';
import { dmsTeasers, dmsProjects } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const [teaser] = await db.select().from(dmsTeasers).where(eq(dmsTeasers.projectId, projectId));
    
    return NextResponse.json({ teaser: teaser || null }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch teaser:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    const { projectId, dealName, sector, geography, companyOverview, revenue, ebitda, yoyGrowth, employees, status } = data;

    if (!projectId || !dealName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if teaser already exists
    const [existingTeaser] = await db.select().from(dmsTeasers).where(eq(dmsTeasers.projectId, projectId));

    if (existingTeaser) {
      // Update
      const [updatedTeaser] = await db.update(dmsTeasers).set({
        dealName,
        sector,
        geography,
        companyOverview,
        revenue,
        ebitda,
        yoyGrowth,
        employees,
        status: status || 'draft',
        updatedAt: new Date()
      }).where(eq(dmsTeasers.projectId, projectId)).returning();
      
      return NextResponse.json({ teaser: updatedTeaser, message: 'Updated successfully' }, { status: 200 });
    } else {
      // Insert
      const [newTeaser] = await db.insert(dmsTeasers).values({
        projectId,
        dealName,
        sector,
        geography,
        companyOverview,
        revenue,
        ebitda,
        yoyGrowth,
        employees,
        status: status || 'draft'
      }).returning();
      
      return NextResponse.json({ teaser: newTeaser, message: 'Created successfully' }, { status: 201 });
    }
  } catch (error) {
    console.error('Failed to save teaser:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const data = await req.json();
    const { projectId } = data;

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const [existingTeaser] = await db.select().from(dmsTeasers).where(eq(dmsTeasers.projectId, projectId));
    if (!existingTeaser) {
      return NextResponse.json({ error: 'Teaser not found for this project' }, { status: 404 });
    }

    // Safely format operationsLocation and preferredBuyerTypes as arrays
    let operationsLocation = data.operationsLocation;
    if (typeof operationsLocation === 'string') {
      operationsLocation = operationsLocation.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (!Array.isArray(operationsLocation) && operationsLocation !== undefined) {
      operationsLocation = [operationsLocation];
    }

    let preferredBuyerTypes = data.preferredBuyerTypes;
    if (typeof preferredBuyerTypes === 'string') {
      preferredBuyerTypes = preferredBuyerTypes.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (!Array.isArray(preferredBuyerTypes) && preferredBuyerTypes !== undefined) {
      preferredBuyerTypes = [preferredBuyerTypes];
    }

    let totalCustomerCount = existingTeaser.totalCustomerCount;
    if (data.totalCustomerCount !== undefined && data.totalCustomerCount !== null && data.totalCustomerCount !== '') {
      const parsedNum = Number(String(data.totalCustomerCount).replace(/[^0-9]/g, ''));
      totalCustomerCount = isNaN(parsedNum) ? 0 : parsedNum;
    }

    const updatePayload = {
      businessModel: data.businessModel !== undefined ? data.businessModel : existingTeaser.businessModel,
      industry: data.industry !== undefined ? data.industry : existingTeaser.industry,
      subIndustry: data.subIndustry !== undefined ? data.subIndustry : existingTeaser.subIndustry,
      yearFounded: data.yearFounded !== undefined ? data.yearFounded : existingTeaser.yearFounded,
      employees: data.employees !== undefined ? data.employees : existingTeaser.employees,
      legalStructure: data.legalStructure !== undefined ? data.legalStructure : existingTeaser.legalStructure,
      headquarters: data.headquarters !== undefined ? data.headquarters : existingTeaser.headquarters,
      operationsLocation: operationsLocation !== undefined ? operationsLocation : existingTeaser.operationsLocation,
      totalCustomerCount,
      topCustomerPercentRevenue: data.topCustomerPercentRevenue !== undefined ? data.topCustomerPercentRevenue : existingTeaser.topCustomerPercentRevenue,
      revenue: data.revenue !== undefined ? data.revenue : existingTeaser.revenue,
      profitabilityEbitdaPercent: data.profitabilityEbitdaPercent !== undefined ? data.profitabilityEbitdaPercent : existingTeaser.profitabilityEbitdaPercent,
      ebitdaBand: data.ebitdaBand !== undefined ? data.ebitdaBand : existingTeaser.ebitdaBand,
      grossMarginPercent: data.grossMarginPercent !== undefined ? data.grossMarginPercent : existingTeaser.grossMarginPercent,
      netProfit: data.netProfit !== undefined ? data.netProfit : existingTeaser.netProfit,
      recurringRevenuePercent: data.recurringRevenuePercent !== undefined ? data.recurringRevenuePercent : existingTeaser.recurringRevenuePercent,
      growthRatePercent: data.growthRatePercent !== undefined ? data.growthRatePercent : existingTeaser.growthRatePercent,
      debtOnBusiness: data.debtOnBusiness !== undefined ? data.debtOnBusiness : existingTeaser.debtOnBusiness,
      workingCapital: data.workingCapital !== undefined ? data.workingCapital : existingTeaser.workingCapital,
      addBacks: data.addBacks !== undefined ? data.addBacks : existingTeaser.addBacks,
      revenueBand: data.revenueBand !== undefined ? data.revenueBand : existingTeaser.revenueBand,
      investmentMandate: data.investmentMandate !== undefined ? data.investmentMandate : existingTeaser.investmentMandate,
      businessSummary: data.businessSummary !== undefined ? data.businessSummary : existingTeaser.businessSummary,
      keyHighlights: data.keyHighlights !== undefined ? data.keyHighlights : existingTeaser.keyHighlights,
      askingPrice: data.askingPrice !== undefined ? data.askingPrice : existingTeaser.askingPrice,
      valuationExpectation: data.valuationExpectation !== undefined ? data.valuationExpectation : existingTeaser.valuationExpectation,
      preferredBuyerTypes: preferredBuyerTypes !== undefined ? preferredBuyerTypes : existingTeaser.preferredBuyerTypes,
      reasonForSale: data.reasonForSale !== undefined ? data.reasonForSale : existingTeaser.reasonForSale,
      status: data.status !== undefined ? data.status : existingTeaser.status,
      updatedAt: new Date()
    };

    const [updatedTeaser] = await db.update(dmsTeasers)
      .set(updatePayload)
      .where(eq(dmsTeasers.projectId, projectId))
      .returning();

    // Update dms_projects table for project name and description if provided
    let updatedProject = null;
    if (data.projectName !== undefined || data.projectDescription !== undefined) {
      const projectUpdate = {
        updatedAt: new Date()
      };
      if (data.projectName !== undefined && typeof data.projectName === 'string' && data.projectName.trim() !== '') {
        projectUpdate.name = data.projectName.trim();
      }
      if (data.projectDescription !== undefined) {
        projectUpdate.description = data.projectDescription;
      }
      if (data.projectType !== undefined) {
        projectUpdate.projectType = data.projectType;
      }
      const [proj] = await db.update(dmsProjects)
        .set(projectUpdate)
        .where(eq(dmsProjects.id, projectId))
        .returning();
      updatedProject = proj;
    }

    return NextResponse.json({ 
      teaser: updatedTeaser, 
      project: updatedProject, 
      message: 'Teaser and project details updated successfully' 
    }, { status: 200 });
  } catch (error) {
    console.error('Failed to update teaser:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    // Instead of completely deleting, we can just set status back to 'draft' or 'inactive'
    // This removes it from the Marketplace but keeps the seller's data
    await db.update(dmsTeasers)
      .set({ status: 'draft', updatedAt: new Date() })
      .where(eq(dmsTeasers.projectId, projectId));
    
    return NextResponse.json({ success: true, message: 'Teaser removed from marketplace' }, { status: 200 });
  } catch (error) {
    console.error('Failed to remove teaser:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
