import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../css/404.css"

function FourOFour () {
  const navigate = useNavigate();

  const [gotoHome, setGotoHome] = useState(false);

  useEffect(() => {
    if (gotoHome) {
      navigate("/")
    }
  }, [gotoHome]);

  return <div className="four-o-four">
    <h2>You don't wanna be here</h2>
    <button className="goto-home-button" onClick={() => {
      setGotoHome(true);
    }}>Take me Home</button>
  </div>
}

export default FourOFour;