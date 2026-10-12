/**
 * 296 Library — Fines and Payment Management Module
 */

function calculateFine(dueDate, returnDate) {
  var due = new Date(dueDate);
  var ret = new Date(returnDate);
  var diffTime = ret.getTime() - due.getTime();
  var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) return 0;
  
  var settings = getTableData("Settings");
  var finePerDay = 2000;
  for (var i = 0; i < settings.length; i++) {
    if (settings[i].key === "fine_per_day") {
      finePerDay = Number(settings[i].value);
      break;
    }
  }
  
  return diffDays * finePerDay;
}

function recordFinePayment(fineId, amountPaid, petugasId) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);
    var paymentId = "PAY_" + new Date().getTime();
    insertTableRow("FinePayments", {
      payment_id: paymentId,
      fine_id: fineId,
      amount_paid: amountPaid,
      payment_date: new Date(),
      processed_by: petugasId,
      notes: "Pembayaran denda lunas",
      created_at: new Date()
    });
    logAudit(petugasId, "PAY_FINE", "Fines", "Recorded payment of " + amountPaid + " for fine " + fineId);
    return { success: true, message: "Pembayaran denda berhasil dicatat." };
  } catch (e) {
    return { success: false, message: e.toString() };
  } finally {
    lock.releaseLock();
  }
}
function getFinesDetailed() {
  var names = {};
  getTableData("Members").forEach(function(m) { names[m.member_id] = m.full_name; });
  return getTableData("Fines").reverse().slice(0, 100).map(function(f) {
    return { fine_id: f.fine_id, member: names[f.member_id] || f.member_id, amount: f.amount, status: f.status, reason: f.reason, assigned_date: f.assigned_date };
  });
}

function processPayFine(token, fineId) {
  var user = requireUser(token, STAFF_ROLES);
  if (!user) return { success: false, message: "Akses ditolak." };
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var fine = getTableData("Fines").filter(function(f) { return f.fine_id === fineId; })[0];
    if (!fine) return { success: false, message: "Denda tidak ditemukan." };
    if (fine.status === "Lunas") return { success: false, message: "Denda ini sudah lunas." };
    var now = new Date();
    insertTableRow("FinePayments", { payment_id: "PAY_" + now.getTime(), fine_id: fineId, amount_paid: fine.amount,
      payment_date: now, processed_by: user.user_id, notes: "Pembayaran denda lunas", created_at: now });
    updateTableRow("Fines", "fine_id", fineId, { status: "Lunas", paid_date: now });
    logAudit(user.user_id, "PAY_FINE", "Fines", "Denda " + fineId + " lunas Rp " + fine.amount);
    return { success: true, message: "Denda Rp " + fine.amount + " dicatat lunas." };
  } catch (e) {
    return { success: false, message: "Error: " + e.toString() };
  } finally {
    lock.releaseLock();
  }
}
