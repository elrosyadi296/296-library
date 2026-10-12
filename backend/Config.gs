/**
 * 296 Library — Konfigurasi Backend & Parameter Sistem
 */

function getConfig() {
  // Masukkan Spreadsheet ID Anda di bawah ini dengan benar (contoh: "1A2B3C4D5E6F...")
  var spreadsheetId = "1sMbUwCsDkrnPYlKw_-895AV4wsvfxNoYIDDTiF8HYz8"; // Ganti dengan ID Spreadsheet Anda yang sebenarnya
  
  return {
    spreadsheetId: spreadsheetId,
    timezone: "Asia/Jakarta",
    sessionDurationHours: 12,
    defaultFinePerDay: 2000,
    maxBorrowLimit: 3,
    maxLoanDays: 7
  };
}

function getDatabaseSpreadsheet() {
  var config = getConfig();
  var sid = config.spreadsheetId;
  
  if (!sid || sid === "MASUKKAN_SPREADSHEET_ID_ANDA_DISINI" || sid.indexOf("MASUKKAN") !== -1) {
    throw new Error("Spreadsheet ID belum dikonfigurasi dengan benar di Config.gs! Mohon ganti string placeholder dengan ID Google Spreadsheet Anda.");
  }
  
  try {
    return SpreadsheetApp.openById(sid);
  } catch (err) {
    throw new Error("Gagal membuka Spreadsheet dengan ID: '" + sid + "'. Pastikan ID benar dan script memiliki izin akses ke spreadsheet tersebut. Detail: " + err.toString());
  }
}