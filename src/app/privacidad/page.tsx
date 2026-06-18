import Link from "next/link";

export const metadata = { title: "Privacidad · FitnessLAB" };

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--fg)] px-5 py-10 max-w-2xl mx-auto">
      <Link href="/" className="font-mono text-[10px] tracking-[0.3em] text-[var(--fg-dim)] hover:text-[var(--accent)]">
        ← VOLVER
      </Link>
      <h1 className="font-display text-3xl tracking-[0.05em] mt-4 mb-6">PRIVACIDAD</h1>
      <div className="flex flex-col gap-4 font-mono text-[12px] leading-relaxed text-[var(--fg-dim)]">
        <p>FitnessLAB es una app personal de seguimiento nutricional. Esto es lo que hacemos con tus datos.</p>

        <Section title="QUÉ GUARDAMOS">
          Tu email y nombre (vía Google o registro), tus registros de comida (macros, fotos, notas),
          tu peso, objetivos y datos de perfil (edad, altura, sexo, actividad). Las fotos de comida se
          almacenan de forma privada y solo tú puedes verlas.
        </Section>

        <Section title="PARA QUÉ">
          Para mostrarte tu progreso, calcular objetivos y, si lo activas, compartir métricas con tus
          amigos dentro de la app. No vendemos tus datos ni los usamos para publicidad.
        </Section>

        <Section title="IA">
          Las fotos que escaneas se envían a Google (Gemini) únicamente para estimar los macros y el
          balance del plato. No se usan para identificarte.
        </Section>

        <Section title="TUS DERECHOS">
          Puedes editar o borrar cualquier registro en cualquier momento. Puedes borrar tu cuenta y
          todos tus datos desde Perfil → Borrar cuenta; la eliminación es permanente.
        </Section>

        <Section title="CONTACTO">
          Dudas sobre privacidad: a través del responsable de la app.
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-mono text-[10px] tracking-[0.3em] text-[var(--fg-faint)] mb-1.5">{title}</h2>
      <p>{children}</p>
    </div>
  );
}
