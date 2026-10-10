/**
 * 296 Library - Authentication, Sessions & RBAC Security
 */

function apiLogin(username, password) {
  var users = getTableData("Users");
  var user = null;
  
  for (var i = 0; i < users.length; i++) {
    if (users[i].username === username && users[i].status === "Active") {
      user = users[i];
      break;
    }
  }
  
  if (!user) {
    return { success: false, message: "Username tidak ditemukan atau akun tidak aktif." };
  }
  
  // Hash input password
  var passwordHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8);
  var hashHex = passwordHash.map(function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('');
  
  if (user.password_hash !== hashHex) {
    return { success: false, message: "Password salah." };
  }
  
  // Generate Session Token
  var token = Utilities.getUuid() + "_" + new Date().getTime();
  var tokenHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token, Utilities.Charset.UTF_8);
  var tokenHex = tokenHash.map(function(b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');
  
  var expiresAt = new Date(new Date().getTime() + (12 * 60 * 60 * 1000)); // 12 hours
  
  insertTableRow("Sessions", {
    session_id: "SES_" + new Date().getTime(),
    user_id: user.user_id,
    token_hash: tokenHex,
    expires_at: expiresAt,
    created_at: new Date()
  });
  
  logAudit(user.user_id, "LOGIN", "Auth", "User " + username + " logged in successfully.");
  
  // Return user info without sensitive password hash
  return {
    success: true,
    token: token,
    user: {
      userId: user.user_id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      email: user.email
    }
  };
}

function validateSession(token) {
  if (!token) return null;
  var tokenHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token, Utilities.Charset.UTF_8);
  var tokenHex = tokenHash.map(function(b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');
  
  var sessions = getTableData("Sessions");
  var now = new Date();
  
  for (var i = 0; i < sessions.length; i++) {
    if (sessions[i].token_hash === tokenHex) {
      var expiry = new Date(sessions[i].expires_at);
      if (expiry > now) {
        var users = getTableData("Users");
        for (var j = 0; j < users.length; j++) {
          if (users[j].user_id === sessions[i].user_id) {
            return users[j];
          }
        }
      }
    }
  }
  return null;
}

function createInitialSuperadmin() {
  var ss = getDatabaseSpreadsheet();
  var usersSheet = ss.getSheetByName("Users");
  
  var username = "superadmin296";
  var plainPassword = "AdminPassword296!"; // Password default awal yang kuat
  var fullName = "Super Administrator Utama";
  var email = "admin@296library.local";
  
  // Cek apakah username sudah ada
  var users = getTableData("Users");
  for (var i = 0; i < users.length; i++) {
    if (users[i].username === username) {
      return "Akun superadmin dengan username '" + username + "' sudah ada di dalam sistem.";
    }
  }
  
  // Hash password menggunakan SHA-256
  var passwordHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, plainPassword, Utilities.Charset.UTF_8);
  var hashHex = passwordHash.map(function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('');
  
  var adminId = "USR_" + new Date().getTime();
  
  usersSheet.appendRow([
    adminId, 
    username, 
    hashHex, 
    fullName, 
    "Superadmin", 
    email, 
    "Active", 
    new Date(), 
    new Date()
  ]);
  
  return "Berhasil membuat Superadmin! Username: " + username + " | Password Default: " + plainPassword + " (Silakan ubah setelah login)";
}