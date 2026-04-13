"use client";

import dynamic from "next/dynamic";
import React from "react";

const FamilyTreeNewDynamic = dynamic(
  () => import("@/components/tree/FamilyTreeNew").then((mod) => mod.FamilyTreeNew),
  { ssr: false }
);

interface WrapperProps {
  rootId?: string;
}

export function FamilyTreeWrapper({ rootId }: WrapperProps) {
  return <FamilyTreeNewDynamic rootId={rootId} />;
}
