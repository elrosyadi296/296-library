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