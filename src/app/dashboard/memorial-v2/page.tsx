import { Metadata } from "next";
import { getMemorialMembers, getMemorialMemberById } from "@/app/actions/memorial";
import MemorialPageClient from "./MemorialPageClient";
import VirtualAltarClientV2 from "@/components/memorial/VirtualAltarClientV2";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Tường Tưởng Niệm - Gia Phả Ký",
  description: "Không gian tưởng nhớ thiêng liêng các thành viên đã khuất trong dòng họ",
};

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function MemorialPage({ searchParams }: PageProps) {
  const params = await searchParams;

  // If id is provided, render Virtual Altar for that member
  if (params.id) {
    const member = await getMemorialMemberById(params.id);
    if (!member) notFound();
    return <VirtualAltarClientV2 member={member} />;
  }

  // Otherwise render the memorial wall
  const members = await getMemorialMembers();
  return <MemorialPageClient initialMembers={members} />;
}
