import { getDb } from "../../../../db";
import { getCurrentUser } from "../../../../db/auth";
import { syncMercadoPagoPayment } from "../../../../lib/mercado-pago";

export async function GET(request:Request){const db=getDb(),user=await getCurrentUser(request,db);if(!user)return Response.json({error:"Entre para continuar."},{status:401});const paymentId=new URL(request.url).searchParams.get("payment_id")||"";if(!paymentId)return Response.json({status:"unknown"});try{const result=await syncMercadoPagoPayment(paymentId);if(result.userId!==user.id)return Response.json({error:"Pagamento inválido."},{status:403});return Response.json({status:result.status})}catch(error){return Response.json({error:error instanceof Error?error.message:"Não foi possível confirmar."},{status:400})}}
