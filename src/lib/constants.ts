import { FlavorCategory, Priority, RequestStatus, Role, SampleType } from "@/generated/prisma/client";

export const STATUS_CONFIG: Record<RequestStatus, { label: string; color: string; bgClass: string; textClass: string }> = {
  REQUESTED:          { label: "Requested",          color: "blue",    bgClass: "bg-blue-100",    textClass: "text-blue-800" },
  APPROVED:           { label: "Approved",           color: "green",   bgClass: "bg-green-100",   textClass: "text-green-800" },
  REVISION_REQUESTED: { label: "Revision Requested", color: "amber",   bgClass: "bg-amber-100",   textClass: "text-amber-800" },
  PREPARATION:        { label: "Preparation",        color: "purple",  bgClass: "bg-purple-100",  textClass: "text-purple-800" },
  QC_CHECK:           { label: "QC Check",           color: "teal",    bgClass: "bg-teal-100",    textClass: "text-teal-800" },
  QC_FAILED:          { label: "QC Failed",          color: "red",     bgClass: "bg-red-100",     textClass: "text-red-800" },
  PACKING:            { label: "Packing",            color: "indigo",  bgClass: "bg-indigo-100",  textClass: "text-indigo-800" },
  SHIPPED:            { label: "Shipped",            color: "emerald", bgClass: "bg-emerald-100", textClass: "text-emerald-800" },
  COMPLETED:          { label: "Completed",          color: "gray",    bgClass: "bg-gray-100",    textClass: "text-gray-800" },
  REJECTED:           { label: "Rejected",           color: "red",     bgClass: "bg-red-100",     textClass: "text-red-800" },
};

export const ROLE_LABELS: Record<Role, string> = {
  REQUESTER:  "Requester",
  APPROVER:   "Approver",
  FLAVORIST:  "Flavorist",
  QC_OFFICER: "QC Officer",
  PACKER:     "Packer",
  SHIPPER:    "Shipper",
  ADMIN:      "Admin",
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; bgClass: string; textClass: string }> = {
  NORMAL: { label: "Normal", bgClass: "bg-gray-100",   textClass: "text-gray-700" },
  URGENT: { label: "Urgent", bgClass: "bg-red-100",    textClass: "text-red-700" },
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  NORMAL: "Normal",
  URGENT: "Urgent",
};

export const FLAVOR_CATEGORY_LABELS: Record<FlavorCategory, string> = {
  BEVERAGE:      "Beverage",
  DAIRY:         "Dairy",
  BAKERY:        "Bakery",
  CONFECTIONERY: "Confectionery",
  SAVOURY:       "Savoury",
  OTHER:         "Other",
};

export const SAMPLE_TYPE_LABELS: Record<SampleType, string> = {
  OFF_SHELF:    "Off-the-shelf",
  NEW_CREATION: "New Creation",
};
