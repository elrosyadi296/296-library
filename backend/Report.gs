/**
 * 296 Library — Laporan operasional
 */
function generateLoanReport(startDate, endDate) {
  var from = startDate ? new Date(startDate) : new Date(0);
  var to = endDate ? new Date(new Date(endDate).getTime() + 86400000 - 1) : new Date(8640000000000000);
  var now = new Date();
  var rows = getLoansDetailed().filter(function(l) { var d = new Date(l.loan_date); return d >= from && d <= to; });
  var overdue = rows.filter(function(l) { return l.status === "Dipinjam" && new Date(l.due_date) < now; }).length;
  var fines = getTableData("Fines").filter(function(f) { var d = new Date(f.assigned_date); return d >= from && d <= to; })
    .reduce(function(t, f) { return t + Number(f.amount || 0); }, 0);
  return {
    summary: { total: rows.length, returned: rows.filter(function(l) { return l.status === "Dikembalikan"; }).length,
      active: rows.filter(function(l) { return l.status === "Dipinjam"; }).length, overdue: overdue, fines: fines },
    rows: rows
  };
}
