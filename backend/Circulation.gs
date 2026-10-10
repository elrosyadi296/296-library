/**
 * 296 Library - Circulation Module (Loans & Returns with LockService)
 */

function processBorrowBook(memberId, copyId, petugasId) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // Wait up to 10s to prevent race condition
    
    var copies = getTableData("BookCopies");
    var targetCopy = null;
    for (var i = 0; i < copies.length; i++) {
      if (copies[i].copy_id === copyId) {
        targetCopy = copies[i];
        break;
      }
    }
    
    if (!targetCopy || targetCopy.status !== "Tersedia") {
      return { success: false, message: "Eksemplar buku tidak tersedia atau sedang dipinjam." };
    }
    
    // Create loan transaction
    var loanId = "LOAN_" + new Date().getTime();
    var dueDate = new Date(new Date().getTime() + (7 * 24 * 60 * 60 * 1000));
    
    insertTableRow("Loans", {
      loan_id: loanId,
      member_id: memberId,
      loan_date: new Date(),
      due_date: dueDate,
      total_items: 1,
      status: "Dipinjam",
      processed_by: petugasId,
      notes: "Peminjaman reguler",
      created_at: new Date(),
      updated_at: new Date()
    });
    
    logAudit(petugasId, "BORROW", "Circulation", "Book copy " + copyId borrowed by member + memberId);
    return { success: true, message: "Peminjaman berhasil dicatat.", loanId: loanId };
    
  } catch (e) {
    return { success: false, message: "Error: " + e.toString() };
  } finally {
    lock.releaseLock();
  }
}