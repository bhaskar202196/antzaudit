// 📄 src/components/zoo/zoo-report-table.tsx

"use client";

import { useState } from "react";
import type { Zoo } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface SiteSummary {
  siteId: string;
  siteName: string;
  enclosureCount: number;
  animalCount: number;
  verifiedCount: number;
  unverifiedCount: number;
}

const getSiteAuditSummary = (zoo: Zoo): SiteSummary[] => {
  return zoo.sites.map((site) => {
    let enclosureCount = 0;
    let animalCount = 0;
    let verifiedCount = 0;

    site.sections.forEach((section) => {
      enclosureCount += section.enclosures.length;
      section.enclosures.forEach((enclosure) => {
        const animals = enclosure.animals;
        animalCount += animals.length;
        verifiedCount += animals.filter((a) => a.verified).length;
      });
    });

    return {
      siteId: site.id,
      siteName: site.name,
      enclosureCount,
      animalCount,
      verifiedCount,
      unverifiedCount: animalCount - verifiedCount,
    };
  });
};

export default function ZooReportTable({ zoo }: { zoo: Zoo }) {
  const summaries = getSiteAuditSummary(zoo);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(summaries.length / pageSize);
  const paginatedData = summaries.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Rows per page:</span>
        <select
          className="border rounded px-2 py-1"
          value={pageSize}
          onChange={(e) => {
            setCurrentPage(1);
            setPageSize(Number(e.target.value));
          }}
        >
          {[20, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SITE</TableHead>
            <TableHead>ENCLOSURES</TableHead>
            <TableHead>ANIMALS</TableHead>
            <TableHead>VERIFIED</TableHead>
            <TableHead>NOT VERIFIED</TableHead>
            <TableHead>TOTAL</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.map((site) => (
            <TableRow key={site.siteId}>
              <TableCell className="font-medium">{site.siteName}</TableCell>
              <TableCell>{site.enclosureCount}</TableCell>
              <TableCell>{site.animalCount}</TableCell>
              <TableCell>{site.verifiedCount}</TableCell>
              <TableCell>{site.unverifiedCount}</TableCell>
              <TableCell>{site.animalCount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-between items-center pt-4">
        <span className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
        <div className="space-x-2">
          <Button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
          >
            Previous
          </Button>
          <Button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            size="sm"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
