import { toast } from "react-toastify";

export async function copy(textToCopy) {
  try {
    navigator.clipboard.writeText(textToCopy);
    toast(`"${textToCopy}" copied!`, {
      position: toast.POSITION.BOTTOM_LEFT,
    });
  } catch (e) {
    console.log(e);
  }
}
