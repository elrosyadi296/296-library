/**
 * 296 Library — Google Apps Script Web App Entry Point (Code.gs)
 * Menangani routing GET dan POST dari frontend.
 */

function doGet(e) {
  var action = e.parameter.action || "ping";
  var result = { status: "ok", message: "296 Library API Active." };

  try {
    switch (action) {
      case "ping":
        result.time = new Date();
        break;
      case "getPublicCatalog":
        result.data = getAllBooks();
        break;
      case "getDashboardStats":
        result.data = {
          booksCount: getTableData("Books").length,
          copiesCount: getTableData("BookCopies").length,
          membersCount: getTableData("Members").length,
          loansCount: getTableData("Loans").length,
          activeLoans: getTableData("Loans").filter(function(l) { return l.status === "Dipinjam"; }).length
        };
        break;
      default:
        result.status = "error";
        result.message = "Unknown GET action: " + action;
    }
  } catch (err) {
    result.status = "error";
    result.message = err.toString();
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var response = { success: false, message: "Invalid request." };

  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;

    switch (action) {
      case "login":
        response = apiLogin(payload.username, payload.password);
        break;
      case "borrowBook":
        response = processBorrowBook(payload.memberId, payload.copyId, payload.petugasId);
        break;
      default:
        response.message = "Unknown POST action: " + action;
    }
  } catch (err) {
    response.message = "Server Exception: " + err.toString();
  }

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}