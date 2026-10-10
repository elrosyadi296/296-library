/**
 * 296 Library - Books & Copies Management Module
 */

function getAllBooks() {
  return getTableData("Books");
}

function getBookCopies(bookId) {
  var copies = getTableData("BookCopies");
  return copies.filter(function(c) { return c.book_id === bookId; });
}