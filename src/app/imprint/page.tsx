import { redirect } from "next/navigation";

// Keep old links working without publishing a corporate-information directory.
export default function ImprintPage() {
  redirect("/contact");
}
