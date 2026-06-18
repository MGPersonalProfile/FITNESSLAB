import Link from "next/link";

export const metadata = { title: "Términos · FitnessLAB" };

export default function TerminosPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--fg)] px-5 py-10 max-w-2xl mx-auto">
      <Link href="/" className="font-mono text-[10px] tracking-[0.3em] text-[var(--fg-dim)] hover:text-[var(--accent)]">
        ← VOLVER
      </Link>
      <h1 className="font-display text-3xl tracking-[0.05em] mt-4 mb-6">TÉRMINOS</h1>
      <div className="flex flex-col gap-4 font-mono text-[12px] leading-relaxed text-[var(--fg-dim)]">
        <Section title="EL SERVICIO">
          FitnessLAB te ayuda a registrar comidas y estimar macros con IA. Las estimaciones son
          aproximadas y no sustituyen el consejo de un profesional de la salud o nutrición.
        </Section>

        <Section title="USO RESPONSABLE">
          Usa la app para ti. No subas contenido ilegal ni de terceros sin permiso. El abuso del
          análisis por IA está limitado por una cuota diaria por usuario.
        </Section>

        <Section title="SIN GARANTÍAS">
          El servicio se ofrece &quot;tal cual&quot;. No garantizamos exactitud de los macros ni
          disponibilidad continua. No somos responsables de decisiones tomadas en base a los datos.
        </Section>

        <Section title="TU CUENTA">
          Eres responsable de tu cuenta. Puedes borrarla en cualquier momento desde Perfil; al hacerlo
          se eliminan tus datos de forma permanente.
        </Section>

        <Section title="CAMBIOS">
          Podemos actualizar estos términos a medida que la app evoluciona. El uso continuado implica
          aceptación de la versión vigente.
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
