import corsHeaders from "@/app/lib/cors";
import { getClientPromise } from "@/app/lib/mongodb";
import { errorResponse } from "@/app/lib/utils";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET
const adminUserMail = process.env.ADMIN_USER_MAIL
const adminPass = process.env.ADMIN_PASS
const DB_NAME = process.env.DB_NAME

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request) {

  const data = await request.json()
  const { email, password } = data

  if (!email || !password) return errorResponse("Missing email or password", 400)

  const admin = checkAdmin(email, password)
  const user = admin ? admin : await checkUser(email, password)

  if (user) {
    const jwtToken = getJwtToken(user)

    const response = NextResponse.json(
      { message: "Login successful" },
      {
        status: 200,
        headers: corsHeaders,
      }
    )

    response.cookies.set("token", jwtToken, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV == "development" ? "lax" : "none",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      secure: process.env.NODE_ENV === "production",
    })

    return response
  }

  else {
    return errorResponse("Invalid email or password", 401)
  }
}

function checkAdmin(email, password) {
  if (!adminUserMail || !adminPass) return false

  if (email === adminUserMail && password === adminPass) {
    return {
      _id: "-1",
      email: email,
      username: "admin"
    }
  }

  return false
}

async function checkUser(email, password) {

  try {
    const client = await getClientPromise()
    const db = client.db(DB_NAME)
    const user = await db.collection("user").findOne({ email })

    // if user not found, then it doesn't exist
    if (!user) return false

    // if user exists, check if password matches
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) return false

    // if everything matches, return the user info
    else return user
  }

  catch(error) {
    console.log("exception", error.toString())
  }
}

function getJwtToken(user) {
  const token = jwt.sign(
    {
      id: user._id,
      email: user.email,
      username: user.username
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  )

  return token
}
