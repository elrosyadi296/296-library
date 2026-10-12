// Pengaturan akun (semua peran): getMyAccount, updateMyAccount, changeMyPassword.
AppNav.render();
(async function () {
  const me = Auth.guard();
  if (!me) return;
  const $ = id => document.getElementById(id), e = UI.esc;
  const ADMINS = ["Superadmin", "Admin Perpustakaan"];
  const BADGE = { info: "bg-blue-50 text-blue-700 border-blue-200", neutral: "bg-slate-100 text-slate-600 border-slate-200", ok: "bg-emerald-50 text-emerald-700 border-emerald-200", bad: "bg-red-50 text-red-700 border-red-200" };
  let acct = null;

  // Sesi habis -> kembali ke login (sama seperti halaman lain).
  const sessionLost = r => {
    if (!r.success && /Sesi|login/i.test(r.message || "")) { UI.toast("Sesi berakhir, silakan masuk lagi.", "err"); setTimeout(Auth.logout, 1200); return true; }
    return false;
  };
  const say = (el, text, ok) => {
    el.className = "text-sm px-4 py-3 rounded-xl " + (ok ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200");
    el.textContent = text;
  };
  const hide = el => el.classList.add("hidden");

  function fill(a) {
    acct = a;
    const isMember = a.role === "Anggota";
    $("acc-avatar").textContent = (a.fullName || "?").trim().charAt(0).toUpperCase();
    $("acc-title").textContent = a.fullName || "-";
    $("acc-username-top").textContent = a.username;
    $("acc-role-badge").innerHTML = '<span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ' + (isMember ? BADGE.neutral : BADGE.info) + '">' + e(a.role) + '</span>';
    $("acc-username").value = a.username;
    $("acc-fullname").value = a.fullName || "";
    $("acc-email").value = a.email || "";
    // Nama anggota dikelola petugas; staf boleh mengubah namanya sendiri.
    $("acc-fullname").readOnly = isMember;
    $("acc-fullname").className = $("acc-fullname").className.replace(/\s*(bg-slate-50 text-slate-500)/, "");
    if (isMember) $("acc-fullname").className += " bg-slate-50 text-slate-500";
    $("acc-name-hint").classList.toggle("hidden", !isMember);
    $("member-fields").classList.toggle("hidden", !(isMember && a.member));
    if (isMember && a.member) {
      $("acc-phone").value = a.member.phone || "";
      $("acc-address").value = a.member.address || "";
      $("acc-mtype").textContent = a.member.memberType || "-";
      $("acc-unit").textContent = a.member.unitClass || "-";
      $("acc-expiry").textContent = UI.date(a.member.expiryDate);
    }
    $("admin-card").classList.toggle("hidden", !ADMINS.includes(a.role));
  }

  // ---- muat data akun
  const r = await LibraryAPI.call("getMyAccount");
  if (!r.success) { if (!sessionLost(r)) UI.toast(r.message || "Gagal memuat akun.", "err"); $("acc-title").textContent = "Akun tidak dapat dimuat"; return; }
  fill(r.data);

  // ---- simpan profil
  $("profile-form").onsubmit = async ev => {
    ev.preventDefault();
    const msg = $("profile-msg"), btn = $("profile-save");
    const email = $("acc-email").value.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { say(msg, "Format email tidak valid.", false); return; }
    const payload = { email };
    if (acct.role === "Anggota") { payload.phone = $("acc-phone").value.trim(); payload.address = $("acc-address").value.trim(); }
    else payload.fullName = $("acc-fullname").value.trim();
    btn.disabled = true;
    const res = await LibraryAPI.call("updateMyAccount", payload);
    btn.disabled = false;
    if (res.success) {
      localStorage.setItem(APP_CONFIG.USER_KEY, JSON.stringify(res.data.user)); // header ikut diperbarui
      fill(res.data.account);
      AppNav.render();
      say(msg, res.message, true); UI.toast(res.message);
    } else if (!sessionLost(res)) { say(msg, res.message || "Gagal menyimpan.", false); }
  };

  // ---- password
  const pwCur = $("pw-current"), pwNew = $("pw-new"), pwCon = $("pw-confirm");
  const rules = () => ({
    len: pwNew.value.length >= 8,
    mix: /[A-Za-z]/.test(pwNew.value) && /[0-9]/.test(pwNew.value),
    diff: pwNew.value.length > 0 && pwNew.value !== pwCur.value,
    same: pwNew.value.length > 0 && pwNew.value === pwCon.value
  });
  function paintRules() {
    const st = rules();
    document.querySelectorAll("#pw-rules [data-rule]").forEach(li => {
      const ok = st[li.dataset.rule];
      li.className = ok ? "text-emerald-600" : "text-slate-500";
      li.querySelector("i").className = ok ? "fa-solid fa-circle-check w-4" : "fa-regular fa-circle w-4";
    });
  }
  [pwCur, pwNew, pwCon].forEach(x => x.addEventListener("input", paintRules));
  $("pw-show").onchange = ev => [pwCur, pwNew, pwCon].forEach(x => x.type = ev.target.checked ? "text" : "password");

  $("password-form").onsubmit = async ev => {
    ev.preventDefault();
    const msg = $("pw-msg"), btn = $("pw-save"), st = rules();
    if (!pwCur.value) { say(msg, "Password saat ini wajib diisi.", false); return; }
    if (!st.len) { say(msg, "Password baru minimal 8 karakter.", false); return; }
    if (!st.mix) { say(msg, "Password baru harus mengandung huruf dan angka.", false); return; }
    if (!st.diff) { say(msg, "Password baru harus berbeda dari password saat ini.", false); return; }
    if (!st.same) { say(msg, "Pengulangan password tidak cocok.", false); return; }
    btn.disabled = true;
    const res = await LibraryAPI.call("changeMyPassword", { currentPassword: pwCur.value, newPassword: pwNew.value });
    btn.disabled = false;
    if (res.success) {
      pwCur.value = pwNew.value = pwCon.value = ""; paintRules();
      say(msg, res.message, true); UI.toast(res.message);
    } else if (!sessionLost(res)) { say(msg, res.message || "Gagal mengubah password.", false); }
  };
})();
