/** 296 Library — Circulation controller */
class CirculationController {
  static borrowBook(memberId, copyId) { return LibraryAPI.call("borrowBook", { memberId, copyId }); }
  static returnBook(loanId) { return LibraryAPI.call("returnBook", { loanId }); }
}
