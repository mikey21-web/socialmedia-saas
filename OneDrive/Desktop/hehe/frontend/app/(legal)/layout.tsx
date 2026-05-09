import { LegalFooter } from "@/components/legal-footer";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-16">{children}</div>
      <LegalFooter />
    </div>
  );
}
