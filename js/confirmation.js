// =========================================
// قراءة بيانات الحجز
// =========================================

const raw = localStorage.getItem("bookingData");

if (!raw) {
    alert("لا توجد بيانات حجز.");
    location.href = "index.html";
    throw new Error("Missing booking data");
}

let booking;

try {
    booking = JSON.parse(raw);
} catch {
    alert("بيانات الحجز غير صالحة.");
    location.href = "index.html";
    throw new Error("Invalid booking data");
}

function formatTime12(value) {
    if (!value) return "-";
    const match = String(value).match(/^(\d{1,2}):(\d{2})/);
    if (!match) return value;
    let hour = Number(match[1]); const minute = match[2];
    const period = hour >= 12 ? "مساءً" : "صباحًا";
    hour = hour % 12 || 12;
    return `${String(hour).padStart(2,"0")}:${minute} ${period}`;
}

function set(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value ?? "-";
}

function normalizeWhatsAppPhone(value) {
    let phone = String(value || "").replace(/[^0-9+]/g, "");
    if (phone.startsWith("+20")) return phone.slice(1);
    if (phone.startsWith("20") && phone.length === 12) return phone;
    if (phone.startsWith("0") && phone.length === 11) return "20" + phone.slice(1);
    return phone;
}

const isConfirmed = booking.status === "confirmed";
const managerName = booking.bookingManagerName || "مسؤول الحجز";
const managerPhone = booking.bookingManagerPhone || "";

const title = document.querySelector(".confirmation-card h1");
const successText = document.querySelector(".success-text");
const notice = document.querySelector(".notice");

if (title) {
    title.textContent = isConfirmed
        ? "تم تأكيد الحجز بنجاح"
        : "تم تسجيل الحجز بنجاح";
}

if (successText) {
    successText.textContent = isConfirmed
        ? "شكرًا لك، تم تأكيد حجزك بنجاح."
        : "شكرًا لك، تم تسجيل طلب الحجز وسيتم تأكيده من الإدارة.";
}

if (notice) {
    notice.textContent = isConfirmed
        ? `يرجى الاحتفاظ ببيانات الحجز وإظهارها عند الدخول. مسؤول الحجز: ${managerName}.`
        : `الحجز حاليًا قيد الانتظار حتى تقوم الإدارة بتأكيده. مسؤول الحجز: ${managerName}.`;
}

set("bookingEvent", booking.eventName);
set("bookingDate", booking.eventDate);
set("bookingTime", formatTime12(booking.eventTime));
set("bookingName", booking.name);
set("bookingPhone", booking.phone);
set("bookingSeats", (booking.seats || []).join(" - "));
set("bookingCount", `${(booking.seats || []).length} تذكرة`);
set("bookingTotal", `${booking.total || 0} جنيه`);
set("bookingManager", `${managerName}${managerPhone ? ` - ${managerPhone}` : ""}`);

const bookingNumber = booking.bookingNumber ||
    `BK-${String(booking.id || Date.now()).slice(-8).toUpperCase()}`;

set("bookingNumber", bookingNumber);

const whatsappBtn = document.getElementById("whatsappBtn");

if (whatsappBtn) {
    if (!managerPhone) {
        whatsappBtn.disabled = true;
        whatsappBtn.textContent = "📱 رقم مسؤول الحجز غير متاح";
    } else {
        whatsappBtn.textContent = `📱 إرسال الحجز إلى ${managerName}`;

        whatsappBtn.addEventListener("click", () => {
            const message =
`🎭 حجز المسرح

رقم الحجز: ${bookingNumber}
الحفلة: ${booking.eventName || "-"}
التاريخ: ${booking.eventDate || "-"}
الوقت: ${booking.eventTime || "-"}

👤 الاسم: ${booking.name || "-"}
📱 رقم الموبايل: ${booking.phone || "-"}
🎟️ المقاعد: ${(booking.seats || []).join(" - ")}
🎫 عدد التذاكر: ${(booking.seats || []).length}
💰 الإجمالي: ${booking.total || 0} جنيه

${isConfirmed ? "✅ تم تأكيد الحجز" : "⏳ الحجز قيد انتظار تأكيد الإدارة"}`;

            const target = normalizeWhatsAppPhone(managerPhone);
            window.open(
                `https://wa.me/${target}?text=${encodeURIComponent(message)}`,
                "_blank",
                "noopener,noreferrer"
            );
        });
    }
}

const backBtn = document.getElementById("backBtn");

if (backBtn) {
    backBtn.addEventListener("click", () => {
        location.href = "index.html";
    });
}
