import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { payments } from "../db/schema";

type MercadoPagoEnv={DB:D1Database;MP_ACCESS_TOKEN?:string;MP_WEBHOOK_SECRET?:string};
type MercadoPagoPayment={id:number|string;status:string;external_reference?:string;transaction_amount?:number;currency_id?:string;date_approved?:string};
export const PLAN_AMOUNT_CENTS=12_000;
export const PLAN_ACCESS_DAYS=30;
export const mpSecrets=()=>env as unknown as MercadoPagoEnv;

const hex=async(value:string,key:string)=>{const cryptoKey=await crypto.subtle.importKey("raw",new TextEncoder().encode(key),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const signed=await crypto.subtle.sign("HMAC",cryptoKey,new TextEncoder().encode(value));return [...new Uint8Array(signed)].map(byte=>byte.toString(16).padStart(2,"0")).join("")};
export async function validWebhookSignature(request:Request,dataId:string){const secret=mpSecrets().MP_WEBHOOK_SECRET;if(!secret)return true;const signature=request.headers.get("x-signature")||"",requestId=request.headers.get("x-request-id")||"",parts=Object.fromEntries(signature.split(",").map(part=>part.trim().split("=")));if(!parts.ts||!parts.v1||!requestId)return false;const expected=await hex(`id:${dataId};request-id:${requestId};ts:${parts.ts};`,secret);if(expected.length!==parts.v1.length)return false;let difference=0;for(let i=0;i<expected.length;i++)difference|=expected.charCodeAt(i)^parts.v1.charCodeAt(i);return difference===0}

export async function syncMercadoPagoPayment(paymentId:string){
 const token=mpSecrets().MP_ACCESS_TOKEN;if(!token)throw new Error("Mercado Pago ainda não configurado.");
 const response=await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,{headers:{Authorization:`Bearer ${token}`}});if(!response.ok)throw new Error("Pagamento não encontrado no Mercado Pago.");
 const remote=await response.json() as MercadoPagoPayment;const reference=String(remote.external_reference||"");if(!reference)throw new Error("Pagamento sem referência.");
 const db=getDb();const[local]=await db.select().from(payments).where(eq(payments.externalReference,reference)).limit(1);if(!local)throw new Error("Pagamento não pertence à plataforma.");
 const amountCents=Math.round(Number(remote.transaction_amount||0)*100);if(amountCents!==local.amountCents||remote.currency_id!==local.currency)throw new Error("O valor do pagamento não confere.");
 const normalized=remote.status==="approved"?"approved":remote.status||"pending";
 if(normalized==="approved"){
  await db.update(payments).set({status:"approved",providerPaymentId:String(remote.id),approvedAt:remote.date_approved||local.approvedAt||new Date().toISOString(),updatedAt:new Date().toISOString()}).where(eq(payments.id,local.id));
  const runtime=mpSecrets();
  await runtime.DB.batch([
   runtime.DB.prepare("UPDATE users SET subscription_status = 'active', subscription_expires_at = datetime(MAX(unixepoch('now'), COALESCE(unixepoch(subscription_expires_at), 0)) + ?, 'unixepoch'), total_paid_cents = total_paid_cents + ? WHERE id = ? AND EXISTS (SELECT 1 FROM payments WHERE id = ? AND access_granted_at IS NULL)").bind(PLAN_ACCESS_DAYS*86_400,local.amountCents,local.userId,local.id),
   runtime.DB.prepare("UPDATE payments SET access_granted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND access_granted_at IS NULL").bind(local.id),
  ]);
 }else if(local.status!=="approved")await db.update(payments).set({status:normalized,providerPaymentId:String(remote.id),updatedAt:new Date().toISOString()}).where(eq(payments.id,local.id));
 return{status:normalized,userId:local.userId};
}
