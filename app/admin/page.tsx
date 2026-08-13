import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { AdminImporter } from "@/components/admin-importer";
import { AdminLogin } from "@/components/admin-login";

export default async function AdminPage() {
  const authenticated = await isAdmin();
  return <main className="admin-page"><Link className="back-link" href="/"><ArrowLeft size={16} /> Public dashboard</Link><div className="admin-shell">
    <div className="admin-intro"><span className="eyebrow dark">Schedule management</span><h1>Administrator</h1><p>Import, review, and publish Deerwood schedules by academic term.</p></div>
    {authenticated ? <AdminImporter /> : <AdminLogin />}
  </div></main>;
}
