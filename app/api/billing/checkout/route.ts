import { getDb } from "../../../../db";
import { getCurrentUser } from "../../../../db/auth";
import { payments } from "../../../../db/schema";
import { mpSecrets, PLAN_AMOUNT_CENTS } from "../../../../lib/mercado-pago";
import { eq } from "drizzle-orm";
import { csrfError, verifyCsrf } from "../../../../db/csrf";
import { writeAuditEvent } from "../../../../lib/audit";

export async function POST(request:Request){
 const db=getDb(),user=await getCurrentUser(request,db);if(!user)return Response.json({error:"Entre para assinar."},{status:401});
 if(!(await verifyCsrf(request,db)))return csrfError();
 const token=mpSecrets().MP_ACCESS_TOKEN;if(!token)return Response.json({error:"O Mercado Pago ainda está aguardando a credencial de integração."},{status:503});
 const reference=crypto.randomUUID(),origin=new URL(request.url).origin;
 await db.insert(payments).values({userId:user.id,externalReference:reference,amountCents:PLAN_AMOUNT_CENTS,currency:"BRL"});
 await writeAuditEvent({request,category:"payment",action:"checkout_created",actorUserId:user.id,targetUserId:user.id,resourceType:"payment",resourceId:reference,metadata:{amountCents:PLAN_AMOUNT_CENTS,currency:"BRL",provider:"mercado_pago"}});
 const response=await fetch("https://api.mercadopago.com/checkout/preferences",{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json","X-Idempotency-Key":reference},body:JSON.stringify({items:[{id:"coletivamente-30-dias",title:"ColetivaMente - acesso por 30 dias",description:"GiroQuiz, Voto em Valor e Sorteio",quantity:1,currency_id:"BRL",unit_price:PLAN_AMOUNT_CENTS/100}],external_reference:reference,notification_url:`${origin}/api/billing/webhook`,back_urls:{success:`${origin}/?modo=conta&pagamento=success`,pending:`${origin}/?modo=conta&pagamento=pending`,failure:`${origin}/?modo=conta&pagamento=failure`},auto_return:"approved",statement_descriptor:"COLETIVAMENTE"})});
 const data=await response.json() as {id?:string;init_point?:string;sandbox_init_point?:string;message?:string};
 if(!response.ok||!data.id){await db.update(payments).set({status:"failed",updatedAt:new Date().toISOString()}).where(eq(payments.externalReference,reference));await writeAuditEvent({request,category:"payment",action:"checkout_failed",severity:"warning",actorUserId:user.id,targetUserId:user.id,resourceType:"payment",resourceId:reference,metadata:{provider:"mercado_pago"}});return Response.json({error:data.message||"Não foi possível abrir o Mercado Pago."},{status:502});}
 await db.update(payments).set({providerPreferenceId:data.id,status:"pending",updatedAt:new Date().toISOString()}).where(eq(payments.externalReference,reference));
 await writeAuditEvent({request,category:"payment",action:"checkout_ready",actorUserId:user.id,targetUserId:user.id,resourceType:"payment",resourceId:reference,metadata:{providerPreferenceId:data.id}});
 return Response.json({checkoutUrl:data.init_point||data.sandbox_init_point});
}
