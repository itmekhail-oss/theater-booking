// =========================================
// Firebase + Theater
// =========================================

import {
    db,
    doc,
    getDoc,
    collection,
    getDocs,
    setDoc,
    writeBatch,
    query,
    serverTimestamp
} from "./firebase.js";

import {
    theater,
    MAX_SEATS
} from "../data/theater.js";


// =========================================
// تحديد الحفلة
// =========================================

let eventId = new URLSearchParams(location.search).get("eventId");

if (!eventId) eventId = localStorage.getItem("selectedEventId");

if (!eventId) {
    alert("لم يتم تحديد الحفلة.");
    location.href = "index.html";
    throw new Error("Missing eventId");
}


// =========================================
// عناصر الصفحة
// =========================================

const theaterDiv = document.getElementById("theater");
const selectedSeatsDiv = document.getElementById("selectedSeats");
const totalPriceDiv = document.getElementById("totalPrice");
const ticketPriceDiv = document.getElementById("ticketPrice");
const continueBtn = document.getElementById("continueBtn");
const customerForm = document.getElementById("customerForm");
const customerName = document.getElementById("customerName");
const customerPhone = document.getElementById("customerPhone");
const confirmBookingBtn = document.getElementById("confirmBookingBtn");
const eventTitle = document.getElementById("eventTitle");
const eventInfo = document.getElementById("eventInfo");

const capacityCount = document.getElementById("capacityCount");
const bookedCount = document.getElementById("bookedCount");
const pendingCount = document.getElementById("pendingCount");
const availableCount = document.getElementById("availableCount");


// =========================================
// بيانات الحفلة
// =========================================

let eventData = null;
let selectedSeats = [];
let bookedSeats = new Set();
let pendingSeats = new Set();


// =========================================
// حساب سعة المسرح
// =========================================

function getTheaterCapacity() {
    let total = 0;

    Object.values(theater.left || {}).forEach(value => {
        total += Number(value || 0);
    });

    Object.values(theater.center || {}).forEach(value => {
        if (Array.isArray(value)) {
            total += value.reduce((sum, item) => sum + Number(item || 0), 0);
        } else {
            total += Number(value || 0);
        }
    });

    return total;
}

const theaterCapacity = getTheaterCapacity();


// =========================================
// تحديث العداد
// =========================================

function updateSeatStats() {
    const booked = bookedSeats.size;
    const pending = [...pendingSeats].filter(seat => !bookedSeats.has(seat)).length;
    const available = Math.max(theaterCapacity - booked - pending, 0);

    if (capacityCount) capacityCount.textContent = theaterCapacity;
    if (bookedCount) bookedCount.textContent = booked;
    if (pendingCount) pendingCount.textContent = pending;
    if (availableCount) availableCount.textContent = available;
}


// =========================================
// إنشاء كرسي
// =========================================

function createSeat(name) {
    const seat = document.createElement("button");
    seat.type = "button";
    seat.className = "seat";
    seat.textContent = name;
    seat.dataset.seat = name;
    return seat;
}


// =========================================
// رسم صف عادي
// =========================================

function drawNormalRow(parent, rowName, count, reverse = false) {
    const row = document.createElement("div");
    row.className = "row";

    const start = reverse ? count : 1;
    const end = reverse ? 0 : count;
    const step = reverse ? -1 : 1;

    for (let i = start; i !== end; i += step) {
        row.appendChild(createSeat(rowName + i));
    }

    parent.appendChild(row);
}


// =========================================
// رسم صف بممر
// =========================================

function drawSplitRow(parent, rowName, leftCount, rightCount) {
    const row = document.createElement("div");
    row.className = "row";

    for (let i = 1; i <= leftCount; i++) {
        row.appendChild(createSeat(rowName + i));
    }

    const gap = document.createElement("div");
    gap.className = "empty-seat";
    row.appendChild(gap);

    for (let i = leftCount + 1; i <= leftCount + rightCount; i++) {
        row.appendChild(createSeat(rowName + i));
    }

    parent.appendChild(row);
}


// =========================================
// تفعيل المقاعد بعد الرسم
// =========================================

function activateSeats() {
    document.querySelectorAll(".seat").forEach(seat => {
        const seatNumber = seat.dataset.seat;

        if (bookedSeats.has(seatNumber)) {
            seat.classList.add("booked");
            seat.disabled = true;
            seat.title = "محجوز";
        } else if (pendingSeats.has(seatNumber)) {
            seat.classList.add("pending");
            seat.disabled = true;
            seat.title = "قيد الانتظار";
        } else {
            seat.addEventListener("click", () => toggleSeat(seat));
        }
    });
}


// =========================================
// رسم المسرح
// =========================================

function renderTheater() {
    if (!theaterDiv) return;

    theaterDiv.innerHTML = "";

    const stage = document.createElement("div");
    stage.className = "stage";
    stage.textContent = "STAGE";
    theaterDiv.appendChild(stage);

    const layout = document.createElement("div");
    layout.className = "layout";
    theaterDiv.appendChild(layout);

    const leftBlock = document.createElement("div");
    leftBlock.className = "block";

    const centerBlock = document.createElement("div");
    centerBlock.className = "block";

    layout.append(leftBlock, centerBlock);

    ["O", "P", "Q", "R", "S"].forEach(rowName => {
        drawNormalRow(leftBlock, rowName, theater.left[rowName], true);
    });

    ["A", "B", "C", "D", "E", "F", "G", "H"].forEach(rowName => {
        drawNormalRow(centerBlock, rowName, theater.center[rowName]);
    });

    [
        ["I", 7, 4],
        ["J", 7, 5],
        ["K", 8, 4]
    ].forEach(row => {
        drawSplitRow(centerBlock, row[0], row[1], row[2]);
    });

    drawNormalRow(centerBlock, "L", theater.center.L);

    const title = document.createElement("h2");
    title.className = "balcony-title";
    title.textContent = "🎭 بلكونة المسرح";
    theaterDiv.appendChild(title);

    const balcony = document.createElement("div");
    balcony.className = "block balcony";
    theaterDiv.appendChild(balcony);

    drawNormalRow(balcony, "M", theater.center.M);
    drawNormalRow(balcony, "N", theater.center.N);

    activateSeats();
}


// =========================================
// اختيار المقعد
// =========================================

function toggleSeat(seat) {
    if (seat.disabled) return;

    const seatNumber = seat.dataset.seat;

    if (seat.classList.contains("selected")) {
        seat.classList.remove("selected");
        selectedSeats = selectedSeats.filter(item => item !== seatNumber);
    } else {
        if (selectedSeats.length >= MAX_SEATS) {
            alert(`يمكنك اختيار ${MAX_SEATS} مقاعد فقط`);
            return;
        }

        seat.classList.add("selected");
        selectedSeats.push(seatNumber);
    }

    updatePanel();
}


// =========================================
// تحديث بيانات الحجز
// =========================================

function updatePanel() {
    if (selectedSeats.length === 0) {
        selectedSeatsDiv.textContent = "لا يوجد مقاعد مختارة";
    } else {
        selectedSeatsDiv.textContent = selectedSeats.join(" ، ");
    }

    const price = Number(eventData?.price || 0);
    const total = selectedSeats.length * price;
    totalPriceDiv.textContent = `${total} جنيه`;
}


function formatTime12(value) {
    if (!value) return "-";
    const match = String(value).match(/^(\d{1,2}):(\d{2})/);
    if (!match) return value;
    let hour = Number(match[1]);
    const minute = match[2];
    const period = hour >= 12 ? "مساءً" : "صباحًا";
    hour = hour % 12 || 12;
    return `${String(hour).padStart(2,"0")}:${minute} ${period}`;
}

// =========================================
// تحميل بيانات الحفلة
// =========================================

async function loadEvent() {
    const eventRef = doc(db, "events", eventId);
    const snapshot = await getDoc(eventRef);

    if (!snapshot.exists()) {
        alert("الحفلة غير موجودة.");
        location.href = "index.html";
        return;
    }

    eventData = snapshot.data();

    if (eventData.active !== true) {
        alert("هذه الحفلة غير متاحة للحجز.");
        location.href = "index.html";
        return;
    }

    if (eventTitle) {
        eventTitle.textContent = `🎭 ${eventData.name || "حفلة مسرحية"}`;
    }

    if (eventInfo) {
        const manager = eventData.bookingManagerName
            ? `   👤 مسؤول الحجز: ${eventData.bookingManagerName}`
            : "";

        eventInfo.textContent =
            `📅 ${eventData.date || "-"}   🕐 ${formatTime12(eventData.time)}${manager}`;
    }

    const price = Number(eventData.price || 0);
    if (ticketPriceDiv) ticketPriceDiv.textContent = `${price} جنيه`;

    updateSeatStats();
}


// =========================================
// تحميل المقاعد المحجوزة
// =========================================

async function loadBookedSeats() {
    // Public users must not read customer names/phones from bookings.
    // Seat availability is exposed through the public seatLocks collection only.
    const locksRef = collection(db, "events", eventId, "seatLocks");
    const snapshot = await getDocs(locksRef);

    bookedSeats.clear();
    pendingSeats.clear();

    snapshot.forEach(documentSnapshot => {
        const data = documentSnapshot.data();
        const seatNumber = data.seatNumber || documentSnapshot.id;
        if (!seatNumber) return;

        if (data.status === "pending") {
            pendingSeats.add(seatNumber);
        } else if (data.status === "confirmed") {
            bookedSeats.add(seatNumber);
        }
    });

    pendingSeats.forEach(seatNumber => {
        if (bookedSeats.has(seatNumber)) pendingSeats.delete(seatNumber);
    });

    updateSeatStats();
}


// =========================================
// متابعة الحجز
// =========================================

if (continueBtn) {
    continueBtn.addEventListener("click", () => {
        if (selectedSeats.length === 0) {
            alert("اختر مقعدًا أولاً");
            return;
        }

        customerForm.style.display = "block";
        customerForm.scrollIntoView({ behavior: "smooth" });
    });
}


// =========================================
// تنفيذ الحجز
// =========================================

async function reserve() {
    const name = customerName.value.trim();
    const phone = customerPhone.value.trim();

    if (!name) {
        alert("من فضلك اكتب الاسم.");
        customerName.focus();
        return;
    }

    if (!/^01[0-9]{9}$/.test(phone)) {
        alert("اكتب رقم موبايل مصري صحيح من 11 رقم.");
        customerPhone.focus();
        return;
    }

    if (selectedSeats.length === 0) {
        alert("لم يتم اختيار أي مقعد.");
        return;
    }

    confirmBookingBtn.disabled = true;
    confirmBookingBtn.textContent = "جاري الحجز...";

    try {
        const bookingsRef = collection(db, "events", eventId, "bookings");
        const locksRef = collection(db, "events", eventId, "seatLocks");
        const latestSnapshot = await getDocs(locksRef);

        const latestBooked = new Set();
        const latestPending = new Set();

        latestSnapshot.forEach(documentSnapshot => {
            const data = documentSnapshot.data();
            const seatNumber = data.seatNumber || documentSnapshot.id;
            if (!seatNumber) return;

            if (data.status === "pending") {
                latestPending.add(seatNumber);
            } else if (data.status === "confirmed") {
                latestBooked.add(seatNumber);
            }
        });

        const conflict = selectedSeats.find(
            seatNumber => latestBooked.has(seatNumber) || latestPending.has(seatNumber)
        );

        if (conflict) {
            alert(`المقعد ${conflict} لم يعد متاحًا. اختر مقعدًا آخر.`);
            await loadBookedSeats();
            selectedSeats = selectedSeats.filter(
                seatNumber => !bookedSeats.has(seatNumber) && !pendingSeats.has(seatNumber)
            );
            renderTheater();
            updatePanel();
            return;
        }

        const seatsToBook = [...selectedSeats];
        const total = seatsToBook.length * Number(eventData.price || 0);
        const bookingRef = doc(bookingsRef);
        const bookingNumber = `BK-${bookingRef.id.slice(-8).toUpperCase()}`;

        // Save the booking and its public seat locks atomically.
        // This prevents two visitors from successfully taking the same seat.
        const batch = writeBatch(db);
        batch.set(bookingRef, {
            eventId,
            eventName: eventData.name || "",
            eventDate: eventData.date || "",
            eventTime: eventData.time || "",
            bookingManagerName: eventData.bookingManagerName || "",
            bookingManagerPhone: eventData.bookingManagerPhone || "",
            name,
            phone,
            seats: seatsToBook,
            total,
            status: "pending",
            bookingNumber,
            createdAt: serverTimestamp()
        });

        seatsToBook.forEach(seatNumber => {
            batch.set(doc(db, "events", eventId, "seatLocks", seatNumber), {
                seatNumber,
                bookingId: bookingRef.id,
                bookingNumber,
                status: "pending",
                createdAt: serverTimestamp()
            });
        });

        await batch.commit();

        localStorage.setItem("bookingData", JSON.stringify({
            id: bookingRef.id,
            bookingNumber,
            eventId,
            eventName: eventData.name || "",
            eventDate: eventData.date || "",
            eventTime: eventData.time || "",
            bookingManagerName: eventData.bookingManagerName || "",
            bookingManagerPhone: eventData.bookingManagerPhone || "",
            name,
            phone,
            seats: seatsToBook,
            total,
            status: "pending"
        }));

        location.href = "confirmation.html";
    } catch (error) {
        console.error("Booking error:", error);
        alert(
            "حدث خطأ أثناء حفظ الحجز:\n\n" +
            (error.code || "") +
            "\n" +
            (error.message || error)
        );
    } finally {
        confirmBookingBtn.disabled = false;
        confirmBookingBtn.textContent = "تأكيد الحجز";
    }
}


// =========================================
// زر تأكيد الحجز
// =========================================

if (confirmBookingBtn) confirmBookingBtn.addEventListener("click", reserve);


// =========================================
// تشغيل الصفحة
// =========================================

async function initializePage() {
    try {
        await loadEvent();
        await loadBookedSeats();
        renderTheater();
        updatePanel();
        updateSeatStats();
    } catch (error) {
        console.error("Seats page error:", error);
        alert("حدث خطأ أثناء تحميل بيانات الحفلة.");
        location.href = "index.html";
    }
}

initializePage();
