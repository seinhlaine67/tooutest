import { useEffect } from "react";

export function useBodyPage(pageName) {
  useEffect(() => {
    document.body.dataset.page = pageName;
    return () => {
      delete document.body.dataset.page;
    };
  }, [pageName]);
}
