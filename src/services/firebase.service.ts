
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

localStorage.removeItem('SESSION_TOKEN')

const { VITE_FIREBASE_CONFIG } =  import.meta.env

const firebaseConfig = JSON.parse(VITE_FIREBASE_CONFIG)

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
