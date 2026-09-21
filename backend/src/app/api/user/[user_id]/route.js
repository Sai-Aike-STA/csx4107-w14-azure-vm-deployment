// src/app/api/user/[user_id]/route.js

import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";
import { isAdmin } from "@/app/lib/auth";
import { getClientPromise } from "@/app/lib/mongodb";
import { errorResponse, printExceptionLog, successResponse } from "@/app/lib/utils";

// changes the password of one user, only the admin may call this endpoint
export async function PUT(request, { params }) {
  if (!isAdmin(request)) {
    return errorResponse("Unauthorized Request", 403);
  }

  const { user_id } = await params;

  // the admin user has the id -1 and is not stored in the database
  if (user_id === "-1") {
    return errorResponse("Admin password is managed by environment parameters", 400);
  }

  try {
    const data = await request.json();
    const password = data.password;

    if (!password) {
      return errorResponse("Missing mandatory data", 400);
    }

    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    const storedUser = await db
      .collection("user")
      .findOne({ _id: new ObjectId(user_id) });

    if (!storedUser) {
      return errorResponse("User not found", 404);
    }

    // bcrypt turns the password into a hashed value so the plain password is never stored
    const hashedPassword = await bcrypt.hash(password, 12);

    await db
      .collection("user")
      .updateOne({ _id: new ObjectId(user_id) }, { $set: { password: hashedPassword } });

    return successResponse({ message: "Password update success" }, 201);
  }

  catch (error) {
    printExceptionLog("PUT user password", error);
    return errorResponse("PUT User Internal Error", 500);
  }
}
