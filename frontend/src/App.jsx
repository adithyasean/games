import { useState } from "react";
import GameMenu from "./components/GameMenu";
import MinimumCost from "./components/MinimumCost";
import ZebraPuzzle from "./components/ZebraPuzzle";

export default function App() {
  const [screen, setScreen] = useState("menu");

  return (
    <>
      {screen === "menu"         && <GameMenu onSelect={setScreen} />}
      {screen === "minimum-cost" && <MinimumCost onBack={() => setScreen("menu")} />}
      {screen === "zebra-puzzle" && <ZebraPuzzle onBack={() => setScreen("menu")} />}
    </>
  );
}
