import { AyniLogo } from "@/components/ayni-logo";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <AyniLogo className="h-20 w-auto" />
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">Ayni</h1>
        <p className="text-muted-foreground">Hoy por ti, mañana por mí</p>
      </div>
      <Button>Empezar</Button>
    </main>
  );
}
