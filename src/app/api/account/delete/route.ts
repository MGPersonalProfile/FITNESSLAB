import { getUserFromRequest, supabaseAdmin } from "@/shared/lib/supabaseServer";

// Permanently delete the authenticated user's account and all their data.
export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }
  const uid = user.id;

  try {
    // 1. Remove their food photos from storage.
    const { data: files } = await supabaseAdmin.storage.from("food-photos").list(uid);
    if (files?.length) {
      await supabaseAdmin.storage
        .from("food-photos")
        .remove(files.map((f) => `${uid}/${f.name}`));
    }

    // 2. Delete owned rows (FKs reference auth.users without cascade).
    for (const table of ["weight_logs", "ai_usage", "saved_meals", "food_logs", "profiles"]) {
      await supabaseAdmin.from(table).delete().eq(table === "profiles" ? "id" : "user_id", uid);
    }

    // 3. Delete the auth user.
    const { error } = await supabaseAdmin.auth.admin.deleteUser(uid);
    if (error) throw error;

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Account delete error:", err);
    return Response.json({ error: "No se pudo borrar la cuenta." }, { status: 500 });
  }
}
