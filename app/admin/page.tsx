import AdminExperience from "./admin-experience";

export const metadata = {
  title: "Admin · YAT.lifestyle",
  description: "Private YAT.lifestyle order and voucher management.",
  robots: { index: false, follow: false },
};

export default function AdminPage() { return <AdminExperience />; }
