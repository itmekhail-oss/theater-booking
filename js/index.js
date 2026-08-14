// =========================================
// Firebase
// =========================================

import {
    db,
    collection,
    getDocs
} from "./firebase.js";


// =========================================
// Elements
// =========================================

const loading =
    document.getElementById("loading");

const eventsContainer =
    document.getElementById("eventsContainer");

const emptyMessage =
    document.getElementById("emptyMessage");


// =========================================
// Data
// =========================================

let events = [];


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


function formatDate(value) {

    if (!value) {
        return "-";
    }

    try {

        const date =
            new Date(value + "T00:00:00");

        return new Intl.DateTimeFormat(
            "ar-EG",
            {
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        ).format(date);

    } catch {

        return value;

    }

}


// =========================================
// Load Events
// =========================================

async function loadEvents() {

    console.log("INDEX: بدأ تحميل الحفلات");


    if (loading) {

        loading.style.display = "block";

        loading.textContent =
            "جاري تحميل الحفلات...";

    }


    if (eventsContainer) {

        eventsContainer.innerHTML = "";

    }


    if (emptyMessage) {

        emptyMessage.style.display = "none";

    }


    try {

        console.log(
            "INDEX: الاتصال بـ Firestore..."
        );


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "events"
                )
            );


        console.log(
            "INDEX: عدد الحفلات:",
            snapshot.size
        );


        events =
            snapshot.docs.map(
                documentSnapshot => ({

                    id:
                        documentSnapshot.id,

                    ...documentSnapshot.data()

                })
            );


        console.log(
            "INDEX: جميع الحفلات:",
            events
        );


        // عرض الحفلات النشطة فقط

        events =
            events
                .filter(
                    event =>
                        event.active === true
                )
                .sort(
                    (a, b) => {

                        const first =
                            `${a.date || ""} ${a.time || ""}`;

                        const second =
                            `${b.date || ""} ${b.time || ""}`;

                        return first.localeCompare(
                            second
                        );

                    }
                );


        console.log(
            "INDEX: الحفلات المتاحة:",
            events
        );


        if (loading) {

            loading.style.display = "none";

        }


        if (!events.length) {

            if (emptyMessage) {

                emptyMessage.style.display =
                    "block";

            }

            console.log(
                "INDEX: لا توجد حفلات Active"
            );

            return;

        }


        renderEvents();


    } catch (error) {

        console.error(
            "INDEX FIRESTORE ERROR:",
            error
        );

        console.error(
            "ERROR CODE:",
            error?.code
        );

        console.error(
            "ERROR MESSAGE:",
            error?.message
        );


        if (loading) {

            loading.style.display = "block";

            loading.innerHTML = `
                <div class="error">
                    حدث خطأ أثناء تحميل الحفلات.
                    <br><br>
                    ${escapeHTML(
                        error?.message ||
                        "Unknown error"
                    )}
                </div>
            `;

        }

    }

}


// =========================================
// Render Events
// =========================================

function renderEvents() {

    if (!eventsContainer) {

        console.error(
            "INDEX ERROR: eventsContainer غير موجود"
        );

        return;

    }


    eventsContainer.innerHTML =
        events
            .map(event => {

                const name =
                    event.name ||
                    "حفلة مسرحية";


                const date =
                    formatDate(
                        event.date
                    );


                const time =
                    event.time ||
                    "-";


                const price =
                    Number(
                        event.price || 0
                    );


                const poster =
                    event.poster ||
                    "";


                return `
                    <div class="event-card">

                        ${
                            poster
                                ? `
                                    <div class="event-poster">
                                        <img
                                            src="${escapeHTML(poster)}"
                                            alt="${escapeHTML(name)}"
                                            loading="lazy"
                                        >
                                    </div>
                                `
                                : `
                                    <div class="event-poster event-poster-empty">
                                        🎭
                                    </div>
                                `
                        }

                        <div class="event-content">

                            <h3>
                                ${escapeHTML(name)}
                            </h3>

                            <p>
                                📅
                                ${escapeHTML(date)}
                            </p>

                            <p>
                                🕐
                                ${escapeHTML(time)}
                            </p>

                            <p>
                                🎟️
                                سعر التذكرة:
                                <strong>
                                    ${price} جنيه
                                </strong>
                            </p>

                            <button
                                type="button"
                                class="book-event-btn"
                                data-event-id="${escapeHTML(event.id)}"
                            >
                                🎟️ احجز تذكرتك
                            </button>

                        </div>

                    </div>
                `;

            })
            .join("");


    document
        .querySelectorAll(
            ".book-event-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    selectEvent(
                        button.dataset.eventId
                    );

                }
            );

        });

}


// =========================================
// Select Event
// =========================================

function selectEvent(eventId) {

    if (!eventId) {

        alert(
            "لم يتم تحديد الحفلة."
        );

        return;

    }


    const event =
        events.find(
            item =>
                item.id === eventId
        );


    if (!event) {

        alert(
            "الحفلة غير موجودة."
        );

        return;

    }


    localStorage.setItem(
        "selectedEventId",
        eventId
    );


    window.location.href =
        `seats.html?eventId=${encodeURIComponent(
            eventId
        )}`;

}


// =========================================
// Start
// =========================================

console.log(
    "INDEX JS يعمل بنجاح"
);


loadEvents();