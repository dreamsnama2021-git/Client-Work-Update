import { Settings } from "lucide-react";

import { PlaceholderPage } from "@/components/admin/placeholder-page";

export default function SettingsPage() {
  return (
    <PlaceholderPage
      icon={Settings}
      title="Settings"
      description="Manage your profile, workspace, and account preferences."
      phase="a future phase"
    />
  );
}
