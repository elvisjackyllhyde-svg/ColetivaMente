import { env } from "cloudflare:workers";
import { and, eq, ne, sql } from "drizzle-orm";
import { getDb } from "../db";
import { payments, users } from "../db/schema";

type MercadoPagoEnv={MP_ACCESS_TOKEN?:string;MP_WEBHOOK_SECRET?:string};
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
 if(normalized==="approved"&&local.status!=="approved"){
  const changed=await db.update(payments).set({status:"approved",providerPaymentId:String(remote.id),approvedAt:remote.date_approved||new Date().toISOString(),updatedAt:new Date().toISOString()}).where(and(eq(payments.id,local.id),ne(payments.status,"approved"))).returning({id:payments.id});
  if(changed.length){const[user]=await db.select().from(users).where(eq(users.id,local.userId)).limit(1);if(user){const current=user.subscriptionExpiresAt?Date.parse(user.subscriptionExpiresAt):0,base=Math.max(Date.now(),Number.isFinite(current)?current:0),expiresAt=new Date(base+PLAN_ACCESS_DAYS*86_400_000).toISOString();await db.update(users).set({subscriptionStatus:"active",subscriptionExpiresAt:expiresAt,totalPaidCents:sql`${users.totalPaidCents}+${local.amountCents}`}).where(eq(users.id,local.userId));}}
 }else if(local.status!=="approved")await db.update(payments).set({status:normalized,providerPaymentId:String(remote.id),updatedAt:new Date().toISOString()}).where(eq(payments.id,local.id));
 return{status:normalized,userId:local.userId};
}
