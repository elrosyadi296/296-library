/**
 * 296 Library - Utilities & API Router (Code.gs entry point counterpart)
 */

function doGet(e) {
  var action = e.parameter.action || "ping";
  var result = { status: "ok", message: "296 Library API is running active." };
  
  if (action === "ping") {
    result.time = new Date();
  } else if (action === "getPublicCatalog") {
    result.data = getTableData("Books");
  } else if (action === "getDashboardStats") {
    result.data = {
      booksCount: getTableData("Books").length,
      copiesCount: getTableData("BookCopies").length,
      membersCount: getTableData("Members").length,
      loansCount: getTableData("Loans").length
    };
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var result = { success: false, message: "Invalid action." };
    
    if (action === "login") {
      result = apiLogin(payload.username, payload.password);
    } else {
      result.message = "Unknown action specified.";
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}