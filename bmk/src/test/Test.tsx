import React, { useEffect } from "react";
import { testDatabaseConnection } from "./testConnection";

const Test = () => {
  useEffect(() => {
    testDatabaseConnection();
  }, []);
  return <div>Check test result in console</div>;
};

export default Test;
