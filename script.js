import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDocs, collection } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDhPRVu8n_pZQzJPVWNFlJonmj5KEYsF10",
  authDomain: "movimagic.firebaseapp.com",
  projectId: "movimagic",
  storageBucket: "movimagic.appspot.com",
  messagingSenderId: "518388279864",
  appId: "1:518388279864:web:a6f699391ec5bb627c14cd",
  measurementId: "G-GG65HJV2T6"
};

document.addEventListener('DOMContentLoaded', () => {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  let currentAdminEmail = null;

  // Manejar Login del Administrador
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      currentAdminEmail = userCredential.user.email;

      document.getElementById('login-modal').style.display = 'none';
      document.getElementById('admin-panel').style.display = 'block';
      document.getElementById('admin-email-display').innerText = `Administrador: ${currentAdminEmail}`;
      listarUsuarios();
    } catch (error) {
      alert("Error en el inicio de sesión: " + error.message);
    }
  });

  // Manejar la creación de usuario
  document.getElementById('user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      await setDoc(doc(db, 'users', userId), {
        username: username,
        email: email,
      });

      document.getElementById('message').innerText = "Usuario creado exitosamente";
      listarUsuarios();
    } catch (error) {
      document.getElementById('message').innerText = "Error al crear usuario: " + error.message;
    }
  });

  // Función para listar los usuarios creados
  async function listarUsuarios() {
    const usersContainer = document.getElementById('users-list');
    usersContainer.innerHTML = '';

    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));

      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        const userElement = document.createElement('div');
        userElement.classList.add('user-item');
        userElement.innerHTML = `
          <p><strong>Nombre:</strong> ${userData.username}</p>
          <p><strong>Email:</strong> ${userData.email}</p>
        `;
        usersContainer.appendChild(userElement);
      });
    } catch (error) {
      console.error("Error al listar usuarios: ", error);
    }
  }

  // Cerrar sesión del administrador
  document.getElementById('logout-btn').addEventListener('click', async () => {
    await signOut(auth);
    location.reload();
  });
});
