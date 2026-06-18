import { supabaseAdmin } from "@/shared/lib/supabaseServer";
import { sendPushToUser } from "@/shared/lib/webpush";

// Weekly summary push. Triggered by Vercel Cron (see vercel.json).
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const since = new Date(Date.now() - 6 * 86_400_000).toISOString().slice(0, 10);

  // Only users with at least one push subscription.
  const { data: subRows } = await supabaseAdmin.from("push_subscriptions").select("user_id");
  const userIds = [...new Set(((subRows as { user_id: string }[]) ?? []).map((r) => r.user_id))];

  let sent = 0;
  await Promise.all(
    userIds.map(async (uid) => {
      const [{ data: logs }, { data: workouts }] = await Promise.all([
        supabaseAdmin.from("food_logs").select("plate_score").eq("user_id", uid).gte("log_date", since),
        supabaseAdmin.from("workout_logs").select("minutes").eq("user_id", uid).gte("log_date", since),
      ]);

      const entries = logs?.length ?? 0;
      if (entries === 0 && (workouts?.length ?? 0) === 0) return; // skip inactive

      const plated = (logs as { plate_score: number | null }[]).filter((l) => l.plate_score != null);
      const avgPlate = plated.length
        ? Math.round(plated.reduce((s, l) => s + (l.plate_score ?? 0), 0) / plated.length)
        : 0;
      const gym = ((workouts as { minutes: number }[]) ?? []).reduce((s, w) => s + w.minutes, 0);

      const parts = [`${entries} registros`];
      if (avgPlate) parts.push(`plato ${avgPlate}`);
      if (gym) parts.push(`${gym} min gym`);

      sent += await sendPushToUser(uid, {
        title: "Resumen semanal · FitnessLAB",
        body: `Esta semana: ${parts.join(" · ")}. ¡Sigue así!`,
        url: "/",
      });
    }),
  );

  return Response.json({ ok: true, users: userIds.length, sent });
}
