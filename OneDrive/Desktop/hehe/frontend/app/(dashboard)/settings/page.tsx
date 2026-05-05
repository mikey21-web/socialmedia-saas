import Link from "next/link";
import { ArrowRight, CreditCard, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

const sections = [
  {
    href: "/settings/billing",
    title: "Billing",
    description: "View plans, pricing and subscription status.",
    icon: CreditCard,
  },
  {
    href: "/settings/team",
    title: "Team",
    description: "Manage team members and invitations.",
    icon: Users,
  },
];

export default function SettingsIndexPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a section to manage your workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {sections.map(({ href, title, description, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="p-5 h-full hover:border-ring transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-muted-foreground" />
                    <p className="text-sm font-semibold">{title}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
