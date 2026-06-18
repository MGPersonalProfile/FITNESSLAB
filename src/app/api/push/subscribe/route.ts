import { getUserFromRequest, supabaseAdmin } from "@/shared/lib/supabaseServer";

// Store (or refresh) the caller's Web Push subscription.
export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

  const { subscription } = await req.json();
  if (!subscription?.endpoint) {
    return Response.json({ error: "Suscripción inválida" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      subscription,
    },
    { onConflict: "endpoint" },
  );
  if (error) {
    console.error("push subscribe error:", error);
    return Response.json({ error: "No se pudo guardar" }, { status: 500 });
  }
  return Response.json({ ok: true });
}
