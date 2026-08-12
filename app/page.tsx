import { getScheduleData } from "@/lib/data";
import { Dashboard } from "@/components/dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  return <Dashboard data={await getScheduleData()} />;
}
