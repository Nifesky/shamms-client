import { auth, db } from "../../config/firebase";

function TestFirebase() {
  console.log(auth);
  console.log(db);

  return <h1>Firebase Connected</h1>;
}

export default TestFirebase;