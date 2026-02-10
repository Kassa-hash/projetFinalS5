import { Link } from "react-router-dom";

function Home() {
  return (
    <div>
      <h1>Accueil</h1>
      <Link to="/login">Se connecter</Link>
    </div>
  );
}

export default Home;
