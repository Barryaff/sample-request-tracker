"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  FlavorCategory,
  FlavorDesignation,
  PhysicalForm,
  Priority,
  QuantityUnit,
  SampleType,
} from "@/generated/prisma/client";
import {
  FLAVOR_CATEGORY_LABELS,
  FLAVOR_DESIGNATION_LABELS,
  PHYSICAL_FORM_LABELS,
  PRIORITY_CONFIG,
  PRIORITY_LABELS,
  QUANTITY_UNIT_LABELS,
  SAMPLE_TYPE_LABELS,
} from "@/lib/constants";
import { createRequest } from "@/app/actions/request-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ChevronDown, ChevronUp, Send } from "lucide-react";

const flavorCategoryValues = Object.keys(
  FLAVOR_CATEGORY_LABELS,
) as [FlavorCategory, ...FlavorCategory[]];
const sampleTypeValues = Object.keys(
  SAMPLE_TYPE_LABELS,
) as [SampleType, ...SampleType[]];
const priorityValues = Object.keys(
  PRIORITY_CONFIG,
) as [Priority, ...Priority[]];
const flavorDesignationValues = Object.keys(
  FLAVOR_DESIGNATION_LABELS,
) as [FlavorDesignation, ...FlavorDesignation[]];
const physicalFormValues = Object.keys(
  PHYSICAL_FORM_LABELS,
) as [PhysicalForm, ...PhysicalForm[]];
const quantityUnitValues = Object.keys(
  QUANTITY_UNIT_LABELS,
) as [QuantityUnit, ...QuantityUnit[]];

const requestFormSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  productName: z.string().min(1, "Product name is required"),
  flavorCategory: z.enum(flavorCategoryValues, {
    message: "Application category is required",
  }),
  sampleType: z.enum(sampleTypeValues, {
    message: "Sample type is required",
  }),
  quantity: z.string().min(1, "Quantity is required"),
  deadline: z.string().min(1, "Deadline is required").refine(
    (val) => {
      const date = new Date(val);
      return date > new Date();
    },
    { message: "Deadline must be in the future" },
  ),
  priority: z.enum(priorityValues),
  specialInstructions: z.string().optional(),
  flavorDesignation: z.enum(flavorDesignationValues).optional(),
  physicalForm: z.enum(physicalFormValues).optional(),
  quantityValue: z.string().optional(),
  quantityUnit: z.enum(quantityUnitValues).optional(),
  targetProfile: z.string().optional(),
  referenceProduct: z.string().optional(),
  regulatoryRequirements: z.string().optional(),
  allergenInfo: z.string().optional(),
  shelfLife: z.string().optional(),
  storageConditions: z.string().optional(),
});

type RequestFormValues = z.infer<typeof requestFormSchema>;

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-[11px] font-semibold tracking-widest text-muted-foreground/70 uppercase">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[13px]">
        {label}
        {required && <span className="ml-0.5 text-primary">*</span>}
      </Label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertTriangle className="size-3" />
          {error}
        </p>
      )}
    </div>
  );
}

export function RequestForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      customerName: "",
      productName: "",
      quantity: "",
      deadline: "",
      priority: "NORMAL",
      specialInstructions: "",
      targetProfile: "",
      referenceProduct: "",
      regulatoryRequirements: "",
      allergenInfo: "",
      shelfLife: "",
      storageConditions: "",
      quantityValue: "",
    },
  });

  const flavorCategory = watch("flavorCategory");
  const sampleType = watch("sampleType");
  const priority = watch("priority");
  const flavorDesignation = watch("flavorDesignation");
  const physicalForm = watch("physicalForm");
  const quantityUnit = watch("quantityUnit");

  const [formError, setFormError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  function onSubmit(data: RequestFormValues) {
    setFormError(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("customerName", data.customerName);
        formData.set("productName", data.productName);
        formData.set("flavorCategory", data.flavorCategory);
        formData.set("sampleType", data.sampleType);
        formData.set("quantity", data.quantity);
        formData.set("deadline", new Date(data.deadline).toISOString());
        formData.set("priority", data.priority);
        if (data.specialInstructions) {
          formData.set("specialInstructions", data.specialInstructions);
        }
        if (data.flavorDesignation) formData.set("flavorDesignation", data.flavorDesignation);
        if (data.physicalForm) formData.set("physicalForm", data.physicalForm);
        if (data.quantityValue) formData.set("quantityValue", data.quantityValue);
        if (data.quantityUnit) formData.set("quantityUnit", data.quantityUnit);
        if (data.targetProfile) formData.set("targetProfile", data.targetProfile);
        if (data.referenceProduct) formData.set("referenceProduct", data.referenceProduct);
        if (data.regulatoryRequirements) formData.set("regulatoryRequirements", data.regulatoryRequirements);
        if (data.allergenInfo) formData.set("allergenInfo", data.allergenInfo);
        if (data.shelfLife) formData.set("shelfLife", data.shelfLife);
        if (data.storageConditions) formData.set("storageConditions", data.storageConditions);

        const result = await createRequest(formData);

        if (!result.success) {
          setFormError(result.error);
          return;
        }

        router.push(`/requests/${result.requestId}`);
      } catch {
        setFormError("Failed to create request");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex max-w-3xl flex-col gap-8"
    >
      {/* Customer & Product */}
      <FormSection title="Product Information">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Customer Name"
            required
            error={errors.customerName?.message}
          >
            <Input
              placeholder="Enter customer name"
              aria-invalid={!!errors.customerName}
              {...register("customerName")}
            />
          </FormField>
          <FormField
            label="Product / Flavor Name"
            required
            error={errors.productName?.message}
          >
            <Input
              placeholder="e.g. Strawberry Milkshake Type 2B"
              aria-invalid={!!errors.productName}
              {...register("productName")}
            />
          </FormField>
        </div>
      </FormSection>

      {/* Classification */}
      <FormSection title="Classification">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Application Category"
            required
            error={errors.flavorCategory?.message}
          >
            <Select
              value={flavorCategory}
              items={FLAVOR_CATEGORY_LABELS}
              onValueChange={(val) =>
                setValue("flavorCategory", val as FlavorCategory, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger
                className="w-full"
                aria-invalid={!!errors.flavorCategory}
              >
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {flavorCategoryValues.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {FLAVOR_CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            label="Sample Type"
            required
            error={errors.sampleType?.message}
          >
            <Select
              value={sampleType}
              items={SAMPLE_TYPE_LABELS}
              onValueChange={(val) =>
                setValue("sampleType", val as SampleType, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger
                className="w-full"
                aria-invalid={!!errors.sampleType}
              >
                <SelectValue placeholder="Select sample type" />
              </SelectTrigger>
              <SelectContent>
                {sampleTypeValues.map((type) => (
                  <SelectItem key={type} value={type}>
                    {SAMPLE_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Flavor Designation">
            <Select
              value={flavorDesignation ?? ""}
              items={FLAVOR_DESIGNATION_LABELS}
              onValueChange={(val) =>
                setValue("flavorDesignation", val as FlavorDesignation, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select designation" />
              </SelectTrigger>
              <SelectContent>
                {flavorDesignationValues.map((d) => (
                  <SelectItem key={d} value={d}>
                    {FLAVOR_DESIGNATION_LABELS[d]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Physical Form">
            <Select
              value={physicalForm ?? ""}
              items={PHYSICAL_FORM_LABELS}
              onValueChange={(val) =>
                setValue("physicalForm", val as PhysicalForm, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select form" />
              </SelectTrigger>
              <SelectContent>
                {physicalFormValues.map((f) => (
                  <SelectItem key={f} value={f}>
                    {PHYSICAL_FORM_LABELS[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>
      </FormSection>

      {/* Quantity & Scheduling */}
      <FormSection title="Quantity & Scheduling">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField
            label="Quantity (text)"
            required
            error={errors.quantity?.message}
          >
            <Input
              placeholder="e.g. 500g, 2 liters"
              aria-invalid={!!errors.quantity}
              {...register("quantity")}
            />
          </FormField>
          <FormField label="Qty Value">
            <Input
              type="number"
              step="any"
              placeholder="e.g. 500"
              {...register("quantityValue")}
            />
          </FormField>
          <FormField label="Qty Unit">
            <Select
              value={quantityUnit ?? ""}
              items={QUANTITY_UNIT_LABELS}
              onValueChange={(val) =>
                setValue("quantityUnit", val as QuantityUnit, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                {quantityUnitValues.map((u) => (
                  <SelectItem key={u} value={u}>
                    {QUANTITY_UNIT_LABELS[u]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Deadline"
            required
            error={errors.deadline?.message}
          >
            <Input
              type="date"
              aria-invalid={!!errors.deadline}
              {...register("deadline")}
            />
          </FormField>
          <FormField label="Priority">
            <Select
              value={priority}
              items={PRIORITY_LABELS}
              onValueChange={(val) =>
                setValue("priority", val as Priority, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {priorityValues.map((p) => (
                  <SelectItem key={p} value={p}>
                    {PRIORITY_CONFIG[p].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>
      </FormSection>

      {/* Profile & Notes */}
      <FormSection title="Profile & Notes">
        <FormField label="Target Flavor Profile">
          <Textarea
            placeholder="Describe the desired flavor profile..."
            className="min-h-20"
            {...register("targetProfile")}
          />
        </FormField>
        <FormField label="Special Instructions">
          <Textarea
            placeholder="Any special requirements or notes..."
            className="min-h-20"
            {...register("specialInstructions")}
          />
        </FormField>
      </FormSection>

      {/* Advanced Fields Toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="group flex items-center gap-2 self-start rounded-lg px-3 py-2 text-[13px] font-medium text-primary transition-colors hover:bg-primary/5"
      >
        {showAdvanced ? (
          <ChevronUp className="size-4 transition-transform" />
        ) : (
          <ChevronDown className="size-4 transition-transform" />
        )}
        {showAdvanced ? "Hide" : "Show"} additional details
      </button>

      {showAdvanced && (
        <div className="animate-slide-up">
          <FormSection title="Additional Details">
            <div className="rounded-xl border border-border bg-muted/20 p-5">
              <div className="space-y-4">
                <FormField label="Reference Product">
                  <Input
                    placeholder="Competitor or reference product for matching"
                    {...register("referenceProduct")}
                  />
                </FormField>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label="Regulatory Requirements">
                    <Input
                      placeholder="Halal, Kosher, EU compliant, etc."
                      {...register("regulatoryRequirements")}
                    />
                  </FormField>
                  <FormField label="Allergen Info">
                    <Input
                      placeholder="e.g. Nut-free, Gluten-free"
                      {...register("allergenInfo")}
                    />
                  </FormField>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label="Shelf Life Requirement">
                    <Input
                      placeholder="e.g. 12 months"
                      {...register("shelfLife")}
                    />
                  </FormField>
                  <FormField label="Storage Conditions">
                    <Input
                      placeholder="e.g. Cool & dry, 15-25°C"
                      {...register("storageConditions")}
                    />
                  </FormField>
                </div>
              </div>
            </div>
          </FormSection>
        </div>
      )}

      {/* Error */}
      {formError && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          {formError}
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center gap-4 border-t pt-6">
        <Button
          type="submit"
          disabled={isPending}
          size="lg"
          className="gap-2 shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30"
        >
          <Send className="size-4" />
          {isPending ? "Creating..." : "Create Request"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Fields marked with <span className="text-primary">*</span> are required
        </p>
      </div>
    </form>
  );
}
