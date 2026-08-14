// =========================================
// Firebase
// =========================================

import {
    db,
    auth,
    googleProvider,
    ADMIN_EMAIL,

    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    setDoc,
    updateDoc,
    writeBatch,
    deleteDoc,
    query,
    where,
    serverTimestamp,

    signInWithPopup,
    signOut,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createManagedUser
} from "./firebase.js";


// =========================================
// Elements
// =========================================

const loginBox = document.getElementById("loginBox");
const adminApp = document.getElementById("adminApp");
const googleLoginBtn = document.getElementById("googleLoginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginMessage = document.getElementById("loginMessage");
const adminEmail = document.getElementById("adminEmail");
const eventsAdminList = document.getElementById("eventsAdminList");
const newEventBtn = document.getElementById("newEventBtn");
const eventEditor = document.getElementById("eventEditor");
const editorTitle = document.getElementById("editorTitle");
const cancelEventBtn = document.getElementById("cancelEventBtn");
const eventIdInput = document.getElementById("eventId");
const eventName = document.getElementById("eventName");
const eventDate = document.getElementById("eventDate");
const eventTime = document.getElementById("eventTime");
const eventPrice = document.getElementById("eventPrice");
const eventPosterUrl = document.getElementById("eventPosterUrl");
const posterPreview = document.getElementById("posterPreview");
const posterPreviewImage = document.getElementById("posterPreviewImage");
const bookingManagerName = document.getElementById("bookingManagerName");
const bookingManagerPhone = document.getElementById("bookingManagerPhone");
const eventActive = document.getElementById("eventActive");
const saveEventBtn = document.getElementById("saveEventBtn");
const eventMessage = document.getElementById("eventMessage");
const bookingsList = document.getElementById("bookingsList");
const bookingSearch = document.getElementById("bookingSearch");
const bookingModal = document.getElementById("bookingModal");
const closeBookingModal = document.getElementById("closeBookingModal");
const editBookingId = document.getElementById("editBookingId");
const editEventId = document.getElementById("editEventId");
const editName = document.getElementById("editName");
const editPhone = document.getElementById("editPhone");
const editSeats = document.getElementById("editSeats");
const bookingEditMessage = document.getElementById("bookingEditMessage");
const confirmBookingBtn = document.getElementById("confirmBookingBtn");
const saveBookingBtn = document.getElementById("saveBookingBtn");
const deleteBookingBtn = document.getElementById("deleteBookingBtn");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const emailLoginBtn = document.getElementById("emailLoginBtn");
const userManagementPanel = document.getElementById("userManagementPanel");
const newUserBtn = document.getElementById("newUserBtn");
const userEditor = document.getElementById("userEditor");
const userName = document.getElementById("userName");
const userPhone = document.getElementById("userPhone");
const userEmail = document.getElementById("userEmail");
const userPassword = document.getElementById("userPassword");
const userActive = document.getElementById("userActive");
const userId = document.getElementById("userId");
const userEventAssignments = document.getElementById("userEventAssignments");
const saveUserBtn = document.getElementById("saveUserBtn");
const cancelUserBtn = document.getElementById("cancelUserBtn");
const userMessage = document.getElementById("userMessage");
const usersList = document.getElementById("usersList");


// =========================================
// Data
// =========================================

let events = [];
let bookings = [];
let currentPosterUrl = "";
let currentUser = null;
let currentRole = "";
let currentUserProfile = null;
let managedUsers = [];


// =========================================
// Helpers
// =========================================

function escapeHTML(value) {
    return String(value ?? "").replace(
        /[&<>"']/g,
        character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[character])
    );
}

function isSuperAdmin() {
    return !!(currentUser && currentUser.email && currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
}

function showMessage(element, message, type = "") {
    if (!element) return;
    element.textContent = message;
    element.className = `message ${type}`;
}

function formatDate(value) {
    if (!value) return "-";
    try {
        const date = new Date(`${value}T00:00:00`);
        if (Number.isNaN(date.getTime())) return value;
        return new Intl.DateTimeFormat("ar-EG", {
            year: "numeric",
            month: "long",
            day: "numeric"
        }).format(date);
    } catch {
        return value;
    }
}

function formatTime12(value) {
    if (!value) return "-";
    const match = String(value).match(/^(\d{1,2}):(\d{2})/);
    if (!match) return value;
    let hour = Number(match[1]);
    const minute = match[2];
    const period = hour >= 12 ? "مساءً" : "صباحًا";
    hour = hour % 12 || 12;
    return `${String(hour).padStart(2, "0")}:${minute} ${period}`;
}

function formatCreatedAt(value) {
    if (!value) return "-";
    try {
        const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        const datePart = new Intl.DateTimeFormat("ar-EG", {year:"numeric",month:"2-digit",day:"2-digit"}).format(date);
        let hour = date.getHours();
        const minute = String(date.getMinutes()).padStart(2,"0");
        const period = hour >= 12 ? "مساءً" : "صباحًا";
        hour = hour % 12 || 12;
        return `${datePart} — ${String(hour).padStart(2,"0")}:${minute} ${period}`;
    } catch { return "-"; }
}

function normalizeEgyptianPhone(value) {
    let phone = String(value || "").replace(/[\s()-]/g, "");
    if (phone.startsWith("+20")) phone = "0" + phone.slice(3);
    if (phone.startsWith("20") && phone.length === 12) phone = "0" + phone.slice(2);
    return phone;
}

function isValidEgyptianPhone(value) {
    return /^01[0-9]{9}$/.test(normalizeEgyptianPhone(value));
}

function isValidPosterUrl(value) {
    try {
        const url = new URL(String(value).trim());
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

function resetPosterPreview() {
    currentPosterUrl = "";
    if (posterPreview) posterPreview.style.display = "none";
    if (posterPreviewImage) posterPreviewImage.removeAttribute("src");
    if (eventPosterUrl) eventPosterUrl.value = "";
}

function showPosterPreview(url) {
    if (!url || !posterPreview || !posterPreviewImage) return;
    posterPreviewImage.src = url;
    posterPreview.style.display = "block";
}


// =========================================
// Google Login
// =========================================

if (googleLoginBtn) {
    googleLoginBtn.addEventListener("click", async () => {
        showMessage(loginMessage, "جاري تسجيل الدخول...");
        googleLoginBtn.disabled = true;

        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            if (!user.email || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
                await signOut(auth);
                showMessage(loginMessage, "هذا الحساب غير مصرح له بالدخول.", "error");
            }
        } catch (error) {
            console.error("Login error:", error);
            showMessage(
                loginMessage,
                error?.code === "auth/popup-closed-by-user"
                    ? "تم إغلاق نافذة تسجيل الدخول."
                    : "تعذر تسجيل الدخول. تأكد من تفعيل Google Authentication.",
                "error"
            );
        } finally {
            googleLoginBtn.disabled = false;
        }
    });
}


// =========================================
// Authentication
// =========================================

onAuthStateChanged(auth, async user => {
    if (!loginBox || !adminApp) return;
    if (!user) {
        loginBox.style.display = "block";
        adminApp.style.display = "none";
        return;
    }

    try {
        currentUser = user;
        if (user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            currentRole = "superadmin";
            currentUserProfile = { name: "المدير الرئيسي", email: user.email, active: true, allowedEventIds: [] };
        } else {
            const profileSnap = await getDoc(doc(db, "users", user.uid));
            if (!profileSnap.exists() || profileSnap.data().active !== true || profileSnap.data().role !== "bookingAdmin") {
                await signOut(auth);
                showMessage(loginMessage, "هذا الحساب غير مصرح له بالدخول.", "error");
                return;
            }
            currentUserProfile = profileSnap.data();
            currentRole = "bookingAdmin";
        }

        loginBox.style.display = "none";
        adminApp.style.display = "block";
        if (adminEmail) adminEmail.textContent = currentUserProfile.name ? `${currentUserProfile.name} — ${user.email}` : user.email;
        if (userManagementPanel) userManagementPanel.style.display = isSuperAdmin() ? "block" : "none";
        if (newEventBtn) newEventBtn.style.display = isSuperAdmin() ? "inline-block" : "none";
        if (isSuperAdmin()) await loadManagedUsers();
        await loadAdminData();
    } catch (error) {
        console.error("Auth profile error:", error);
        await signOut(auth);
        showMessage(loginMessage, "تعذر تحميل صلاحيات المستخدم.", "error");
    }
});

if (emailLoginBtn) {
    emailLoginBtn.addEventListener("click", async () => {
        const email = loginEmail?.value.trim();
        const password = loginPassword?.value || "";
        if (!email || !password) { showMessage(loginMessage, "اكتب الإيميل وكلمة المرور.", "error"); return; }
        emailLoginBtn.disabled = true;
        showMessage(loginMessage, "جاري تسجيل الدخول...");
        try { await signInWithEmailAndPassword(auth, email, password); }
        catch (error) {
            console.error(error);
            showMessage(loginMessage, "الإيميل أو كلمة المرور غير صحيحة، أو المستخدم غير مفعل.", "error");
        }
        finally { emailLoginBtn.disabled = false; }
    });
}

// =========================================
// Logout
// =========================================

if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout error:", error);
        }
    });
}


// =========================================
// Load Events
// =========================================

async function loadEvents() {
    if (isSuperAdmin()) {
        const snapshot = await getDocs(collection(db, "events"));
        events = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
        const ids = Array.isArray(currentUserProfile?.allowedEventIds) ? currentUserProfile.allowedEventIds : [];
        const results = await Promise.all(ids.map(id => getDoc(doc(db, "events", id))));
        events = results.filter(snap => snap.exists()).map(snap => ({ id: snap.id, ...snap.data() }));
    }
    events.sort((a,b) => `${a.date||""} ${a.time||""}`.localeCompare(`${b.date||""} ${b.time||""}`));
}

// =========================================
// Load Bookings
// =========================================

async function syncSeatLocksForEvent(eventId, eventBookings) {
    // Keep the public seat map synchronized with ALL existing bookings,
    // including bookings created before seatLocks were introduced.
    // Customer data remains private in /bookings; only seat status is public.
    const locksRef = collection(db, "events", eventId, "seatLocks");
    const lockSnapshot = await getDocs(locksRef);

    const activeBookings = new Map();
    for (const booking of eventBookings) {
        if (booking.status === "pending" || booking.status === "confirmed") {
            activeBookings.set(booking.id, booking);
        }
    }

    const batch = writeBatch(db);
    let operations = 0;
    const lockedSeats = new Map();

    // First remove stale locks and remember valid existing locks.
    for (const lockDoc of lockSnapshot.docs) {
        const lock = lockDoc.data();
        const owner = lock.bookingId ? activeBookings.get(lock.bookingId) : null;

        if (!owner) {
            batch.delete(lockDoc.ref);
            operations++;
            continue;
        }

        const seatNumber = lock.seatNumber || lockDoc.id;
        if (seatNumber) lockedSeats.set(seatNumber, lock.bookingId);
    }

    // Create missing locks and correct status for existing locks.
    for (const booking of activeBookings.values()) {
        const seats = Array.isArray(booking.seats) ? booking.seats : [];
        const status = booking.status === "confirmed" ? "confirmed" : "pending";
        const bookingNumber = booking.bookingNumber || `BK-${booking.id.slice(-8).toUpperCase()}`;

        for (const seatNumber of seats) {
            const normalizedSeat = String(seatNumber).trim().toUpperCase();
            if (!normalizedSeat) continue;

            const existingOwner = lockedSeats.get(normalizedSeat);

            // Never overwrite a seat belonging to another booking.
            // This protects old data if duplicate bookings already exist.
            if (existingOwner && existingOwner !== booking.id) continue;

            batch.set(doc(db, "events", eventId, "seatLocks", normalizedSeat), {
                seatNumber: normalizedSeat,
                bookingId: booking.id,
                bookingNumber,
                status,
                updatedAt: serverTimestamp()
            }, { merge: true });
            operations++;
            lockedSeats.set(normalizedSeat, booking.id);
        }
    }

    if (operations > 0) {
        await batch.commit();
    }
}

async function loadBookings() {
    bookings = [];

    for (const event of events) {
        const snapshot = await getDocs(
            collection(db, "events", event.id, "bookings")
        );

        const eventBookings = [];

        snapshot.forEach(documentSnapshot => {
            const data = documentSnapshot.data();

            eventBookings.push({
                id: documentSnapshot.id,
                eventId: event.id,
                eventName: event.name || data.eventName || "-",
                eventDate: event.date || data.eventDate || "-",
                eventTime: event.time || data.eventTime || "-",
                ...data
            });
        });

        bookings.push(...eventBookings);

        // This repairs legacy bookings that do not have seatLocks yet.
        // If the current user is allowed to manage this event, the rules
        // allow the synchronization writes below.
        await syncSeatLocksForEvent(event.id, eventBookings);
    }
}


// =========================================
// Load Admin Data
// =========================================

async function loadAdminData() {
    if (eventsAdminList) eventsAdminList.innerHTML = "<p>جاري تحميل الحفلات...</p>";
    if (bookingsList) bookingsList.innerHTML = "<p>جاري تحميل الحجوزات...</p>";

    try {
        await loadEvents();
        renderEvents();
        if (isSuperAdmin()) { renderUserEventAssignments(); renderUsers(); }
    } catch (error) {
        console.error("Load events error:", error);
        if (eventsAdminList) {
            eventsAdminList.innerHTML = `
                <p class="error">حدث خطأ أثناء تحميل الحفلات.<br>${escapeHTML(error?.message || "Unknown error")}</p>
            `;
        }
    }

    try {
        await loadBookings();
        renderBookings();
    } catch (error) {
        console.error("Load bookings error:", error);
        if (bookingsList) {
            bookingsList.innerHTML = `
                <p class="error">حدث خطأ أثناء تحميل الحجوزات.<br>${escapeHTML(error?.message || "Unknown error")}</p>
            `;
        }
    }
}


// =========================================
// Render Events
// =========================================

function renderEvents() {
    if (!eventsAdminList) return;

    if (!events.length) {
        eventsAdminList.innerHTML = `<div class="empty">لا توجد حفلات مضافة حاليًا.</div>`;
        return;
    }

    eventsAdminList.innerHTML = events.map(event => {
        const active = event.active === true;
        const managerName = event.bookingManagerName || "غير محدد";
        const managerPhone = event.bookingManagerPhone || "غير محدد";

        return `
            <div class="admin-event-card">
                <div class="admin-event-info">
                    ${event.poster ? `
                        <img class="admin-event-poster" src="${escapeHTML(event.poster)}" alt="${escapeHTML(event.name || "")}">
                    ` : ""}

                    <div>
                        <h3>🎭 ${escapeHTML(event.name || "حفلة بدون اسم")}</h3>
                        <p>📅 ${escapeHTML(formatDate(event.date))}</p>
                        <p>🕐 ${escapeHTML(formatTime12(event.time))}</p>
                        <p>🎟️ ${Number(event.price || 0)} جنيه</p>
                        <p>👤 مسؤول الحجز: <strong>${escapeHTML(managerName)}</strong></p>
                        <p>📱 رقم المسؤول: <strong>${escapeHTML(managerPhone)}</strong></p>
                        <p>الحالة: <strong>${active ? "متاحة للحجز" : "متوقفة"}</strong></p>
                    </div>
                </div>

                <div class="admin-event-actions">
                    <button type="button" class="edit-event-btn" data-id="${escapeHTML(event.id)}">✏️ تعديل</button>
                    <button type="button" class="toggle-event-btn" data-id="${escapeHTML(event.id)}">
                        ${active ? "⛔ إيقاف الحجز" : "✅ تفعيل الحجز"}
                    </button>
                    <button type="button" class="delete-event-btn danger" data-id="${escapeHTML(event.id)}">🗑️ حذف</button>
                </div>
            </div>
        `;
    }).join("");

    document.querySelectorAll(".edit-event-btn").forEach(button => {
        button.addEventListener("click", () => editEvent(button.dataset.id));
    });

    document.querySelectorAll(".toggle-event-btn").forEach(button => {
        button.addEventListener("click", () => toggleEvent(button.dataset.id));
    });

    document.querySelectorAll(".delete-event-btn").forEach(button => {
        button.addEventListener("click", () => deleteEvent(button.dataset.id));
    });
}


// =========================================
// User Management (Super Admin)
// =========================================

async function loadManagedUsers() {
    if (!isSuperAdmin() || !usersList) return;
    const snapshot = await getDocs(collection(db, "users"));
    managedUsers = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderUsers();
    renderUserEventAssignments();
}

function renderUserEventAssignments(selected = []) {
    if (!userEventAssignments) return;
    if (!events.length) { userEventAssignments.innerHTML = '<p>أضف حفلات أولًا.</p>'; return; }
    userEventAssignments.innerHTML = events.map(event => `<label class="assignment-item"><input type="checkbox" class="user-event-check" value="${escapeHTML(event.id)}" ${selected.includes(event.id)?"checked":""}> <span>🎭 ${escapeHTML(event.name||"حفلة")}</span></label>`).join("");
}

function renderUsers() {
    if (!usersList) return;
    if (!managedUsers.length) { usersList.innerHTML = '<div class="empty">لا يوجد مستخدمون إضافيون.</div>'; return; }
    usersList.innerHTML = managedUsers.filter(u=>u.role!=="superadmin").map(u => {
        const names = (u.allowedEventIds||[]).map(id => events.find(e=>e.id===id)?.name).filter(Boolean);
        return `<div class="managed-user-card"><div><h3>👤 ${escapeHTML(u.name||"بدون اسم")}</h3><p>📧 ${escapeHTML(u.email||"-")}</p><p>📱 ${escapeHTML(u.phone||"-")}</p><p>🎭 ${escapeHTML(names.length?names.join("، "):"لا توجد حفلات مخصصة")}</p><p>الحالة: <strong>${u.active===true?"✅ فعال":"⛔ متوقف"}</strong></p></div><div class="admin-event-actions"><button type="button" class="edit-user-btn" data-id="${escapeHTML(u.id)}">✏️ تعديل</button><button type="button" class="toggle-user-btn" data-id="${escapeHTML(u.id)}">${u.active===true?"⛔ إيقاف":"✅ تفعيل"}</button></div></div>`;
    }).join("");
    document.querySelectorAll('.edit-user-btn').forEach(b=>b.addEventListener('click',()=>openUserEditor(b.dataset.id)));
    document.querySelectorAll('.toggle-user-btn').forEach(b=>b.addEventListener('click',()=>toggleManagedUser(b.dataset.id)));
}

function clearUserForm() {
    if(userId) userId.value=""; if(userName) userName.value=""; if(userPhone) userPhone.value=""; if(userEmail) userEmail.value=""; if(userPassword) userPassword.value=""; if(userActive) userActive.checked=true; showMessage(userMessage,""); renderUserEventAssignments([]);
}

function openUserEditor(id="") {
    if(!isSuperAdmin()) return;
    clearUserForm();
    if(id){ const u=managedUsers.find(x=>x.id===id); if(!u)return; userId.value=u.id; userName.value=u.name||""; userPhone.value=u.phone||""; userEmail.value=u.email||""; userEmail.disabled=true; userPassword.placeholder="كلمة مرور جديدة اختيارية"; userActive.checked=u.active===true; renderUserEventAssignments(u.allowedEventIds||[]); } else { userEmail.disabled=false; renderUserEventAssignments([]); }
    userEditor.style.display="block"; userEditor.scrollIntoView({behavior:"smooth"});
}

if(newUserBtn) newUserBtn.addEventListener('click',()=>openUserEditor());
if(cancelUserBtn) cancelUserBtn.addEventListener('click',()=>{userEditor.style.display='none';clearUserForm();});

async function saveManagedUser(){
    if(!isSuperAdmin())return;
    const name=userName.value.trim(), phone=normalizeEgyptianPhone(userPhone.value.trim()), email=userEmail.value.trim().toLowerCase(), password=userPassword.value;
    const selected=[...document.querySelectorAll('.user-event-check:checked')].map(x=>x.value);
    if(!name){showMessage(userMessage,'اكتب اسم المستخدم.','error');return;}
    if(!email || !email.includes('@')){showMessage(userMessage,'اكتب إيميل صحيح.','error');return;}
    if(!userId.value && password.length<6){showMessage(userMessage,'كلمة المرور يجب أن تكون 6 أحرف أو أكثر.','error');return;}
    if(phone && !isValidEgyptianPhone(phone)){showMessage(userMessage,'رقم الموبايل غير صحيح.','error');return;}
    saveUserBtn.disabled=true; saveUserBtn.textContent='جاري الحفظ...';
    try{
        if(userId.value){
            const data={name,phone,email,active:userActive.checked,allowedEventIds:selected,role:'bookingAdmin',updatedAt:serverTimestamp()};
            await updateDoc(doc(db,'users',userId.value),data);
            showMessage(userMessage,'تم تعديل المستخدم بنجاح.','success');
        }else{
            const created=await createManagedUser(email,password);
            await setDoc(doc(db,'users',created.uid),{name,phone,email,active:userActive.checked,allowedEventIds:selected,role:'bookingAdmin',createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
            showMessage(userMessage,'تم إنشاء المستخدم بنجاح.','success');
        }
        await loadManagedUsers();
        setTimeout(()=>{userEditor.style.display='none';clearUserForm();},600);
    }catch(error){console.error('User save error',error);showMessage(userMessage,error?.code==='auth/email-already-in-use'?'الإيميل مستخدم بالفعل.':`حدث خطأ: ${error?.message||error}`,'error');}
    finally{saveUserBtn.disabled=false;saveUserBtn.textContent='حفظ المستخدم';}
}
if(saveUserBtn) saveUserBtn.addEventListener('click',saveManagedUser);

async function toggleManagedUser(id){ const u=managedUsers.find(x=>x.id===id); if(!u)return; try{await updateDoc(doc(db,'users',id),{active:u.active!==true,updatedAt:serverTimestamp()});await loadManagedUsers();}catch(e){console.error(e);alert('تعذر تغيير حالة المستخدم.');}}

// =========================================
// New Event
// =========================================

if (newEventBtn) {
    newEventBtn.addEventListener("click", () => {
        clearEventForm();
        if (editorTitle) editorTitle.textContent = "إضافة حفلة";
        if (eventEditor) {
            eventEditor.style.display = "block";
            eventEditor.scrollIntoView({ behavior: "smooth" });
        }
    });
}


// =========================================
// Poster URL Input
// =========================================

if (eventPosterUrl) {
    eventPosterUrl.addEventListener("input", () => {
        const url = eventPosterUrl.value.trim();

        if (!url) {
            if (posterPreview) posterPreview.style.display = "none";
            if (posterPreviewImage) posterPreviewImage.removeAttribute("src");
            return;
        }

        showPosterPreview(url);
    });

    eventPosterUrl.addEventListener("change", () => {
        const url = eventPosterUrl.value.trim();
        if (!url) return;

        if (!isValidPosterUrl(url)) {
            showMessage(eventMessage, "اكتب رابط صورة صحيح يبدأ بـ https:// أو http://.", "error");
            return;
        }

        showMessage(eventMessage, "تم إدخال رابط الصورة. اضغط حفظ الحفلة.", "success");
    });
}


// =========================================
// Clear Event Form
// =========================================

function clearEventForm() {
    if (eventIdInput) eventIdInput.value = "";
    if (eventName) eventName.value = "";
    if (eventDate) eventDate.value = "";
    if (eventTime) eventTime.value = "";
    if (eventPrice) eventPrice.value = "";
    if (bookingManagerName) bookingManagerName.value = "";
    if (bookingManagerPhone) bookingManagerPhone.value = "";
    if (eventActive) eventActive.checked = true;
    resetPosterPreview();
    showMessage(eventMessage, "");
}


// =========================================
// Edit Event
// =========================================

function editEvent(id) {
    const event = events.find(item => item.id === id);
    if (!event) return;

    eventIdInput.value = event.id;
    eventName.value = event.name || "";
    eventDate.value = event.date || "";
    eventTime.value = event.time || "";
    eventPrice.value = event.price || 0;
    bookingManagerName.value = event.bookingManagerName || "";
    bookingManagerPhone.value = event.bookingManagerPhone || "";
    eventActive.checked = event.active === true;

    currentPosterUrl = event.poster || "";
    if (eventPosterUrl) eventPosterUrl.value = currentPosterUrl;
    if (currentPosterUrl) showPosterPreview(currentPosterUrl);
    else resetPosterPreview();

    editorTitle.textContent = "تعديل الحفلة";
    eventEditor.style.display = "block";
    eventEditor.scrollIntoView({ behavior: "smooth" });
}


// =========================================
// Cancel Event
// =========================================

if (cancelEventBtn) {
    cancelEventBtn.addEventListener("click", () => {
        eventEditor.style.display = "none";
        clearEventForm();
    });
}


// =========================================
// Save Event
// =========================================

if (saveEventBtn) saveEventBtn.addEventListener("click", saveEvent);

async function saveEvent() {
    if (!isSuperAdmin()) { alert("ليس لديك صلاحية إدارة الحفلات."); return; }
    const name = eventName.value.trim();
    const date = eventDate.value;
    const time = eventTime.value;
    const price = Number(eventPrice.value || 0);
    const managerName = bookingManagerName.value.trim();
    const managerPhone = normalizeEgyptianPhone(bookingManagerPhone.value.trim());
    const active = eventActive.checked;
    const poster = eventPosterUrl?.value.trim() || "";
    const existingId = eventIdInput.value;

    if (!name) {
        showMessage(eventMessage, "اكتب اسم الحفلة.", "error");
        eventName.focus();
        return;
    }

    if (!date) {
        showMessage(eventMessage, "اختر تاريخ الحفلة.", "error");
        eventDate.focus();
        return;
    }

    if (!time) {
        showMessage(eventMessage, "اختر وقت الحفلة.", "error");
        eventTime.focus();
        return;
    }

    if (!Number.isFinite(price) || price < 0) {
        showMessage(eventMessage, "السعر غير صحيح.", "error");
        return;
    }

    if (!managerName) {
        showMessage(eventMessage, "اكتب اسم مسؤول الحجز.", "error");
        bookingManagerName.focus();
        return;
    }

    if (!isValidEgyptianPhone(managerPhone)) {
        showMessage(eventMessage, "اكتب رقم مسؤول الحجز المصري صحيحًا من 11 رقم.", "error");
        bookingManagerPhone.focus();
        return;
    }

    if (poster && !isValidPosterUrl(poster)) {
        showMessage(eventMessage, "رابط صورة الحفلة غير صحيح. استخدم رابطًا مباشرًا يبدأ بـ https:// أو http://.", "error");
        eventPosterUrl?.focus();
        return;
    }


    saveEventBtn.disabled = true;
    saveEventBtn.textContent = "جاري الحفظ...";

    try {
        let id = existingId;

        const baseData = {
            name,
            date,
            time,
            price,
            poster,
            bookingManagerName: managerName,
            bookingManagerPhone: managerPhone,
            active,
            updatedAt: serverTimestamp()
        };

        if (id) {
            await updateDoc(doc(db, "events", id), baseData);
            showMessage(eventMessage, "تم تعديل الحفلة بنجاح.", "success");
        } else {
            await addDoc(collection(db, "events"), {
                ...baseData,
                createdAt: serverTimestamp()
            });

            showMessage(eventMessage, "تم إضافة الحفلة بنجاح.", "success");
        }

        await loadEvents();
        renderEvents();

        setTimeout(() => {
            if (eventEditor) eventEditor.style.display = "none";
            clearEventForm();
        }, 700);
    } catch (error) {
        console.error("Save event error:", error);
        showMessage(
            eventMessage,
            `حدث خطأ أثناء حفظ الحفلة: ${error?.message || ""}`,
            "error"
        );
    } finally {
        saveEventBtn.disabled = false;
        saveEventBtn.textContent = "حفظ الحفلة";
    }
}


// =========================================
// Toggle Event
// =========================================

async function toggleEvent(id) {
    if (!isSuperAdmin()) { alert("ليس لديك صلاحية تغيير الحفلات."); return; }
    const event = events.find(item => item.id === id);
    if (!event) return;

    try {
        await updateDoc(doc(db, "events", id), {
            active: event.active !== true,
            updatedAt: serverTimestamp()
        });

        await loadEvents();
        renderEvents();
    } catch (error) {
        console.error("Toggle event error:", error);
        alert("حدث خطأ أثناء تغيير حالة الحفلة.");
    }
}


// =========================================
// Delete Event
// =========================================

async function deleteEvent(id) {
    if (!isSuperAdmin()) { alert("ليس لديك صلاحية حذف الحفلات."); return; }
    const event = events.find(item => item.id === id);
    if (!event) return;

    const relatedBookings = bookings.filter(booking => booking.eventId === id);

    if (relatedBookings.length) {
        alert("لا يمكن حذف حفلة بها حجوزات. قم بإيقاف الحجز بدلًا من حذفها.");
        return;
    }

    if (!confirm(`هل أنت متأكد من حذف حفلة "${event.name || ""}"؟`)) return;

    try {
        await deleteDoc(doc(db, "events", id));
        await loadEvents();
        await loadBookings();
        renderEvents();
        renderBookings();
        alert("تم حذف الحفلة بنجاح.");
    } catch (error) {
        console.error("Delete event error:", error);
        alert("حدث خطأ أثناء حذف الحفلة.");
    }
}


// =========================================
// Render Bookings
// =========================================

function renderBookings() {
    if (!bookingsList) return;
    const search = (bookingSearch?.value || "").trim().toLowerCase();
    let filtered = bookings;
    if (search) {
        filtered = bookings.filter(booking => {
            const seats = Array.isArray(booking.seats) ? booking.seats : [];
            const number = booking.bookingNumber || `BK-${booking.id.slice(-8).toUpperCase()}`;
            return [number, booking.name, booking.phone, ...seats, booking.eventName, booking.status].join(" ").toLowerCase().includes(search);
        });
    }
    if (!filtered.length) { bookingsList.innerHTML = `<div class="empty">لا توجد حجوزات.</div>`; return; }

    const groups = new Map();
    filtered.forEach(b => { if (!groups.has(b.eventId)) groups.set(b.eventId, []); groups.get(b.eventId).push(b); });
    bookingsList.innerHTML = [...groups.entries()].map(([eventId, group]) => {
        const event = events.find(e => e.id === eventId);
        const eventName = event?.name || group[0]?.eventName || "حفلة";
        const confirmedCount = group.filter(b => b.status === "confirmed").reduce((n,b)=>n+(b.seats?.length||0),0);
        const pendingCount = group.filter(b => b.status !== "confirmed").reduce((n,b)=>n+(b.seats?.length||0),0);
        return `<section class="booking-group">
            <div class="booking-group-header"><div><h3>🎭 ${escapeHTML(eventName)}</h3><p>📅 ${escapeHTML(formatDate(event?.date || group[0]?.eventDate))} — 🕐 ${escapeHTML(formatTime12(event?.time || group[0]?.eventTime))}</p></div><div class="booking-group-stats"><span>✅ ${confirmedCount} محجوز</span><span>⏳ ${pendingCount} انتظار</span></div></div>
            <div class="booking-group-list">${group.map(renderBookingCard).join("")}</div>
        </section>`;
    }).join("");

    document.querySelectorAll(".confirm-booking-btn").forEach(b => b.addEventListener("click", () => confirmBooking(b.dataset.bookingId,b.dataset.eventId)));
    document.querySelectorAll(".edit-booking-btn").forEach(b => b.addEventListener("click", () => openBookingEditor(b.dataset.bookingId,b.dataset.eventId)));
    document.querySelectorAll(".delete-booking-btn").forEach(b => b.addEventListener("click", () => cancelBooking(b.dataset.bookingId,b.dataset.eventId)));
}

function renderBookingCard(booking) {
    const seats = Array.isArray(booking.seats) ? booking.seats : [];
    const number = booking.bookingNumber || `BK-${booking.id.slice(-8).toUpperCase()}`;
    const confirmed = booking.status === "confirmed";
    return `<div class="booking-card"><div class="booking-info"><h3>🎟️ ${escapeHTML(number)}</h3><p>👤 ${escapeHTML(booking.name||"-")}</p><p>📱 ${escapeHTML(booking.phone||"-")}</p><p>🎟️ المقاعد: <strong>${escapeHTML(seats.join(" - "))}</strong></p><p>💰 الإجمالي: <strong>${Number(booking.total||0)} جنيه</strong></p><p>الحالة: <strong class="${confirmed?"status-confirmed":"status-pending"}">${confirmed?"✅ مؤكد":"⏳ قيد الانتظار"}</strong></p><p>🕒 وقت الحجز: ${escapeHTML(formatCreatedAt(booking.createdAt))}</p></div><div class="booking-actions">${!confirmed?`<button type="button" class="confirm-booking-btn success" data-booking-id="${escapeHTML(booking.id)}" data-event-id="${escapeHTML(booking.eventId)}">✅ تأكيد الحجز</button>`:`<span class="booking-confirmed">✅ الحجز مؤكد</span>`}<button type="button" class="edit-booking-btn" data-booking-id="${escapeHTML(booking.id)}" data-event-id="${escapeHTML(booking.eventId)}">✏️ تعديل</button><button type="button" class="delete-booking-btn danger" data-booking-id="${escapeHTML(booking.id)}" data-event-id="${escapeHTML(booking.eventId)}">❌ إلغاء الحجز</button></div></div>`;
}

// =========================================
// Booking Search
// =========================================

if (bookingSearch) bookingSearch.addEventListener("input", renderBookings);


// =========================================
// Confirm Booking
// =========================================

async function confirmBooking(bookingId, eventId) {
    const booking = bookings.find(item => item.id === bookingId && item.eventId === eventId);

    if (!booking) {
        alert("لم يتم العثور على الحجز.");
        return;
    }

    if (booking.status === "confirmed") {
        alert("الحجز مؤكد بالفعل.");
        return;
    }

    const bookingNumber = booking.bookingNumber || `BK-${bookingId.slice(-8).toUpperCase()}`;
    if (!confirm(`هل تريد تأكيد الحجز ${bookingNumber}؟`)) return;

    try {
        await updateDoc(doc(db, "events", eventId, "bookings", bookingId), {
            status: "confirmed",
            updatedAt: serverTimestamp()
        });

        const confirmedBooking = { ...booking, status: "confirmed" };
        await syncSeatLocksForEvent(eventId, [
            ...bookings.filter(item => item.eventId === eventId && item.id !== bookingId),
            confirmedBooking
        ]);

        await loadBookings();
        renderBookings();
        alert("تم تأكيد الحجز بنجاح ✅");
    } catch (error) {
        console.error("Confirm booking error:", error);
        alert("حدث خطأ أثناء تأكيد الحجز.");
    }
}


// =========================================
// Open Booking Editor
// =========================================

function openBookingEditor(bookingId, eventId) {
    const booking = bookings.find(item => item.id === bookingId && item.eventId === eventId);
    if (!booking) return;

    editBookingId.value = booking.id;
    editEventId.value = booking.eventId;
    editName.value = booking.name || "";
    editPhone.value = booking.phone || "";
    editSeats.value = Array.isArray(booking.seats) ? booking.seats.join(",") : "";

    showMessage(bookingEditMessage, "");

    if (confirmBookingBtn) {
        confirmBookingBtn.style.display = booking.status === "confirmed" ? "none" : "block";
    }

    if (bookingModal) bookingModal.style.display = "flex";
}


// =========================================
// Close Booking Modal
// =========================================

if (closeBookingModal) closeBookingModal.addEventListener("click", closeBookingEditor);

function closeBookingEditor() {
    if (bookingModal) bookingModal.style.display = "none";
}


// =========================================
// Confirm From Modal
// =========================================

if (confirmBookingBtn) {
    confirmBookingBtn.addEventListener("click", async () => {
        const bookingId = editBookingId.value;
        const eventId = editEventId.value;
        if (!bookingId || !eventId) return;

        await confirmBooking(bookingId, eventId);

        const booking = bookings.find(item => item.id === bookingId && item.eventId === eventId);
        if (booking && booking.status === "confirmed") closeBookingEditor();
    });
}


// =========================================
// Save Booking Edit
// =========================================

if (saveBookingBtn) saveBookingBtn.addEventListener("click", saveBookingEdit);

async function saveBookingEdit() {
    const bookingId = editBookingId.value;
    const eventId = editEventId.value;
    const name = editName.value.trim();
    const phone = normalizeEgyptianPhone(editPhone.value.trim());
    const seats = editSeats.value.split(",").map(seat => seat.trim().toUpperCase()).filter(Boolean);

    if (!name) {
        showMessage(bookingEditMessage, "اكتب اسم العميل.", "error");
        return;
    }

    if (!isValidEgyptianPhone(phone)) {
        showMessage(bookingEditMessage, "رقم الموبايل يجب أن يكون 11 رقم ويبدأ بـ 01.", "error");
        return;
    }

    if (!seats.length) {
        showMessage(bookingEditMessage, "يجب اختيار مقعد واحد على الأقل.", "error");
        return;
    }

    if (seats.length > 6) {
        showMessage(bookingEditMessage, "يمكن حجز 6 مقاعد كحد أقصى.", "error");
        return;
    }

    if (new Set(seats).size !== seats.length) {
        showMessage(bookingEditMessage, "يوجد مقعد مكرر.", "error");
        return;
    }

    saveBookingBtn.disabled = true;
    saveBookingBtn.textContent = "جاري الحفظ...";

    try {
        const snapshot = await getDocs(collection(db, "events", eventId, "bookings"));

        const conflict = snapshot.docs.some(documentSnapshot => {
            if (documentSnapshot.id === bookingId) return false;
            const data = documentSnapshot.data();
            const otherSeats = Array.isArray(data.seats) ? data.seats : [];
            return seats.some(seat => otherSeats.includes(seat));
        });

        if (conflict) {
            showMessage(bookingEditMessage, "أحد المقاعد المختارة محجوز بالفعل لحجز آخر.", "error");
            return;
        }

        const event = events.find(item => item.id === eventId);
        const total = seats.length * Number(event?.price || 0);

        await updateDoc(doc(db, "events", eventId, "bookings", bookingId), {
            name,
            phone,
            seats,
            total,
            updatedAt: serverTimestamp()
        });

        const currentBooking = bookings.find(item => item.id === bookingId && item.eventId === eventId);
        const lockStatus = currentBooking?.status === "confirmed" ? "confirmed" : "pending";
        const lockSnapshot = await getDocs(collection(db, "events", eventId, "seatLocks"));
        const existingLocks = new Map();
        lockSnapshot.docs.forEach(lockDoc => {
            const lock = lockDoc.data();
            if (lock.bookingId === bookingId) existingLocks.set(lockDoc.id, lockDoc);
        });

        for (const [seatId, lockDoc] of existingLocks) {
            if (!seats.includes(seatId)) await deleteDoc(lockDoc.ref);
        }

        for (const seatId of seats) {
            await setDoc(doc(db, "events", eventId, "seatLocks", seatId), {
                seatNumber: seatId,
                bookingId,
                bookingNumber: currentBooking?.bookingNumber || `BK-${bookingId.slice(-8).toUpperCase()}`,
                status: lockStatus,
                updatedAt: serverTimestamp()
            });
        }

        showMessage(bookingEditMessage, "تم تعديل الحجز بنجاح.", "success");
        await loadBookings();
        renderBookings();
        setTimeout(closeBookingEditor, 700);
    } catch (error) {
        console.error("Save booking error:", error);
        showMessage(bookingEditMessage, "حدث خطأ أثناء تعديل الحجز.", "error");
    } finally {
        saveBookingBtn.disabled = false;
        saveBookingBtn.textContent = "✏️ حفظ التعديل";
    }
}


// =========================================
// Cancel Booking From Modal
// =========================================

if (deleteBookingBtn) {
    deleteBookingBtn.addEventListener("click", async () => {
        const bookingId = editBookingId.value;
        const eventId = editEventId.value;
        if (!bookingId || !eventId) return;
        await cancelBooking(bookingId, eventId, true);
    });
}


// =========================================
// Cancel Booking
// =========================================

async function cancelBooking(bookingId, eventId, fromModal = false) {
    const booking = bookings.find(item => item.id === bookingId && item.eventId === eventId);
    if (!booking) return;

    const bookingNumber = booking.bookingNumber || `BK-${bookingId.slice(-8).toUpperCase()}`;
    if (!confirm(`هل أنت متأكد من إلغاء الحجز ${bookingNumber}؟\n\nسيتم تحرير المقاعد.`)) return;

    try {
        await deleteDoc(doc(db, "events", eventId, "bookings", bookingId));

        const lockSnapshot = await getDocs(collection(db, "events", eventId, "seatLocks"));
        for (const lockDoc of lockSnapshot.docs) {
            const lock = lockDoc.data();
            if (lock.bookingId === bookingId) await deleteDoc(lockDoc.ref);
        }

        if (fromModal) closeBookingEditor();
        await loadBookings();
        renderBookings();
        alert("تم إلغاء الحجز وتحرير المقاعد بنجاح.");
    } catch (error) {
        console.error("Cancel booking error:", error);
        alert("حدث خطأ أثناء إلغاء الحجز.");
    }
}


// =========================================
// Close Modal Outside
// =========================================

if (bookingModal) {
    bookingModal.addEventListener("click", event => {
        if (event.target === bookingModal) closeBookingEditor();
    });
}
