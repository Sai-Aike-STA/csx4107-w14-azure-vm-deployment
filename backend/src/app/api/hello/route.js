import {NextResponse} from "next/server";
import corsHeaders from "@/app/lib/cors";

export async function OPTIONS(request) {
  return NextResponse(null, {
    status: 200,
    headers: corsHeaders
  })
}

export async function GET() {
  const message = {
    message: "hello world"
  }

  return NextResponse.json(message, {
    headers: corsHeaders
  })
}