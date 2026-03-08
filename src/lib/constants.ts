import {
  FlavorCategory,
  FlavorDesignation,
  PhysicalForm,
  Priority,
  QcOutcome,
  QuantityUnit,
  RequestStatus,
  Role,
  SampleType,
  ShipTemp,
  ShippingCarrier,
} from "@/generated/prisma/client";

export const STATUS_CONFIG: Record<RequestStatus, { label: string; color: string; bgClass: string; textClass: string; dotClass: string; icon: string }> = {
  REQUESTED:          { label: "Requested",          color: "blue",    bgClass: "bg-blue-50",     textClass: "text-blue-700",    dotClass: "bg-blue-500",    icon: "inbox" },
  APPROVED:           { label: "Approved",           color: "green",   bgClass: "bg-emerald-50",  textClass: "text-emerald-700", dotClass: "bg-emerald-500", icon: "check-circle" },
  REVISION_REQUESTED: { label: "Revision Requested", color: "amber",   bgClass: "bg-amber-50",    textClass: "text-amber-700",   dotClass: "bg-amber-500",   icon: "edit" },
  PREPARATION:        { label: "Preparation",        color: "purple",  bgClass: "bg-violet-50",   textClass: "text-violet-700",  dotClass: "bg-violet-500",  icon: "flask" },
  QC_CHECK:           { label: "QC Check",           color: "teal",    bgClass: "bg-teal-50",     textClass: "text-teal-700",    dotClass: "bg-teal-500",    icon: "search" },
  QC_FAILED:          { label: "QC Failed",          color: "red",     bgClass: "bg-rose-50",     textClass: "text-rose-700",    dotClass: "bg-rose-500",    icon: "x-circle" },
  PACKING:            { label: "Packing",            color: "indigo",  bgClass: "bg-indigo-50",   textClass: "text-indigo-700",  dotClass: "bg-indigo-500",  icon: "package" },
  SHIPPED:            { label: "Shipped",            color: "emerald", bgClass: "bg-cyan-50",     textClass: "text-cyan-700",    dotClass: "bg-cyan-500",    icon: "truck" },
  COMPLETED:          { label: "Completed",          color: "gray",    bgClass: "bg-stone-100",   textClass: "text-stone-600",   dotClass: "bg-stone-400",   icon: "check" },
  REJECTED:           { label: "Rejected",           color: "red",     bgClass: "bg-red-50",      textClass: "text-red-700",     dotClass: "bg-red-500",     icon: "ban" },
  CANCELLED:          { label: "Cancelled",          color: "gray",    bgClass: "bg-gray-50",     textClass: "text-gray-500",    dotClass: "bg-gray-400",    icon: "slash" },
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

export const PRIORITY_CONFIG: Record<Priority, { label: string; bgClass: string; textClass: string; dotClass: string; borderClass: string }> = {
  LOW:      { label: "Low",      bgClass: "bg-slate-50",   textClass: "text-slate-600",  dotClass: "bg-slate-400",  borderClass: "border-l-slate-300" },
  NORMAL:   { label: "Normal",   bgClass: "bg-gray-50",    textClass: "text-gray-600",   dotClass: "bg-gray-400",   borderClass: "border-l-gray-300" },
  HIGH:     { label: "High",     bgClass: "bg-amber-50",   textClass: "text-amber-700",  dotClass: "bg-amber-500",  borderClass: "border-l-amber-400" },
  URGENT:   { label: "Urgent",   bgClass: "bg-orange-50",  textClass: "text-orange-700", dotClass: "bg-orange-500", borderClass: "border-l-orange-500" },
  CRITICAL: { label: "Critical", bgClass: "bg-red-50",     textClass: "text-red-800",    dotClass: "bg-red-600",    borderClass: "border-l-red-600" },
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW:      "Low",
  NORMAL:   "Normal",
  HIGH:     "High",
  URGENT:   "Urgent",
  CRITICAL: "Critical",
};

export const FLAVOR_CATEGORY_LABELS: Record<FlavorCategory, string> = {
  BEVERAGE:       "Beverage",
  DAIRY:          "Dairy",
  BAKERY:         "Bakery",
  CONFECTIONERY:  "Confectionery",
  SAVOURY:        "Savoury",
  NUTRACEUTICAL:  "Nutraceutical",
  ORAL_CARE:      "Oral Care",
  TOBACCO:        "Tobacco",
  PERSONAL_CARE:  "Personal Care",
  PET_FOOD:       "Pet Food",
  PHARMACEUTICAL: "Pharmaceutical",
  OTHER:          "Other",
};

export const SAMPLE_TYPE_LABELS: Record<SampleType, string> = {
  OFF_SHELF:        "Off-the-shelf",
  NEW_CREATION:     "New Creation",
  MATCHING:         "Matching",
  MODIFICATION:     "Modification",
  GOLD_STANDARD:    "Gold Standard",
  PRODUCTION_TRIAL: "Production Trial",
  COST_REDUCTION:   "Cost Reduction",
  REFORMULATION:    "Reformulation",
};

export const FLAVOR_DESIGNATION_LABELS: Record<FlavorDesignation, string> = {
  NATURAL:          "Natural",
  NATURE_IDENTICAL: "Nature Identical",
  ARTIFICIAL:       "Artificial",
  ORGANIC:          "Organic",
  WONF:             "WONF (With Other Natural Flavors)",
};

export const PHYSICAL_FORM_LABELS: Record<PhysicalForm, string> = {
  LIQUID:        "Liquid",
  POWDER:        "Powder",
  PASTE:         "Paste",
  EMULSION:      "Emulsion",
  SPRAY_DRIED:   "Spray Dried",
  ENCAPSULATED:  "Encapsulated",
  OIL_SOLUBLE:   "Oil Soluble",
  WATER_SOLUBLE: "Water Soluble",
};

export const QC_OUTCOME_LABELS: Record<QcOutcome, string> = {
  PASS:             "Pass",
  FAIL:             "Fail",
  CONDITIONAL_PASS: "Conditional Pass",
};

export const QUANTITY_UNIT_LABELS: Record<QuantityUnit, string> = {
  G:    "g",
  KG:   "kg",
  ML:   "mL",
  L:    "L",
  OZ:   "oz",
  LB:   "lb",
  UNIT: "unit(s)",
};

export const SHIPPING_CARRIER_LABELS: Record<ShippingCarrier, string> = {
  DHL:            "DHL",
  FEDEX:          "FedEx",
  UPS:            "UPS",
  LOCAL_COURIER:  "Local Courier",
  HAND_DELIVERY:  "Hand Delivery",
  OTHER:          "Other",
};

export const SHIP_TEMP_LABELS: Record<ShipTemp, string> = {
  AMBIENT: "Ambient",
  CHILLED: "Chilled (2–8°C)",
  FROZEN:  "Frozen (−18°C)",
};
