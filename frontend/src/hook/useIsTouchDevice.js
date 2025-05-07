import { useEffect, useState } from "react";

export default function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(() =>
    window.matchMedia("(pointer: coarse)").matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(pointer: coarse)");
    const update = () => setIsTouch(mediaQuery.matches);

    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return isTouch;
}
