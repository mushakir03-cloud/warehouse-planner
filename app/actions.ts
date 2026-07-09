"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession, destroySession, requireUser } from "@/lib/auth";
import { ROLES, STATUSES } from "@/lib/constants";

export async function login(formData: FormData) {
  // "email" is the underlying db column, but staff log in with a short username now.
  const username = String(formData.get("username") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const user = await prisma.user.findUnique({ where: { email: username } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    redirect("/login?error=1");
  }
  await createSession(user.id);
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

function readLpoFields(formData: FormData) {
  const qty = Math.floor(Number(formData.get("totalQuantity") || 0));
  return {
    billNumber: String(formData.get("billNumber") || "").trim(),
    customerName: String(formData.get("customerName") || "").trim(),
    deliveryLocation: String(formData.get("deliveryLocation") || "").trim(),
    deliveryDate: String(formData.get("deliveryDate") || ""),
    totalQuantity: Number.isFinite(qty) && qty > 0 ? qty : 0,
    notes: String(formData.get("notes") || "").trim(),
  };
}

export type FormState = { error?: string } | null;

function validateLpo(fields: ReturnType<typeof readLpoFields>): string | null {
  if (!fields.billNumber || !fields.customerName || !fields.deliveryLocation || !fields.deliveryDate) {
    return "Invoice Number, Customer Name, Delivery Location and Delivery Date are required";
  }
  if (fields.totalQuantity <= 0) {
    return "Total Quantity is required";
  }
  return null;
}

// True if another invoice already uses this invoice number (case-insensitive).
async function invoiceNumberTaken(billNumber: string, exceptId?: number) {
  const dup = await prisma.lpo.findFirst({
    where: {
      billNumber: { equals: billNumber, mode: "insensitive" },
      ...(exceptId ? { NOT: { id: exceptId } } : {}),
    },
    select: { id: true },
  });
  return Boolean(dup);
}

export async function createLpo(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (user.role !== ROLES.ADMIN && user.role !== ROLES.SALESMAN) {
    return { error: "Not allowed: only Admin or Salesman can create invoices" };
  }
  const fields = readLpoFields(formData);
  const err = validateLpo(fields);
  if (err) return { error: err };
  if (await invoiceNumberTaken(fields.billNumber)) {
    return { error: `Invoice number "${fields.billNumber}" already exists — please use a different number.` };
  }

  await prisma.lpo.create({
    data: { ...fields, status: "Pending", createdById: user.id },
  });
  revalidatePath("/", "layout");
  // Go straight back to a list with a "saved" confirmation — no edit page.
  // Salesmen land on the Deliveries schedule; admin on the Invoices list.
  redirect(user.role === ROLES.ADMIN ? "/lpos?saved=1" : "/deliveries?saved=1");
}

export async function updateLpo(lpoId: number, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const lpo = await prisma.lpo.findUnique({ where: { id: lpoId } });
  if (!lpo) return { error: "Invoice not found" };
  const canEdit =
    user.role === ROLES.ADMIN ||
    (user.role === ROLES.SALESMAN && lpo.createdById === user.id);
  if (!canEdit) return { error: "You can only edit invoices you created" };

  const fields = readLpoFields(formData);
  const err = validateLpo(fields);
  if (err) return { error: err };
  if (await invoiceNumberTaken(fields.billNumber, lpoId)) {
    return { error: `Invoice number "${fields.billNumber}" already exists on another invoice.` };
  }

  await prisma.lpo.update({ where: { id: lpoId }, data: fields });
  revalidatePath(`/lpos/${lpoId}`);
  revalidatePath("/");
  redirect(`/lpos/${lpoId}`);
}

export async function deleteLpo(lpoId: number, redirectTo?: string) {
  const user = await requireUser();
  if (user.role !== ROLES.ADMIN) {
    throw new Error("Not allowed: only Admin can delete invoices");
  }
  const lpo = await prisma.lpo.findUnique({ where: { id: lpoId } });
  if (!lpo) throw new Error("Invoice not found");
  // activity logs are removed automatically (onDelete: Cascade)
  await prisma.lpo.delete({ where: { id: lpoId } });
  revalidatePath("/", "layout");
  // From a list row we stay on the page; from the detail page we must leave it
  if (redirectTo) redirect(redirectTo);
}

export async function updateLpoStatus(lpoId: number, formData: FormData) {
  const user = await requireUser();
  if (user.role !== ROLES.WAREHOUSE_KEEPER && user.role !== ROLES.ADMIN) {
    throw new Error("Not allowed");
  }
  const lpo = await prisma.lpo.findUnique({ where: { id: lpoId } });
  if (!lpo) throw new Error("Invoice not found");

  const newStatus = String(formData.get("status") || "");
  if (!(STATUSES as readonly string[]).includes(newStatus)) {
    throw new Error("Invalid status");
  }
  const logNote = String(formData.get("logNote") || "").trim();

  const data: Record<string, unknown> = { status: newStatus };
  let note = logNote;

  // Marking Delivered requires the delivery confirmation details
  if (newStatus === "Delivered") {
    const doNumber = String(formData.get("doNumber") || "").trim();
    const deliveredBags = Math.max(0, Math.floor(Number(formData.get("deliveredBags") || 0)));
    const deliveredCartons = Math.max(0, Math.floor(Number(formData.get("deliveredCartons") || 0)));
    if (!doNumber) throw new Error("DO number is required to confirm delivery");
    Object.assign(data, { doNumber, deliveredBags, deliveredCartons });
    const summary = `DO ${doNumber} · 🛍️ ${deliveredBags} bags · 📦 ${deliveredCartons} cartons`;
    note = logNote ? `${summary} — ${logNote}` : summary;
  }

  if (newStatus !== lpo.status) {
    await prisma.$transaction([
      prisma.lpo.update({ where: { id: lpoId }, data }),
      prisma.activityLog.create({
        data: {
          lpoId,
          changedById: user.id,
          oldStatus: lpo.status,
          newStatus,
          notes: note,
        },
      }),
    ]);
  }
  // No redirect: the page the user is on (list row dropdown or the LPO's
  // Change Status box) simply refreshes with the new status.
  revalidatePath("/", "layout");
}
