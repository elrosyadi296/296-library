/**
 * 296 Library - Database Initialization and Sheet Management
 */

function initDatabase() {
  var ss = getDatabaseSpreadsheet();
  
  var sheetsConfig = {
    "Settings": ["key", "value", "description", "updated_at"],
    "Users": ["user_id", "username", "password_hash", "full_name", "role", "email", "status", "created_at", "updated_at"],
    "Members": ["member_id", "member_number", "full_name", "member_type", "identity_number", "unit_class", "address", "phone", "email", "join_date", "expiry_date", "status", "notes", "created_at", "updated_at"],
    "Books": ["book_id", "isbn", "title", "subtitle", "author", "editor", "publisher", "publish_year", "edition", "language", "category", "subcategory", "description", "keywords", "pages", "format", "cover_url", "digital_url", "shelf_location", "catalog_status", "input_date", "input_by", "created_at", "updated_at"],
    "BookCopies": ["copy_id", "book_id", "inventory_number", "barcode", "shelf_location", "condition", "status", "notes", "created_at", "updated_at"],
    "Categories": ["category_id", "category_name", "type", "description", "created_at"],
    "Authors": ["author_id", "author_name", "bio", "created_at"],
    "Publishers": ["publisher_id", "publisher_name", "city", "created_at"],
    "Shelves": ["shelf_id", "shelf_code", "location_name", "capacity", "created_at"],
    "Loans": ["loan_id", "member_id", "loan_date", "due_date", "total_items", "status", "processed_by", "notes", "created_at", "updated_at"],
    "LoanItems": ["item_id", "loan_id", "copy_id", "book_id", "due_date", "return_date", "status", "fine_amount", "condition_returned", "created_at", "updated_at"],
    "Returns": ["return_id", "loan_id", "copy_id", "return_date", "processed_by", "late_days", "fine_incurred", "notes", "created_at"],
    "Fines": ["fine_id", "loan_id", "member_id", "amount", "status", "reason", "assigned_date", "paid_date", "processed_by", "created_at"],
    "FinePayments": ["payment_id", "fine_id", "amount_paid", "payment_date", "processed_by", "notes", "created_at"],
    "Reservations": ["reservation_id", "member_id", "book_id", "reservation_date", "expiry_date", "status", "processed_by", "created_at", "updated_at"],
    "DigitalCollections": ["digital_id", "title", "author", "description", "category", "document_url", "cover_url", "access_level", "status", "created_at"],
    "Notifications": ["notif_id", "recipient_id", "title", "message", "type", "is_read", "created_at"],
    "AuditLogs": ["log_id", "user_id", "action", "module", "details", "ip_address", "timestamp"],
    "Sessions": ["session_id", "user_id", "token_hash", "expires_at", "created_at"]
  };
  
  for (var sheetName in sheetsConfig) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    
    // Set headers if empty
    if (sheet.getLastRow() === 0) {
      var headers = sheetsConfig[sheetName];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#0f172a").setFontColor("#ffffff");
    }
  }
  
  // Insert initial default settings if empty
  var settingsSheet = ss.getSheetByName("Settings");
  if (settingsSheet.getLastRow() <= 1) {
    var defaultSettings = [
      ["library_name", "296 Library — Sistem Informasi Perpustakaan Online", "Nama Resmi Perpustakaan", new Date()],
      ["fine_per_day", "2000", "Tarif denda per hari (IDR)", new Date()],
      ["max_borrow_limit", "3", "Maksimum peminjaman buku per anggota", new Date()],
      ["max_loan_days", "7", "Lama masa peminjaman normal (hari)", new Date()]
    ];
    settingsSheet.getRange(2, 1, defaultSettings.length, defaultSettings[0].length).setValues(defaultSettings);
  }
  
  // Superadmin dibuat terpisah lewat createInitialSuperadmin() (password acak).
  
  return "Database initialized successfully!";
}

function getTableData(sheetName) {
  var ss = getDatabaseSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  
  var dataRange = sheet.getDataRange().getValues();
  var headers = dataRange[0];
  var rows = dataRange.slice(1);
  
  var result = [];
  for (var i = 0; i < rows.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = rows[i][j];
    }
    result.push(obj);
  }
  return result;
}

function insertTableRow(sheetName, rowDataObj) {
  var ss = getDatabaseSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  var rowArray = [];
  for (var i = 0; i < headers.length; i++) {
    rowArray.push(rowDataObj[headers[i]] !== undefined ? rowDataObj[headers[i]] : "");
  }
  
  sheet.appendRow(rowArray);
  return true;
}