import { JobStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { jobStatusLabels, jobStatusTone } from "@/lib/constants";

export const JobStatusBadge = ({ status }: { status: JobStatus }) => (
  <Badge className={jobStatusTone[status]} variant="secondary">
    {jobStatusLabels[status]}
  </Badge>
);
