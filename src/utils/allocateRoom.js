// src/utils/allocateRoom.js

import { db } from "../config/firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

export const allocateRooms = async () => {
  // 1. GET STUDENTS
  const studentsSnap = await getDocs(collection(db, "users"));

  let students = studentsSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((s) => s.role === "student" && !s.roomAssigned);

  // 2. GET ROOMS
  const roomsSnap = await getDocs(collection(db, "rooms"));

  let rooms = roomsSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  // 3. SHUFFLE STUDENTS
  students = shuffle(students);

  let roomIndex = 0;

  // 4. CREATE ALLOCATION SESSION (HISTORY)
  const sessionRef = await addDoc(collection(db, "allocation_history"), {
    createdAt: serverTimestamp(),
    totalStudents: students.length,
  });

  // 5. ASSIGN STUDENTS TO ROOMS
  for (let student of students) {
    let room = rooms[roomIndex];

    if (!room) break;

    if (!room.occupants) room.occupants = [];

    if (room.occupants.length < room.capacity) {
      room.occupants.push(student.id);

      // update room
      await setDoc(doc(db, "rooms", room.id), room);

      // update student
      await setDoc(doc(db, "users", student.id), {
        ...student,
        roomAssigned: true,
        roomId: room.id,
      });

      // log history per student
      await addDoc(collection(db, "allocation_history", sessionRef.id, "logs"), {
        studentId: student.id,
        roomId: room.id,
        level: student.level,
      });
    } else {
      roomIndex++;
    }
  }

  return sessionRef.id;
};