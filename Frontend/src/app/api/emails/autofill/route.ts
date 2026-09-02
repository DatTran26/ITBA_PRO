import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { autofillVariables } from "@/lib/email/autofill-variables";
import type { TemplateType } from "@/lib/email/template-variables";

export async function POST(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { type, locale, relatedEntityType, relatedEntityId } = await req.json();
    const vars = await autofillVariables(type as TemplateType, {
        senderAuthId: user.id,
        relatedEntityType,
        relatedEntityId,
        locale: locale ?? "vi",
    });
    return NextResponse.json({ variables: vars });
}
