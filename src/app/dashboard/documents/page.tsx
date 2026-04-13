import React from "react";
import { DocumentsPageClient } from "./DocumentsPageClient";
import { getDocuments } from "@/app/actions/documents";

export const metadata = {
  title: "Tài Liệu Số | Gia Phả Ký",
  description: "Quản lý di sản văn hóa và tài liệu số của dòng họ",
};

export default async function DocumentsPage() {
  // Fetch documents from the server
  const documents = await getDocuments();

  return (
    <DocumentsPageClient 
      initialDocuments={JSON.parse(JSON.stringify(documents))} 
    />
  );
}
