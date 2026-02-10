import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // 🔑 Connexion Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Récupérer le token ID Firebase
      const idToken = await userCredential.user.getIdToken();

      // Stocker localement si besoin
      localStorage.setItem("id_token", idToken);
      localStorage.setItem("user", JSON.stringify(userCredential.user));

      // Redirection vers le dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Email ou mot de passe incorrect");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Connexion</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button type="submit">Se connecter</button>
    </form>
  );
}

export default Login;
