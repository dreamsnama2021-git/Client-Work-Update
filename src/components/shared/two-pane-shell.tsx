"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

interface TwoPaneShellProps {
  basePath: string;
  listPane: React.ReactNode;
  children: React.ReactNode;
}

/**
 * List/detail layout shared by the messages and files sections. Below `md`
 * only one pane is visible at a time (driven by whether an item is
 * selected in the URL), since both panes side by side don't fit on a phone.
 */
export function TwoPaneShell({ basePath, listPane, children }: TwoPaneShellProps) {
  const pathname = usePathname();
  const isIndex = pathname === basePath;

  return (
    <>
      <div
        className={cn(
          "w-full shrink-0 flex-col md:flex md:w-full md:max-w-xs md:border-r md:border-border",
          isIndex ? "flex" : "hidden",
        )}
      >
        {listPane}
      </div>
      <div
        className={cn(
          "min-w-0 w-full flex-1 flex-col md:flex",
          isIndex ? "hidden" : "flex",
        )}
      >
        {!isIndex && (
          <Link
            href={basePath}
            className="flex items-center gap-1.5 border-b border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground md:hidden"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
        )}
        {children}
      </div>
    </>
  );
}
