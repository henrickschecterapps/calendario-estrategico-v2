import { TriplaEvent } from "@/types/evento";

/**
 * Export filtered events as an .ics (iCalendar) file.
 * Matches the legacy exportICS behavior.
 */
export function exportICS(events: TriplaEvent[]) {
  let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Tripla//Eventos//PT\n";

  events.forEach(e => {
    if (!e.data_ini) return;
    const start = e.data_ini.replace(/-/g, '') + 'T000000Z';
    const end = (e.data_fim || e.data_ini).replace(/-/g, '') + 'T235959Z';
    ics += `BEGIN:VEVENT\nDTSTART:${start}\nDTEND:${end}\nSUMMARY:${e.evento || "Sem título"}\nDESCRIPTION:Resp: ${e.responsavel || ''} | Status: ${e.status || ''}\nEND:VEVENT\n`;
  });

  ics += "END:VCALENDAR";

  const blob = new Blob([ics], { type: "text/calendar" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "eventos-tripla.ics";
  a.click();
  URL.revokeObjectURL(a.href);
}

/**
 * Duplicate an event in Firestore.
 * Creates a copy with "(Cópia)" appended and status reset to "Planejado".
 */
export async function duplicateEvent(event: TriplaEvent) {
  const { getFirebaseDb } = await import("@/lib/firebase");
  const { collection, addDoc } = await import("firebase/firestore");
  
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase not initialized");

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...data } = event;
  const copy = {
    ...data,
    evento: `${event.evento} (Cópia)`,
    status: "Planejado",
  };

  const docRef = await addDoc(collection(db, "eventos"), copy);
  return docRef.id;
}

/**
 * Delete an event from Firestore.
 */
export async function deleteEventFromFirestore(eventId: string) {
  const { getFirebaseDb } = await import("@/lib/firebase");
  const { doc, deleteDoc } = await import("firebase/firestore");
  
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase not initialized");

  await deleteDoc(doc(db, "eventos", eventId));
}

/**
 * Log an action to an event's history subcollection.
 */
export async function logEventHistory(
  eventId: string,
  action: string,
  authorEmail: string,
  summary?: string
) {
  const { getFirebaseDb } = await import("@/lib/firebase");
  const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
  
  const db = getFirebaseDb();
  if (!db) return;

  const authorName = authorEmail
    .split("@")[0]
    .replace(".", " ")
    .replace(/\b\w/g, l => l.toUpperCase());

  await addDoc(collection(db, "eventos", eventId, "history"), {
    action,
    author: authorName,
    author_email: authorEmail,
    timestamp: serverTimestamp(),
    summary: summary || "",
  });
}

/**
 * Fetch event history from Firestore subcollection.
 */
export async function fetchEventHistory(eventId: string): Promise<Array<{
  id: string;
  action: string;
  author: string;
  author_email: string;
  timestamp: any;
  summary: string;
}>> {
  const { getFirebaseDb } = await import("@/lib/firebase");
  const { collection, getDocs, orderBy, query, limit } = await import("firebase/firestore");
  
  const db = getFirebaseDb();
  if (!db) return [];

  try {
    const q = query(
      collection(db, "eventos", eventId, "history"),
      orderBy("timestamp", "desc"),
      limit(20)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as any;
  } catch {
    return [];
  }
}
