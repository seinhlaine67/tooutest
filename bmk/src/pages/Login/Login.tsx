import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [formData, setFormData] = useState<{
    email: string;
    password: string;
  } | null>({
    email: "",
    password: "",
  });
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const handleLogin = async () => {
    console.log(formData);
    const result = await signIn(formData.email, formData.password);
    if (result.user) {
      navigate("/library", { replace: true });
    }
  };
  return (
    <div className="flex gap-8 bg-blue-300">
      <input
        type="text"
        name="email"
        placeholder="Email..."
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
      <input
        type="password"
        name="password"
        placeholder="password.."
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default Login;
