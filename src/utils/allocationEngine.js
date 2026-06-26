import { db } from "../config/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";

/**
 * SHUFFLE (random fairness)
 */
function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

/**
 * MAIN ALLOCATION ENGINE
 */
export const runAllocationEngine = async () => {
  try {
    console.log("🚀 Allocation Engine Started...");

    // 1. GET ALL STUDENTS
    const usersSnap = await getDocs(collection(db, "users"));

    let students = usersSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter(
        (u) =>
          u.role === "student" &&
          u.paymentStatus === "verified" &&
          !u.roomAssigned
      );

    if (students.length === 0) {
      console.log("No eligible students found");
      return;
    }

    // 2. GROUP BY LEVEL
    const groupedByLevel = {
      "100": [],
      "200": [],
      "300": [],
      "400": [],
    };

    students.forEach((s) => {
      if (groupedByLevel[s.level]) {
        groupedByLevel[s.level].push(s);
      }
    });

    // shuffle each level for fairness
    Object.keys(groupedByLevel).forEach((level) => {
      groupedByLevel[level] = shuffle(groupedByLevel[level]);
    });

    // 3. GET ROOMS
    const roomsSnap = await getDocs(collection(db, "rooms"));

    let rooms = roomsSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    // sort rooms by available space (optional optimization)
    rooms.sort((a, b) => (a.capacity || 0) - (b.capacity || 0));

    // 4. ALLOCATION PROCESS
    for (let level of Object.keys(groupedByLevel)) {
      for (let student of groupedByLevel[level]) {
        let allocated = false;

        for (let room of rooms) {
          if (!room.occupants) room.occupants = [];

          const isSameGender =
            !room.gender || room.gender === student.gender;

          const hasSpace = room.occupants.length < room.capacity;

          if (hasSpace && isSameGender) {
            room.occupants.push(student.id);

            // update room in DB
            await updateDoc(doc(db, "rooms", room.id), {
              occupants: room.occupants,
            });

            // update student in DB
            await updateDoc(doc(db, "users", student.id), {
              roomAssigned: true,
              roomId: room.id,
            });

            allocated = true;
            break;
          }
        }

        if (!allocated) {
          console.log(
            `⚠ No room found for student: ${student.fullName}`
          );
        }
      }
    }

    console.log("✅ Allocation Completed Successfully!");
  } catch (error) {
    console.log("❌ Allocation Engine Error:", error.message);
  }
};