import { HashRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Item from "./pages/Item.jsx";
import LoginPage from "./pages/Login.jsx";
import User from "./pages/User.jsx";

export default function App() {

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />}>
          <Route path="item" element={<Item />} />
          <Route path="user" element={<User />} />
        </Route>
        <Route path="/login" element={<LoginPage/>}/>
      </Routes>
    </HashRouter>
  );
}