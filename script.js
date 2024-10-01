import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDocs, collection, deleteDoc, updateDoc, getDoc, query, where } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentAdminId = null;
let currentAdminEmail = null;

// Manejar Login del Administrador
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('admin-email').value;
  const password = document.getElementById('admin-password').value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    currentAdminId = userCredential.user.uid;
    currentAdminEmail = userCredential.user.email;

    // Verificar si el usuario tiene el rol de administrador
    const adminDoc = await getDoc(doc(db, 'adminUsers', currentAdminId));
    if (adminDoc.exists() && adminDoc.data().role === 'admin') {
      document.getElementById('login-modal').style.display = 'none';
      document.getElementById('admin-panel').style.display = 'block';
      document.getElementById('admin-email-display').innerText = `Administrador: ${currentAdminEmail}`;
      listarUsuarios();
    } else {
      throw new Error("No tiene permisos de administrador.");
    }
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
  const expirationDate = document.getElementById('expirationDate').value;

  try {
    // Crear usuario en Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;

    // Crear documento del usuario en Firestore
    await setDoc(doc(db, 'users', userId), {
      username: username,
      email: email,
      expirationDate: new Date(expirationDate),
      adminId: currentAdminId, // UID del administrador que crea el usuario
    });

    document.getElementById('message').innerText = "Usuario creado exitosamente";
    listarUsuarios();
  } catch (error) {
    document.getElementById('message').innerText = "Error al crear usuario: " + error.message;
  }
});

// Función para listar los usuarios creados por el administrador actual
async function listarUsuarios() {
  const usersContainer = document.getElementById('users-list');
  usersContainer.innerHTML = '';

  try {
    const q = query(collection(db, 'users'), where("adminId", "==", currentAdminId));
    const usersSnapshot = await getDocs(q);
    const searchQuery = document.getElementById('search-bar').value.toLowerCase();

    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.username.toLowerCase().includes(searchQuery) || userData.email.toLowerCase().includes(searchQuery)) {
        const userElement = document.createElement('div');
        userElement.classList.add('user-item');
        userElement.innerHTML = `
          <p><strong>Nombre:</strong> ${userData.username}</p>
          <p><strong>Email:</strong> ${userData.email}</p>
          <p><strong>Fecha de Expiración:</strong> ${new Date(userData.expirationDate.seconds * 1000).toLocaleDateString()}</p>
          <div class="user-actions">
            <button class="edit-btn" onclick="editarUsuario('${doc.id}', '${userData.username}')"><i class="fas fa-edit"></i> Editar</button>
            <button class="delete-btn" onclick="eliminarUsuario('${doc.id}')"><i class="fas fa-trash"></i> Eliminar</button>
            <button class="renew-btn" onclick="renovarUsuario('${doc.id}', 1)"><i class="fas fa-sync-alt"></i> Renovar 1 mes</button>
          </div>
        `;
        usersContainer.appendChild(userElement);
      }
    });
  } catch (error) {
    console.error("Error al listar usuarios: ", error);
  }
}

// Función para editar solo el nombre de usuario
window.editarUsuario = async function (userId, currentUsername) {
  const newUsername = prompt("Editar Nombre de Usuario:", currentUsername);

  if (newUsername && newUsername !== currentUsername) {
    try {
      // Actualizar solo el nombre de usuario en Firestore
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        username: newUsername,
      });

      alert("Nombre de usuario actualizado exitosamente.");
      listarUsuarios();
    } catch (error) {
      console.error("Error al actualizar nombre de usuario: ", error);
      alert("Error al actualizar nombre de usuario: " + error.message);
    }
  }
};

// Función para eliminar usuario
window.eliminarUsuario = async function (userId) {
  try {
    await deleteDoc(doc(db, 'users', userId));
    alert("Usuario eliminado exitosamente.");
    listarUsuarios();
  } catch (error) {
    console.error("Error al eliminar usuario: ", error);
    alert("Error al eliminar usuario: " + error.message);
  }
};

// Función para renovar la cuenta del usuario
window.renovarUsuario = async function (userId, months) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const userData = userDoc.data();
      let currentExpiration = userData.expirationDate.toDate ? userData.expirationDate.toDate() : new Date(userData.expirationDate.seconds * 1000);
      currentExpiration.setMonth(currentExpiration.getMonth() + months);
      const newExpirationDate = currentExpiration;

      await updateDoc(userRef, { expirationDate: newExpirationDate });

      alert(`Usuario renovado exitosamente por ${months} mes(es).`);
      listarUsuarios();
    }
  } catch (error) {
    console.error("Error al renovar usuario: ", error);
    alert("Error al renovar usuario: " + error.message);
  }
};

// Cerrar sesión del administrador
document.getElementById('logout-btn').addEventListener('click', async () => {
  await signOut(auth);
  location.reload();
});
