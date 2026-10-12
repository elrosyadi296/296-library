/**
 * 296 Library - Helper umum (router ada di Code.gs; jangan definisikan doGet/doPost di sini)
 */
var STAFF_ROLES = ["Superadmin", "Admin Perpustakaan", "Petugas"];

function requireUser(token, roles) {
  var user = validateSession(token);
  if (!user) return null;
  if (roles && roles.indexOf(user.role) === -1) return null;
  return user;
}

function updateTableRow(sheetName, keyField, keyValue, updates) {
  var sheet = getDatabaseSpreadsheet().getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var k = headers.indexOf(keyField);
  for (var r = 1; r < data.length; r++) {
    if (data[r][k] === keyValue) {
      for (var f in updates) {
        var c = headers.indexOf(f);
        if (c > -1) sheet.getRange(r + 1, c + 1).setValue(updates[f]);
      }
      return true;
    }
  }
  return false;
}

function sha256Hex_(text) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(text), Utilities.Charset.UTF_8)
    .map(function(b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');
}

function randomPassword_() {
  return Utilities.getUuid().replace(/-/g, "").slice(0, 10) + "!A9";
}
