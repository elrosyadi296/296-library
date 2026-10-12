/** 296 Library — Reports (frontend). Logika laporan ada di backend/Report.gs */
class ReportsController { static loans() { return LibraryAPI.call("getLoans"); } }
