/**
 * 296 Library - Pengaturan Akun
 *
 *  Semua peran (Superadmin, Admin Perpustakaan, Petugas, Anggota):
 *    getMyAccount, updateMyAccount, changeMyPassword
 *  Superadmin & Admin Perpustakaan:
 *    listAccounts, adminUpdateAccount, adminResetPassword
 *
 *  Aturan wewenang pengelolaan akun orang lain:
 *    - Superadmin       : semua akun, kecuali dirinya sendiri
 *    - Admin Perpustakaan: hanya akun Petugas dan Anggota
 *    - Mengubah peran   : hanya Superadmin
 *    - Akun sendiri diatur lewat getMyAccount / updateMyAccount / changeMyPassword
 *
 *  Status akun memakai nilai "Active" / "Inactive" (login hanya menerima "Active").
 */

var ACCOUNT_ADMIN_ROLES = ["Superadmin", "Admin Perpustakaan"];
var ACCOUNT_ROLES = ["Superadmin", "Admin Perpustakaan", "Petugas", "Anggota"];
var ACCOUNT_STATUSES = ["Active", "Inactive"];
var ACCOUNT_SESSION_MSG_ = "Sesi berakhir. Silakan login ulang.";

// ------------------------------------------------------------------ helper
function accFail_(msg) { return { success: false, message: msg }; }

function accLoginShape_(u) {
  return { userId: u.user_id, username: u.username, fullName: u.full_name, role: u.role, email: u.email };
}

function accFindUser_(userId) {
  return getTableData("Users").filter(function (u) { return u.user_id === userId; })[0];
}

function accFindMember_(user) {
  return getTableData("Members").filter(function (m) { return String(m.member_number) === String(user.username); })[0];
}

function accView_(u) {
  var view = { userId: u.user_id, username: u.username, fullName: u.full_name, email: u.email || "", role: u.role,
    status: u.status, createdAt: u.created_at };
  if (u.role === "Anggota") {
    var m = accFindMember_(u);
    if (m) {
      view.member = { memberNumber: String(m.member_number), memberType: m.member_type, unitClass: m.unit_class,
        phone: m.phone === "" || m.phone == null ? "" : String(m.phone), address: m.address || "",
        expiryDate: m.expiry_date, status: m.status };
    }
  }
  return view;
}

// Tulis nilai sebagai TEKS agar angka nol di depan (mis. nomor telepon 0812...) tidak hilang.
function accSetText_(sheetName, keyField, keyValue, field, text) {
  var sheet = getDatabaseSpreadsheet().getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues(), headers = data[0];
  var k = headers.indexOf(keyField), c = headers.indexOf(field);
  if (k < 0 || c < 0) return false;
  for (var r = 1; r < data.length; r++) {
    if (data[r][k] === keyValue) {
      var cell = sheet.getRange(r + 1, c + 1);
      cell.setNumberFormat("@");
      cell.setValue(text);
      return true;
    }
  }
  return false;
}

// Hapus sesi login milik user (kecuali token tertentu). Dipakai saat password diganti/reset
// atau akun dinonaktifkan, supaya perangkat lain ikut keluar.
function accDeleteSessions_(userId, exceptTokenHash) {
  var sheet = getDatabaseSpreadsheet().getSheetByName("Sessions");
  if (!sheet || sheet.getLastRow() <= 1) return 0;
  var data = sheet.getDataRange().getValues(), h = data[0];
  var iu = h.indexOf("user_id"), it = h.indexOf("token_hash"), n = 0;
  for (var r = data.length - 1; r >= 1; r--) {
    if (data[r][iu] === userId && data[r][it] !== exceptTokenHash) { sheet.deleteRow(r + 1); n++; }
  }
  return n;
}

function accPasswordProblem_(pwd, username, current) {
  pwd = String(pwd == null ? "" : pwd);
  if (pwd.length < 8) return "Password baru minimal 8 karakter.";
  if (pwd.length > 64) return "Password baru maksimal 64 karakter.";
  if (!/[A-Za-z]/.test(pwd) || !/[0-9]/.test(pwd)) return "Password baru harus mengandung huruf dan angka.";
  if (pwd.toLowerCase() === String(username).toLowerCase()) return "Password tidak boleh sama dengan username.";
  if (current !== undefined && pwd === current) return "Password baru harus berbeda dari password saat ini.";
  return "";
}

function accCanManage_(actor, target) {
  if (!actor || !target || actor.user_id === target.user_id) return false;
  if (actor.role === "Superadmin") return true;
  if (actor.role === "Admin Perpustakaan") return target.role === "Petugas" || target.role === "Anggota";
  return false;
}

function accCleanName_(v) {
  var s = sanitizeInput(String(v == null ? "" : v)).replace(/\s+/g, " ");
  return s;
}

// ------------------------------------------------------------------ akun sendiri
function getMyAccount(token) {
  var user = requireUser(token);
  if (!user) return accFail_(ACCOUNT_SESSION_MSG_);
  return { success: true, data: accView_(user) };
}

function updateMyAccount(token, p) {
  var user = requireUser(token);
  if (!user) return accFail_(ACCOUNT_SESSION_MSG_);
  p = p || {};
  var isMember = user.role === "Anggota";
  var now = new Date();

  var email = p.email === undefined ? String(user.email || "") : String(p.email).trim();
  if (email.length > 100) return accFail_("Email terlalu panjang (maksimal 100 karakter).");
  if (email && !validateEmail(email)) return accFail_("Format email tidak valid.");

  var userUpdates = { email: email, updated_at: now }, memberUpdates = null, memberRow = null, phoneText = null;

  if (!isMember && p.fullName !== undefined) {
    var name = accCleanName_(p.fullName);
    if (name.length < 2) return accFail_("Nama lengkap minimal 2 karakter.");
    if (name.length > 100) return accFail_("Nama lengkap maksimal 100 karakter.");
    userUpdates.full_name = name;
  }
  // Anggota: nama mengikuti data keanggotaan (hanya petugas yang boleh mengubahnya).

  if (isMember) {
    memberRow = accFindMember_(user);
    memberUpdates = { email: email, updated_at: now };
    if (p.phone !== undefined) {
      phoneText = String(p.phone).trim();
      if (phoneText && !/^[0-9+\-\s()]{6,20}$/.test(phoneText)) return accFail_("Nomor telepon tidak valid (6-20 karakter: angka, +, -, spasi).");
    }
    if (p.address !== undefined) {
      var addr = sanitizeInput(String(p.address)).replace(/\s+/g, " ");
      if (addr.length > 200) return accFail_("Alamat terlalu panjang (maksimal 200 karakter).");
      memberUpdates.address = addr;
    }
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    updateTableRow("Users", "user_id", user.user_id, userUpdates);
    if (memberRow) {
      updateTableRow("Members", "member_id", memberRow.member_id, memberUpdates);
      if (phoneText !== null) accSetText_("Members", "member_id", memberRow.member_id, "phone", phoneText);
    }
    logAudit(user.user_id, "UPDATE_PROFILE", "Accounts", "Profil " + user.username + " diperbarui");
    var fresh = accFindUser_(user.user_id);
    return { success: true, message: "Profil berhasil diperbarui.", data: { user: accLoginShape_(fresh), account: accView_(fresh) } };
  } catch (e) {
    return accFail_("Error: " + e.toString());
  } finally {
    lock.releaseLock();
  }
}

function changeMyPassword(token, p) {
  var user = requireUser(token);
  if (!user) return accFail_(ACCOUNT_SESSION_MSG_);
  p = p || {};
  var current = String(p.currentPassword == null ? "" : p.currentPassword);
  var next = String(p.newPassword == null ? "" : p.newPassword);
  if (!current) return accFail_("Password saat ini wajib diisi.");
  if (sha256Hex_(current) !== user.password_hash) return accFail_("Password saat ini salah.");
  var problem = accPasswordProblem_(next, user.username, current);
  if (problem) return accFail_(problem);

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    updateTableRow("Users", "user_id", user.user_id, { password_hash: sha256Hex_(next), updated_at: new Date() });
    var ended = accDeleteSessions_(user.user_id, sha256Hex_(token));
    logAudit(user.user_id, "CHANGE_PASSWORD", "Accounts", "Password " + user.username + " diganti, " + ended + " sesi lain diakhiri");
    return { success: true, message: ended > 0
      ? "Password berhasil diubah. Sesi di perangkat lain telah diakhiri."
      : "Password berhasil diubah." };
  } catch (e) {
    return accFail_("Error: " + e.toString());
  } finally {
    lock.releaseLock();
  }
}

// ------------------------------------------------------------------ pengelolaan akun (admin)
function listAccounts(token) {
  var actor = requireUser(token, ACCOUNT_ADMIN_ROLES);
  if (!actor) return accFail_("Akses ditolak.");
  var units = {};
  getTableData("Members").forEach(function (m) { units[String(m.member_number)] = m.unit_class || ""; });
  var rank = { "Superadmin": 4, "Admin Perpustakaan": 3, "Petugas": 2, "Anggota": 1 };
  var rows = getTableData("Users").map(function (u) {
    return { userId: u.user_id, username: String(u.username), fullName: u.full_name, email: u.email || "", role: u.role,
      status: u.status, unitClass: u.role === "Anggota" ? (units[String(u.username)] || "") : "",
      isSelf: u.user_id === actor.user_id, canManage: accCanManage_(actor, u) };
  });
  rows.sort(function (a, b) {
    return (rank[b.role] || 0) - (rank[a.role] || 0) || String(a.fullName).localeCompare(String(b.fullName));
  });
  return { success: true, data: { accounts: rows, canChangeRole: actor.role === "Superadmin" } };
}

function adminUpdateAccount(token, p) {
  var actor = requireUser(token, ACCOUNT_ADMIN_ROLES);
  if (!actor) return accFail_("Akses ditolak.");
  p = p || {};
  var target = accFindUser_(p.userId);
  if (!target) return accFail_("Akun tidak ditemukan.");
  if (actor.user_id === target.user_id) return accFail_("Gunakan halaman Pengaturan Akun untuk mengubah akunmu sendiri.");
  if (!accCanManage_(actor, target)) return accFail_("Kamu tidak berwenang mengelola akun ini.");

  var now = new Date(), updates = { updated_at: now }, endSessions = false, changes = [];

  if (p.fullName !== undefined) {
    var name = accCleanName_(p.fullName);
    if (name.length < 2) return accFail_("Nama lengkap minimal 2 karakter.");
    if (name.length > 100) return accFail_("Nama lengkap maksimal 100 karakter.");
    if (name !== target.full_name) { updates.full_name = name; changes.push("nama"); }
  }
  if (p.email !== undefined) {
    var email = String(p.email).trim();
    if (email.length > 100) return accFail_("Email terlalu panjang (maksimal 100 karakter).");
    if (email && !validateEmail(email)) return accFail_("Format email tidak valid.");
    if (email !== String(target.email || "")) { updates.email = email; changes.push("email"); }
  }
  if (p.role !== undefined && p.role !== target.role) {
    if (actor.role !== "Superadmin") return accFail_("Hanya Superadmin yang dapat mengubah peran.");
    if (ACCOUNT_ROLES.indexOf(p.role) === -1) return accFail_("Peran tidak dikenal.");
    updates.role = p.role; changes.push("peran " + target.role + " -> " + p.role); endSessions = true;
  }
  if (p.status !== undefined && p.status !== target.status) {
    if (ACCOUNT_STATUSES.indexOf(p.status) === -1) return accFail_("Status tidak dikenal.");
    updates.status = p.status; changes.push("status " + target.status + " -> " + p.status);
    if (p.status === "Inactive") endSessions = true;
  }
  if (!changes.length) return { success: true, message: "Tidak ada perubahan.", data: null };

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    updateTableRow("Users", "user_id", target.user_id, updates);
    // Anggota: samakan nama/email di data keanggotaan.
    if (target.role === "Anggota" && (updates.full_name || updates.email !== undefined)) {
      var mem = accFindMember_(target);
      if (mem) {
        var mu = { updated_at: now };
        if (updates.full_name) mu.full_name = updates.full_name;
        if (updates.email !== undefined) mu.email = updates.email;
        updateTableRow("Members", "member_id", mem.member_id, mu);
      }
    }
    var ended = endSessions ? accDeleteSessions_(target.user_id, null) : 0;
    logAudit(actor.user_id, "ADMIN_UPDATE_ACCOUNT", "Accounts", target.username + ": " + changes.join(", "));
    return { success: true, message: "Akun " + target.username + " diperbarui" + (ended ? " (sesi loginnya diakhiri)." : "."),
      data: accView_(accFindUser_(target.user_id)) };
  } catch (e) {
    return accFail_("Error: " + e.toString());
  } finally {
    lock.releaseLock();
  }
}

function adminResetPassword(token, p) {
  var actor = requireUser(token, ACCOUNT_ADMIN_ROLES);
  if (!actor) return accFail_("Akses ditolak.");
  p = p || {};
  var target = accFindUser_(p.userId);
  if (!target) return accFail_("Akun tidak ditemukan.");
  if (actor.user_id === target.user_id) return accFail_("Untuk akunmu sendiri, gunakan Ganti Password di halaman Pengaturan Akun.");
  if (!accCanManage_(actor, target)) return accFail_("Kamu tidak berwenang mengelola akun ini.");

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var pwd = randomPassword_();
    updateTableRow("Users", "user_id", target.user_id, { password_hash: sha256Hex_(pwd), updated_at: new Date() });
    accDeleteSessions_(target.user_id, null);
    logAudit(actor.user_id, "RESET_PASSWORD", "Accounts", "Password " + target.username + " direset");
    return { success: true, message: "Password " + target.username + " direset.",
      data: { username: String(target.username), fullName: target.full_name, password: pwd } };
  } catch (e) {
    return accFail_("Error: " + e.toString());
  } finally {
    lock.releaseLock();
  }
}
