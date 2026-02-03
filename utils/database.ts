import { doc, collection, setDoc } from "firebase/firestore";
import { firestore } from "../firebase";

export interface User {
  email: string;
  image: string;
  name: string;
}

export interface status {
  success: boolean;
  error?: string;
}

export const saveQuestion = async (
  user: User,
  question: string,
  status: status
) => {
  const quesCollection = collection(firestore, "ques");

  // get the current timestamp
  const timestamp: string = Date.now().toString();
  const date: Date = new Date();
  // create a pointer to our Document
  const _todo = doc(quesCollection);
  // structure the todo data
  const todoData = {
    user: user,
    question: question,
    timestamp,
    date,
    status,
  };
  try {
    //add the Document
    await setDoc(_todo, todoData);
    //show a success message
    //reset fields
  } catch (error) {
    //show an error message
    console.log(error);
  }
};
