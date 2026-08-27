import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";

export async function POST(request: Request) {
    try {
        const ctx = await getAuthContext();
        if (isAuthError(ctx)) return ctx;

        if (!ctx.isAdmin) {
            return NextResponse.json({ error: "Access denied. Admin authorization required." }, { status: 403 });
        }

        const { name, email, role } = await request.json();

        if (role === "super_admin" && !ctx.isSuperAdmin) {
            return NextResponse.json({ error: "Access denied. Cannot create super-administrative identities." }, { status: 403 });
        }

        if (!name || !email) {
            return NextResponse.json({ error: "Missing identity parameters" }, { status: 400 });
        }

        const admin = createAdminClient();

        // Generate a cryptographically secure temporary passphrase
        const tempPassword = crypto.randomBytes(16).toString('hex');

        // 1. Create the user in Supabase Auth
        const { data: authData, error: authError } = await admin.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
                name,
                role,
                force_password_change: true
            }
        });

        if (authError) throw authError;

        // 2. Provision entry in public.users table
        const { data: userData, error: userError } = await admin
            .from("users")
            .insert({
                auth_id: authData.user.id,
                email,
                name,
                role
            })
            .select()
            .single();

        // In case the column doesn't exist yet, we'll rely on auth metadata for redirection logic

        return NextResponse.json({
            user: userData,
            credentials: {
                link: "Security protocols established",
                passphrase: tempPassword // In production, send this via transactional email
            }
        });

    } catch (err: unknown) {
        console.error("[Users API]", err);
        return NextResponse.json({ error: err instanceof Error ? err.message : "System instance failure" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const ctx = await getAuthContext();
        if (isAuthError(ctx)) return ctx;

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const auth_id = searchParams.get("auth_id");

        if (!auth_id) {
            return NextResponse.json({ error: "Authentication ID mandatory" }, { status: 400 });
        }

        const admin = createAdminClient();

        // Security Check: Fetch target user to check role
        const { data: targetUser } = await admin
            .from("users")
            .select("role, auth_id")
            .eq("auth_id", auth_id)
            .single();

        if (targetUser?.role === "super_admin" && !ctx.isSuperAdmin) {
            return NextResponse.json({ error: "Access denied. Target identity is protected by super-administrative protocols." }, { status: 403 });
        }

        if (targetUser?.role === "admin" && !ctx.isSuperAdmin && targetUser.auth_id !== ctx.authId) {
             // Optional: Admin might not be allowed to delete another admin, but user only asked for Super Admin protection
        }

        // 1. Terminate Auth identity
        const { error: authError } = await admin.auth.admin.deleteUser(auth_id);
        if (authError) {
            const err = authError as { code?: string; status?: number };
            if (err.code !== 'user_not_found' && err.status !== 404) {
                throw authError;
            }
        }

        // 2. Purge record from public table
        const { error: userError } = await admin
            .from("users")
            .delete()
            .eq("id", id);

        return NextResponse.json({ success: true });

    } catch (err: unknown) {
        console.error("[Users API DELETE]", err);
        return NextResponse.json({ error: err instanceof Error ? err.message : "System instance failure" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const ctx = await getAuthContext();
        if (isAuthError(ctx)) return ctx;

        if (!ctx.isAdmin) {
            return NextResponse.json({ error: "Access denied. Admin authorization required." }, { status: 403 });
        }

        const { auth_id, name, role, reset_password } = await request.json();

        if (!auth_id) {
            return NextResponse.json({ error: "Missing authorization ID" }, { status: 400 });
        }

        const admin = createAdminClient();

        // 1. Fetch target user's current data from DB to check role
        const { data: targetUser, error: fetchError } = await admin
            .from("users")
            .select("id, role, auth_id")
            .eq("auth_id", auth_id)
            .single();

        if (fetchError || !targetUser) {
            return NextResponse.json({ error: "Target identity not found in system." }, { status: 404 });
        }

        // Security Check: Regular admin cannot modify super_admin
        if (targetUser.role === "super_admin" && !ctx.isSuperAdmin) {
            return NextResponse.json({ error: "Access denied. Target identity is protected by super-administrative protocols." }, { status: 403 });
        }

        // 2. Security Check: Admin cannot change their own role (to prevent lock-out)
        if (targetUser.auth_id === ctx.authId && role && role !== targetUser.role) {
            return NextResponse.json({ error: "Self-identity role modification protocols restricted." }, { status: 403 });
        }

        // 3. Security Check: Admin cannot downgrade another Admin to recruiter
        if (targetUser.role === "admin" && role === "recruiter") {
            const hasOtherAdmins = true; // Optimization: In a real system, verify there's at least one other admin before self-downgrade (not applicable here)
            if (targetUser.auth_id !== ctx.authId) {
                return NextResponse.json({ error: "Prohibition: Admin downgrade protocols restricted for other administrative agents." }, { status: 403 });
            }
        }

        let updatePayload: any = {
            user_metadata: {
                name,
                role
            }
        };

        let tempPassword = "";

        // Only generate new credentials if explicitly requested
        if (reset_password) {
            tempPassword = crypto.randomBytes(16).toString('hex');
            updatePayload.password = tempPassword;
            updatePayload.user_metadata.force_password_change = true;
        }

        // 4. Synchronize Auth Identity
        const { error: authError } = await admin.auth.admin.updateUserById(auth_id, updatePayload);
        if (authError) throw authError;

        // 5. Synchronize Public Record
        const { error: dbError } = await admin
            .from("users")
            .update({
                name,
                role,
                updated_at: new Date().toISOString()
            })
            .eq("auth_id", auth_id);

        if (dbError) throw dbError;

        return NextResponse.json({
            success: true,
            credentials: reset_password ? { passphrase: tempPassword } : null
        });

    } catch (err: unknown) {
        console.error("[Users API PATCH]", err);
        return NextResponse.json({ error: err instanceof Error ? err.message : "System instance failure" }, { status: 500 });
    }
}
