"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  FlavorCategory,
  Priority,
  SampleType,
} from "@/generated/prisma/client";
import {
  FLAVOR_CATEGORY_LABELS,
  PRIORITY_CONFIG,
  PRIORITY_LABELS,
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

const flavorCategoryValues = Object.keys(
  FLAVOR_CATEGORY_LABELS,
) as [FlavorCategory, ...FlavorCategory[]];
const sampleTypeValues = Object.keys(
  SAMPLE_TYPE_LABELS,
) as [SampleType, ...SampleType[]];
const priorityValues = Object.keys(
  PRIORITY_CONFIG,
) as [Priority, ...Priority[]];

const requestFormSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  productName: z.string().min(1, "Product name is required"),
  flavorCategory: z.enum(flavorCategoryValues, {
    message: "Flavor category is required",
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
});

type RequestFormValues = z.infer<typeof requestFormSchema>;

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
    },
  });

  const flavorCategory = watch("flavorCategory");
  const sampleType = watch("sampleType");
  const priority = watch("priority");

  const [formError, setFormError] = useState<string | null>(null);

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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {/* Customer Name */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="customerName">Customer Name *</Label>
        <Input
          id="customerName"
          placeholder="Enter customer name"
          aria-invalid={!!errors.customerName}
          {...register("customerName")}
        />
        {errors.customerName && (
          <p className="text-sm text-destructive">
            {errors.customerName.message}
          </p>
        )}
      </div>

      {/* Product Name */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="productName">Product Name *</Label>
        <Input
          id="productName"
          placeholder="Enter product name"
          aria-invalid={!!errors.productName}
          {...register("productName")}
        />
        {errors.productName && (
          <p className="text-sm text-destructive">
            {errors.productName.message}
          </p>
        )}
      </div>

      {/* Flavor Category */}
      <div className="flex flex-col gap-1.5">
        <Label>Flavor Category *</Label>
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
            <SelectValue placeholder="Select flavor category" />
          </SelectTrigger>
          <SelectContent>
            {flavorCategoryValues.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {FLAVOR_CATEGORY_LABELS[cat]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.flavorCategory && (
          <p className="text-sm text-destructive">
            {errors.flavorCategory.message}
          </p>
        )}
      </div>

      {/* Sample Type */}
      <div className="flex flex-col gap-1.5">
        <Label>Sample Type *</Label>
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
        {errors.sampleType && (
          <p className="text-sm text-destructive">
            {errors.sampleType.message}
          </p>
        )}
      </div>

      {/* Quantity */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="quantity">Quantity *</Label>
        <Input
          id="quantity"
          placeholder="e.g. 500g, 2 liters, 10 units"
          aria-invalid={!!errors.quantity}
          {...register("quantity")}
        />
        {errors.quantity && (
          <p className="text-sm text-destructive">
            {errors.quantity.message}
          </p>
        )}
      </div>

      {/* Deadline */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="deadline">Deadline *</Label>
        <Input
          id="deadline"
          type="date"
          aria-invalid={!!errors.deadline}
          {...register("deadline")}
        />
        {errors.deadline && (
          <p className="text-sm text-destructive">
            {errors.deadline.message}
          </p>
        )}
      </div>

      {/* Priority */}
      <div className="flex flex-col gap-1.5">
        <Label>Priority</Label>
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
      </div>

      {/* Special Instructions */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="specialInstructions">Special Instructions</Label>
        <Textarea
          id="specialInstructions"
          placeholder="Any special requirements or notes..."
          {...register("specialInstructions")}
        />
      </div>

      {/* Error */}
      {formError && (
        <p className="text-sm text-destructive">{formError}</p>
      )}

      {/* Submit */}
      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Creating..." : "Create Request"}
      </Button>
    </form>
  );
}
