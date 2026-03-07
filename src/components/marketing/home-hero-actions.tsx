"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/client";

export function HomeHeroActions() {
  const { user } = useAuth();

  return (
    <>
      <Button asChild>
        <Link href="/workspace" className="inline-flex items-center gap-2">
          Open the workspace <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/account">{user ? "Go to account" : "Open account"}</Link>
      </Button>
    </>
  );
}
