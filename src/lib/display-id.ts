import { prisma } from "@/lib/db";
import { format } from "date-fns";

export async function generateDisplayId(): Promise<string> {
  const today = new Date();
  const dateStr = format(today, "yyyyMMdd");
  const prefix = `SR-${dateStr}-`;

  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const count = await prisma.sampleRequest.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });

  const sequence = String(count + 1).padStart(3, "0");
  return `${prefix}${sequence}`;
}
