
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const { VITE_FIREBASE_CONFIG } =  import.meta.env

const firebaseConfig = JSON.parse(VITE_FIREBASE_CONFIG)

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)