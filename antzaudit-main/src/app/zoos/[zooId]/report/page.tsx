// 📄 src/app/zoos/[zooId]/report/page.tsx

"use client";

import { use, useEffect, useState, useCallback } from "react";
import type { Enclosure, Zoo } from "@/lib/types";
import {
  useBreadcrumbs,
  type BreadcrumbItem,
} from "@/contexts/breadcrumb-context";
import { useZooData } from "@/contexts/zoo-data-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  AlertTriangle,
  ListChecks,
  Building,
  Layers3,
  Fence,
  Maximize,
  Minimize,
} from "lucide-react";
import ZooReportTable from "@/components/zoo/zoo-report-table";

interface ZooReportPageProps {
  params: Promise<{ zooId: string }>;
}

const getEnclosureAuditStatus = (enclosure: Enclosure) => {
  const totalAnimals = enclosure.animals.length;
  const verifiedAnimals = enclosure.animals.filter((a) => a.verified).length;
  const progress =
    totalAnimals > 0 ? (verifiedAnimals / totalAnimals) * 100 : 0;
  return { totalAnimals, verifiedAnimals, progress };
};

export default function ZooReportPage({
  params: paramsPromise,
}: ZooReportPageProps) {
  const params = use(paramsPromise);
  const { zooId } = params;

  const { getZooById: getZooByIdFromContext, isLoading: isZooDataLoading } =
    useZooData();
  const [zoo, setZoo] = useState<Zoo | null | undefined>(null);
  const { setBreadcrumbs } = useBreadcrumbs();

  const [viewMode, setViewMode] = useState<"detailed" | "table">("detailed");
  const [openSiteItemValues, setOpenSiteItemValues] = useState<string[]>([]);
  const [openSectionItemValuesBySite, setOpenSectionItemValuesBySite] =
    useState<Record<string, string[]>>({});

  useEffect(() => {
    const currentZoo = getZooByIdFromContext(zooId);
    setZoo(currentZoo);

    if (currentZoo) {
      const breadcrumbsData: BreadcrumbItem[] = [
        { label: currentZoo.name, href: `/zoos/${zooId}/sites` },
        { label: "Audit Report", href: `/zoos/${zooId}/report` },
      ];
      setBreadcrumbs(breadcrumbsData);

      const initialSiteValues = currentZoo.sites.map(
        (site) => `site-${site.id}`
      );
      setOpenSiteItemValues(initialSiteValues);

      const initialSectionValues: Record<string, string[]> = {};
      currentZoo.sites.forEach((site) => {
        initialSectionValues[`site-${site.id}`] = site.sections.map(
          (section) => `section-${section.id}`
        );
      });
      setOpenSectionItemValuesBySite(initialSectionValues);
    } else if (!isZooDataLoading) {
      setZoo(undefined);
      setBreadcrumbs([
        { label: "Zoo Not Found", href: "/dashboard" },
        { label: "Audit Report", href: "/dashboard" },
      ]);
    }
  }, [zooId, getZooByIdFromContext, setBreadcrumbs, isZooDataLoading]);

  const handleExpandAll = useCallback(() => {
    if (!zoo) return;
    const allSiteValues = zoo.sites.map((site) => `site-${site.id}`);
    const allSectionValues: Record<string, string[]> = {};
    zoo.sites.forEach((site) => {
      allSectionValues[`site-${site.id}`] = site.sections.map(
        (section) => `section-${section.id}`
      );
    });
    setOpenSiteItemValues(allSiteValues);
    setOpenSectionItemValuesBySite(allSectionValues);
  }, [zoo]);

  const handleCollapseAll = useCallback(() => {
    setOpenSiteItemValues([]);
    setOpenSectionItemValuesBySite({});
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button
          onClick={() =>
            setViewMode(viewMode === "detailed" ? "table" : "detailed")
          }
        >
          Switch to {viewMode === "detailed" ? "Table" : "Detailed"} View
        </Button>
        {viewMode === "detailed" && (
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={handleExpandAll}>
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={handleCollapseAll}>
              Collapse All
            </Button>
          </div>
        )}
      </div>

      {zoo ? (
        viewMode === "detailed" ? (
          <Accordion
            type="multiple"
            value={openSiteItemValues}
            onValueChange={setOpenSiteItemValues}
          >
            {zoo.sites.map((site) => (
              <AccordionItem key={site.id} value={`site-${site.id}`}>
                <AccordionTrigger>{site.name}</AccordionTrigger>
                <AccordionContent>
                  <Accordion
                    type="multiple"
                    value={openSectionItemValuesBySite[`site-${site.id}`] || []}
                    onValueChange={(vals) =>
                      setOpenSectionItemValuesBySite((prev) => ({
                        ...prev,
                        [`site-${site.id}`]: vals,
                      }))
                    }
                  >
                    {site.sections.map((section) => (
                      <AccordionItem
                        key={section.id}
                        value={`section-${section.id}`}
                      >
                        <AccordionTrigger>{section.name}</AccordionTrigger>
                        <AccordionContent>
                          {section.enclosures.map((enclosure) => {
                            const { totalAnimals, verifiedAnimals } =
                              getEnclosureAuditStatus(enclosure);
                            return (
                              <div key={enclosure.id} className="py-1 text-sm">
                                <strong>{enclosure.name}:</strong>{" "}
                                {verifiedAnimals}/{totalAnimals} verified
                              </div>
                            );
                          })}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <ZooReportTable zoo={zoo} />
        )
      ) : (
        <Skeleton className="w-full h-64" />
      )}
    </div>
  );
}
