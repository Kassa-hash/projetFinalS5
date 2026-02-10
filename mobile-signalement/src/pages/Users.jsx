import { useEffect, useState } from "react";
import { getUsers } from "../services/user.service";

function Users() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    getUsers().then((res) => setUsers(res.data));
  }, []);

  return (
    <ul>
      {users.map((u) => (
        <li key={u.id}>{u.name} – {u.role}</li>
      ))}
    </ul>
  );
}

export default Users;
