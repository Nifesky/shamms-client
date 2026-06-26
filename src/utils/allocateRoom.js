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

export const allocateRooms = async () => {
  // 1. GET ALL STUDENTS & PROFILE MAP FOR LOOKUPS
  const studentsSnap = await getDocs(collection(db, "users"));
  
  const globalUsers = {};
  studentsSnap.docs.forEach((d) => {
    globalUsers[d.id] = { id: d.id, ...d.data() };
  });

  // Filter students who are eligible for allocation:
  // Role is student, payment is verified, and room is not assigned
  let students = Object.values(globalUsers).filter(
    (s) => s.role === "student" && !s.roomAssigned && s.paymentStatus === "verified"
  );

  if (students.length === 0) {
    throw new Error("No unallocated students with verified payments found.");
  }

  // 2. GET HOSTELS AND INDEX BY ID
  const hostelsSnap = await getDocs(collection(db, "hostels"));
  const hostelsMap = {};
  hostelsSnap.docs.forEach((d) => {
    hostelsMap[d.id] = { id: d.id, ...d.data() };
  });

  // 3. GET ROOMS AND RESOLVE HOSTEL GENDER/INFO
  const roomsSnap = await getDocs(collection(db, "rooms"));
  let rooms = roomsSnap.docs.map((d) => {
    const rData = d.data();
    const hostel = hostelsMap[rData.hostelId] || {};
    return {
      id: d.id,
      ...rData,
      gender: hostel.gender || "Male", // Fallback to Male if hostel has no gender
      hostelName: hostel.hostelName || "Unknown Hostel",
      occupants: rData.occupants || []
    };
  });

  // 4. CREATE ALLOCATION SESSION (HISTORY)
  const sessionRef = await addDoc(collection(db, "allocation_history"), {
    createdAt: serverTimestamp(),
    totalStudents: students.length,
  });

  // 5. SMART ALLOCATION LOGIC
  // Group students by gender, and then by department (courseOfStudy)
  const studentsByGenderAndDept = {
    Male: {},
    Female: {}
  };

  students.forEach((s) => {
    const gender = s.gender === "Female" ? "Female" : "Male"; // Normalize
    const dept = s.courseOfStudy || "General";
    
    if (!studentsByGenderAndDept[gender][dept]) {
      studentsByGenderAndDept[gender][dept] = [];
    }
    studentsByGenderAndDept[gender][dept].push(s);
  });

  // Process allocation for each gender group
  for (const gender of ["Male", "Female"]) {
    const depts = studentsByGenderAndDept[gender];
    const genderRooms = rooms.filter(r => r.gender === gender);

    for (const dept of Object.keys(depts)) {
      const deptStudents = depts[dept];

      for (const student of deptStudents) {
        let targetRoom = null;

        // Step A: Try to find a room that is not full AND already has at least one occupant from the SAME department
        for (const room of genderRooms) {
          const hasSpace = room.occupants.length < room.capacity;
          if (hasSpace && room.occupants.length > 0) {
            const hasSameDeptRoommate = room.occupants.some(occId => {
              const occProfile = globalUsers[occId] || {};
              return (occProfile.courseOfStudy || "General") === dept;
            });

            if (hasSameDeptRoommate) {
              targetRoom = room;
              break;
            }
          }
        }

        // Step B: If no same-department room found, try to find a completely EMPTY room
        if (!targetRoom) {
          for (const room of genderRooms) {
            if (room.occupants.length === 0) {
              targetRoom = room;
              break;
            }
          }
        }

        // Step C: Fall back to ANY room of matching gender that has space
        if (!targetRoom) {
          for (const room of genderRooms) {
            if (room.occupants.length < room.capacity) {
              targetRoom = room;
              break;
            }
          }
        }

        // If a room was successfully matched, perform DB writes
        if (targetRoom) {
          targetRoom.occupants.push(student.id);
          const newOccupiedSlots = targetRoom.occupants.length;

          // Update Room Document (Keep occupants array and occupiedSlots count synced)
          await setDoc(doc(db, "rooms", targetRoom.id), {
            ...targetRoom,
            occupiedSlots: newOccupiedSlots
          }, { merge: true });

          // Update Student Document
          await setDoc(doc(db, "users", student.id), {
            ...student,
            roomAssigned: true,
            roomId: targetRoom.id,
            hostelId: targetRoom.hostelId
          });

          // Log per student history log
          await addDoc(collection(db, "allocation_history", sessionRef.id, "logs"), {
            studentId: student.id,
            roomId: targetRoom.id,
            level: student.level || "Unspecified",
            courseOfStudy: student.courseOfStudy || "General",
            allocationDate: new Date().toISOString()
          });

          // Update global profile cache in case this student is a roommate in subsequent loops
          globalUsers[student.id].roomAssigned = true;
          globalUsers[student.id].roomId = targetRoom.id;
          globalUsers[student.id].hostelId = targetRoom.hostelId;
        } else {
          console.warn(`No available room found for student ${student.fullName} (${gender}, ${dept})`);
        }
      }
    }
  }

  return sessionRef.id;
};