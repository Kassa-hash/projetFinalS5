import { useState } from "react";
import { Link } from "react-router-dom";

function Login() {
  const [mail, setMail] = useState("");
  const [mdp, setMdp] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault(); // empêche le rechargement

    console.log("Email :", mail);
    console.log("Mot de passe :", mdp);

    // ici tu appelleras ton API
  };

  return (
    <div>
      <h1>Test Login</h1>

      <form onSubmit={handleSubmit}>
        <label htmlFor="mail">Email:</label>
        <input
          type="email"
          id="mail"
          value={mail}
          onChange={(e) => setMail(e.target.value)}
        />

        <label>Mot de passe:</label>
        <input
          type="password"
          value={mdp}
          onChange={(e) => setMdp(e.target.value)}
        />

        <button type="submit">Se connecter</button>
      </form>

    </div>
  );
}

export default Login;
