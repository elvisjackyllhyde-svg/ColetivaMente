import { syncMercadoPagoPayment, validWebhookSignature } from "../../../../lib/mercado-pago";

export async function POST(request:Request){
 const url=new URL(request.url),body=await request.clone().json().catch(()=>({})) as {type?:string;data?:{id?:string|number}};const dataId=String(body.data?.id||url.searchParams.get("data.id")||url.searchParams.get("id")||"");
 if(!dataId)return Response.json({ok:true});
 if(!(await validWebhookSignature(request,dataId)))return Response.json({error:"Assinatura inválida."},{status:401});
 try{await syncMercadoPagoPayment(dataId);return Response.json({ok:true})}catch{return Response.json({ok:true})}
}
