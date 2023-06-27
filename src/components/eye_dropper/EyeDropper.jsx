import { Eyedropper } from "react-bootstrap-icons";
import "./eyeDropper.css";
import { useContext } from "react";
import Button from "../button/Button";
import { ColorContext } from "../ColorContext";

export default function EyeDropper() {
  const { setColor } = useContext(ColorContext);

  async function handleEyedropper() {
    const eyeDropper = new window.EyeDropper();

    eyeDropper
      .open()
      .then((result) => {
        setColor(result.sRGBHex);
      })
      .catch((e) => {
        console.log(e);
      });
  }

  return (
    <>
      {window.EyeDropper ? (
        <Button type="text-icon-btn" handler={handleEyedropper}>
          <Eyedropper /> Eyedropper
        </Button>
      ) : null}
    </>
  );
}
