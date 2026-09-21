// src/app/lib/audit.js

import { X_HEADER_USER_ID, X_HEADER_USER_NAME } from "./constant";
import { printExceptionLog } from "./utils";

// writes one audit log record for an item action
// the user data comes from the internal headers that the proxy set from the token
export async function recordAuditLog(client, action, itemId, request, detail) {
  try {
    const db = client.db(process.env.DB_NAME);
    const result = await db.collection("audit_log").insertOne({
      action: action,
      item_id: itemId,
      user_id: request.headers.get(X_HEADER_USER_ID),
      username: request.headers.get(X_HEADER_USER_NAME),
      detail: detail,
      timestamp: new Date(),
    });
    console.log("==>Audit log:", action, itemId, result.insertedId);
  }
  catch (error) {
    // a failed log write must not break the main item action
    printExceptionLog("Audit Log", error);
  }
}
