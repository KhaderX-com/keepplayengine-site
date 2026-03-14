import { NextResponse } from "next/server";
import { createSubMilestoneSchema } from "@/lib/schemas";
import { createApiHandler } from "@/lib/api-gateway";
import { getUserClient, MilestonesDAL, AdminDAL } from "@/lib/dal";

// =====================================================
// GET - Fetch all sub-milestones for a milestone
// =====================================================
export const GET = createApiHandler({}, async (_req, ctx, routeContext) => {
    const { id } = await routeContext.params;
    const client = await getUserClient(ctx.session.user.id, ctx.session.user.role);

    const { data: subMilestones, error } = await MilestonesDAL.listSubMilestones(client, id);
    if (error) {
        return NextResponse.json({ error: "Failed to fetch sub-milestones" }, { status: 500 });
    }

    return NextResponse.json({ subMilestones: subMilestones || [] });
});

// =====================================================
// POST - Create a new sub-milestone
// =====================================================
export const POST = createApiHandler(
    { bodySchema: createSubMilestoneSchema, requiredRoles: ["SUPER_ADMIN", "ADMIN"] },
    async (_req, ctx, routeContext) => {
        const { id } = await routeContext.params;
        const client = await getUserClient(ctx.session.user.id, ctx.session.user.role);
        const body = ctx.body!;

        // Verify milestone exists
        const { data: milestone, error: milestoneError } = await client
            .from("milestones")
            .select("id, task_id")
            .eq("id", id)
            .single();

        if (milestoneError || !milestone) {
            return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
        }

        // Auto-calculate major/minor numbers if not provided
        let majorNumber = body.major_number;
        let minorNumber = body.minor_number;

        if (!majorNumber || !minorNumber) {
            const { data: existing } = await MilestonesDAL.getMaxSubMilestoneNumbers(client, id);
            if (existing) {
                majorNumber = majorNumber || existing.major_number;
                minorNumber = (existing.minor_number || 0) + 1;
            } else {
                majorNumber = 1;
                minorNumber = 1;
            }
        }

        // Get position for new sub-milestone
        const { data: positionData } = await client
            .from("sub_milestones")
            .select("position")
            .eq("milestone_id", id)
            .order("position", { ascending: false })
            .limit(1);

        const position = positionData && positionData.length > 0 ? positionData[0].position + 1 : 0;

        const { data: subMilestone, error } = await MilestonesDAL.createSubMilestone(client, {
            milestone_id: id,
            major_number: majorNumber,
            minor_number: minorNumber,
            title: body.title,
            description: body.description || null,
            status: "not_started",
            target_date: body.target_date || null,
            assignee_id: body.assignee_id || null,
            priority: body.priority || "medium",
            notes: body.notes || null,
            position,
        });

        if (error) {
            if (error.code === "23505") {
                return NextResponse.json(
                    { error: `Sub-milestone M${majorNumber}.${minorNumber} already exists` },
                    { status: 400 }
                );
            }
            return NextResponse.json({ error: "Failed to create sub-milestone" }, { status: 500 });
        }

        await AdminDAL.logActivity(client, {
            admin_user_id: ctx.session.user.id,
            action: "create_sub_milestone",
            resource_type: "sub_milestone",
            resource_id: subMilestone!.id,
            description: `Created sub-milestone M${majorNumber}.${minorNumber}: ${body.title}`,
            ip_address: ctx.ip,
            user_agent: ctx.userAgent,
        });

        return NextResponse.json({ subMilestone }, { status: 201 });
    }
);
