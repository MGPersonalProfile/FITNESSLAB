# Project Instructions: CalAI Clone (Modo Guerra)

## Core Architectural Rules
- **Framework:** Next.js 14/15 with App Router.
- **Styling:** Tailwind CSS + Shadcn UI + Framer Motion. 
- **Database & Auth:** Supabase (PostgreSQL).
- **AI Integration:** Gemini 1.5 Flash via Vercel AI SDK for ultra-fast, structured JSON outputs of macros.
- **Format:** Progressive Web App (PWA) using `serwist`. Mobile-first design is mandatory.
- **State Management:** TanStack Query (React Query) for aggressive caching and offline resilience.

## Design System ("Modo Guerra")
- **Vibe:** Highly aggressive, masculine, gym-focused. No pastel colors, no soft rounded corners.
- **Color Palette:** Pure Black/Charcoal (`bg-zinc-950` / `bg-black`) backgrounds. Blood Red/Neon Red (`text-red-600`, `bg-red-600`) for primary actions, buttons, and progress bars.
- **Typography:** Heavy, uppercase, impactful fonts (e.g., Bebas Neue, Anton, or a heavily weighted sans-serif) for all headers and numbers.
- **Micro-interactions:** Sharp, electric animations. Fast transitions. 
- **Copywriting:** Direct, commanding, no-nonsense. (e.g., "REGISTRA EL COMBUSTIBLE", "OBJETIVO", "MACROS").

## Sub-Agent Workflows & Methodologies
- **Mandatory Skills:** All code modifications MUST follow the principles of `writing-plans` and `verification-before-completion`. 
- **No Unverified Code:** Never mark a task as complete without compiling, running linters, or verifying the output.
- **Sub-agent Delegation:** Complex, multi-file features or repetitive setups must be delegated to the `generalist` sub-agent. The orchestrator must not write massive code blocks directly in chat.
- **File Structure:** Maintain strict separation of concerns (e.g., `/components`, `/app`, `/lib`, `/hooks`).

## Development Phases
1. **Scaffolding:** Init Next.js, Tailwind, Shadcn, and PWA config.
2. **Backend Config:** Set up Supabase clients and Gemini AI structured prompts.
3. **UI Implementation:** Build the core screens (Camera/Upload, Dashboard/Macros, History).
4. **Integration:** Connect the UI to the AI and Database.