const ErrorMessage = (prop: { message: string }) => {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center text-red-500">
        <p className="text-xl">Error loading episodes</p>
        <p className="text-sm mt-2">{prop.message}</p>
      </div>
      <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Try Again
      </button>
    </div>
  );
};

export default ErrorMessage;
