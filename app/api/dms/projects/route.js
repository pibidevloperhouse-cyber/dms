import { NextResponse } from 'next/server';
import { db } from '@/db';
import { dmsProjects, dmsDeals, userGroups, groups, companies } from '@/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Service Role required for backend storage
);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');

    if (!companyId) {
      return NextResponse.json({ error: 'Missing companyId' }, { status: 400 });
    }

    if (role === 'super_admin' || !userId) {
      const projects = await db.select().from(dmsProjects).where(eq(dmsProjects.companyId, companyId));
      return NextResponse.json({ projects }, { status: 200 });
    }

    const userGroupsQuery = await db.select().from(userGroups).where(eq(userGroups.userId, userId));
    const groupIds = userGroupsQuery.map(ug => ug.groupId);

    if (groupIds.length === 0) {
      return NextResponse.json({ projects: [] }, { status: 200 });
    }

    const groupsQuery = await db.select().from(groups).where(inArray(groups.id, groupIds));
    const workspaceIds = groupsQuery.map(g => g.workspaceId).filter(id => id != null);

    if (workspaceIds.length === 0) {
      return NextResponse.json({ projects: [] }, { status: 200 });
    }

    const deals = await db.select().from(dmsDeals).where(inArray(dmsDeals.id, workspaceIds));
    const projectIds = deals.map(d => d.projectId);

    if (projectIds.length === 0) {
      return NextResponse.json({ projects: [] }, { status: 200 });
    }

    const projects = await db.select()
      .from(dmsProjects)
      .where(
        and(
          eq(dmsProjects.companyId, companyId),
          inArray(dmsProjects.id, projectIds)
        )
      );

    return NextResponse.json({ projects }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const name = formData.get('name');
    const companyId = formData.get('companyId');
    const dealType = formData.get('dealType');
    const projectType = formData.get('projectType');
    const description = formData.get('description');
    
    // Extracted teaser fields
    const businessModel = formData.get('businessModel');
    const industry = formData.get('industry');
    const subIndustry = formData.get('subIndustry');
    const yearFounded = formData.get('yearFounded');
    const numberOfEmployees = formData.get('numberOfEmployees');
    const legalStructure = formData.get('legalStructure');
    const headquarters = formData.get('headquarters');
    const operationsLocationsStr = formData.get('operationsLocations');
    const customerCount = formData.get('customerCount');
    const topCustomerRevenue = formData.get('topCustomerRevenue');
    const revenue = formData.get('revenue');
    const ebitda = formData.get('ebitda');
    const grossMargin = formData.get('grossMargin');
    const netProfit = formData.get('netProfit');
    const recurringRevenue = formData.get('recurringRevenue');
    const growthRate = formData.get('growthRate');
    const debt = formData.get('debt');
    const workingCapital = formData.get('workingCapital');
    const addBacks = formData.get('addBacks');
    const revenueBandDropdown = formData.get('revenueBandDropdown');
    const keyHighlights = formData.get('keyHighlights');
    const reasonForSale = formData.get('reasonForSale');
    const askingPrice = formData.get('askingPrice');
    const valuationExpectation = formData.get('valuationExpectation');
    const preferredBuyerTypesStr = formData.get('preferredBuyerTypes');
    const ebitdaBandDropdown = formData.get('ebitdaBandDropdown');
    const mandate = formData.get('mandate');

    const profitAndLossFile = formData.get('profitAndLossFile');
    const balanceSheetFile = formData.get('balanceSheetFile');

    if (!name || !companyId) {
      return NextResponse.json({ error: 'Missing name or companyId' }, { status: 400 });
    }

    // Parse JSON strings
    let operationsLocations = [];
    try { if (operationsLocationsStr) operationsLocations = JSON.parse(operationsLocationsStr); } catch(e){}
    let preferredBuyerTypes = [];
    try { if (preferredBuyerTypesStr) preferredBuyerTypes = JSON.parse(preferredBuyerTypesStr); } catch(e){}

    const [newProject] = await db.insert(dmsProjects).values({
      name,
      companyId,
      projectType: dealType || projectType,
      description,
      status: 'inactive'
    }).returning();

    // Fetch company name for the bucket folder structure
    let companyName = 'Unknown_Company';
    try {
      const [companyRecord] = await db.select({ name: companies.name }).from(companies).where(eq(companies.id, companyId));
      if (companyRecord && companyRecord.name) {
        companyName = companyRecord.name.replace(/[^a-zA-Z0-9_-]/g, '_'); // sanitize
      }
    } catch(e) {
      console.error("Could not fetch company name", e);
    }

    const uploadBaseFolder = `${companyName}/${newProject.id}`;

    // Upload files
    let profitAndLossUrl = null;
    let balanceSheetUrl = null;
    const bucketName = 'teaser_documents';

    // Helper to upload
    const uploadFile = async (file) => {
      if (!file || typeof file === 'string') return null;
      const fileName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const filePath = `${uploadBaseFolder}/${Date.now()}_${fileName}`;
      
      const buffer = Buffer.from(await file.arrayBuffer());
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, buffer, { contentType: file.type, upsert: false });
        
      if (error) {
        console.error('File upload error:', error);
        return null;
      }
      
      const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
      return publicUrlData.publicUrl;
    };

    try {
      profitAndLossUrl = await uploadFile(profitAndLossFile);
      balanceSheetUrl = await uploadFile(balanceSheetFile);
    } catch (uploadError) {
      console.error("Failed uploading files to Supabase", uploadError);
    }

    // Create teaser with the collected details and URLs
    try {
      const { dmsTeasers } = require('@/db/schema');
      await db.insert(dmsTeasers).values({
        projectId: newProject.id,
        businessModel: businessModel || '',
        industry: industry || '',
        subIndustry: subIndustry || '',
        yearFounded: yearFounded || '',
        employees: numberOfEmployees || '',
        legalStructure: legalStructure || '',
        headquarters: headquarters || '',
        operationsLocation: operationsLocations || [],
        totalCustomerCount: customerCount ? parseInt(customerCount, 10) : null,
        topCustomerPercentRevenue: topCustomerRevenue || '',
        revenue: revenue || '',
        profitabilityEbitdaPercent: ebitda || '',
        ebitdaBand: ebitdaBandDropdown || '',
        grossMarginPercent: grossMargin || '',
        netProfit: netProfit || '',
        recurringRevenuePercent: recurringRevenue || '',
        growthRatePercent: growthRate || '',
        debtOnBusiness: debt || '',
        workingCapital: workingCapital || '',
        addBacks: addBacks || '',
        revenueBand: revenueBandDropdown || '',
        investmentMandate: mandate || '',
        businessSummary: description || '',
        keyHighlights: keyHighlights || '',
        askingPrice: askingPrice || '',
        valuationExpectation: valuationExpectation || '',
        preferredBuyerTypes: preferredBuyerTypes || [],
        reasonForSale: reasonForSale || '',
        profitAndLossUrl: profitAndLossUrl || null,
        balanceSheetUrl: balanceSheetUrl || null,
        status: 'inactive'
      });
    } catch(teaserErr) {
      console.error('Failed to create initial teaser:', teaserErr);
    }

    return NextResponse.json({ project: newProject }, { status: 201 });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing project id' }, { status: 400 });
    }

    const { dmsTeasers, dmsDeals, dmsDealProposals, riskIssues, approvals, auditLogs } = require('@/db/schema');
    
    const teasers = await db.select().from(dmsTeasers).where(eq(dmsTeasers.projectId, id));
    if (teasers.length > 0) {
      const teaserIds = teasers.map(t => t.id);
      await db.delete(dmsDealProposals).where(inArray(dmsDealProposals.teaserId, teaserIds));
    }

    if (dmsDeals) await db.delete(dmsDeals).where(eq(dmsDeals.projectId, id));
    if (riskIssues) await db.delete(riskIssues).where(eq(riskIssues.projectId, id));
    if (approvals) await db.delete(approvals).where(eq(approvals.projectId, id));
    if (auditLogs) await db.delete(auditLogs).where(eq(auditLogs.projectId, id));
    if (dmsTeasers) await db.delete(dmsTeasers).where(eq(dmsTeasers.projectId, id));

    await db.delete(dmsProjects).where(eq(dmsProjects.id, id));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
