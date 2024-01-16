import Button from "../button/Button";
import "./eye-dropper.css";
import { EyeDropperIcon } from "@heroicons/react/24/outline";
// Eyedropper isn't included yet on the window object
declare global {
  interface Window {
    EyeDropper: any;
  }
}
export function EyeDropper({setColor}: {setColor: Function}) {

  async function handleEyedropper() {
    const eyeDropper = new window.EyeDropper();

    eyeDropper
      .open()
      .then((result: {sRGBHex: string}) => {
        setColor(result.sRGBHex)
      })
      .catch((e: Error) => {
        console.log(e);
      });
  }

  return (
    <>
      {window.EyeDropper ? (
        <Button handler={handleEyedropper} active={false}>
          Eyedropper
          </Button>
      ) : null}
    </>
  );
}
