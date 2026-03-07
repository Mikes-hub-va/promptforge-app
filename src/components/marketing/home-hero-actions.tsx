"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HomeHeroActions() {
  return (
    <>
      <Button asChild>
        <Link href="/workspace" className="inline-flex items-center gap-2">
          Open the workspace <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/account">Open account</Link>
      </Button>
    </>
  );
}
