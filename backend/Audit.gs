/**
 * 296 Library - Audit Trail & Activity Logger
 */

function logAudit(userId, action, module, details) {
  try {
    insertTableRow("AuditLogs", {
      log_id: "LOG_" + new Date().getTime() + "_" + Math.floor(Math.random() * 1000),
      user_id: userId || "SYSTEM",
      action: action,
      module: module,
      details: details,
      ip_address: "CLIENT_WEB",
      timestamp: new Date()
    });
  } catch (e) {
    console.error("Failed to write audit log: " + e.toString());
  }
}