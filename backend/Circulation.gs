/**
 * 296 Library - Circulation Module (Loans & Returns, LockService)
 */
function processBorrowBook(token, memberRef, copyRef) {
  var user = requireUser(token, STAFF_ROLES);
  if (!user) return { success: false, message: "Akses ditolak. Login sebagai petugas." };

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var cfg = getConfig();
    var member = getTableData("Members").filter(function(m) {
      return m.member_id === memberRef || String(m.member_number) === String(memberRef);
    })[0];
    if (!member) return { success: false, message: "Anggota tidak ditemukan." };

    var active = getTableData("Loans").filter(function(l) {
      return l.member_id === member.member_id && l.status === "Dipinjam";
    }).length;
    if (active >= cfg.maxBorrowLimit) {
      return { success: false, message: "Batas pinjam " + cfg.maxBorrowLimit + " buku sudah tercapai." };
    }

    var copy = getTableData("BookCopies").filter(function(c) {
      return c.copy_id === copyRef || String(c.barcode) === String(copyRef) || String(c.inventory_number) === String(copyRef);
    })[0];
    if (!copy || copy.status !== "Tersedia") {
      return { success: false, message: "Eksemplar tidak ditemukan atau sedang dipinjam." };
    }

    var now = new Date();
    var due = new Date(now.getTime() + cfg.maxLoanDays * 86400000);
    var loanId = "LOAN_" + now.getTime();
    insertTableRow("Loans", { loan_id: loanId, member_id: member.member_id, loan_date: now, due_date: due,
      total_items: 1, status: "Dipinjam", processed_by: user.user_id, notes: "Peminjaman reguler", created_at: now, updated_at: now });
    insertTableRow("LoanItems", { item_id: "ITM_" + now.getTime(), loan_id: loanId, copy_id: copy.copy_id, book_id: copy.book_id,
      due_date: due, status: "Dipinjam", fine_amount: 0, created_at: now, updated_at: now });
    updateTableRow("BookCopies", "copy_id", copy.copy_id, { status: "Dipinjam", updated_at: now });

    logAudit(user.user_id, "BORROW", "Circulation", "Copy " + copy.copy_id + " dipinjam " + member.member_id);
    return { success: true, message: "Peminjaman dicatat. Jatuh tempo " + Utilities.formatDate(due, cfg.timezone, "dd MMM yyyy") + ".", loanId: loanId };
  } catch (e) {
    return { success: false, message: "Error: " + e.toString() };
  } finally {
    lock.releaseLock();
  }
}

function processReturnBook(token, loanId) {
  var user = requireUser(token, STAFF_ROLES);
  if (!user) return { success: false, message: "Akses ditolak. Login sebagai petugas." };

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var now = new Date(), total = 0;
    var items = getTableData("LoanItems").filter(function(i) { return i.loan_id === loanId && i.status !== "Dikembalikan"; });
    if (!items.length) return { success: false, message: "Pinjaman tidak ditemukan atau sudah dikembalikan." };

    items.forEach(function(it) {
      var fine = calculateFine(it.due_date, now);
      total += fine;
      updateTableRow("LoanItems", "item_id", it.item_id, { return_date: now, status: "Dikembalikan", fine_amount: fine, updated_at: now });
      updateTableRow("BookCopies", "copy_id", it.copy_id, { status: "Tersedia", updated_at: now });
    });
    updateTableRow("Loans", "loan_id", loanId, { status: "Dikembalikan", updated_at: now });

    if (total > 0) {
      var loan = getTableData("Loans").filter(function(l) { return l.loan_id === loanId; })[0];
      insertTableRow("Fines", { fine_id: "FIN_" + now.getTime(), loan_id: loanId, member_id: loan ? loan.member_id : "",
        amount: total, status: "Belum Lunas", reason: "Terlambat", assigned_date: now, processed_by: user.user_id, created_at: now });
    }
    logAudit(user.user_id, "RETURN", "Circulation", "Loan " + loanId + " dikembalikan, denda " + total);
    return { success: true, message: total > 0 ? "Dikembalikan. Denda Rp " + total : "Buku dikembalikan tepat waktu." };
  } catch (e) {
    return { success: false, message: "Error: " + e.toString() };
  } finally {
    lock.releaseLock();
  }
}

function getLoansDetailed(memberId) {
  var names = {}, titles = {}, items = getTableData("LoanItems");
  getTableData("Members").forEach(function(m) { names[m.member_id] = m.full_name; });
  getTableData("Books").forEach(function(b) { titles[b.book_id] = b.title; });
  return getTableData("Loans").reverse()
    .filter(function(l) { return !memberId || l.member_id === memberId; })
    .slice(0, 100)
    .map(function(l) {
      var mine = items.filter(function(i) { return i.loan_id === l.loan_id; });
      return { loan_id: l.loan_id, member: names[l.member_id] || l.member_id, loan_date: l.loan_date,
        due_date: l.due_date, status: l.status,
        books: mine.map(function(i) { return titles[i.book_id] || i.copy_id; }).join(", ") };
    });
}
